import { Router } from 'express'
import customerAuth from '../middlewares/customer-auth.middleware.js'
import {
  shopifyAuthController,
  shopifyCallbackController
} from '../controllers/shopify/shopify.controller.js'

const shopifyRouter = Router()

// /auth: el vendedor (cuenta customer) inicia la instalación desde su panel.
// Requiere sesión de cliente (cookie customer-token) para capturar su id y
// asociarlo a la tienda en el state firmado.
shopifyRouter.get('/shopify/auth', customerAuth, shopifyAuthController)

// /callback: lo invoca Shopify, no el navegador del vendedor con su cookie.
// La seguridad la dan el HMAC y el state firmado, no la sesión.
shopifyRouter.get('/shopify/callback', shopifyCallbackController)

export { shopifyRouter }
