import { useEffect, useState, useCallback } from 'react'
import {
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getFamilies,
  getFamily,
  getAssets,
  linkAsset,
  unlinkAsset,
  syndicate
} from '../services/pim/pimService'
import { StatusBadge } from './PimUI'
import styles from './Pim.module.css'

const EMPTY_FORM = {
  name: '',
  description: '',
  sku: '',
  ean: '',
  brand: '',
  supplier: '',
  categoryId: '',
  familyId: '',
  price: '',
  stock: '',
  status: 'draft'
}

export default function PimProductEditor({ productId, onBack, onSaved }) {
  const [id, setId] = useState(productId)
  const [form, setForm] = useState(EMPTY_FORM)
  const [attrDefs, setAttrDefs] = useState([])
  const [attrValues, setAttrValues] = useState({})
  const [variants, setVariants] = useState([])
  const [assets, setAssets] = useState([])
  const [channels, setChannels] = useState([])
  const [completeness, setCompleteness] = useState({ percent: 0, missing: [] })
  const [readiness, setReadiness] = useState({ ready: false, reasons: [] })

  const [categories, setCategories] = useState([])
  const [families, setFamilies] = useState([])

  const [loading, setLoading] = useState(Boolean(productId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const loadProduct = useCallback(async pid => {
    const p = await getProduct(pid)
    setForm({
      name: p.name ?? '',
      description: p.description ?? '',
      sku: p.sku ?? '',
      ean: p.ean ?? '',
      brand: p.brand ?? '',
      supplier: p.supplier ?? '',
      categoryId: p.categoryId ?? '',
      familyId: p.familyId ?? '',
      price: p.price ?? '',
      stock: p.stock ?? '',
      status: p.status ?? 'draft'
    })
    setAttrDefs(p.attributes.map(a => ({ ...a })))
    const values = {}
    p.attributes.forEach(a => {
      if (a.value !== null && a.value !== undefined) values[a.code] = a.value
    })
    setAttrValues(values)
    setVariants(p.variants ?? [])
    setAssets(p.assets ?? [])
    setChannels(p.channels ?? [])
    setCompleteness(p.completeness)
    setReadiness(p.readiness)
  }, [])

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getFamilies().then(setFamilies).catch(() => {})
  }, [])

  useEffect(() => {
    if (!productId) return
    ;(async () => {
      try {
        await loadProduct(productId)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [productId, loadProduct])

  // Al cambiar de familia, carga sus atributos (conserva valores por code).
  const handleFamilyChange = async familyId => {
    setForm(f => ({ ...f, familyId }))
    if (!familyId) {
      setAttrDefs([])
      return
    }
    try {
      const fam = await getFamily(familyId)
      setAttrDefs(fam.attributes.map(a => ({ ...a })))
    } catch (err) {
      setError(err.message)
    }
  }

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const setAttr = (code, value) => setAttrValues(v => ({ ...v, [code]: value }))

  // --- Variantes ---
  const addVariant = () =>
    setVariants(vs => [...vs, { name: '', sku: '', price: '', stock: 0 }])
  const setVariant = (idx, key, value) =>
    setVariants(vs => vs.map((v, i) => (i === idx ? { ...v, [key]: value } : v)))
  const removeVariant = idx => setVariants(vs => vs.filter((_, i) => i !== idx))

  const buildPayload = () => {
    // Normaliza valores de atributos (number -> Number).
    const attributes = {}
    for (const def of attrDefs) {
      const raw = attrValues[def.code]
      if (raw === undefined || raw === '' || raw === null) continue
      attributes[def.code] = def.type === 'number' ? Number(raw) : raw
    }
    return {
      name: form.name.trim(),
      description: form.description,
      categoryId: form.categoryId,
      familyId: form.familyId || null,
      sku: form.sku || null,
      ean: form.ean || null,
      brand: form.brand || null,
      supplier: form.supplier || null,
      price: form.price === '' ? 0 : Number(form.price),
      stock: form.stock === '' ? 0 : Number(form.stock),
      status: form.status,
      attributes,
      variants: variants
        .filter(v => v.name.trim())
        .map((v, i) => ({
          name: v.name.trim(),
          sku: v.sku || null,
          ean: v.ean || null,
          price: v.price === '' || v.price === undefined ? null : Number(v.price),
          stock: v.stock === '' || v.stock === undefined ? 0 : Number(v.stock),
          attributes: v.attributes ?? {},
          position: i
        }))
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return setError('El nombre es obligatorio')
    if (!form.categoryId) return setError('La categoría es obligatoria')
    setSaving(true)
    setError('')
    setMsg('')
    try {
      const payload = buildPayload()
      if (id) {
        await updateProduct(id, payload)
        await loadProduct(id)
        setMsg('Cambios guardados')
      } else {
        const created = await createProduct(payload)
        setId(created.id)
        await loadProduct(created.id)
        setMsg('Producto creado. Ahora puedes adjuntar activos y publicar.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm('¿Eliminar este producto? No se puede deshacer.')) return
    try {
      await deleteProduct(id)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSyndicate = async channelId => {
    setError('')
    setMsg('')
    try {
      const r = await syndicate(id, channelId)
      setMsg(`Publicado en ${r.channel}`)
      await loadProduct(id)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p className={styles.muted}>Cargando producto…</p>

  return (
    <div>
      <div className={styles.sectionHead}>
        <div className={styles.btnRow}>
          <button
            className={styles.btnGhost}
            onClick={onBack}
          >
            ← Volver
          </button>
          <h2 className={styles.title}>{id ? form.name || 'Editar producto' : 'Nuevo producto'}</h2>
        </div>
        <div className={styles.btnRow}>
          {id && (
            <button
              className={styles.btnDanger}
              onClick={handleDelete}
            >
              Eliminar
            </button>
          )}
          <button
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {msg && <div className={styles.success}>{msg}</div>}

      <div className={styles.editorGrid}>
        {/* Columna principal */}
        <div>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Información base</h3>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Nombre<span className={styles.req}>*</span>
                </label>
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>SKU</label>
                  <input
                    className={styles.input}
                    value={form.sku}
                    onChange={e => setField('sku', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>EAN / GTIN</label>
                  <input
                    className={styles.input}
                    value={form.ean}
                    onChange={e => setField('ean', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Marca</label>
                  <input
                    className={styles.input}
                    value={form.brand}
                    onChange={e => setField('brand', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>
                    Categoría<span className={styles.req}>*</span>
                  </label>
                  <select
                    className={styles.select}
                    value={form.categoryId}
                    onChange={e => setField('categoryId', e.target.value)}
                  >
                    <option value=''>— Selecciona —</option>
                    {categories.map(c => (
                      <option
                        key={c.id}
                        value={c.id}
                      >
                        {c.path}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Familia (atributos)</label>
                  <select
                    className={styles.select}
                    value={form.familyId}
                    onChange={e => handleFamilyChange(e.target.value)}
                  >
                    <option value=''>— Sin familia —</option>
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
                <div className={styles.field}>
                  <label className={styles.label}>Importador</label>
                  <input
                    className={styles.input}
                    value={form.supplier}
                    onChange={e => setField('supplier', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Precio (CLP)</label>
                  <input
                    className={styles.input}
                    type='number'
                    value={form.price}
                    onChange={e => setField('price', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Stock</label>
                  <input
                    className={styles.input}
                    type='number'
                    value={form.stock}
                    onChange={e => setField('stock', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Estado</label>
                  <select
                    className={styles.select}
                    value={form.status}
                    onChange={e => setField('status', e.target.value)}
                  >
                    <option value='draft'>Borrador</option>
                    <option value='review'>Revisión</option>
                    <option value='approved'>Aprobado</option>
                    <option value='published'>Publicado</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Descripción</label>
                <textarea
                  className={styles.textarea}
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Atributos dinámicos */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Atributos de la familia</h3>
            {attrDefs.length === 0 ? (
              <p className={styles.muted}>
                Selecciona una familia para ver sus atributos.
              </p>
            ) : (
              <div className={styles.formRow}>
                {attrDefs.map(def => (
                  <div
                    key={def.code}
                    className={styles.field}
                  >
                    <label className={styles.label}>
                      {def.label}
                      {def.unit ? ` (${def.unit})` : ''}
                      {def.required && <span className={styles.req}>*</span>}
                    </label>
                    {def.type === 'select' ? (
                      <select
                        className={styles.select}
                        value={attrValues[def.code] ?? ''}
                        onChange={e => setAttr(def.code, e.target.value)}
                      >
                        <option value=''>—</option>
                        {(def.options ?? []).map(o => (
                          <option
                            key={o}
                            value={o}
                          >
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : def.type === 'boolean' ? (
                      <select
                        className={styles.select}
                        value={attrValues[def.code] === true ? 'true' : attrValues[def.code] === false ? 'false' : ''}
                        onChange={e => setAttr(def.code, e.target.value === '' ? '' : e.target.value === 'true')}
                      >
                        <option value=''>—</option>
                        <option value='true'>Sí</option>
                        <option value='false'>No</option>
                      </select>
                    ) : (
                      <input
                        className={styles.input}
                        type={def.type === 'number' ? 'number' : def.type === 'date' ? 'date' : 'text'}
                        value={attrValues[def.code] ?? ''}
                        onChange={e => setAttr(def.code, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variantes */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>
              Variantes
              <button
                className={styles.btnGhost}
                onClick={addVariant}
              >
                + Agregar
              </button>
            </h3>
            {variants.length === 0 ? (
              <p className={styles.muted}>Sin variantes.</p>
            ) : (
              variants.map((v, idx) => (
                <div
                  key={idx}
                  className={styles.variantRow}
                >
                  <input
                    className={styles.inputInline}
                    placeholder='Nombre (ej. Talla M / Azul)'
                    value={v.name}
                    onChange={e => setVariant(idx, 'name', e.target.value)}
                  />
                  <input
                    className={styles.inputInline}
                    placeholder='SKU'
                    value={v.sku ?? ''}
                    onChange={e => setVariant(idx, 'sku', e.target.value)}
                  />
                  <input
                    className={styles.inputInline}
                    type='number'
                    placeholder='Precio'
                    value={v.price ?? ''}
                    onChange={e => setVariant(idx, 'price', e.target.value)}
                  />
                  <input
                    className={styles.inputInline}
                    type='number'
                    placeholder='Stock'
                    value={v.stock ?? 0}
                    onChange={e => setVariant(idx, 'stock', e.target.value)}
                  />
                  <button
                    className={styles.btnDanger}
                    onClick={() => removeVariant(idx)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columna lateral */}
        <div>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Completitud</h3>
            <div className={styles.statValue}>{completeness.percent}%</div>
            {completeness.missing?.length > 0 ? (
              <p
                className={styles.muted}
                style={{ marginTop: 8 }}
              >
                Faltan: {completeness.missing.map(m => m.label).join(', ')}
              </p>
            ) : (
              <p
                className={styles.muted}
                style={{ marginTop: 8 }}
              >
                Datos obligatorios completos.
              </p>
            )}
          </div>

          {id ? (
            <>
              <AssetPanel
                productId={id}
                assets={assets}
                onChanged={() => loadProduct(id)}
              />

              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Canales</h3>
                {!readiness.ready && (
                  <p
                    className={styles.muted}
                    style={{ marginBottom: 10 }}
                  >
                    Para publicar: {readiness.reasons.join('; ')}
                  </p>
                )}
                {channels.map(c => (
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
                          disabled={!readiness.ready}
                          onClick={() => handleSyndicate(c.channelId)}
                        >
                          Publicar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.panel}>
              <p className={styles.muted}>
                Guarda el producto para adjuntar activos del DAM y publicarlo en canales.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Panel de activos vinculados + vinculación desde el DAM.
function AssetPanel({ productId, assets, onChanged }) {
  const [available, setAvailable] = useState([])
  const [selected, setSelected] = useState('')
  const [role, setRole] = useState('gallery')
  const [error, setError] = useState('')

  useEffect(() => {
    getAssets().then(setAvailable).catch(() => {})
  }, [])

  const handleLink = async () => {
    if (!selected) return
    setError('')
    try {
      await linkAsset(productId, { assetId: selected, role })
      setSelected('')
      onChanged?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUnlink = async assetId => {
    try {
      await unlinkAsset(productId, assetId)
      onChanged?.()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>Activos (DAM)</h3>
      {error && <div className={styles.error}>{error}</div>}

      {assets.length === 0 ? (
        <p
          className={styles.muted}
          style={{ marginBottom: 10 }}
        >
          Sin activos vinculados.
        </p>
      ) : (
        <div style={{ marginBottom: 12 }}>
          {assets.map(a => (
            <div
              key={a.id}
              className={styles.btnRow}
              style={{ justifyContent: 'space-between', marginBottom: 6 }}
            >
              <span className={styles.assetName}>
                {a.type === 'image' ? '🖼' : a.type === 'model' ? '🧊' : a.type === 'video' ? '🎬' : '📄'}{' '}
                {a.name} <span className={styles.assetType}>({a.role})</span>
              </span>
              <button
                className={styles.btnGhost}
                onClick={() => handleUnlink(a.id)}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.field}>
        <select
          className={styles.select}
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value=''>— Elegir del DAM —</option>
          {available.map(a => (
            <option
              key={a.id}
              value={a.id}
            >
              {a.name} ({a.type})
            </option>
          ))}
        </select>
      </div>
      <div
        className={styles.btnRow}
        style={{ marginTop: 8 }}
      >
        <select
          className={styles.select}
          style={{ maxWidth: 130 }}
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          <option value='gallery'>Galería</option>
          <option value='main'>Principal</option>
          <option value='model'>Modelo 3D</option>
          <option value='datasheet'>Ficha técnica</option>
        </select>
        <button
          className={styles.btnGhost}
          onClick={handleLink}
          disabled={!selected}
        >
          Vincular
        </button>
      </div>
    </div>
  )
}
