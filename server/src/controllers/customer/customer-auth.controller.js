import { z } from 'zod'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { createCustomer, getCustomerByEmail } from '../../services/customer.service.js'
import {
  CUSTOMER_COOKIE_NAME,
  CUSTOMER_COOKIE_OPTIONS
} from '../../utils/customer-cookie-options.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'
import { AppError } from '../../utils/AppError.js'
import { env } from '../../config/env.js'

// El payload que firmamos en el JWT del cliente. Sin datos sensibles.
const buildPayload = customer => ({
  id: customer.id,
  email: customer.email,
  name: customer.name ?? null
})

// --- Registro ---
const registerSchema = z.object({
  email: z.email().min(1),
  password: z.string().min(8),
  name: z.string().trim().min(1).optional()
})

const customerRegisterController = async (req, res) => {
  const { email, password, name } = registerSchema.parse(req.body)
  const hashedPassword = await bcrypt.hash(password, 10)

  const customer = await createCustomer({ email, password: hashedPassword, name })
  const payload = buildPayload(customer)
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' })

  return res
    .status(HTTP_STATUS.created)
    .cookie(CUSTOMER_COOKIE_NAME, token, CUSTOMER_COOKIE_OPTIONS)
    .json(payload)
}

// --- Login ---
const loginSchema = z.object({
  email: z.email().min(1),
  password: z.string().min(8)
})

const customerLoginController = async (req, res) => {
  const { email, password } = loginSchema.parse(req.body)

  const { password: hashedPassword, ...rest } = await getCustomerByEmail({ email })
  const ok = await bcrypt.compare(password, hashedPassword)

  if (!ok) {
    throw new AppError(HTTP_STATUS.badRequest, 'Email o contraseña inválidos')
  }

  const payload = buildPayload(rest)
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' })

  return res
    .status(HTTP_STATUS.ok)
    .cookie(CUSTOMER_COOKIE_NAME, token, CUSTOMER_COOKIE_OPTIONS)
    .json(payload)
}

// --- Logout ---
const customerLogoutController = (req, res) => {
  return res
    .status(HTTP_STATUS.ok)
    .clearCookie(CUSTOMER_COOKIE_NAME, CUSTOMER_COOKIE_OPTIONS)
    .json({ message: 'Sesión cerrada' })
}

// --- Verify (sesión activa) ---
const customerVerifyController = (req, res) => {
  return res.status(HTTP_STATUS.ok).json({
    valid: true,
    id: req.customer.id,
    email: req.customer.email,
    name: req.customer.name ?? null
  })
}

export {
  customerRegisterController,
  customerLoginController,
  customerLogoutController,
  customerVerifyController
}
