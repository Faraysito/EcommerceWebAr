import { apiGet, apiPost, apiPut, apiDelete } from '../api'

// Direcciones de despacho del cliente. Requieren sesión.

export const getAddresses = () => apiGet('/customer/addresses')
export const createAddress = payload => apiPost('/customer/addresses', payload)
export const updateAddress = (id, payload) => apiPut(`/customer/addresses/${id}`, payload)
export const deleteAddress = id => apiDelete(`/customer/addresses/${id}`)
