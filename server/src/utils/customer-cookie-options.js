import { env } from '../config/env.js'

const isProd = env.NODE_ENV === 'production'

// Mismas reglas que la cookie del admin, pero esta es la sesión del CLIENTE
// (quien compra). Cookie distinta para que admin y cliente puedan coexistir
// en el mismo navegador sin pisarse.
const CUSTOMER_COOKIE_NAME = 'customer-token'

const CUSTOMER_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 7 * 1000, // 7 días en ms (el cliente dura más logueado)
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax'
}

export { CUSTOMER_COOKIE_NAME, CUSTOMER_COOKIE_OPTIONS }
