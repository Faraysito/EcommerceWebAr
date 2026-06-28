import { apiGet, apiPut } from '../api'

// --- Tiendas públicas (directorio + perfil) ---
export const getStores = () => apiGet('/stores')
export const getStore = slug => apiGet(`/stores/${slug}`)
// Productos de una tienda concreta (catálogo filtrado por vendedor).
export const getStoreProducts = sellerId => apiGet(`/products?seller=${sellerId}`)

// --- Admin del marketplace (comisión, vendedores, payouts) ---
export const getSettings = () => apiGet('/admin/marketplace/settings')
export const updateSettings = commissionPercent =>
  apiPut('/admin/marketplace/settings', { commissionPercent })
export const getSellers = () => apiGet('/admin/marketplace/sellers')
export const getPayouts = status =>
  apiGet(`/admin/marketplace/payouts${status ? `?status=${status}` : ''}`)
export const updatePayout = (id, status) => apiPut(`/admin/marketplace/payouts/${id}`, { status })
