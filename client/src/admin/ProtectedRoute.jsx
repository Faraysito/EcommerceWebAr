import { Navigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

// Envuelve rutas que requieren sesion. Mientras verifica, muestra un loader.
// Si no hay sesion, redirige a /admin/login. Si la hay, renderiza el contenido.
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#888' }}>
        Verificando sesión…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
