import { useEffect, useState } from 'react'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { getMyPayoutInfo } from '../../services/seller/sellerService'
import styles from './SellerForms.module.css'

// Bancos chilenos frecuentes (lista corta; el vendedor puede escribir otro).
const BANKS = [
  'Banco de Chile',
  'BancoEstado',
  'Banco Santander',
  'Banco BCI',
  'Scotiabank',
  'Banco Itaú',
  'Banco Falabella',
  'Banco Ripley',
  'Mercado Pago',
  'Tenpo',
  'Otro'
]

const ACCOUNT_TYPES = ['Cuenta Corriente', 'Cuenta Vista', 'Cuenta RUT', 'Cuenta de Ahorro']

export default function SellerStoreForm() {
  const { customer, becomeSeller } = useCustomerAuth()

  const [storeName, setStoreName] = useState(customer?.storeName || '')
  const [storeBio, setStoreBio] = useState('')
  const [payout, setPayout] = useState({
    bank: '',
    accountType: '',
    accountNumber: '',
    holderName: '',
    holderDoc: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  // Carga los datos de pago actuales del vendedor.
  useEffect(() => {
    getMyPayoutInfo()
      .then(info => {
        setPayout({
          bank: info.bank || '',
          accountType: info.accountType || '',
          accountNumber: info.accountNumber || '',
          holderName: info.holderName || '',
          holderDoc: info.holderDoc || ''
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    if (storeName.trim().length < 2) {
      setError('El nombre de la tienda debe tener al menos 2 caracteres.')
      return
    }
    setSaving(true)
    setError('')
    setOk('')
    try {
      // Solo envía los campos de payout que tienen contenido.
      const cleanPayout = Object.fromEntries(
        Object.entries(payout).filter(([, v]) => v && v.trim())
      )
      await becomeSeller({
        storeName: storeName.trim(),
        storeBio: storeBio.trim() || undefined,
        payout: Object.keys(cleanPayout).length ? cleanPayout : undefined
      })
      setOk('Datos guardados.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className={styles.muted}>Cargando…</p>

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        maxWidth: 640
      }}
    >
      <h3 className={styles.sectionTitle}>Datos de la tienda</h3>

      <label className={styles.field}>
        <span className={styles.label}>Nombre de la tienda</span>
        <input
          className={styles.input}
          value={storeName}
          onChange={e => setStoreName(e.target.value)}
          disabled={saving}
        />
        {customer?.storeSlug && (
          <span className={styles.hint}>Tu URL: /tienda/{customer.storeSlug}</span>
        )}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Descripción</span>
        <textarea
          className={styles.textarea}
          value={storeBio}
          onChange={e => setStoreBio(e.target.value)}
          placeholder='Cuéntales a tus clientes sobre tu tienda'
          rows={3}
          disabled={saving}
        />
      </label>

      <h3
        className={styles.sectionTitle}
        style={{ marginTop: 10 }}
      >
        Datos para recibir pagos
      </h3>
      <p className={styles.hint}>
        Aquí depositaremos el dinero de tus ventas. Solo tú ves esta información.
      </p>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.label}>Banco</span>
          <select
            className={styles.select}
            value={payout.bank}
            onChange={e => setPayout(p => ({ ...p, bank: e.target.value }))}
            disabled={saving}
          >
            <option value=''>Elige tu banco</option>
            {BANKS.map(b => (
              <option
                key={b}
                value={b}
              >
                {b}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Tipo de cuenta</span>
          <select
            className={styles.select}
            value={payout.accountType}
            onChange={e => setPayout(p => ({ ...p, accountType: e.target.value }))}
            disabled={saving}
          >
            <option value=''>Elige tipo</option>
            {ACCOUNT_TYPES.map(t => (
              <option
                key={t}
                value={t}
              >
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Número de cuenta</span>
          <input
            className={styles.input}
            value={payout.accountNumber}
            onChange={e => setPayout(p => ({ ...p, accountNumber: e.target.value }))}
            placeholder='000000000'
            disabled={saving}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>RUT del titular</span>
          <input
            className={styles.input}
            value={payout.holderDoc}
            onChange={e => setPayout(p => ({ ...p, holderDoc: e.target.value }))}
            placeholder='12.345.678-9'
            disabled={saving}
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Nombre del titular</span>
          <input
            className={styles.input}
            value={payout.holderName}
            onChange={e => setPayout(p => ({ ...p, holderName: e.target.value }))}
            placeholder='Nombre y apellido'
            disabled={saving}
          />
        </label>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {ok && <div className={styles.success}>{ok}</div>}

      <button
        className={styles.primaryBtn}
        type='submit'
        disabled={saving}
      >
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
