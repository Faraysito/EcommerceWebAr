import { Router } from 'express'
import auth from '../middlewares/auth.middleware.js'
import { requirePermission } from '../middlewares/permission.middleware.js'
import { deleteReviewAdminController } from '../controllers/reviews/review.controller.js'

// Rutas ADMIN nuevas: moderación de reseñas. Se montan bajo /api/admin.
// Requiere el permiso review.delete (añadido en la migración 06).
const adminExtrasRouter = Router()
adminExtrasRouter.use(auth)

adminExtrasRouter.delete(
  '/reviews/:id',
  requirePermission('review.delete'),
  deleteReviewAdminController
)

export { adminExtrasRouter }
