import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import CategoriesManager from './CategoriesManager'
import styles from './AdminDashboard.module.css'

// Pestañas del panel. Por ahora solo Categorias; Productos y Archivos se
// agregan en la siguiente fase.
const TABS = [
  { id: 'categories', label: 'Categorías' },
  { id: 'products', label: 'Productos' },
  { id: 'files', label: 'Archivos' }
]

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('categories')

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
          <button className={styles.logout} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className={styles.tabs}>
        {TABS.map((tab) => (
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
        {activeTab === 'categories' && <CategoriesManager />}

        {activeTab === 'products' && (
          <div className={styles.placeholder}>
            <h2>Productos</h2>
            <p>El CRUD de productos y el uploader de imágenes/modelos mas adelante wajdsak</p>
          </div>
        )}

        {activeTab === 'files' && (
          <div className={styles.placeholder}>
            <h2>Archivos</h2>
            <p>La gestión de imágenes y modelos 3D mas adelante wajdsak.</p>
          </div>
        )}
      </main>
    </div>
  )
}
