import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { routes } from './routes'
import { AuthProvider } from './context/AuthContext'
import { CustomerAuthProvider } from './context/CustomerAuthContext'
import { CartProvider } from './context/CartContext'
import CartModal from './components/CartModal'

// Registra el custom element <model-viewer> globalmente (AR).
import '@google/model-viewer'

import './assets/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* AuthProvider = sesion del admin. CustomerAuthProvider = sesion del
        cliente que compra. CartProvider = carrito. El CartModal vive aqui
        para estar disponible en cualquier pagina. */}
    <AuthProvider>
      <CustomerAuthProvider>
        <CartProvider>
          <RouterProvider router={routes} />
          <CartModal />
        </CartProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  </StrictMode>
)
