import { z } from 'zod'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import {
  createCustomer,
  getCustomerByEmail,
  getCustomerById
} from '../../services/customer.service.js'
import {
  CUSTOMER_COOKIE_NAME,
  CUSTOMER_COOKIE_OPTIONS
} from '../../utils/customer-cookie-options.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'
import { AppError } from '../../utils/AppError.js'
import { env } from '../../config/env.js'

// Payload del JWT del cliente. Incluye is_seller para que el frontend muestre
// el panel de vendedor sin consultar la BD en cada navegación. No lleva datos
// sensibles (ni password ni datos de pago).
const buildPayload = customer => ({
  id: customer.id,
  email: customer.email,
  name: customer.name ?? null,
  isSeller: Boolean(customer.is_seller),
  storeName: customer.store_name ?? null,
  storeSlug: customer.store_slug ?? null
})

const sign = payload => jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' })

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

  return res
    .status(HTTP_STATUS.created)
    .cookie(CUSTOMER_COOKIE_NAME, sign(payload), CUSTOMER_COOKIE_OPTIONS)
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

  return res
    .status(HTTP_STATUS.ok)
    .cookie(CUSTOMER_COOKIE_NAME, sign(payload), CUSTOMER_COOKIE_OPTIONS)
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
// Relee el cliente de la BD para reflejar cambios recientes (ej. acaba de
// abrir su tienda) y reemite la cookie con el payload fresco.
const customerVerifyController = async (req, res) => {
  const fresh = await getCustomerById({ id: req.customer.id })
  const payload = buildPayload(fresh)

  return res
    .status(HTTP_STATUS.ok)
    .cookie(CUSTOMER_COOKIE_NAME, sign(payload), CUSTOMER_COOKIE_OPTIONS)
    .json({ valid: true, ...payload })
}

export {
  customerRegisterController,
  customerLoginController,
  customerLogoutController,
  customerVerifyController
}
