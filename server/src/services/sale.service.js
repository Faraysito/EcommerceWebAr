import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'
import { getCommissionPercent } from './marketplace.service.js'

// ============================================================
// Ventas del MARKETPLACE. Una orden (sale) del comprador puede contener
// productos de VARIOS vendedores. Cada línea (sale_product) guarda:
//   - seller_id : a qué vendedor corresponde
//   - sub_total : precio * cantidad
//   - commission_amount : comisión que retiene el marketplace
//   - seller_amount : lo que recibe el vendedor (sub_total - comisión)
//
// Al confirmar el pago se generan los PAYOUTS: un registro por vendedor por
// orden con lo que el marketplace le debe.
//
// Limitación conocida (igual que el proyecto original): el cliente JS de
// Supabase no expone transacciones multi-statement, así que hacemos escrituras
// secuenciales con re-chequeo de stock. Para mover esto a atomicidad estricta
// se migraría a una función RPC de Postgres.
// ============================================================

function activeOfferFor(product) {
  const now = Date.now()
  return (
    (product.offer ?? []).find(o => {
      const start = new Date(o.start_date).getTime()
      const end = new Date(o.end_date).getTime()
      return now >= start && now <= end
    }) ?? null
  )
}

function unitPriceWithOffer(product) {
  const offer = activeOfferFor(product)
  if (!offer) return product.price
  if (offer.discount_type === 'PERCENTAGE') {
    return Math.round(product.price * (1 - offer.discount_value / 100))
  }
  return Math.max(0, product.price - offer.discount_value)
}

// Crea una orden a partir de un carrito [{ productId, quantity }].
// buyerId viene del JWT (req.customer.id).
const createSale = async ({ buyerId, items, paymentMethod }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(HTTP_STATUS.badRequest, 'El carrito está vacío')
  }

  // 1. Agrupa cantidades por producto.
  const qtyByProduct = new Map()
  for (const it of items) {
    const prev = qtyByProduct.get(it.productId) ?? 0
    qtyByProduct.set(it.productId, prev + it.quantity)
  }
  const productIds = [...qtyByProduct.keys()]

  // 2. Trae los productos reales (precio, stock, ofertas, vendedor).
  const { data: products, error: prodError } = await supabase
    .from('product')
    .select(
      'id, name, price, stock, seller_id, offer ( discount_type, discount_value, start_date, end_date )'
    )
    .in('id', productIds)

  if (prodError) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron leer los productos')
  }

  // 3. Comisión vigente del marketplace.
  const commissionPercent = await getCommissionPercent()

  // 4. Valida existencia/stock y arma líneas con precio del servidor + split.
  const lines = []
  let total = 0

  for (const productId of productIds) {
    const product = products.find(p => p.id === productId)
    if (!product) {
      throw new AppError(HTTP_STATUS.badRequest, 'Un producto del carrito ya no existe')
    }

    // No se puede comprar a un producto sin vendedor (no debería pasar).
    if (!product.seller_id) {
      throw new AppError(HTTP_STATUS.conflict, `"${product.name}" no tiene vendedor asignado`)
    }

    const quantity = qtyByProduct.get(productId)
    if (quantity <= 0) {
      throw new AppError(HTTP_STATUS.badRequest, `Cantidad inválida para "${product.name}"`)
    }
    if (product.stock < quantity) {
      throw new AppError(
        HTTP_STATUS.conflict,
        `Stock insuficiente de "${product.name}" (quedan ${product.stock})`
      )
    }

    const unitPrice = unitPriceWithOffer(product)
    const subTotal = unitPrice * quantity
    const commissionAmount = Math.round(subTotal * (commissionPercent / 100))
    const sellerAmount = subTotal - commissionAmount

    total += subTotal
    lines.push({ product, quantity, unitPrice, subTotal, commissionAmount, sellerAmount })
  }

  // Evita auto-compra: un vendedor no debería comprarse a sí mismo. (Opcional;
  // lo bloqueamos para no generar payouts raros.)
  for (const l of lines) {
    if (l.product.seller_id === buyerId) {
      throw new AppError(HTTP_STATUS.badRequest, 'No puedes comprar tus propios productos')
    }
  }

  // 5. Crea la orden (cabecera).
  const { data: sale, error: saleError } = await supabase
    .from('sale')
    .insert({
      customer_id: buyerId,
      total,
      status: 'Pendiente',
      payment_method: paymentMethod
    })
    .select(
      'id, status, total, buy_order, authorization_code, transaction_token, card_number, payment_method, payment_status, created_at'
    )
    .single()

  if (saleError || !sale) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo crear la orden')
  }

  // 6. Inserta las líneas con el desglose por vendedor.
  const saleProducts = lines.map(l => ({
    sale_id: sale.id,
    product_id: l.product.id,
    seller_id: l.product.seller_id,
    quantity: l.quantity,
    unit_price: l.unitPrice,
    sub_total: l.subTotal,
    commission_amount: l.commissionAmount,
    seller_amount: l.sellerAmount,
    fulfillment_status: 'Pendiente'
  }))

  const { error: spError } = await supabase.from('sale_product').insert(saleProducts)
  if (spError) {
    await supabase.from('sale').delete().eq('id', sale.id)
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo registrar el detalle')
  }

  // 7. Descuenta stock con re-chequeo (carrera).
  for (const l of lines) {
    const { data: fresh } = await supabase
      .from('product')
      .select('stock')
      .eq('id', l.product.id)
      .single()

    const current = fresh?.stock ?? 0
    if (current < l.quantity) {
      await supabase.from('sale_product').delete().eq('sale_id', sale.id)
      await supabase.from('sale').delete().eq('id', sale.id)
      throw new AppError(
        HTTP_STATUS.conflict,
        `Stock insuficiente de "${l.product.name}" al confirmar. Intenta de nuevo.`
      )
    }

    await supabase
      .from('product')
      .update({ stock: current - l.quantity })
      .eq('id', l.product.id)
  }

  return {
    id: sale.id,
    status: sale.status,
    total: sale.total,
    transactionToken: sale.transaction_token,
    buyOrder: sale.buy_order,
    authorizationCode: sale.authorization_code,
    cardNumber: sale.card_number,
    paymentMethod: sale.payment_method,
    paymentStatus: sale.payment_status,
    createdAt: sale.created_at,
    items: lines.map(l => ({
      productId: l.product.id,
      name: l.product.name,
      sellerId: l.product.seller_id,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      subTotal: l.subTotal
    }))
  }
}

// Genera los payouts de una orden pagada: agrupa las líneas por vendedor y
// crea/acumula un payout por vendedor. Idempotente vía UNIQUE(sale_id,
// seller_id): si ya existen, no los duplica.
const generatePayoutsForSale = async ({ saleId }) => {
  const { data: lines, error } = await supabase
    .from('sale_product')
    .select('seller_id, sub_total, commission_amount, seller_amount')
    .eq('sale_id', saleId)

  if (error || !lines) return

  // Agrupa por vendedor.
  const bySeller = new Map()
  for (const l of lines) {
    const acc = bySeller.get(l.seller_id) ?? { gross: 0, commission: 0, net: 0 }
    acc.gross += l.sub_total
    acc.commission += l.commission_amount
    acc.net += l.seller_amount
    bySeller.set(l.seller_id, acc)
  }

  const rows = [...bySeller.entries()].map(([sellerId, a]) => ({
    sale_id: saleId,
    seller_id: sellerId,
    gross_amount: a.gross,
    commission_amount: a.commission,
    net_amount: a.net,
    status: 'Pendiente'
  }))

  if (rows.length === 0) return

  // upsert por (sale_id, seller_id) para no duplicar si se reintenta.
  await supabase.from('payout').upsert(rows, { onConflict: 'sale_id,seller_id' })
}

// Lista los pedidos de un COMPRADOR, con líneas y de qué tienda viene cada una.
const listSalesByCustomer = async ({ customerId }) => {
  const { data, error } = await supabase
    .from('sale')
    .select(
      `
      id, status, total, created_at,
      sale_product (
        quantity, unit_price, sub_total, fulfillment_status,
        product ( id, name ),
        seller:seller_id ( store_name, store_slug )
      )
    `
    )
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron leer tus pedidos')
  }

  return (data ?? []).map(sale => ({
    id: sale.id,
    status: sale.status,
    total: sale.total,
    createdAt: sale.created_at,
    items: (sale.sale_product ?? []).map(sp => ({
      productId: sp.product?.id ?? null,
      name: sp.product?.name ?? 'Producto eliminado',
      storeName: sp.seller?.store_name ?? null,
      storeSlug: sp.seller?.store_slug ?? null,
      quantity: sp.quantity,
      unitPrice: sp.unit_price,
      subTotal: sp.sub_total,
      fulfillmentStatus: sp.fulfillment_status
    }))
  }))
}

// Lista las VENTAS de un VENDEDOR: solo las líneas que le pertenecen, con datos
// del comprador y de la orden. Es el "mis ventas" del panel de vendedor.
const listSalesBySeller = async ({ sellerId }) => {
  const { data, error } = await supabase
    .from('sale_product')
    .select(
      `
      id, quantity, unit_price, sub_total, commission_amount, seller_amount,
      fulfillment_status, created_at,
      product ( id, name ),
      sale:sale_id (
        id, status, payment_status, created_at,
        buyer:customer_id ( id, name, email )
      )
    `
    )
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron leer tus ventas')
  }

  return (data ?? []).map(sp => ({
    lineId: sp.id,
    saleId: sp.sale?.id ?? null,
    orderStatus: sp.sale?.status ?? null,
    paymentStatus: sp.sale?.payment_status ?? null,
    fulfillmentStatus: sp.fulfillment_status,
    productId: sp.product?.id ?? null,
    productName: sp.product?.name ?? 'Producto eliminado',
    buyerName: sp.sale?.buyer?.name ?? null,
    buyerEmail: sp.sale?.buyer?.email ?? null,
    quantity: sp.quantity,
    unitPrice: sp.unit_price,
    subTotal: sp.sub_total,
    commissionAmount: sp.commission_amount,
    sellerAmount: sp.seller_amount,
    createdAt: sp.created_at
  }))
}

// El vendedor actualiza el estado de despacho de UNA línea suya.
const updateFulfillmentStatus = async ({ lineId, sellerId, status }) => {
  // Verifica que la línea sea del vendedor.
  const { data: line, error: readErr } = await supabase
    .from('sale_product')
    .select('id, seller_id')
    .eq('id', lineId)
    .single()

  if (readErr || !line) {
    throw new AppError(HTTP_STATUS.notFound, 'Venta no encontrada')
  }
  if (line.seller_id !== sellerId) {
    throw new AppError(HTTP_STATUS.unauthorized, 'Esta venta no es de tu tienda')
  }

  const { error } = await supabase
    .from('sale_product')
    .update({ fulfillment_status: status })
    .eq('id', lineId)

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo actualizar el estado')
  }

  return { lineId, fulfillmentStatus: status }
}

// Resumen de ganancias del vendedor (para su dashboard).
const getSellerEarnings = async ({ sellerId }) => {
  const { data: payouts, error } = await supabase
    .from('payout')
    .select('net_amount, gross_amount, commission_amount, status')
    .eq('seller_id', sellerId)

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron leer tus ganancias')
  }

  let pending = 0
  let paid = 0
  let gross = 0
  let commission = 0
  for (const p of payouts ?? []) {
    gross += p.gross_amount
    commission += p.commission_amount
    if (p.status === 'Pagado') paid += p.net_amount
    else pending += p.net_amount
  }

  return { gross, commission, net: gross - commission, pending, paid }
}

const updateSale = async ({
  id,
  status,
  customerId,
  total,
  transactionToken,
  buyOrder,
  authorizationCode,
  cardNumber,
  paymentMethod,
  paymentStatus
}) => {
  const payload = {
    status,
    customer_id: customerId,
    total,
    transaction_token: transactionToken,
    buy_order: buyOrder,
    authorization_code: authorizationCode,
    card_number: cardNumber,
    payment_method: paymentMethod,
    payment_status: paymentStatus
  }

  const validPayload = Object.entries(payload).reduce((acc, [key, value]) => {
    if (value) acc[key] = value
    return acc
  }, {})

  const { data, error } = await supabase
    .from('sale')
    .update(validPayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se ha podido actualizar la venta')
  }

  return data
}

const getSaleById = async ({ id }) => {
  const { data, error } = await supabase
    .from('sale')
    .select(
      `
      *,
      sale_product (
        quantity, unit_price, sub_total, seller_id,
        product ( id, name, stock )
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.notFound, 'No se ha podido encontrar la venta')
  }

  return data
}

export {
  createSale,
  generatePayoutsForSale,
  listSalesByCustomer,
  listSalesBySeller,
  updateFulfillmentStatus,
  getSellerEarnings,
  updateSale,
  getSaleById
}
