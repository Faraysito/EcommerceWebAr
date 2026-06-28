import { z } from 'zod'
import {
  listReviewsByProduct,
  getRatingSummary,
  upsertReview,
  deleteOwnReview,
  deleteReviewAsAdmin
} from '../../services/review.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// --- Público: reseñas + resumen de calificación de un producto ---
const getProductReviewsController = async (req, res) => {
  const { productId } = z.object({ productId: z.uuidv4() }).parse(req.params)
  const [reviews, summary] = await Promise.all([
    listReviewsByProduct({ productId }),
    getRatingSummary({ productId })
  ])
  return res.status(HTTP_STATUS.ok).json({ summary, reviews })
}

// --- Cliente: crear o actualizar la propia reseña ---
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional()
})

const upsertReviewController = async (req, res) => {
  const { productId } = z.object({ productId: z.uuidv4() }).parse(req.params)
  const { rating, comment } = reviewSchema.parse(req.body)

  const review = await upsertReview({
    productId,
    customerId: req.customer.id,
    rating,
    comment
  })

  return res.status(HTTP_STATUS.ok).json(review)
}

// --- Cliente: borrar la propia reseña ---
const deleteMyReviewController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  await deleteOwnReview({ reviewId: id, customerId: req.customer.id })
  return res.status(HTTP_STATUS.noContent).end()
}

// --- Admin: moderar (borrar cualquier reseña) ---
const deleteReviewAdminController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  await deleteReviewAsAdmin({ reviewId: id })
  return res.status(HTTP_STATUS.noContent).end()
}

export {
  getProductReviewsController,
  upsertReviewController,
  deleteMyReviewController,
  deleteReviewAdminController
}
