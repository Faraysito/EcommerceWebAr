import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router'
import { Catalog } from './pages/Catalog'
import { ProtectedRoute } from './admin/ProtectedRoute'

// Code-splitting: las páginas pesadas se cargan bajo demanda.
const DirectARViewer = lazy(() => import('./pages/DirectARViewer'))
const EmbedViewer = lazy(() => import('./pages/EmbedViewer'))
const Orders = lazy(() => import('./pages/Orders'))
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'))
const StorePage = lazy(() => import('./pages/StorePage'))
const StoresDirectory = lazy(() => import('./pages/StoresDirectory'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const AdminLogin = lazy(() => import('./admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))
const PimApp = lazy(() => import('./pim/PimApp'))

const Loading = () => (
  <div
    style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--text-muted)' }}
  >
    Cargando…
  </div>
)

const s = el => <Suspense fallback={<Loading />}>{el}</Suspense>

const routes = createBrowserRouter([
  { path: '/', element: <Catalog /> },
  { path: '/producto/:id', element: s(<ProductPage />) },
  { path: '/ar/:productId', element: s(<DirectARViewer />) },
  // Página desnuda del visor AR para incrustar vía iframe en tiendas externas.
  { path: '/ver/:id', element: s(<EmbedViewer />) },
  { path: '/pedidos', element: s(<Orders />) },
  { path: '/favoritos', element: s(<WishlistPage />) },
  { path: '/cuenta', element: s(<AccountPage />) },
  { path: '/vender', element: s(<SellerDashboard />) },
  { path: '/tiendas', element: s(<StoresDirectory />) },
  { path: '/tienda/:slug', element: s(<StorePage />) },
  { path: '/admin/login', element: s(<AdminLogin />) },
  {
    path: '/admin',
    element: <ProtectedRoute>{s(<AdminDashboard />)}</ProtectedRoute>
  },
  {
    path: '/pim',
    element: <ProtectedRoute>{s(<PimApp />)}</ProtectedRoute>
  }
])

export { routes }