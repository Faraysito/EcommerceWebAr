import { apiGet, apiPost, apiDelete } from '../api'

// Favoritos del cliente. Todas requieren sesión (cookie customer-token).

export const getWishlist = () => apiGet('/customer/wishlist')
export const getWishlistIds = () => apiGet('/customer/wishlist/ids')
export const addToWishlist = productId => apiPost('/customer/wishlist', { productId })
export const removeFromWishlist = productId => apiDelete(`/customer/wishlist/${productId}`)
