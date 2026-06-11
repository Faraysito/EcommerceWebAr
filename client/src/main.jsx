import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { routes } from './routes'
import { AuthProvider } from './context/AuthContext'

// Registra el custom element <model-viewer> globalmente (AR).
import '@google/model-viewer'

import './assets/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={routes} />
    </AuthProvider>
  </StrictMode>
)
