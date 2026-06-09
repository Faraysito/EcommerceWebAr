import jwt from 'jsonwebtoken';
import { HTTP_STATUS } from '../../utils/httpStatus.js';
import { AppError } from '../../utils/AppError.js'

function auth(req, res, next) {
  const cookie = req.cookies.authorization

  if (!cookie) {
    throw new AppError(HTTP_STATUS.unauthorized, 'La cookie es necesaria')
  }

  try {
    const payload = jwt.verify(cookie, process.env.JWT_SECRET)

    req.user = payload

    next()
  } catch {
    throw new AppError(HTTP_STATUS.unauthorized, 'Token inválido')
  }
}

export default auth;