import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { env } from '../../config/env'
import styles from './SellerForms.module.css'

// Conecta la tienda Shopify del vendedor con la app (OAuth Etapa 1).
//
// El flujo NO usa fetch: redirige el navegador completo a nuestro backend
// (/api/shopify/auth), que a su vez redirige a Shopify. Esto es necesario para
// que (a) viaje la cookie de sesión del vendedor y (b) Shopify pueda mostrar su
// pantalla de permisos y volver al callback. Un fetch no permite ese ida-y-vuelta.
export default function SellerShopify() {
  const [shop, setShop] = useState('')
  const [error, setError] = useState('')
  const [params] = useSearchParams()

  // Al volver del callback, la URL trae ?shopify=connected&shop=...
  const connected = params.get('shopify') === 'connected'
  const connectedShop = params.get('shop') || ''

  // Normaliza lo que escribe el vendedor a un dominio xxx.myshopify.com.
  // Acepta que pegue la URL completa o solo el nombre de la tienda.
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

    // Navegación top-level: el backend continúa el OAuth con Shopify.
    window.location.href = `${env.VITE_API_URL}/api/shopify/auth?shop=${encodeURIComponent(clean)}`
  }

  useEffect(() => {
    if (connected) setShop(connectedShop)
  }, [connected, connectedShop])

  return (
    <div>
      <h2 className={styles.sectionTitle}>Conectar con Shopify</h2>
      <p className={styles.hint}>
        Vincula tu tienda Shopify para importar tus productos y asociarles modelos 3D.
      </p>

      {connected && (
        <p className={styles.success}>
          Tienda <strong>{connectedShop}</strong> conectada correctamente.
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
          {connected ? 'Reconectar' : 'Conectar tienda'}
        </button>
      </form>
    </div>
  )
}
