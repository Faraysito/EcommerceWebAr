import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '../api'

// Servicios del VENDEDOR (cuenta logueada que vende). Todas las rutas viven
// bajo /customer/seller/* y usan la cookie de cliente.

// --- Convertirse en vendedor / editar tienda ---
export const becomeSeller = payload => apiPost('/customer/seller/become', payload)
export const getMyPayoutInfo = () => apiGet('/customer/seller/payout-info')

// --- Productos del vendedor ---
export const getMyProducts = () => apiGet('/customer/seller/products')
export const createMyProduct = payload => apiPost('/customer/seller/products', payload)
export const updateMyProduct = (id, payload) => apiPut(`/customer/seller/products/${id}`, payload)
export const deleteMyProduct = id => apiDelete(`/customer/seller/products/${id}`)

// --- Subida de archivos del vendedor ---
export const uploadSellerImage = (file, name) => apiUpload('/customer/seller/images', file, name)
export const uploadSellerModel = (file, name) => apiUpload('/customer/seller/models', file, name)

// --- Ventas y ganancias del vendedor ---
export const getMySales = () => apiGet('/customer/seller/sales')
export const getMyEarnings = () => apiGet('/customer/seller/earnings')
export const updateFulfillment = (lineId, status) =>
  apiPut(`/customer/seller/sales/${lineId}/fulfillment`, { status })
