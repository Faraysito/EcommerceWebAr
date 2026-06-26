import { createBrowserRouter } from 'react-router'
import { Catalog } from './pages/Catalog'
import DirectARViewer from './pages/DirectARViewer'
import Orders from './pages/Orders'
import SellerDashboard from './pages/SellerDashboard'
import StorePage from './pages/StorePage'
import StoresDirectory from './pages/StoresDirectory'
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
    // Historial de pedidos del comprador (requiere sesion de cliente)
    path: '/pedidos',
    element: <Orders />
  },
  {
    // Panel de vendedor: abrir tienda, productos, ventas, ganancias.
    // Si no hay sesion redirige al inicio; si la hay pero no es vendedor,
    // muestra el llamado a abrir tienda (auto-aprobado).
    path: '/vender',
    element: <SellerDashboard />
  },
  {
    // Directorio publico de tiendas
    path: '/tiendas',
    element: <StoresDirectory />
  },
  {
    // Tienda publica de un vendedor: /tienda/mi-slug
    path: '/tienda/:slug',
    element: <StorePage />
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
