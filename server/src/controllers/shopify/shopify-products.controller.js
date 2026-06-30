import { getSellerShopifyProducts } from '../../services/shopify-admin.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// GET /api/customer/shopify/products
// Devuelve los productos de la tienda Shopify del vendedor logueado.
// Protegido por customerAuth: el seller_id sale de req.customer.id.
async function listShopifyProductsController(req, res) {
  const result = await getSellerShopifyProducts({ sellerId: req.customer.id })
  return res.status(HTTP_STATUS.ok).json(result)
}

export { listShopifyProductsController }
