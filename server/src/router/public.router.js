import { Router } from 'express'
import {
  getProductsController,
  getProductController
} from '../controllers/products/product.controller.js'
import { getCategoriesController } from '../controllers/categories/category.controller.js'
import {
  getStoreController,
  listStoresController
} from '../controllers/customer/seller.controller.js'

// Rutas públicas (sin auth): lo que consume el catálogo del marketplace.
const publicRouter = Router()

publicRouter.get('/products', getProductsController) // ?search= ?seller=
publicRouter.get('/products/:id', getProductController)
publicRouter.get('/categories', getCategoriesController)

// Tiendas (vendedores) públicas
publicRouter.get('/stores', listStoresController)
publicRouter.get('/stores/:slug', getStoreController)

export { publicRouter }
