import { HTTP_STATUS } from '../utils/httpStatus.js'
import { AppError } from '../utils/AppError.js'

// 429 no está en httpStatus.js original; usa el del objeto si existe, o el
// número directo. Así este archivo funciona aunque no edites httpStatus.js.
const TOO_MANY_REQUESTS = HTTP_STATUS.tooManyRequests ?? 429

// Rate limiter en memoria (sin dependencias). Sirve para proteger endpoints
// sensibles (login, registro, checkout) de fuerza bruta / abuso básico.
//
// Limitación: el estado vive en el proceso. Si escalas a varias instancias,
// cada una cuenta por separado; para producción multi-instancia conviene
// mover el contador a Redis o usar un limitador a nivel de infraestructura.
//
// Uso:
//   import { rateLimit } from '../middlewares/rate-limit.middleware.js'
//   router.post('/login', rateLimit({ windowMs: 60_000, max: 10 }), loginController)

function rateLimit({ windowMs = 60_000, max = 30, message } = {}) {
  // key -> { count, resetAt }
  const hits = new Map()

  // Limpieza periódica de entradas vencidas para no crecer sin límite.
  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key)
    }
  }, windowMs)
  // No mantener vivo el proceso solo por este timer.
  if (typeof cleanup.unref === 'function') cleanup.unref()

  return (req, res, next) => {
    // Identifica al cliente por IP. Respeta x-forwarded-for si hay proxy.
    const fwd = req.headers['x-forwarded-for']
    const ip = (Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0])?.trim() || req.ip || 'unknown'
    const key = `${ip}:${req.baseUrl}${req.path}`

    const now = Date.now()
    const entry = hits.get(key)

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    entry.count += 1
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      res.setHeader('Retry-After', String(retryAfter))
      throw new AppError(
        TOO_MANY_REQUESTS,
        message || 'Demasiadas solicitudes. Inténtalo de nuevo en unos momentos.'
      )
    }

    return next()
  }
}

export { rateLimit }
