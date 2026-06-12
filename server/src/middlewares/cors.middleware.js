import cors from 'cors'
import { env } from '../config/env.js'

// credentials: true es imprescindible para que el navegador acepte enviar y
// recibir la cookie httpOnly de sesion en peticiones cross-origin (front en
// :5173, back en :3000).
//
// OJO: con credentials, el origin NO puede ser '*'. Tiene que ser una lista
// explicita de origenes (ej. ["http://localhost:5173"]). Asegurate de que
// ALLOWED_ORIGINS en el .env tenga tu origen del frontend.
const corsMiddleware = cors({
  origin: env.ALLOWED_ORIGINS,
  credentials: true
})

export { corsMiddleware }
