import { z } from 'zod'
import { listOffers, createOffer, deleteOffer } from '../../services/offer.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

const getOffersController = async (req, res) => {
  return res.status(HTTP_STATUS.ok).json(await listOffers())
}

const createSchema = z.object({
  productId: z.uuidv4(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().int().positive(),
  startDate: z.string().min(1), // ISO date string
  endDate: z.string().min(1)
})

const createOfferController = async (req, res) => {
  const body = createSchema.parse(req.body)
  const offer = await createOffer(body)
  return res.status(HTTP_STATUS.created).json(offer)
}

const deleteOfferController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  await deleteOffer({ id })
  return res.status(HTTP_STATUS.noContent).end()
}

export { getOffersController, createOfferController, deleteOfferController }
