import { apiGet, apiPut, apiDelete } from '../api'

// Reseñas. La lectura es pública; escribir/borrar exige sesión de cliente.

// { summary: { average, count }, reviews: [...] }
export const getProductReviews = productId => apiGet(`/products/${productId}/reviews`)

// Crea o actualiza la reseña del cliente logueado.
export const upsertReview = (productId, { rating, comment }) =>
  apiPut(`/customer/products/${productId}/reviews`, { rating, comment })

// Borra la reseña propia.
export const deleteMyReview = reviewId => apiDelete(`/customer/reviews/${reviewId}`)
