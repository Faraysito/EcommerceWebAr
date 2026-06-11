import jwt from 'jsonwebtoken'
import { HTTP_STATUS } from '../utils/httpStatus.js'
import { AppError } from '../utils/AppError.js'
import { env } from '../config/env.js'

// Valida el JWT que viaja en la cookie httpOnly 'auth-token'. Si es valido,
// deja el payload decodificado en req.user (incluye id, email, role y
// permissions). Se usa en todas las rutas protegidas (/api/admin/*).
function auth(req, res, next) {
  const token = req.cookies['auth-token']

  if (!token) {
    throw new AppError(HTTP_STATUS.unauthorized, 'Autenticación requerida')
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    req.user = payload
    next()
  } catch {
    throw new AppError(HTTP_STATUS.unauthorized, 'Token inválido o expirado')
  }
}

export default auth
