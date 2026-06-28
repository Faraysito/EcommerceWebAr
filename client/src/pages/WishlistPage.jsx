import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/ProductSkeleton'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { getWishlist } from '../services/wishlist/wishlistService'
import styles from './WishlistPage.module.css'

// Página de favoritos del comprador. Requiere sesión; si no hay, manda al inicio.
export default function WishlistPage() {
  const { isAuthenticated, loading: authLoading } = useCustomerAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    getWishlist()
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [authLoading, isAuthenticated, navigate])

  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.head}>
            <h1 className={styles.title}>Mis favoritos</h1>
            <p className={styles.subtitle}>Los productos que guardaste para después.</p>
          </header>

          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>
              <p>Todavía no guardaste favoritos.</p>
              <button
                className={styles.primaryBtn}
                onClick={() => navigate('/')}
              >
                Explorar productos
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {items.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
