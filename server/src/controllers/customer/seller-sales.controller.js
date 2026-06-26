import { z } from 'zod'
import {
  listSalesBySeller,
  updateFulfillmentStatus,
  getSellerEarnings
} from '../../services/sale.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// Ventas y ganancias del VENDEDOR logueado.

const mySalesController = async (req, res) => {
  const sales = await listSalesBySeller({ sellerId: req.customer.id })
  return res.status(HTTP_STATUS.ok).json(sales)
}

const myEarningsController = async (req, res) => {
  const earnings = await getSellerEarnings({ sellerId: req.customer.id })
  return res.status(HTTP_STATUS.ok).json(earnings)
}

const fulfillmentSchema = z.object({
  status: z.enum(['Pendiente', 'Preparando', 'Enviado', 'Entregado', 'Cancelado'])
})

const updateFulfillmentController = async (req, res) => {
  const { lineId } = z.object({ lineId: z.uuidv4() }).parse(req.params)
  const { status } = fulfillmentSchema.parse(req.body)

  const result = await updateFulfillmentStatus({
    lineId,
    sellerId: req.customer.id,
    status
  })

  return res.status(HTTP_STATUS.ok).json(result)
}

export { mySalesController, myEarningsController, updateFulfillmentController }
