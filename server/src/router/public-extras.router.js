import { Router } from 'express'
import { getProductReviewsController } from '../controllers/reviews/review.controller.js'
import { getSimilarProductsController } from '../controllers/products/similar.controller.js'

// Rutas PÚBLICAS nuevas (sin auth): reseñas de un producto y recomendaciones.
// Se montan junto al resto del router público en /api.
const publicExtrasRouter = Router()

// Reseñas + resumen de calificación de un producto.
publicExtrasRouter.get('/products/:productId/reviews', getProductReviewsController)

// Productos similares (recomendador). ?limit=8
publicExtrasRouter.get('/products/:id/similar', getSimilarProductsController)

export { publicExtrasRouter }
