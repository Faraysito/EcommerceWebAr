import { useEffect, useState } from 'react'
import {
  getSettings,
  updateSettings,
  getSellers,
  getPayouts,
  updatePayout
} from '../services/marketplace/marketplaceService'
import { formatCLP } from '../utils/formatCLP'
import styles from './MarketplaceManager.module.css'

const PAYOUT_STATES = ['Pendiente', 'Pagado', 'Retenido']

export default function MarketplaceManager() {
  const [tab, setTab] = useState('settings')

  return (
    <div>
      <div className={styles.subtabs}>
        <button
          className={`${styles.subtab} ${tab === 'settings' ? styles.active : ''}`}
          onClick={() => setTab('settings')}
        >
          Comisión
        </button>
        <button
          className={`${styles.subtab} ${tab === 'sellers' ? styles.active : ''}`}
          onClick={() => setTab('sellers')}
        >
          Vendedores
        </button>
        <button
          className={`${styles.subtab} ${tab === 'payouts' ? styles.active : ''}`}
          onClick={() => setTab('payouts')}
        >
          Pagos a vendedores
        </button>
      </div>

      {tab === 'settings' && <SettingsPanel />}
      {tab === 'sellers' && <SellersPanel />}
      {tab === 'payouts' && <PayoutsPanel />}
    </div>
  )
}

function SettingsPanel() {
  const [commission, setCommission] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    getSettings()
      .then(s => setCommission(String(s.commissionPercent)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async e => {
    e.preventDefault()
    const value = Number(commission)
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      setError('La comisión debe ser un entero entre 0 y 100.')
      return
    }
    setSaving(true)
    setError('')
    setOk('')
    try {
      await updateSettings(value)
      setOk('Comisión actualizada.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className={styles.muted}>Cargando…</p>

  return (
    <form
      className={styles.card}
      onSubmit={handleSave}
    >
      <h3 className={styles.cardTitle}>Comisión del marketplace</h3>
      <p className={styles.cardText}>
        Porcentaje que retiene la plataforma sobre cada venta. Se aplica a las compras nuevas.
      </p>
      <div className={styles.commissionRow}>
        <input
          className={styles.input}
          type='number'
          value={commission}
          onChange={e => setCommission(e.target.value)}
          min='0'
          max='100'
          disabled={saving}
        />
        <span className={styles.percent}>%</span>
        <button
          className={styles.primaryBtn}
          type='submit'
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {ok && <div className={styles.success}>{ok}</div>}
    </form>
  )
}

function SellersPanel() {
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getSellers()
      .then(setSellers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className={styles.muted}>Cargando vendedores…</p>
  if (error) return <div className={styles.error}>{error}</div>
  if (sellers.length === 0)
    return <p className={styles.muted}>Todavía no hay vendedores registrados.</p>

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tienda</th>
            <th>Email</th>
            <th>URL</th>
            <th>Desde</th>
          </tr>
        </thead>
        <tbody>
          {sellers.map(s => (
            <tr key={s.id}>
              <td>{s.storeName}</td>
              <td>{s.email}</td>
              <td>
                <a
                  href={`/tienda/${s.storeSlug}`}
                  target='_blank'
                  rel='noreferrer'
                  className={styles.link}
                >
                  /tienda/{s.storeSlug}
                </a>
              </td>
              <td>{s.sellerSince ? new Date(s.sellerSince).toLocaleDateString('es-CL') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PayoutsPanel() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setPayouts(await getPayouts())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = async (id, status) => {
    setSavingId(id)
    setError('')
    try {
      await updatePayout(id, status)
      setPayouts(prev => prev.map(p => (p.id === id ? { ...p, status } : p)))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <p className={styles.muted}>Cargando pagos…</p>
  if (error) return <div className={styles.error}>{error}</div>
  if (payouts.length === 0)
    return (
      <p className={styles.muted}>
        No hay pagos pendientes. Aparecerán cuando haya ventas pagadas.
      </p>
    )

  return (
    <div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tienda</th>
              <th>Bruto</th>
              <th>Comisión</th>
              <th>A pagar</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(p => (
              <tr key={p.id}>
                <td>
                  {p.storeName}
                  <div className={styles.hint}>{p.sellerEmail}</div>
                </td>
                <td>{formatCLP(p.grossAmount)}</td>
                <td>{formatCLP(p.commissionAmount)}</td>
                <td>
                  <strong>{formatCLP(p.netAmount)}</strong>
                </td>
                <td>
                  <select
                    className={styles.inlineSelect}
                    value={p.status}
                    onChange={e => handleChange(p.id, e.target.value)}
                    disabled={savingId === p.id}
                  >
                    {PAYOUT_STATES.map(st => (
                      <option
                        key={st}
                        value={st}
                      >
                        {st}
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
