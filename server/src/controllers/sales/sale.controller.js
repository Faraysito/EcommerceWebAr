import { z } from 'zod'
import { createSale, listSalesByCustomer } from '../../services/sale.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

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
  const sale = await createSale({ customerId: req.customer.id, items })
  return res.status(HTTP_STATUS.created).json(sale)
}

// Historial de pedidos del cliente logueado.
const myOrdersController = async (req, res) => {
  const orders = await listSalesByCustomer({ customerId: req.customer.id })
  return res.status(HTTP_STATUS.ok).json(orders)
}

export { checkoutController, myOrdersController }
