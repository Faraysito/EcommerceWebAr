import { Router } from 'express'
import customerAuth from '../middlewares/customer-auth.middleware.js'
import {
  customerRegisterController,
  customerLoginController,
  customerLogoutController,
  customerVerifyController
} from '../controllers/customer/customer-auth.controller.js'
import {
  checkoutCommitController,
  checkoutController,
  myOrdersController
} from '../controllers/sales/sale.controller.js'

// Rutas del CLIENTE de la tienda (quien compra). Sesión propia con la cookie
// 'customer-token', separada del panel admin.
const customerRouter = Router()

// --- Auth del cliente ---
customerRouter.post('/auth/register', customerRegisterController)
customerRouter.post('/auth/login', customerLoginController)
customerRouter.post('/auth/logout', customerLogoutController)
customerRouter.get('/auth/verify', customerAuth, customerVerifyController)

// --- Compras (requieren sesión de cliente) ---
customerRouter.post('/checkout', customerAuth, checkoutController)
customerRouter.get('/checkout/commit/:saleId', customerAuth, checkoutCommitController)
customerRouter.get('/orders', customerAuth, myOrdersController)

export { customerRouter }
