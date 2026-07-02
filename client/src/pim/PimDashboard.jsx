import { useEffect, useState } from 'react'
import { getStats } from '../services/pim/pimService'
import styles from './Pim.module.css'

export default function PimDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        setStats(await getStats())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <p className={styles.muted}>Cargando panel…</p>
  if (error) return <div className={styles.error}>{error}</div>
  if (!stats) return null

  const { products, avgCompleteness, families, attributes, assets, variants, channels } = stats

  return (
    <div>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.title}>Panel</h2>
          <p className={styles.subtitle}>Fuente única de verdad del catálogo</p>
        </div>
      </div>

      <div className={styles.cardGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{products.total}</div>
          <div className={styles.statLabel}>Productos (fichas maestras)</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statValue} ${styles.statAccent}`}>{avgCompleteness}%</div>
          <div className={styles.statLabel}>Completitud promedio</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{families}</div>
          <div className={styles.statLabel}>Familias</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{attributes}</div>
          <div className={styles.statLabel}>Atributos definidos</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{variants}</div>
          <div className={styles.statLabel}>Variantes</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{assets}</div>
          <div className={styles.statLabel}>Activos en el DAM</div>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.card}>
          <h3 className={styles.panelTitle}>Por estado editorial</h3>
          <table className={styles.table}>
            <tbody>
              <tr>
                <td>Borrador</td>
                <td>{products.byStatus.draft ?? 0}</td>
              </tr>
              <tr>
                <td>En revisión</td>
                <td>{products.byStatus.review ?? 0}</td>
              </tr>
              <tr>
                <td>Aprobado</td>
                <td>{products.byStatus.approved ?? 0}</td>
              </tr>
              <tr>
                <td>Publicado</td>
                <td>{products.byStatus.published ?? 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <h3 className={styles.panelTitle}>Sindicación por canal</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Canal</th>
                <th>Publicados</th>
                <th>Listos</th>
                <th>Pendientes</th>
              </tr>
            </thead>
            <tbody>
              {channels.map(c => (
                <tr key={c.name}>
                  <td>{c.name}</td>
                  <td>{c.published}</td>
                  <td>{c.ready}</td>
                  <td>{c.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
