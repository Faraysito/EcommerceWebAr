import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import CategoriesManager from './CategoriesManager'
import ProductsManager from './ProductsManager'
import FilesManager from './FilesManager'
import UsersManager from './UsersManager'
import MarketplaceManager from './MarketplaceManager'
import styles from './AdminDashboard.module.css'

const TABS = [
  { id: 'products', label: 'Productos' },
  { id: 'categories', label: 'Categorías' },
  { id: 'files', label: 'Archivos' },
  { id: 'users', label: 'Usuarios' },
  { id: 'marketplace', label: 'Marketplace' }
]

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('products')

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>◆ Panel FiguraAR</span>
        <div className={styles.userBox}>
          <span className={styles.email}>{user?.email}</span>
          {user?.isSuperAdmin && <span className={styles.badge}>Superadmin</span>}
          <button
            className={styles.logout}
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className={styles.main}>
        {activeTab === 'products' && <ProductsManager />}
        {activeTab === 'categories' && <CategoriesManager />}
        {activeTab === 'files' && <FilesManager />}
        {activeTab === 'users' && <UsersManager />}
        {activeTab === 'marketplace' && <MarketplaceManager />}
      </main>
    </div>
  )
}
