import { apiGet, apiPost, apiPut, apiDelete } from '../api'

// GET publico (mismo que el catalogo); el resto protegido en /admin.
export const getProducts = () => apiGet('/products')

export const createProduct = (payload) => apiPost('/admin/products', payload)
export const updateProduct = (id, payload) => apiPut(`/admin/products/${id}`, payload)
export const deleteProduct = (id) => apiDelete(`/admin/products/${id}`)
