import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import SellerProducts from '../components/seller/SellerProducts'
import SellerSales from '../components/seller/SellerSales'
import SellerEarnings from '../components/seller/SellerEarnings'
import SellerStoreForm from '../components/seller/SellerStoreForm'
import SellerShopify from '../components/seller/SellerShopify'
import BecomeSellerCta from '../components/seller/BecomeSellerCta'
import styles from './SellerDashboard.module.css'

const TABS = [
  { id: 'products', label: 'Mis productos' },
  { id: 'sales', label: 'Ventas' },
  { id: 'earnings', label: 'Ganancias' },
  { id: 'store', label: 'Mi tienda' },
  { id: 'shopify', label: 'Shopify' }
]

export default function SellerDashboard() {
  const { customer, loading, isAuthenticated, isSeller } = useCustomerAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('products')

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) navigate('/')
  }, [loading, isAuthenticated, navigate])

  if (loading) {
    return (
      <div className={styles.shell}>
        <Header />
        <main className={styles.main}>
          <p className={styles.muted}>Cargando…</p>
        </main>
        <Footer />
      </div>
    )
  }

  // Cuenta logueada pero que aún no vende: muestra el llamado a abrir tienda.
  if (isAuthenticated && !isSeller) {
    return (
      <div className={styles.shell}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <BecomeSellerCta />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.head}>
            <div>
              <h1 className={styles.title}>{customer?.storeName || 'Mi tienda'}</h1>
              <p className={styles.subtitle}>Panel de vendedor</p>
            </div>
            {customer?.storeSlug && (
              <a
                className={styles.viewStore}
                href={`/tienda/${customer.storeSlug}`}
              >
                Ver mi tienda pública →
              </a>
            )}
          </div>

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

          <section className={styles.panel}>
            {tab === 'products' && <SellerProducts />}
            {tab === 'sales' && <SellerSales />}
            {tab === 'earnings' && <SellerEarnings />}
            {tab === 'store' && <SellerStoreForm />}
            {tab === 'shopify' && <SellerShopify />}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
