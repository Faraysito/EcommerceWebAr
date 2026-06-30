import { Router } from 'express'
import auth from '../middlewares/auth.middleware.js'
import {
  shopifyAuthController,
  shopifyCallbackController
} from '../controllers/shopify/shopify.controller.js'

const shopifyRouter = Router()

// /auth: el vendedor inicia la instalación desde su panel (requiere sesión JWT,
// para capturar su id y asociarlo a la tienda en el state firmado).
shopifyRouter.get('/shopify/auth', auth, shopifyAuthController)

// /callback: lo invoca Shopify, no el navegador del vendedor con su cookie.
// La seguridad la dan el HMAC y el state firmado, no el JWT. Por eso NO lleva
// el middleware auth (la cookie no viaja en una redirección desde Shopify).
shopifyRouter.get('/shopify/callback', shopifyCallbackController)

export { shopifyRouter }
