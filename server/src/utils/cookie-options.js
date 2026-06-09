import { env } from '../config/env.js'

const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24, // 1d
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'none'
}

export { COOKIE_OPTIONS }
