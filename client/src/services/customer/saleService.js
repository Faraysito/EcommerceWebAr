import { apiPost, apiGet } from '../api'

// Compras del cliente. checkout manda el carrito; orders trae el historial.
// Ambas requieren sesión de cliente (cookie customer-token).

// items: [{ productId, quantity }]
export const checkout = items => apiPost('/customer/checkout', { items })

export const getMyOrders = () => apiGet('/customer/orders')
