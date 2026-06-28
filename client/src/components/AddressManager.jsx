import { useEffect, useState } from 'react'
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress
} from '../services/addresses/addressService'
import styles from './AddressManager.module.css'

// Gestión de direcciones de despacho del comprador. Componente autónomo:
// puedes montarlo en una página "Mi cuenta" o en el flujo de checkout.

const EMPTY = {
  label: '',
  recipient: '',
  phone: '',
  region: '',
  commune: '',
  addressLine: '',
  extra: '',
  isDefault: false
}

export default function AddressManager() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setAddresses(await getAddresses())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY)
    setShowForm(true)
    setError('')
  }

  const openEdit = a => {
    setEditingId(a.id)
    setForm({
      label: a.label || '',
      recipient: a.recipient || '',
      phone: a.phone || '',
      region: a.region || '',
      commune: a.commune || '',
      addressLine: a.addressLine || '',
      extra: a.extra || '',
      isDefault: Boolean(a.isDefault)
    })
    setShowForm(true)
    setError('')
  }

  const submit = async e => {
    e.preventDefault()
    if (!form.recipient.trim()) return setError('Indica el nombre de quién recibe.')
    if (!form.addressLine.trim()) return setError('Indica la dirección (calle y número).')

    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        label: form.label.trim() || undefined,
        phone: form.phone.trim() || undefined,
        region: form.region.trim() || undefined,
        commune: form.commune.trim() || undefined,
        extra: form.extra.trim() || undefined
      }
      if (editingId) await updateAddress(editingId, payload)
      else await createAddress(payload)
      setShowForm(false)
      setForm(EMPTY)
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async id => {
    if (!window.confirm('¿Eliminar esta dirección?')) return
    try {
      await deleteAddress(id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p className={styles.muted}>Cargando direcciones…</p>

  return (
    <div>
      <div className={styles.toolbar}>
        <h2 className={styles.sectionTitle}>Mis direcciones</h2>
        {!showForm && (
          <button
            className={styles.primaryBtn}
            onClick={openCreate}
          >
            + Agregar dirección
          </button>
        )}
      </div>

      {error && !showForm && <div className={styles.error}>{error}</div>}

      {showForm && (
        <form
          className={styles.form}
          onSubmit={submit}
        >
          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.label}>Etiqueta</span>
              <input
                className={styles.input}
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder='Casa, Trabajo…'
                disabled={saving}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Recibe</span>
              <input
                className={styles.input}
                value={form.recipient}
                onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                placeholder='Nombre y apellido'
                disabled={saving}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Teléfono</span>
              <input
                className={styles.input}
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder='+56 9 …'
                disabled={saving}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Región</span>
              <input
                className={styles.input}
                value={form.region}
                onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                disabled={saving}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Comuna</span>
              <input
                className={styles.input}
                value={form.commune}
                onChange={e => setForm(f => ({ ...f, commune: e.target.value }))}
                disabled={saving}
              />
            </label>
            <label className={`${styles.field} ${styles.full}`}>
              <span className={styles.label}>Dirección (calle y número)</span>
              <input
                className={styles.input}
                value={form.addressLine}
                onChange={e => setForm(f => ({ ...f, addressLine: e.target.value }))}
                disabled={saving}
              />
            </label>
            <label className={`${styles.field} ${styles.full}`}>
              <span className={styles.label}>Depto / referencia (opcional)</span>
              <input
                className={styles.input}
                value={form.extra}
                onChange={e => setForm(f => ({ ...f, extra: e.target.value }))}
                disabled={saving}
              />
            </label>
            <label className={styles.checkRow}>
              <input
                type='checkbox'
                checked={form.isDefault}
                onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                disabled={saving}
              />
              <span>Usar como dirección predeterminada</span>
            </label>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formActions}>
            <button
              className={styles.primaryBtn}
              type='submit'
              disabled={saving}
            >
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Agregar dirección'}
            </button>
            <button
              className={styles.ghostBtn}
              type='button'
              onClick={() => {
                setShowForm(false)
                setForm(EMPTY)
                setEditingId(null)
              }}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className={styles.empty}>
          <p>Aún no tienes direcciones guardadas.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {addresses.map(a => (
            <li
              key={a.id}
              className={styles.card}
            >
              <div className={styles.cardHead}>
                <span className={styles.cardLabel}>
                  {a.label || 'Dirección'}
                  {a.isDefault && <span className={styles.defaultTag}>Predeterminada</span>}
                </span>
              </div>
              <p className={styles.cardLine}>{a.recipient}</p>
              <p className={styles.cardLine}>
                {a.addressLine}
                {a.extra ? `, ${a.extra}` : ''}
              </p>
              <p className={styles.cardMeta}>
                {[a.commune, a.region].filter(Boolean).join(', ')}
                {a.phone ? ` · ${a.phone}` : ''}
              </p>
              <div className={styles.cardActions}>
                <button
                  className={styles.ghostBtn}
                  onClick={() => openEdit(a)}
                >
                  Editar
                </button>
                <button
                  className={styles.dangerBtn}
                  onClick={() => remove(a.id)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
