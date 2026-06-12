import { createContext, useContext, useEffect, useState } from 'react'
import {
  customerLogin,
  customerRegister,
  customerLogout,
  customerVerify
} from '../services/customer/customerAuthService'

// Contexto de sesión del CLIENTE de la tienda. Separado de AuthContext, que es
// para el panel admin. Guarda el cliente logueado y expone login/register/
// logout. Igual que el admin: la sesión vive en una cookie httpOnly.

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

  const value = {
    customer,
    loading,
    login,
    register,
    logout,
    isAuthenticated: Boolean(customer)
  }

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) throw new Error('useCustomerAuth debe usarse dentro de <CustomerAuthProvider>')
  return ctx
}
