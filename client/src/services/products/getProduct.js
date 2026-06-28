import { env } from '../../config/env'

// Detalle de un producto y productos similares (recomendador). Públicos, sin
// cookie; mismo estilo que getProducts.

export const getProductById = async id => {
  const res = await fetch(`${env.VITE_API_URL}/api/products/${id}`)
  if (!res.ok) throw new Error('No se pudo cargar el producto')
  return res.json()
}

export const getSimilarProducts = async (id, limit = 8) => {
  const res = await fetch(`${env.VITE_API_URL}/api/products/${id}/similar?limit=${limit}`)
  if (!res.ok) throw new Error('No se pudieron cargar recomendaciones')
  return res.json()
}
