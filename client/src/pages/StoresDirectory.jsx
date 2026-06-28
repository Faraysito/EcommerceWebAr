import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getStores } from '../services/marketplace/marketplaceService'
import styles from './StoresDirectory.module.css'

export default function StoresDirectory() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getStores()
      .then(setStores)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.head}>
            <h1 className={styles.title}>Tiendas</h1>
            <p className={styles.subtitle}>Descubre a todos los vendedores del marketplace.</p>
          </header>

          {loading ? (
            <p className={styles.muted}>Cargando tiendas…</p>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : stores.length === 0 ? (
            <div className={styles.empty}>
              <p>Todavía no hay tiendas. ¿Quieres ser el primero?</p>
              <a
                className={styles.primaryBtn}
                href='/vender'
              >
                Abrir mi tienda
              </a>
            </div>
          ) : (
            <div className={styles.grid}>
              {stores.map(s => (
                <a
                  key={s.id}
                  className={styles.storeCard}
                  href={`/tienda/${s.storeSlug}`}
                >
                  <div className={styles.avatar}>{s.storeName?.[0]?.toUpperCase() || '?'}</div>
                  <div className={styles.storeName}>{s.storeName}</div>
                  {s.storeBio && <p className={styles.storeBio}>{s.storeBio}</p>}
                  <span className={styles.visit}>Visitar tienda →</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
