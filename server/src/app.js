import express from 'express'

// Controllers and Routes
import { healthCheckController } from './controllers/health-check.controller.js'
import { authRouter } from './router/auth.router.js'
import { publicRouter } from './router/public.router.js'
import { adminRouter } from './router/admin.router.js'
import { customerRouter } from './router/customer.router.js'

// Routers NUEVOS (este paquete)
import { publicExtrasRouter } from './router/public-extras.router.js'
import { customerExtrasRouter } from './router/customer-extras.router.js'
import { adminExtrasRouter } from './router/admin-extras.router.js'
import { embedRouter } from './router/embed.router.js'

// Middlewares
import cookieParser from 'cookie-parser'
import { notFound } from './middlewares/not-found.middleware.js'
import { corsMiddleware } from './middlewares/cors.middleware.js'
import { errorMiddleware } from './middlewares/error.middleware.js'
import { rateLimit } from './middlewares/rate-limit.middleware.js'

const app = express()

// Necesario detrás del proxy de Vercel: para que `secure` cookies y la
// detección de IP (x-forwarded-for) del rate limiter funcionen.
app.set('trust proxy', 1)

// Middlewares
app.use(corsMiddleware)
app.use(express.json())
app.use(cookieParser())

// Rate limiting en endpoints sensibles (fuerza bruta / abuso).
app.use('/api/auth/login', rateLimit({ windowMs: 60_000, max: 10 }))
app.use('/api/auth/register', rateLimit({ windowMs: 60_000, max: 10 }))
app.use('/api/customer/auth/login', rateLimit({ windowMs: 60_000, max: 10 }))
app.use('/api/customer/auth/register', rateLimit({ windowMs: 60_000, max: 10 }))
app.use('/api/customer/checkout', rateLimit({ windowMs: 60_000, max: 20 }))

// Routes
app.get('/api/health', healthCheckController)
app.use('/api/auth', authRouter)
app.use('/api/customer', customerRouter) // auth del cliente + checkout + pedidos
app.use('/api/customer', customerExtrasRouter) // reseñas/wishlist/direcciones del cliente
app.use('/api', publicRouter) // /api/products, /api/categories (publico)
app.use('/api', publicExtrasRouter) // reseñas públicas + productos similares
app.use('/api', embedRouter) // /api/embed/:id (visor AR público para iframe)
app.use('/api/admin', adminRouter) // CRUD protegido
app.use('/api/admin', adminExtrasRouter) // moderación de reseñas

// Middlewares
app.use(notFound)
app.use(errorMiddleware)

export default app
