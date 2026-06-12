import { Router } from 'express'
import {
  getProductsController,
  getProductController
} from '../controllers/products/product.controller.js'
import { getCategoriesController } from '../controllers/categories/category.controller.js'

// Rutas publicas (sin auth): lo que consume el catalogo del frontend.
const publicRouter = Router()

publicRouter.get('/products', getProductsController)
publicRouter.get('/products/:id', getProductController)
publicRouter.get('/categories', getCategoriesController)

export { publicRouter }
