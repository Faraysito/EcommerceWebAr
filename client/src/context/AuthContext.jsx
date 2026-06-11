import { createContext, useContext, useEffect, useState } from 'react'
import { login as loginRequest, logout as logoutRequest, verifySession } from '../services/auth/authService'

// Contexto de autenticacion. Guarda el usuario logueado y expone helpers para
// login, logout y chequeo de permisos. Lo consume todo el panel admin.

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true mientras verifica sesion inicial

  // Al montar, pregunta al backend si hay sesion activa (cookie valida).
  useEffect(() => {
    verifySession()
      .then((data) => setUser(data))
      .catch(() => setUser(null)) // 401 = no logueado, es esperado
      .finally(() => setLoading(false))
  }, [])

  const login = async (credentials) => {
    const data = await loginRequest(credentials)
    setUser(data)
    return data
  }

  const logout = async () => {
    await logoutRequest().catch(() => {}) // aunque falle, limpiamos local
    setUser(null)
  }

  // Chequeo de permisos en el cliente (solo para mostrar/ocultar UI; la
  // seguridad real la aplica el backend). Superadmin siempre true.
  const hasPermission = (permission) => {
    if (!user) return false
    if (user.isSuperAdmin) return true
    return (user.permissions ?? []).includes(permission)
  }

  const value = { user, loading, login, logout, hasPermission, isAuthenticated: Boolean(user) }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook para consumir el contexto.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
