import { buildAuthUrl, handleCallback } from '../../services/shopify.service.js'
import { env } from '../../config/env.js'

// GET /api/shopify/auth?shop=xxx.myshopify.com
// Inicia el OAuth. El vendedor llega aquí autenticado (cookie JWT), así
// capturamos su id para asociarlo a la tienda. Redirige a Shopify.
function shopifyAuthController(req, res) {
  const { shop } = req.query
  const sellerId = req.customer?.id ?? null

  const { authUrl } = buildAuthUrl({ shop, sellerId })
  res.redirect(authUrl)
}

// GET /api/shopify/callback
// Shopify redirige aquí tras el consentimiento. Validamos HMAC + state,
// intercambiamos code por token, lo guardamos, y devolvemos al panel del
// vendedor en el frontend.
async function shopifyCallbackController(req, res) {
  const { shop } = await handleCallback(req.query)

  // Vuelve al panel de vendedor (/vender) con un flag de éxito.
  const redirectTo = `${env.SHOPIFY_FRONTEND_URL}/vender?shopify=connected&shop=${encodeURIComponent(shop)}`
  res.redirect(redirectTo)
}

export { shopifyAuthController, shopifyCallbackController }
