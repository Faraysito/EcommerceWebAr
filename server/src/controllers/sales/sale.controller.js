import { z } from 'zod'
import {
  createSale,
  getSaleById,
  listSalesByCustomer,
  updateSale
} from '../../services/sale.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'
import {
  commitTransaction,
  initTransaction,
  statusTransaction
} from '../../services/transbank.service.js'
import { AppError } from '../../utils/AppError.js'
import { randomBytes } from 'node:crypto'
import { env } from '../../config/env.js'
import { updateProduct } from '../../services/product.service.js'

// Checkout: recibe el carrito y crea la venta. El cliente sale del JWT
// (req.customer), no del body, para que nadie compre a nombre de otro.
const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.uuidv4(),
        quantity: z.number().int().positive()
      })
    )
    .min(1)
})

const checkoutController = async (req, res) => {
  const { items } = checkoutSchema.parse(req.body)

  const sale = await createSale({
    customerId: req.customer.id,
    items,
    paymentMethod: 'Webpay Plus'
  })

  const buyOrder = randomBytes(10).toString('hex')

  const initSale = await initTransaction({
    amount: sale.total,
    sessionId: req.customer.id,
    buyOrder: `VENTA-${buyOrder}`,
    returnUrl: `${env.TRANSBANK_RETURN_URL}/${sale.id}`
  })

  return res.status(HTTP_STATUS.created).json(initSale)
}

const statusMap = {
  AUTHORIZED: 'Completado',
  INITIALIZED: 'En progreso',
  FAILED: 'Cancelado',
  REVERSED: 'Cancelado'
}

const checkoutCommitController = async (req, res) => {
  const { token_ws, TBK_TOKEN } = req.query
  const { saleId } = req.params

  if (!saleId) {
    throw new AppError(HTTP_STATUS.badRequest, 'Es necesario el id de la venta')
  }

  const sale = await getSaleById({ id: saleId })

  const prodToModify = sale.sale_product.map(data => ({
    id: data.product.id,
    quantity: data.quantity,
    productStock: data.product.stock
  }))

  if (TBK_TOKEN) {
    // Compra anulada por el usuario
    const data = await statusTransaction({ token: TBK_TOKEN })

    // Devuelve el stock antes de la compra
    prodToModify.forEach(async ({ id, quantity, productStock }) => {
      await updateProduct({ id, stock: productStock + quantity })
    })

    await updateSale({
      id: saleId,
      transactionToken: TBK_TOKEN,
      buyOrder: data.buy_order,
      paymentStatus: data.status,
      status: statusMap.FAILED
    })

    return res.status(HTTP_STATUS.ok).redirect(env.REDIRECT_AFTER_CHECKOUT_TBK)
  }

  if (!token_ws) {
    throw new AppError(HTTP_STATUS.badRequest, 'No existe el token de la transacción')
  }

  const transaction = await commitTransaction({ token: token_ws })

  const payload = {
    status: statusMap[transaction.status] ?? 'Cancelado',
    transactionToken: token_ws,
    buyOrder: transaction.buy_order,
    authorizationCode: transaction.authorization_code,
    cardNumber: transaction.card_detail.card_number,
    paymentStatus: transaction.status
  }

  // Devuelve el stock antes de la compra si esta es distinta de 'AUTHORIZED'
  if (transaction.status !== 'AUTHORIZED') {
    prodToModify.forEach(async ({ id, quantity, productStock }) => {
      await updateProduct({ id, stock: productStock + quantity })
    })
  }

  await updateSale({
    id: saleId,
    ...payload
  })

  return res.status(HTTP_STATUS.ok).redirect(env.REDIRECT_AFTER_CHECKOUT_TBK)
}

// Historial de pedidos del cliente logueado.
const myOrdersController = async (req, res) => {
  const orders = await listSalesByCustomer({ customerId: req.customer.id })
  return res.status(HTTP_STATUS.ok).json(orders)
}

export { checkoutController, myOrdersController, checkoutCommitController }
