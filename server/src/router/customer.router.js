import { Router } from 'express'
import customerAuth from '../middlewares/customer-auth.middleware.js'
import { uploadImageMiddleware, uploadModelMiddleware } from '../middlewares/upload.middleware.js'
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
import {
  becomeSellerController,
  getMyPayoutInfoController
} from '../controllers/customer/seller.controller.js'
import {
  myProductsController,
  createMyProductController,
  updateMyProductController,
  deleteMyProductController
} from '../controllers/customer/seller-product.controller.js'
import {
  mySalesController,
  myEarningsController,
  updateFulfillmentController
} from '../controllers/customer/seller-sales.controller.js'
import {
  uploadImageController,
  uploadModelController
} from '../controllers/files/file.controller.js'

// Rutas del CLIENTE del marketplace (cuenta unificada: compra y vende).
// Sesión propia con la cookie 'customer-token', separada del panel admin.
const customerRouter = Router()

// --- Auth del cliente ---
customerRouter.post('/auth/register', customerRegisterController)
customerRouter.post('/auth/login', customerLoginController)
customerRouter.post('/auth/logout', customerLogoutController)
customerRouter.get('/auth/verify', customerAuth, customerVerifyController)

// --- Compras (como comprador) ---
customerRouter.post('/checkout', customerAuth, checkoutController)
customerRouter.get('/checkout/commit/:saleId', customerAuth, checkoutCommitController)
customerRouter.get('/orders', customerAuth, myOrdersController)

// --- Convertirse en vendedor / perfil de tienda (auto-aprobado) ---
customerRouter.post('/seller/become', customerAuth, becomeSellerController)
customerRouter.get('/seller/payout-info', customerAuth, getMyPayoutInfoController)

// --- Productos del vendedor (su propio inventario) ---
customerRouter.get('/seller/products', customerAuth, myProductsController)
customerRouter.post('/seller/products', customerAuth, createMyProductController)
customerRouter.put('/seller/products/:id', customerAuth, updateMyProductController)
customerRouter.delete('/seller/products/:id', customerAuth, deleteMyProductController)

// --- Subida de archivos del vendedor (imágenes y modelos 3D de sus productos) ---
// Reutiliza los controllers de archivos; cualquier vendedor autenticado puede
// subir. Los archivos quedan en el mismo bucket compartido.
customerRouter.post('/seller/images', customerAuth, uploadImageMiddleware, uploadImageController)
customerRouter.post('/seller/models', customerAuth, uploadModelMiddleware, uploadModelController)

// --- Ventas y ganancias del vendedor ---
customerRouter.get('/seller/sales', customerAuth, mySalesController)
customerRouter.get('/seller/earnings', customerAuth, myEarningsController)
customerRouter.put('/seller/sales/:lineId/fulfillment', customerAuth, updateFulfillmentController)

export { customerRouter }
