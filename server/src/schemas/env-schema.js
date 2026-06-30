import { z } from 'zod'
// transbank-sdk es CommonJS: se importa el default y se desestructura, porque
// los named imports de ESM no están garantizados sobre un módulo CJS.
import transbankSdk from 'transbank-sdk'
const { Environment, IntegrationCommerceCodes, IntegrationApiKeys } = transbankSdk

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
    .default('*'),
  TRANSBANK_COMMERCE_CODE: z.string().min(1).default(IntegrationCommerceCodes.WEBPAY_PLUS),
  TRANSBANK_API_KEY: z.string().min(1).default(IntegrationApiKeys.WEBPAY),
  TRANSBANK_ENVIRONMENT: z.string().default(Environment.Integration),
  TRANSBANK_RETURN_URL: z
    .url()
    .min(1)
    .default('http://localhost:3000/api/customer/checkout/commit'),
  REDIRECT_AFTER_CHECKOUT_TBK: z.url().min(1).default('http://localhost:5173/pedidos'),

  // --- Shopify OAuth ---
  SHOPIFY_API_KEY: z.string().min(1),
  SHOPIFY_API_SECRET: z.string().min(1),
  SHOPIFY_SCOPES: z.string().min(1).default('read_products,write_products'),
  SHOPIFY_APP_URL: z.url().min(1),
  SHOPIFY_FRONTEND_URL: z.url().min(1).default('https://ecommerce-web-ar-client.vercel.app')
})

export { envSchema }
