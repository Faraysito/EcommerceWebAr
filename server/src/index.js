import { env } from './config/env.js'
import express from 'express'

// Controllers and Routes
import { healthCheckController } from './controllers/health-check.controller.js'
import { authRouter } from './router/auth.router.js'

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
app.use('/api/auth', authRouter)
app.get('/api/health', healthCheckController)

// Middlewares
app.use(notFound)
app.use(errorMiddleware)

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)
})
