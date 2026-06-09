import { createBrowserRouter } from 'react-router'
import { App } from './pages/App'

const routes = createBrowserRouter([
  {
    path: '/',
    element: <App />
  }
])

export { routes }
