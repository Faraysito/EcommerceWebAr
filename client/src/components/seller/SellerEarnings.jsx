import { useEffect, useState } from 'react'
import { getMyEarnings } from '../../services/seller/sellerService'
import { formatCLP } from '../../utils/formatCLP'
import styles from './SellerForms.module.css'

export default function SellerEarnings() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyEarnings()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className={styles.muted}>Cargando tus ganancias…</p>
  if (error) return <div className={styles.error}>{error}</div>
  if (!data) return null

  return (
    <div>
      <div className={styles.metricGrid}>
        <div className={`${styles.metricCard} ${styles.metricCardAccent}`}>
          <p className={styles.metricLabel}>Por cobrar</p>
          <div className={`${styles.metricValue} ${styles.metricValueAccent}`}>
            {formatCLP(data.pending)}
          </div>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Ya pagado</p>
          <div className={styles.metricValue}>{formatCLP(data.paid)}</div>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Ventas brutas</p>
          <div className={styles.metricValue}>{formatCLP(data.gross)}</div>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Comisión retenida</p>
          <div className={styles.metricValue}>{formatCLP(data.commission)}</div>
        </div>
      </div>

      <p
        className={styles.hint}
        style={{ marginTop: 16, textAlign: 'center' }}
      >
        El monto por cobrar se transfiere a tu cuenta registrada en "Mi tienda". La comisión es lo
        que retiene el marketplace por cada venta.
      </p>
    </div>
  )
}
