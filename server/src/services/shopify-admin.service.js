import { supabase } from '../config/supabase.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Lee el catálogo de la tienda Shopify del vendedor vía Admin GraphQL API.
//
// Flujo: con el seller_id (req.customer.id) buscamos su fila en shopify_store
// (shop + access_token), y con eso consultamos la API de Shopify. El token
// NUNCA sale del backend.

const API_VERSION = '2026-04' // misma versión que el .toml de la app

// --- Recupera la tienda conectada de un vendedor ---
async function getStoreBySeller(sellerId) {
  const { data, error } = await supabase
    .from('shopify_store')
    .select('shop, access_token, scope')
    .eq('seller_id', sellerId)
    .maybeSingle()

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, `Error leyendo tienda: ${error.message}`)
  }
  if (!data) {
    throw new AppError(HTTP_STATUS.notFound, 'No tienes ninguna tienda Shopify conectada')
  }
  return data
}

// --- Request genérico a la Admin GraphQL API ---
async function shopifyGraphql({ shop, accessToken, query, variables }) {
  const res = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({ query, variables })
  })

  if (!res.ok) {
    // 401/403 -> token inválido o scope insuficiente. 429 -> rate limit.
    throw new AppError(
      HTTP_STATUS.badGateway,
      `Shopify respondió ${res.status} al consultar la API`
    )
  }

  const json = await res.json()

  // GraphQL devuelve 200 con errores dentro del body.
  if (json.errors?.length) {
    throw new AppError(HTTP_STATUS.badGateway, `GraphQL: ${json.errors[0].message}`)
  }

  return json.data
}

// --- Query: primeros N productos del vendedor ---
const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first, sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          id
          title
          handle
          status
          totalInventory
          featuredImage {
            url
            altText
          }
          priceRangeV2 {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`

// Aplana la respuesta GraphQL a una lista simple para el frontend.
function listProducts(rawData) {
  const edges = rawData?.products?.edges ?? []
  return edges.map(({ node }) => ({
    id: node.id, // gid://shopify/Product/123...
    title: node.title,
    handle: node.handle,
    status: node.status,
    inventory: node.totalInventory,
    image: node.featuredImage?.url ?? null,
    imageAlt: node.featuredImage?.altText ?? node.title,
    price: node.priceRangeV2?.minVariantPrice?.amount ?? null,
    currency: node.priceRangeV2?.minVariantPrice?.currencyCode ?? null
  }))
}

// --- Punto de entrada: productos de la tienda del vendedor ---
async function getSellerShopifyProducts({ sellerId, first = 50 }) {
  const { shop, access_token: accessToken } = await getStoreBySeller(sellerId)

  const data = await shopifyGraphql({
    shop,
    accessToken,
    query: PRODUCTS_QUERY,
    variables: { first }
  })

  return { shop, products: listProducts(data) }
}

export { getSellerShopifyProducts, getStoreBySeller }
