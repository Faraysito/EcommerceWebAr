import { resolveModel } from '../../services/shopify-embed.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// GET /api/shopify/ar?shop=xxx.myshopify.com&product_id=123
// PÚBLICO: lo llama el visor AR en el storefront del vendedor. Devuelve la URL
// del .glb y medidas para ese producto, o { hasModel: false }.
//
// CORS abierto: el storefront es un dominio arbitrario (la tienda del vendedor),
// así que este endpoint permite cualquier origen. Solo expone datos públicos
// (la URL del modelo ya es pública en Storage).
async function resolveModelController(req, res) {
  // Permite que cualquier storefront consuma este endpoint.
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Cache-Control', 'public, max-age=300') // 5 min de cache en el CDN/navegador

  const { shop, product_id: productId } = req.query
  const result = await resolveModel({ shop, productId })
  return res.status(HTTP_STATUS.ok).json(result)
}

export { resolveModelController }
