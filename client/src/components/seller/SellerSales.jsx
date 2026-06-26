import { useEffect, useState } from 'react'
import { getMySales, updateFulfillment } from '../../services/seller/sellerService'
import { formatCLP } from '../../utils/formatCLP'
import styles from './SellerForms.module.css'

const FULFILLMENT_OPTIONS = ['Pendiente', 'Preparando', 'Enviado', 'Entregado', 'Cancelado']

// Mapea estado -> clase de badge.
const statusClass = status =>
  ({
    Pendiente: styles.stPendiente,
    Preparando: styles.stPreparando,
    Enviado: styles.stEnviado,
    Entregado: styles.stEntregado,
    Cancelado: styles.stCancelado
  })[status] || ''

export default function SellerSales() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setSales(await getMySales())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleStatusChange = async (lineId, status) => {
    setSavingId(lineId)
    setError('')
    try {
      await updateFulfillment(lineId, status)
      setSales(prev =>
        prev.map(s => (s.lineId === lineId ? { ...s, fulfillmentStatus: status } : s))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  const formatDate = iso => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return ''
    }
  }

  if (loading) return <p className={styles.muted}>Cargando tus ventas…</p>

  if (error) return <div className={styles.error}>{error}</div>

  if (sales.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Aún no tienes ventas. Cuando alguien compre tus productos, aparecerán aquí.</p>
      </div>
    )
  }

  return (
    <div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Comprador</th>
              <th>Cant.</th>
              <th>Tu monto</th>
              <th>Pago</th>
              <th>Despacho</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(s => (
              <tr key={s.lineId}>
                <td>{formatDate(s.createdAt)}</td>
                <td>{s.productName}</td>
                <td>
                  {s.buyerName || s.buyerEmail || '—'}
                  <div className={styles.hint}>
                    {s.quantity} × {formatCLP(s.unitPrice)}
                  </div>
                </td>
                <td>{s.quantity}</td>
                <td>
                  <strong>{formatCLP(s.sellerAmount)}</strong>
                  <div className={styles.hint}>comisión {formatCLP(s.commissionAmount)}</div>
                </td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      s.paymentStatus === 'AUTHORIZED' ? styles.stPagado : styles.stPendiente
                    }`}
                  >
                    {s.paymentStatus === 'AUTHORIZED' ? 'Pagado' : s.orderStatus || 'Pendiente'}
                  </span>
                </td>
                <td>
                  <select
                    className={styles.inlineSelect}
                    value={s.fulfillmentStatus}
                    onChange={e => handleStatusChange(s.lineId, e.target.value)}
                    disabled={savingId === s.lineId}
                  >
                    {FULFILLMENT_OPTIONS.map(opt => (
                      <option
                        key={opt}
                        value={opt}
                      >
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
