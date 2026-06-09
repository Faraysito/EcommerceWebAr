import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.url().min(1).default('http://localhost:3000')
})

export { envSchema }
