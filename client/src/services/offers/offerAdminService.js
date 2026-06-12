import { apiGet, apiPost, apiDelete } from '../api'

export const getOffers = () => apiGet('/admin/offers')
export const createOffer = (payload) => apiPost('/admin/offers', payload)
export const deleteOffer = (id) => apiDelete(`/admin/offers/${id}`)
