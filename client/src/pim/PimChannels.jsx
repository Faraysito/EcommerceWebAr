import { useEffect, useState } from 'react'
import {
  getChannels,
  getProducts,
  getProductChannels,
  syndicate
} from '../services/pim/pimService'
import { StatusBadge } from './PimUI'
import styles from './Pim.module.css'

const KIND_LABEL = { shopify: 'Shopify', generic: 'Feed genérico' }

export default function PimChannels() {
  const [channels, setChannels] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [expanded, setExpanded] = useState(null) // productId
  const [expChannels, setExpChannels] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const [ch, pr] = await Promise.all([getChannels(), getProducts()])
        setChannels(ch)
        setProducts(pr)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const toggle = async productId => {
    setMsg('')
    setError('')
    if (expanded === productId) {
      setExpanded(null)
      return
    }
    setExpanded(productId)
    try {
      setExpChannels(await getProductChannels(productId))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSyndicate = async (productId, channelId) => {
    setError('')
    setMsg('')
    try {
      const r = await syndicate(productId, channelId)
      setMsg(`Publicado en ${r.channel}`)
      setExpChannels(await getProductChannels(productId))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p className={styles.muted}>Cargando canales…</p>

  return (
    <div>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.title}>Canales</h2>
          <p className={styles.subtitle}>Sindicación del catálogo a destinos de venta</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {msg && <div className={styles.success}>{msg}</div>}

      <div className={styles.cardGrid}>
        {channels.map(c => (
          <div
            key={c.id}
            className={styles.statCard}
          >
            <div className={styles.statValue}>{KIND_LABEL[c.kind] ?? c.kind}</div>
            <div className={styles.statLabel}>{c.name}</div>
            <div
              className={styles.mono}
              style={{ marginTop: 6 }}
            >
              {c.code}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>Publicar productos</h3>
        <p
          className={styles.muted}
          style={{ marginBottom: 12 }}
        >
          Abre un producto para ver su estado por canal y publicarlo. Solo se publican las fichas listas
          (completas + con imagen).
        </p>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Estado</th>
                <th>Completitud</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <FragmentRow
                  key={p.id}
                  product={p}
                  expanded={expanded === p.id}
                  channelsState={expanded === p.id ? expChannels : []}
                  onToggle={() => toggle(p.id)}
                  onSyndicate={handleSyndicate}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FragmentRow({ product, expanded, channelsState, onToggle, onSyndicate }) {
  return (
    <>
      <tr
        className={styles.rowClickable}
        onClick={onToggle}
      >
        <td>{product.name}</td>
        <td className={styles.mono}>{product.sku || '—'}</td>
        <td>
          <StatusBadge status={product.status} />
        </td>
        <td>{product.completeness.percent}%</td>
        <td>{expanded ? '▲' : '▼'}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5}>
            {channelsState.length === 0 ? (
              <span className={styles.muted}>Cargando canales…</span>
            ) : (
              channelsState.map(c => (
                <div
                  key={c.channelId}
                  className={styles.btnRow}
                  style={{ justifyContent: 'space-between', marginBottom: 8 }}
                >
                  <span>{c.name}</span>
                  <div className={styles.btnRow}>
                    <StatusBadge status={c.status} />
                    {c.status !== 'published' && (
                      <button
                        className={styles.btnPrimary}
                        onClick={() => onSyndicate(product.id, c.channelId)}
                      >
                        Publicar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </td>
        </tr>
      )}
    </>
  )
}
