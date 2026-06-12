import { env } from './config/env.js'
import express from 'express'

// Controllers and Routes
import { healthCheckController } from './controllers/health-check.controller.js'
import { authRouter } from './router/auth.router.js'
import { publicRouter } from './router/public.router.js'
import { adminRouter } from './router/admin.router.js'
import { customerRouter } from './router/customer.router.js'

// Middlewares
import cookieParser from 'cookie-parser'
import { notFound } from './middlewares/not-found.middleware.js'
import { corsMiddleware } from './middlewares/cors.middleware.js'
import { errorMiddleware } from './middlewares/error.middleware.js'

const app = express()

// Middlewares
app.use(corsMiddleware)
app.use(express.json())
app.use(cookieParser())

// Routes
app.get('/api/health', healthCheckController)
app.use('/api/auth', authRouter)
app.use('/api/customer', customerRouter) // auth del cliente + checkout + pedidos
app.use('/api', publicRouter) // /api/products, /api/categories (publico)
app.use('/api/admin', adminRouter) // CRUD protegido

// Middlewares
app.use(notFound)
app.use(errorMiddleware)

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)
})
