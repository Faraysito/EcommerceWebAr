import { createContext, useContext, useEffect, useState } from 'react'
import {
  customerLogin,
  customerRegister,
  customerLogout,
  customerVerify
} from '../services/customer/customerAuthService'
import { becomeSeller as becomeSellerRequest } from '../services/seller/sellerService'

// Contexto de sesión de la CUENTA del marketplace (compra y vende). El payload
// del backend ahora incluye isSeller / storeName / storeSlug, así el frontend
// sabe si mostrar el panel de vendedor. La sesión vive en una cookie httpOnly.

const CustomerAuthContext = createContext(null)

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    customerVerify()
      .then(data => setCustomer(data))
      .catch(() => setCustomer(null)) // 401 = no logueado, esperado
      .finally(() => setLoading(false))
  }, [])

  const login = async credentials => {
    const data = await customerLogin(credentials)
    setCustomer(data)
    return data
  }

  const register = async payload => {
    const data = await customerRegister(payload)
    setCustomer(data)
    return data
  }

  const logout = async () => {
    await customerLogout().catch(() => {})
    setCustomer(null)
  }

  // Abre la tienda (o actualiza su perfil). Tras el cambio, vuelve a verificar
  // la sesión para refrescar isSeller/storeSlug en el estado y la cookie.
  const becomeSeller = async payload => {
    await becomeSellerRequest(payload)
    const fresh = await customerVerify()
    setCustomer(fresh)
    return fresh
  }

  const value = {
    customer,
    loading,
    login,
    register,
    logout,
    becomeSeller,
    isAuthenticated: Boolean(customer),
    isSeller: Boolean(customer?.isSeller)
  }

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) throw new Error('useCustomerAuth debe usarse dentro de <CustomerAuthProvider>')
  return ctx
}
