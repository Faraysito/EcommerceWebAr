import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import PimDashboard from './PimDashboard'
import PimProducts from './PimProducts'
import PimFamilies from './PimFamilies'
import PimImport from './PimImport'
import PimAssets from './PimAssets'
import PimChannels from './PimChannels'
import styles from './Pim.module.css'

const TABS = [
  { id: 'dashboard', label: 'Panel' },
  { id: 'products', label: 'Productos' },
  { id: 'families', label: 'Familias y atributos' },
  { id: 'import', label: 'Importar CSV' },
  { id: 'assets', label: 'Activos (DAM)' },
  { id: 'channels', label: 'Canales' }
]

export default function PimApp() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>
          ◆ Weseller PIM
          <small>Product Information Management</small>
        </span>
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
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className={styles.main}>
        {tab === 'dashboard' && <PimDashboard onGoTo={setTab} />}
        {tab === 'products' && <PimProducts />}
        {tab === 'families' && <PimFamilies />}
        {tab === 'import' && <PimImport />}
        {tab === 'assets' && <PimAssets />}
        {tab === 'channels' && <PimChannels />}
      </main>
    </div>
  )
}
