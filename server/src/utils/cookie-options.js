import { env } from '../config/env.js'

const isProd = env.NODE_ENV === 'production'

// En produccion: sameSite 'none' + secure (front y back en dominios distintos
// sobre HTTPS). En desarrollo: 'lax' sin secure, porque 'none' sin secure es
// rechazado por los navegadores y la cookie no se guardaria en localhost.
const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 1000, // 1 dia en ms
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax'
}

export { COOKIE_OPTIONS }
