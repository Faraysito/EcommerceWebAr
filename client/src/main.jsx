import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { routes } from './routes'
import { AuthProvider } from './context/AuthContext'
import { CustomerAuthProvider } from './context/CustomerAuthContext'
import { WishlistProvider } from './context/WishlistContext'
import { CartProvider } from './context/CartContext'
import CartModal from './components/CartModal'

// Registra el custom element <model-viewer> globalmente (AR).
import '@google/model-viewer'

import './assets/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CustomerAuthProvider>
        <WishlistProvider>
          <CartProvider>
            <RouterProvider router={routes} />
            <CartModal />
          </CartProvider>
        </WishlistProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  </StrictMode>
)
