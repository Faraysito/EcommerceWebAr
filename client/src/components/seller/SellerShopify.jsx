import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { env } from '../../config/env'
import { getShopifyProducts, getAssignments } from '../../services/shopify/shopifyService'
import ShopifyAssignModal from './ShopifyAssignModal'
import styles from './SellerForms.module.css'

// Conecta la tienda Shopify (OAuth), lista sus productos, y permite asociar a
// cada producto un modelo 3D (subir o reusar) con medidas para AR.
export default function SellerShopify() {
  const [shop, setShop] = useState('')
  const [error, setError] = useState('')
  const [params] = useSearchParams()

  const [products, setProducts] = useState([])
  const [assignments, setAssignments] = useState({}) // { gid: {...} }
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [connectedShop, setConnectedShop] = useState('')

  const [modalProduct, setModalProduct] = useState(null) // producto en edición

  const justConnected = params.get('shopify') === 'connected'

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

  // Carga productos + asignaciones en paralelo.
  const loadAll = useCallback(async () => {
    setLoadingProducts(true)
    setProductsError('')
    try {
      const prodData = await getShopifyProducts() // { shop, products }
      setConnectedShop(prodData.shop)
      setProducts(prodData.products)
      setShop(prodData.shop)

      // Asignaciones (si falla, no bloquea la lista).
      try {
        const asgData = await getAssignments()
        setAssignments(asgData.assignments || {})
      } catch {
        setAssignments({})
      }
    } catch (err) {
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
    loadAll()
  }, [loadAll])

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
              {products.map(p => {
                const asg = assignments[p.id]
                return (
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

                      {asg ? (
                        <p className={styles.badge}>AR: {asg.modelName || 'modelo asignado'}</p>
                      ) : (
                        <p className={styles.prodMeta}>Sin modelo AR</p>
                      )}

                      <button
                        className={styles.primaryBtn}
                        style={{ marginTop: 8 }}
                        onClick={() => setModalProduct(p)}
                        type="button"
                      >
                        {asg ? 'Editar AR' : 'Asignar AR'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {modalProduct && (
        <ShopifyAssignModal
          product={modalProduct}
          current={assignments[modalProduct.id] || null}
          isOpen={!!modalProduct}
          close={() => setModalProduct(null)}
          onSaved={loadAll}
        />
      )}
    </div>
  )
}
