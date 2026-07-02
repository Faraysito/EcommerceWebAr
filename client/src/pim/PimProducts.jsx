import { useEffect, useState, useCallback } from 'react'
import { getProducts, getFamilies } from '../services/pim/pimService'
import { StatusBadge, Completeness } from './PimUI'
import PimProductEditor from './PimProductEditor'
import { formatCLP } from '../utils/formatCLP'
import styles from './Pim.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'review', label: 'Revisión' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'published', label: 'Publicado' }
]

export default function PimProducts() {
  const [products, setProducts] = useState([])
  const [families, setFamilies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [familyId, setFamilyId] = useState('')

  // null = lista; 'new' = crear; uuid = editar
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getProducts({
        search: search || undefined,
        status: status || undefined,
        familyId: familyId || undefined
      })
      setProducts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, status, familyId])

  useEffect(() => {
    getFamilies().then(setFamilies).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 250) // debounce de búsqueda
    return () => clearTimeout(t)
  }, [load])

  if (editing) {
    return (
      <PimProductEditor
        productId={editing === 'new' ? null : editing}
        onBack={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          load()
        }}
      />
    )
  }

  return (
    <div>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.title}>Productos</h2>
          <p className={styles.subtitle}>{products.length} fichas maestras</p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => setEditing('new')}
        >
          + Nuevo producto
        </button>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder='Buscar por nombre…'
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className={styles.select}
          style={{ maxWidth: 200 }}
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map(o => (
            <option
              key={o.value}
              value={o.value}
            >
              {o.label}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          style={{ maxWidth: 220 }}
          value={familyId}
          onChange={e => setFamilyId(e.target.value)}
        >
          <option value=''>Todas las familias</option>
          {families.map(f => (
            <option
              key={f.id}
              value={f.id}
            >
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.muted}>Cargando…</p>
      ) : products.length === 0 ? (
        <p className={styles.muted}>No hay productos con esos filtros.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>SKU</th>
                <th>Familia</th>
                <th>Importador</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Completitud</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr
                  key={p.id}
                  className={styles.rowClickable}
                  onClick={() => setEditing(p.id)}
                >
                  <td>{p.name}</td>
                  <td className={styles.mono}>{p.sku || '—'}</td>
                  <td>{p.familyName || '—'}</td>
                  <td>{p.supplier || '—'}</td>
                  <td>{p.price ? formatCLP(p.price) : '—'}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>
                    <Completeness percent={p.completeness.percent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
