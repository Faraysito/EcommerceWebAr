import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/ProductSkeleton'
import { getStore, getStoreProducts } from '../services/marketplace/marketplaceService'
import styles from './StorePage.module.css'

export default function StorePage() {
  const { slug } = useParams()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        const s = await getStore(slug)
        if (!active) return
        setStore(s)
        const prods = await getStoreProducts(s.id)
        if (!active) return
        setProducts(prods)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [slug])

  const initial = store?.storeName?.[0]?.toUpperCase() || '?'

  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        {loading ? (
          <div className={styles.container}>
            <ProductGridSkeleton count={6} />
          </div>
        ) : error ? (
          <div className={styles.container}>
            <div className={styles.notFound}>
              <h1>Tienda no encontrada</h1>
              <p>Puede que el enlace esté mal o que la tienda ya no exista.</p>
              <a
                className={styles.primaryBtn}
                href='/'
              >
                Ir al inicio
              </a>
            </div>
          </div>
        ) : (
          <div className={styles.container}>
            <header className={styles.storeHero}>
              <div className={styles.avatar}>{initial}</div>
              <div className={styles.storeInfo}>
                <h1 className={styles.storeName}>{store.storeName}</h1>
                {store.storeBio && <p className={styles.storeBio}>{store.storeBio}</p>}
                <span className={styles.storeMeta}>
                  {products.length} {products.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>
            </header>

            {products.length === 0 ? (
              <div className={styles.emptyProducts}>
                <p>Esta tienda todavía no tiene productos publicados.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {products.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
