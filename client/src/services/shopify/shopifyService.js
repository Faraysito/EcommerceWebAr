import { apiGet } from '../api'

// Servicio Shopify del vendedor. La conexión OAuth se inicia con una
// navegación top-level (no fetch), por eso eso NO está aquí. Aquí solo van las
// llamadas de datos vía API normal (cookie de cliente).

// Lista los productos de la tienda Shopify conectada del vendedor.
// Devuelve { shop, products: [...] }.
export const getShopifyProducts = () => apiGet('/customer/shopify/products')
