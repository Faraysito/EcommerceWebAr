import { Router } from 'express'
import customerAuth from '../middlewares/customer-auth.middleware.js'
import {
  shopifyAuthController,
  shopifyCallbackController
} from '../controllers/shopify/shopify.controller.js'
import { listShopifyProductsController } from '../controllers/shopify/shopify-products.controller.js'
import {
  listModelsController,
  listAssignmentsController,
  assignModelController,
  unassignModelController
} from '../controllers/shopify/shopify-assign.controller.js'

const shopifyRouter = Router()

// --- OAuth (Etapa 1) ---
shopifyRouter.get('/shopify/auth', customerAuth, shopifyAuthController)
shopifyRouter.get('/shopify/callback', shopifyCallbackController)

// --- Catálogo (Etapa 2) ---
shopifyRouter.get('/customer/shopify/products', customerAuth, listShopifyProductsController)

// --- Asociación modelo AR <-> producto (Etapa 3) ---
// Modelos disponibles para reusar.
shopifyRouter.get('/customer/models', customerAuth, listModelsController)
// Qué productos ya tienen modelo.
shopifyRouter.get('/customer/shopify/assignments', customerAuth, listAssignmentsController)
// Asignar / reasignar.
shopifyRouter.post('/customer/shopify/assign', customerAuth, assignModelController)
// Quitar asignación (POST, no DELETE: el cliente apiDelete no manda body).
shopifyRouter.post('/customer/shopify/unassign', customerAuth, unassignModelController)

export { shopifyRouter }
