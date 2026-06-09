import { getUserByEmail } from '../../services/user.service.js'
import { COOKIE_OPTIONS } from '../../utils/cookie-options.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'
import { AppError } from '../../utils/AppError.js'
import { env } from '../../config/env.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const bodySchema = z.object({
  email: z.email().min(1),
  password: z.string().min(8)
})

const loginController = async (req, res) => {
  const { email, password } = bodySchema.parse(req.body)

  const { password: hashedPassword, ...restUser } = await getUserByEmail({ email })

  const checkPassword = await bcrypt.compare(password, hashedPassword)

  if (!checkPassword) {
    throw new AppError(HTTP_STATUS.badRequest, 'Email or password is invalid')
  }

  const token = jwt.sign(restUser, env.JWT_SECRET, { expiresIn: '1d' })

  return res.status(HTTP_STATUS.ok).cookie('auth-token', token, COOKIE_OPTIONS).json(restUser)
}

export { loginController }
