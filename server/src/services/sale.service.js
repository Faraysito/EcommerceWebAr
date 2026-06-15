import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// ============================================================
// Servicio de ventas. El checkout es lo delicado: valida stock, calcula el
// precio real (aplicando ofertas vigentes en el servidor, no confiando en lo
// que mande el cliente), crea la venta + sus líneas y descuenta stock.
//
// Limitación conocida: el cliente JS de Supabase no expone transacciones
// multi-statement, así que hacemos escrituras secuenciales con re-chequeo de
// stock. Para una tienda de este tamaño es suficiente. Si en el futuro se
// necesita atomicidad estricta, se mueve esta lógica a una función RPC de
// Postgres (plpgsql) y se llama con supabase.rpc().
// ============================================================

// Devuelve la oferta vigente AHORA para un producto (o null). Misma lógica que
// product.service para mantener un único criterio de descuento.
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

// Precio unitario real de un producto considerando ofertas. Entero (CLP).
function unitPriceWithOffer(product) {
  const offer = activeOfferFor(product)
  if (!offer) return product.price

  if (offer.discount_type === 'PERCENTAGE') {
    return Math.round(product.price * (1 - offer.discount_value / 100))
  }
  // FIXED
  return Math.max(0, product.price - offer.discount_value)
}

// Crea una venta a partir de un carrito [{ productId, quantity }].
// customer viene del JWT (req.customer): { id, email, name }.
const createSale = async ({ customerId, items, paymentMethod }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(HTTP_STATUS.badRequest, 'El carrito está vacío')
  }

  // 1. Normaliza: agrupa cantidades por producto (por si vienen repetidos).
  const qtyByProduct = new Map()
  for (const it of items) {
    const prev = qtyByProduct.get(it.productId) ?? 0
    qtyByProduct.set(it.productId, prev + it.quantity)
  }
  const productIds = [...qtyByProduct.keys()]

  // 2. Trae los productos reales (precio, stock, ofertas) desde la BD.
  const { data: products, error: prodError } = await supabase
    .from('product')
    .select('id, name, price, stock, offer ( discount_type, discount_value, start_date, end_date )')
    .in('id', productIds)

  if (prodError) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron leer los productos')
  }

  // 3. Valida existencia y stock; arma las líneas con precio del servidor.
  const lines = []
  let total = 0

  for (const productId of productIds) {
    const product = products.find(p => p.id === productId)
    if (!product) {
      throw new AppError(HTTP_STATUS.badRequest, 'Un producto del carrito ya no existe')
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
    total += subTotal

    lines.push({ product, quantity, unitPrice, subTotal })
  }

  // 4. Crea la venta (cabecera).
  const { data: sale, error: saleError } = await supabase
    .from('sale')
    .insert({
      customer_id: customerId,
      total,
      status: 'Pendiente',
      payment_method: paymentMethod
    })
    .select(
      'id, status, total, buy_order, authorization_code, transaction_token, card_number, payment_method, payment_status, created_at'
    )
    .single()

  if (saleError || !sale) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo crear la venta')
  }

  // 5. Inserta las líneas de la venta.
  const saleProducts = lines.map(l => ({
    sale_id: sale.id,
    product_id: l.product.id,
    quantity: l.quantity,
    unit_price: l.unitPrice,
    sub_total: l.subTotal
  }))

  const { error: spError } = await supabase.from('sale_product').insert(saleProducts)
  if (spError) {
    // Rollback best-effort de la cabecera para no dejar ventas vacías.
    await supabase.from('sale').delete().eq('id', sale.id)
    throw new AppError(
      HTTP_STATUS.internalServerError,
      'No se pudo registrar el detalle de la venta'
    )
  }

  // 6. Descuenta stock. Re-chequea por si cambió entre la lectura y ahora.
  for (const l of lines) {
    const { data: fresh } = await supabase
      .from('product')
      .select('stock')
      .eq('id', l.product.id)
      .single()

    const current = fresh?.stock ?? 0
    if (current < l.quantity) {
      // Carrera perdida: deshace todo lo de esta venta.
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
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      subTotal: l.subTotal
    }))
  }
}

// Lista los pedidos de un cliente, con sus líneas. Más reciente primero.
const listSalesByCustomer = async ({ customerId }) => {
  const { data, error } = await supabase
    .from('sale')
    .select(
      `
      id,
      status,
      total,
      created_at,
      sale_product (
        quantity,
        unit_price,
        sub_total,
        product ( id, name )
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
      quantity: sp.quantity,
      unitPrice: sp.unit_price,
      subTotal: sp.sub_total
    }))
  }))
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
    if (value) {
      acc[key] = value
    }

    return acc
  }, {})

  const { data, success } = await supabase
    .from('sale')
    .update(validPayload)
    .eq('id', id)
    .select()
    .single()

  if (!success) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se ha podido actualizar la venta')
  }

  return data
}

const getSaleById = async ({ id }) => {
  const { data, success } = await supabase
    .from('sale')
    .select(
      `
      *,
      sale_product (
        quantity,
        unit_price,
        sub_total,
        product ( id, name, stock )
      )
    `
    )
    .eq('id', id)
    .single()

  if (!success) {
    throw new AppError(HTTP_STATUS.notFound, 'No se ha podido encontrar la venta')
  }

  return data
}

export { createSale, listSalesByCustomer, updateSale, getSaleById }
