import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'
import { ZodError } from 'zod'
import { HTTP_STATUS } from '../utils/httpStatus.js'

const errorMiddleware = (error, req, res, _next) => {
  if (env.NODE_ENV === 'development') {
    console.error('Error:', error)
  }

  if (error instanceof ZodError) {
    const details = error.issues.reduce((acc, currentValue) => {
      acc[currentValue.path] = currentValue.message
      return acc
    }, {})

    return res.status(HTTP_STATUS.badRequest).json({ error: 'Validation Error', details })
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message })
  }

  return res.status(HTTP_STATUS.internalServerError).json({ error: 'Internal Server Error' })
}

export { errorMiddleware }
