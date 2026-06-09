import cors from 'cors'
import { env } from '../config/env.js'

const corsMiddleware = cors({
  origin: env.ALLOWED_ORIGINS
})

export { corsMiddleware }
