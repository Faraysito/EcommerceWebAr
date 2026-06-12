import { apiPost, apiGet } from '../api'

// Auth del CLIENTE (quien compra). Mismo patrón que el admin (cookie httpOnly),
// pero contra /api/customer/auth/*. La cookie 'customer-token' la maneja el
// navegador sola; aquí no guardamos tokens.

export const customerRegister = ({ email, password, name }) =>
  apiPost('/customer/auth/register', { email, password, name })

export const customerLogin = ({ email, password }) =>
  apiPost('/customer/auth/login', { email, password })

export const customerLogout = () => apiPost('/customer/auth/logout', {})

export const customerVerify = () => apiGet('/customer/auth/verify')
