import jwt from 'jsonwebtoken'
import { HTTP_STATUS } from '../utils/httpStatus.js'
import { AppError } from '../utils/AppError.js'
import { env } from '../config/env.js'
import { CUSTOMER_COOKIE_NAME } from '../utils/customer-cookie-options.js'

// Valida el JWT de la cookie 'customer-token' (sesión del cliente que compra).
// Deja el payload en req.customer (id, email, name). Distinto del auth del
// admin, que usa req.user y la cookie 'auth-token'.
function customerAuth(req, res, next) {
  const token = req.cookies[CUSTOMER_COOKIE_NAME]

  if (!token) {
    throw new AppError(HTTP_STATUS.unauthorized, 'Debes iniciar sesión para continuar')
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    req.customer = payload
    next()
  } catch {
    throw new AppError(HTTP_STATUS.unauthorized, 'Sesión inválida o expirada')
  }
}

export default customerAuth
