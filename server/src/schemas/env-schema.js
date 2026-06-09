import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .transform(val => Number(val))
    .default(3000),
  SUPABASE_URL: z.url().min(1),
  SUPABASE_KEY: z.string().min(1),
  SUPABASE_BUCKET: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z
    .string()
    .transform(val => {
      try {
        return JSON.parse(val)
      } catch {
        throw new Error('ALLOWED_ORIGINS must be a valid JSON array of strings')
      }
    })
    .default('*')
})

export { envSchema }
