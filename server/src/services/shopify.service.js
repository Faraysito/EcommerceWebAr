import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// --- Validación del dominio de la tienda ---
// Solo aceptamos dominios *.myshopify.com bien formados. Previene open redirect.
function sanitizeShop(shop) {
  if (!shop || typeof shop !== 'string') {
    throw new AppError(HTTP_STATUS.badRequest, 'Falta el parámetro shop')
  }
  const clean = shop.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(clean)) {
    throw new AppError(HTTP_STATUS.badRequest, 'Dominio de tienda inválido')
  }
  return clean
}

// --- State firmado (nonce + seller_id) ---
// En serverless no hay memoria entre el inicio del OAuth y el callback, así que
// el nonce no se guarda en el server: se firma dentro de un JWT corto y viaja
// en el parámetro state. En el callback se verifica la firma. De paso lleva el
// seller_id del vendedor logueado que inició la instalación.
function buildState(sellerId) {
  const nonce = crypto.randomBytes(16).toString('hex')
  return jwt.sign({ nonce, sellerId }, env.JWT_SECRET, { expiresIn: '10m' })
}

function verifyState(state) {
  try {
    return jwt.verify(state, env.JWT_SECRET) // { nonce, sellerId }
  } catch {
    throw new AppError(HTTP_STATUS.badRequest, 'State OAuth inválido o expirado')
  }
}

// --- Paso 1: construir la URL de autorización ---
// Devuelve la URL de Shopify a la que redirigimos al vendedor para que conceda
// permisos. redirect_uri es nuestra URL registrada (/api/shopify/callback).
function buildAuthUrl({ shop, sellerId }) {
  const cleanShop = sanitizeShop(shop)
  const state = buildState(sellerId)
  const redirectUri = `${env.SHOPIFY_APP_URL}/api/shopify/callback`

  const params = new URLSearchParams({
    client_id: env.SHOPIFY_API_KEY,
    scope: env.SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state
  })

  return {
    authUrl: `https://${cleanShop}/admin/oauth/authorize?${params.toString()}`,
    state
  }
}

// --- Paso 2: validar el callback e intercambiar code por access token ---
async function handleCallback(query) {
  const { shop, code, state } = query

  const cleanShop = sanitizeShop(shop)
  if (!code) throw new AppError(HTTP_STATUS.badRequest, 'Falta el code de autorización')

  // a) Verifica la firma del state (anti-CSRF + recupera seller).
  const { sellerId } = verifyState(state)

  // b) Verifica el HMAC de Shopify sobre el query completo (autenticidad).
  validateHmac(query)

  // c) Intercambia el code por el access token (offline).
  const tokenRes = await fetch(`https://${cleanShop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.SHOPIFY_API_KEY,
      client_secret: env.SHOPIFY_API_SECRET,
      code
    })
  })

  if (!tokenRes.ok) {
    throw new AppError(HTTP_STATUS.badGateway, 'Shopify rechazó el intercambio de token')
  }

  const data = await tokenRes.json() // { access_token, scope }

  // d) Persiste/actualiza la tienda (upsert por shop).
  await upsertStore({
    shop: cleanShop,
    accessToken: data.access_token,
    scope: data.scope,
    sellerId
  })

  return { shop: cleanShop }
}

// --- Verificación HMAC del callback ---
// Shopify firma el query string con el client secret. Recomputamos y comparamos
// en tiempo constante. Sin esto, cualquiera podría falsificar un callback.
function validateHmac(query) {
  const { hmac, signature: _signature, ...rest } = query
  if (!hmac) throw new AppError(HTTP_STATUS.badRequest, 'Falta HMAC')

  const message = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join('&')

  const generated = crypto
    .createHmac('sha256', env.SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex')

  const ok =
    generated.length === hmac.length &&
    crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(hmac))

  if (!ok) throw new AppError(HTTP_STATUS.unauthorized, 'HMAC inválido')
}

// --- Persistencia ---
async function upsertStore({ shop, accessToken, scope, sellerId }) {
  const { error } = await supabase.from('shopify_store').upsert(
    {
      shop,
      access_token: accessToken,
      scope,
      seller_id: sellerId ?? null,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'shop' }
  )

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, `Error guardando tienda: ${error.message}`)
  }
}

export { buildAuthUrl, handleCallback }
