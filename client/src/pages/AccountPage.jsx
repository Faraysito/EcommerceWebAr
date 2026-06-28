import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AddressManager from '../components/AddressManager'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import styles from './AccountPage.module.css'

// Página "Mi cuenta": por ahora alberga las direcciones de despacho. Pensada
// para crecer (datos personales, métodos de pago, etc.).
export default function AccountPage() {
  const { customer, isAuthenticated, loading } = useCustomerAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) navigate('/')
  }, [loading, isAuthenticated, navigate])

  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.head}>
            <h1 className={styles.title}>Mi cuenta</h1>
            {customer && (
              <p className={styles.subtitle}>{customer.name ? customer.name : customer.email}</p>
            )}
          </header>
          <AddressManager />
        </div>
      </main>
      <Footer />
    </div>
  )
}
