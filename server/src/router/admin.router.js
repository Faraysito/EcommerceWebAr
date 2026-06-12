import { Router } from 'express'
import auth from '../middlewares/auth.middleware.js'
import { requirePermission } from '../middlewares/permission.middleware.js'
import {
  uploadImageMiddleware,
  uploadModelMiddleware
} from '../middlewares/upload.middleware.js'

import {
  createProductController,
  updateProductController,
  deleteProductController
} from '../controllers/products/product.controller.js'
import {
  createCategoryController,
  updateCategoryController,
  deleteCategoryController
} from '../controllers/categories/category.controller.js'
import {
  uploadImageController,
  getImagesController,
  deleteImageController,
  uploadModelController,
  getModelsController,
  deleteModelController
} from '../controllers/files/file.controller.js'
import {
  getUsersController,
  createUserController,
  deleteUserController
} from '../controllers/users/user.controller.js'
import {
  getOffersController,
  createOfferController,
  deleteOfferController
} from '../controllers/offers/offer.controller.js'

// Todas las rutas de este router pasan primero por auth (cookie JWT valida).
const adminRouter = Router()
adminRouter.use(auth)

// --- Productos ---
adminRouter.post('/products', requirePermission('product.create'), createProductController)
adminRouter.put('/products/:id', requirePermission('product.update'), updateProductController)
adminRouter.delete('/products/:id', requirePermission('product.delete'), deleteProductController)

// --- Categorias ---
adminRouter.post('/categories', requirePermission('category.create'), createCategoryController)
adminRouter.put('/categories/:id', requirePermission('category.update'), updateCategoryController)
adminRouter.delete('/categories/:id', requirePermission('category.delete'), deleteCategoryController)

// --- Imagenes ---
adminRouter.get('/images', requirePermission('image.read'), getImagesController)
adminRouter.post('/images', requirePermission('image.create'), uploadImageMiddleware, uploadImageController)
adminRouter.delete('/images/:id', requirePermission('image.delete'), deleteImageController)

// --- Modelos 3D ---
adminRouter.get('/models', requirePermission('model.read'), getModelsController)
adminRouter.post('/models', requirePermission('model.create'), uploadModelMiddleware, uploadModelController)
adminRouter.delete('/models/:id', requirePermission('model.delete'), deleteModelController)

// --- Ofertas ---
adminRouter.get('/offers', requirePermission('offer.read'), getOffersController)
adminRouter.post('/offers', requirePermission('offer.create'), createOfferController)
adminRouter.delete('/offers/:id', requirePermission('offer.delete'), deleteOfferController)

// --- Usuarios ---
adminRouter.get('/users', requirePermission('user.read'), getUsersController)
adminRouter.post('/users', requirePermission('user.create'), createUserController)
adminRouter.delete('/users/:id', requirePermission('user.delete'), deleteUserController)

export { adminRouter }
