import { useEffect, useState } from 'react'
import {
  getMyProducts,
  createMyProduct,
  updateMyProduct,
  deleteMyProduct,
  uploadSellerImage,
  uploadSellerModel
} from '../../services/seller/sellerService'
import { getCategories } from '../../services/categories/getCategories'
import styles from './SellerForms.module.css'

const EMPTY = {
  name: '',
  description: '',
  categoryId: '',
  images: [], // [{ id, url }]
  modelId: null,
  modelName: '',
  widthCm: '',
  heightCm: '',
  depthCm: ''
}

// Arma el snippet del iframe que el vendedor pega en su tienda externa.
function buildEmbed(id) {
  const base = window.location.origin
  return `<iframe src="${base}/ver/${id}" width="100%" height="500" style="border:0;" allow="camera; xr-spatial-tracking" allowfullscreen></iframe>`
}

// Bloque por producto: caja con el código del iframe + botón copiar.
function EmbedBox({ id }) {
  const [copied, setCopied] = useState(false)
  const code = buildEmbed(id)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Fallback si el navegador bloquea la API de portapapeles.
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className={styles.embedBox}>
      <span className={styles.embedLabel}>Código para tu tienda</span>
      <code className={styles.embedCode}>{code}</code>
      <button
        type='button'
        className={styles.ghostBtn}
        onClick={copy}
      >
        {copied ? '¡Copiado!' : 'Copiar código'}
      </button>
    </div>
  )
}

export default function SellerProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [prods, cats] = await Promise.all([getMyProducts(), getCategories()])
      setProducts(prods)
      setCategories(cats)
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

  const openEdit = p => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      description: p.description || '',
      categoryId: p.categoryId || '',
      images: (p.images || []).map(i => ({ id: i.id, url: i.url })),
      // El producto trae el modelo como URL, no como id editable; al editar no
      // lo recargamos salvo que el vendedor suba uno nuevo.
      modelId: null,
      modelName: p.model ? 'Modelo 3D actual' : '',
      widthCm: p.widthCm != null ? String(p.widthCm) : '',
      heightCm: p.heightCm != null ? String(p.heightCm) : '',
      depthCm: p.depthCm != null ? String(p.depthCm) : ''
    })
    setShowForm(true)
    setError('')
  }

  const closeForm = () => {
    setShowForm(false)
    setForm(EMPTY)
    setEditingId(null)
  }

  const handleImageUpload = async e => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    setError('')
    try {
      for (const file of files) {
        const img = await uploadSellerImage(file, file.name)
        setForm(f => ({ ...f, images: [...f.images, { id: img.id, url: img.url }] }))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = '' // permite re-subir el mismo archivo
    }
  }

  const removeImage = id => {
    setForm(f => ({ ...f, images: f.images.filter(i => i.id !== id) }))
  }

  const handleModelUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const model = await uploadSellerModel(file, file.name)
      setForm(f => ({ ...f, modelId: model.id, modelName: model.name }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Parsea un campo de medida: '' -> null; número positivo -> número.
  const parseDim = v => {
    if (v === '' || v == null) return null
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!form.name.trim()) return setError('El nombre es obligatorio.')
    if (!form.categoryId) return setError('Elige una categoría.')

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      imageIds: form.images.map(i => i.id),
      widthCm: parseDim(form.widthCm),
      heightCm: parseDim(form.heightCm),
      depthCm: parseDim(form.depthCm)
    }
    // Solo manda modelId si se subió uno nuevo (al editar, null = no tocar).
    if (form.modelId) payload.modelId = form.modelId

    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await updateMyProduct(editingId, payload)
      } else {
        await createMyProduct(payload)
      }
      closeForm()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar este producto? No se puede deshacer.')) return
    setError('')
    try {
      await deleteMyProduct(id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p className={styles.muted}>Cargando tus productos…</p>

  return (
    <div>
      <div className={styles.toolbar}>
        <h2 className={styles.sectionTitle}>
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </h2>
        {!showForm && (
          <button
            className={styles.primaryBtn}
            onClick={openCreate}
          >
            + Nuevo producto AR
          </button>
        )}
      </div>

      {error && !showForm && <div className={styles.error}>{error}</div>}

      {showForm && (
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 22,
            marginBottom: 22
          }}
        >
          <div className={styles.formGrid}>
            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Nombre del producto</span>
              <input
                className={styles.input}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder='Ej: Silla de madera'
                disabled={saving}
              />
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Descripción (opcional)</span>
              <textarea
                className={styles.textarea}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder='Materiales, detalles…'
                rows={3}
                disabled={saving}
              />
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Categoría</span>
              <select
                className={styles.select}
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                disabled={saving}
              >
                <option value=''>Elige una categoría</option>
                {categories.map(c => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Alto (cm)</span>
              <input
                className={styles.input}
                type='number'
                step='0.1'
                min='0'
                value={form.heightCm}
                onChange={e => setForm(f => ({ ...f, heightCm: e.target.value }))}
                placeholder='90'
                disabled={saving}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Ancho (cm)</span>
              <input
                className={styles.input}
                type='number'
                step='0.1'
                min='0'
                value={form.widthCm}
                onChange={e => setForm(f => ({ ...f, widthCm: e.target.value }))}
                placeholder='45'
                disabled={saving}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Profundidad (cm)</span>
              <input
                className={styles.input}
                type='number'
                step='0.1'
                min='0'
                value={form.depthCm}
                onChange={e => setForm(f => ({ ...f, depthCm: e.target.value }))}
                placeholder='45'
                disabled={saving}
              />
            </label>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Fotos del producto (opcional)</span>
              <div className={styles.uploadRow}>
                <label className={styles.ghostBtn}>
                  {uploading ? 'Subiendo…' : 'Subir fotos'}
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={handleImageUpload}
                    disabled={saving || uploading}
                    style={{ display: 'none' }}
                  />
                </label>
                <span className={styles.hint}>JPG, PNG o WEBP. Hasta 5MB cada una.</span>
              </div>
              {form.images.length > 0 && (
                <div className={styles.thumbStrip}>
                  {form.images.map(img => (
                    <div
                      key={img.id}
                      className={styles.thumbItem}
                    >
                      <img
                        src={img.url}
                        alt=''
                      />
                      <button
                        type='button'
                        className={styles.thumbRemove}
                        onClick={() => removeImage(img.id)}
                        aria-label='Quitar foto'
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Modelo 3D para Realidad Aumentada</span>
              <div className={styles.uploadRow}>
                <label className={styles.ghostBtn}>
                  {uploading ? 'Subiendo…' : 'Subir .glb o .usdz'}
                  <input
                    type='file'
                    accept='.glb,.usdz,model/gltf-binary,model/vnd.usdz+zip'
                    onChange={handleModelUpload}
                    disabled={saving || uploading}
                    style={{ display: 'none' }}
                  />
                </label>
                <span className={styles.hint}>
                  {form.modelName || '.glb (Android) o .usdz (iPhone), hasta 50MB.'}
                </span>
              </div>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className={styles.primaryBtn}
              type='submit'
              disabled={saving || uploading}
            >
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear producto'}
            </button>
            <button
              className={styles.ghostBtn}
              type='button'
              onClick={closeForm}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {products.length === 0 && !showForm ? (
        <div className={styles.empty}>
          <p>Todavía no creaste productos.</p>
          <button
            className={styles.primaryBtn}
            onClick={openCreate}
          >
            Crear mi primer producto AR
          </button>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {products.map(p => (
            <div
              key={p.id}
              className={styles.prodCard}
            >
              {p.image ? (
                <img
                  className={styles.prodThumb}
                  src={p.image}
                  alt={p.name}
                />
              ) : (
                <div className={styles.prodThumbEmpty}>Sin foto</div>
              )}
              <div className={styles.prodBody}>
                <p className={styles.prodName}>{p.name}</p>
                <span className={styles.prodMeta}>
                  {p.heightCm || p.widthCm || p.depthCm
                    ? `${p.heightCm ?? '—'} × ${p.widthCm ?? '—'} × ${p.depthCm ?? '—'} cm`
                    : 'Sin medidas'}
                </span>
                <span className={styles.prodMeta}>
                  Visto {p.views ?? 0} {(p.views ?? 0) === 1 ? 'vez' : 'veces'} en AR
                </span>
              </div>

              {p.model && <EmbedBox id={p.id} />}

              <div className={styles.prodActions}>
                <button
                  className={styles.ghostBtn}
                  onClick={() => openEdit(p)}
                >
                  Editar
                </button>
                <button
                  className={styles.dangerBtn}
                  onClick={() => handleDelete(p.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
