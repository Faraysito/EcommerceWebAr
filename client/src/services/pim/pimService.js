import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '../api'

// Cliente del PIM (Weseller). Reusa los helpers httpOnly-cookie de api.js.
// Todo cuelga de /api/pim (protegido con permiso pim.access en el backend).

// --- Dashboard ---
export const getStats = () => apiGet('/pim/stats')

// --- Categorías (jerárquicas, para selects) ---
export const getCategories = () => apiGet('/pim/categories')

// --- Familias / atributos ---
export const getFamilies = () => apiGet('/pim/families')
export const getFamily = id => apiGet(`/pim/families/${id}`)
export const createFamily = payload => apiPost('/pim/families', payload)
export const updateFamily = (id, payload) => apiPut(`/pim/families/${id}`, payload)
export const deleteFamily = id => apiDelete(`/pim/families/${id}`)
export const createAttribute = (familyId, payload) =>
  apiPost(`/pim/families/${familyId}/attributes`, payload)
export const updateAttribute = (id, payload) => apiPut(`/pim/attributes/${id}`, payload)
export const deleteAttribute = id => apiDelete(`/pim/attributes/${id}`)

// --- Productos ---
export const getProducts = params => {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.status) qs.set('status', params.status)
  if (params?.familyId) qs.set('familyId', params.familyId)
  if (params?.supplier) qs.set('supplier', params.supplier)
  const q = qs.toString()
  return apiGet(`/pim/products${q ? `?${q}` : ''}`)
}
export const getProduct = id => apiGet(`/pim/products/${id}`)
export const createProduct = payload => apiPost('/pim/products', payload)
export const updateProduct = (id, payload) => apiPut(`/pim/products/${id}`, payload)
export const deleteProduct = id => apiDelete(`/pim/products/${id}`)

// --- DAM: activos ---
export const getAssets = params => {
  const qs = new URLSearchParams()
  if (params?.type) qs.set('type', params.type)
  if (params?.tag) qs.set('tag', params.tag)
  if (params?.search) qs.set('search', params.search)
  const q = qs.toString()
  return apiGet(`/pim/assets${q ? `?${q}` : ''}`)
}
export const uploadAsset = (file, name, tags) => {
  // apiUpload manda 'file' y 'name'; añadimos 'tags' por FormData.
  const formData = new FormData()
  formData.append('file', file)
  if (name) formData.append('name', name)
  if (tags) formData.append('tags', tags)
  return apiUploadRaw('/pim/assets', formData)
}
export const updateAsset = (id, payload) => apiPut(`/pim/assets/${id}`, payload)
export const deleteAsset = id => apiDelete(`/pim/assets/${id}`)
export const linkAsset = (productId, payload) =>
  apiPost(`/pim/products/${productId}/assets`, payload)
export const unlinkAsset = (productId, assetId) =>
  apiDelete(`/pim/products/${productId}/assets/${assetId}`)

// --- Importación CSV ---
export const parseImport = file => apiUpload('/pim/import/parse', file)
export const commitImport = payload => apiPost('/pim/import/commit', payload)

// --- Canales / sindicación ---
export const getChannels = () => apiGet('/pim/channels')
export const getProductChannels = productId => apiGet(`/pim/products/${productId}/channels`)
export const setProductChannelStatus = (productId, payload) =>
  apiPut(`/pim/products/${productId}/channels`, payload)
export const syndicate = (productId, channelId) =>
  apiPost(`/pim/products/${productId}/syndicate`, { channelId })

// Upload con FormData arbitrario (para incluir tags). Mismo patrón que apiUpload.
import { env } from '../../config/env'
async function apiUploadRaw(path, formData) {
  const res = await fetch(`${env.VITE_API_URL}/api${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error en ${path}`)
  }
  return res.json()
}
