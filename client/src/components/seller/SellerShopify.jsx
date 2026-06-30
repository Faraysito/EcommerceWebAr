import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { env } from '../../config/env'
import { getShopifyProducts } from '../../services/shopify/shopifyService'
import styles from './SellerForms.module.css'

// Conecta la tienda Shopify del vendedor (OAuth) y, una vez conectada, lista
// sus productos reales traídos de la Admin GraphQL API.
//
// La conexión NO usa fetch: redirige el navegador completo a /api/shopify/auth,
// que continúa el OAuth con Shopify. El listado SÍ usa fetch normal (cookie).
export default function SellerShopify() {
  const [shop, setShop] = useState('')
  const [error, setError] = useState('')
  const [params] = useSearchParams()

  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [connectedShop, setConnectedShop] = useState('')

  const justConnected = params.get('shopify') === 'connected'

  // Normaliza lo que escribe el vendedor a un dominio xxx.myshopify.com.
  function normalizeShop(raw) {
    let s = raw.trim().toLowerCase()
    s = s.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (s && !s.includes('.myshopify.com')) {
      s = `${s}.myshopify.com`
    }
    return s
  }

  function handleConnect(e) {
    e.preventDefault()
    setError('')

    const clean = normalizeShop(shop)
    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(clean)) {
      setError('Escribe un dominio válido, por ejemplo: mitienda.myshopify.com')
      return
    }

    window.location.href = `${env.VITE_API_URL}/api/shopify/auth?shop=${encodeURIComponent(clean)}`
  }

  // Carga los productos de la tienda conectada. Si no hay tienda (404), no es
  // un error: simplemente el vendedor aún no conectó.
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    setProductsError('')
    try {
      const data = await getShopifyProducts() // { shop, products }
      setConnectedShop(data.shop)
      setProducts(data.products)
      setShop(data.shop)
    } catch (err) {
      // El backend manda "No tienes ninguna tienda Shopify conectada" en 404.
      if (/no tienes/i.test(err.message)) {
        setConnectedShop('')
        setProducts([])
      } else {
        setProductsError(err.message)
      }
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return (
    <div>
      <h2 className={styles.sectionTitle}>Conectar con Shopify</h2>
      <p className={styles.hint}>
        Vincula tu tienda Shopify para importar tus productos y asociarles modelos 3D.
      </p>

      {justConnected && (
        <p className={styles.success}>
          Tienda <strong>{params.get('shop')}</strong> conectada correctamente.
        </p>
      )}

      <form onSubmit={handleConnect} className={styles.form}>
        <label className={styles.label}>
          Dominio de tu tienda Shopify
          <input
            className={styles.input}
            type="text"
            placeholder="mitienda.myshopify.com"
            value={shop}
            onChange={e => setShop(e.target.value)}
            autoComplete="off"
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.primaryBtn}>
          {connectedShop ? 'Reconectar' : 'Conectar tienda'}
        </button>
      </form>

      {/* --- Listado de productos de Shopify --- */}
      {connectedShop && (
        <>
          <h2 className={styles.sectionTitle} style={{ marginTop: 28 }}>
            Productos en {connectedShop}
          </h2>

          {loadingProducts && <p className={styles.muted}>Cargando productos…</p>}
          {productsError && <p className={styles.error}>{productsError}</p>}

          {!loadingProducts && !productsError && products.length === 0 && (
            <p className={styles.empty}>Tu tienda Shopify no tiene productos.</p>
          )}

          {!loadingProducts && products.length > 0 && (
            <div className={styles.cardGrid}>
              {products.map(p => (
                <div key={p.id} className={styles.prodCard}>
                  {p.image ? (
                    <img className={styles.prodThumb} src={p.image} alt={p.imageAlt} />
                  ) : (
                    <div className={styles.prodThumb} />
                  )}
                  <div className={styles.prodBody}>
                    <p className={styles.prodName}>{p.title}</p>
                    <p className={styles.prodMeta}>
                      {p.status} · stock: {p.inventory ?? 0}
                    </p>
                    {p.price && (
                      <p className={styles.prodPrice}>
                        {p.price} {p.currency}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
