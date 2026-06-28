import { Router } from 'express'
import customerAuth from '../middlewares/customer-auth.middleware.js'
import {
  upsertReviewController,
  deleteMyReviewController
} from '../controllers/reviews/review.controller.js'
import {
  myWishlistController,
  myWishlistIdsController,
  addController as addWishlistController,
  removeController as removeWishlistController
} from '../controllers/wishlist/wishlist.controller.js'
import {
  listController as listAddressesController,
  createController as createAddressController,
  updateController as updateAddressController,
  deleteController as deleteAddressController
} from '../controllers/addresses/address.controller.js'

// Rutas del CLIENTE logueado (cookie customer-token) que añaden:
//   - escribir/borrar su reseña
//   - favoritos (wishlist)
//   - direcciones de despacho
// Se montan bajo /api/customer junto al customerRouter existente.
const customerExtrasRouter = Router()

// --- Reseñas (escritura; la lectura es pública) ---
customerExtrasRouter.put('/products/:productId/reviews', customerAuth, upsertReviewController)
customerExtrasRouter.delete('/reviews/:id', customerAuth, deleteMyReviewController)

// --- Wishlist / favoritos ---
customerExtrasRouter.get('/wishlist', customerAuth, myWishlistController)
customerExtrasRouter.get('/wishlist/ids', customerAuth, myWishlistIdsController)
customerExtrasRouter.post('/wishlist', customerAuth, addWishlistController)
customerExtrasRouter.delete('/wishlist/:productId', customerAuth, removeWishlistController)

// --- Direcciones de despacho ---
customerExtrasRouter.get('/addresses', customerAuth, listAddressesController)
customerExtrasRouter.post('/addresses', customerAuth, createAddressController)
customerExtrasRouter.put('/addresses/:id', customerAuth, updateAddressController)
customerExtrasRouter.delete('/addresses/:id', customerAuth, deleteAddressController)

export { customerExtrasRouter }
