import { createBrowserRouter } from 'react-router'
import { Catalog } from './pages/Catalog'
import DirectARViewer from './pages/DirectARViewer'
import Orders from './pages/Orders'
import AdminLogin from './admin/AdminLogin'
import AdminDashboard from './admin/AdminDashboard'
import { ProtectedRoute } from './admin/ProtectedRoute'

const routes = createBrowserRouter([
  {
    path: '/',
    element: <Catalog />
  },
  {
    // AR directo via QR: /ar/prod-1
    path: '/ar/:productId',
    element: <DirectARViewer />
  },
  {
    // Historial de pedidos del cliente (requiere sesion de cliente)
    path: '/pedidos',
    element: <Orders />
  },
  {
    // Login del admin (publico)
    path: '/admin/login',
    element: <AdminLogin />
  },
  {
    // Dashboard protegido: si no hay sesion redirige a /admin/login
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    )
  }
])

export { routes }
