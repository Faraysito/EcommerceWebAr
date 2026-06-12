import { apiGet, apiDelete, apiUpload } from '../api'

// Imagenes
export const getImages = () => apiGet('/admin/images')
export const uploadImage = (file, name) => apiUpload('/admin/images', file, name)
export const deleteImage = (id) => apiDelete(`/admin/images/${id}`)

// Modelos 3D
export const getModels = () => apiGet('/admin/models')
export const uploadModel = (file, name) => apiUpload('/admin/models', file, name)
export const deleteModel = (id) => apiDelete(`/admin/models/${id}`)
