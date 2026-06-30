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
import { resolveModelController } from '../controllers/shopify/shopify-embed.controller.js'

const shopifyRouter = Router()

// --- OAuth (Etapa 1) ---
shopifyRouter.get('/shopify/auth', customerAuth, shopifyAuthController)
shopifyRouter.get('/shopify/callback', shopifyCallbackController)

// --- Resolución pública del modelo AR (Etapa 4) ---
// La consume el visor en el storefront del vendedor. SIN auth (CORS abierto).
shopifyRouter.get('/shopify/ar', resolveModelController)

// --- Catálogo (Etapa 2) ---
shopifyRouter.get('/customer/shopify/products', customerAuth, listShopifyProductsController)

// --- Asociación modelo AR <-> producto (Etapa 3) ---
shopifyRouter.get('/customer/models', customerAuth, listModelsController)
shopifyRouter.get('/customer/shopify/assignments', customerAuth, listAssignmentsController)
shopifyRouter.post('/customer/shopify/assign', customerAuth, assignModelController)
shopifyRouter.post('/customer/shopify/unassign', customerAuth, unassignModelController)

export { shopifyRouter }
