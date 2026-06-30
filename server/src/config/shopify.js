import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api'
import '@shopify/shopify-api/adapters/node'
import { env } from './env.js'

// Cliente de la Admin API de Shopify. Lo usamos para:
//   - validar el callback (HMAC) e intercambiar code -> access token
//   - hacer requests GraphQL a la Admin API (Etapa 2+)
//
// hostName es el dominio de NUESTRO backend (sin https://), porque la lib lo
// usa para construir/validar las redirect URLs del OAuth.
const shopify = shopifyApi({
  apiKey: env.SHOPIFY_API_KEY,
  apiSecretKey: env.SHOPIFY_API_SECRET,
  scopes: env.SHOPIFY_SCOPES.split(','),
  hostName: env.SHOPIFY_APP_URL.replace(/^https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false // app NO embebida: OAuth clásico con redirect propio
})

export { shopify }
