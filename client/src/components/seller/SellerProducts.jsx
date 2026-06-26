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
import { formatCLP } from '../../utils/formatCLP'
import styles from './SellerForms.module.css'

const EMPTY = {
  name: '',
  description: '',
  price: '',
  stock: '',
  categoryId: '',
  images: [], // [{ id, url }]
  modelId: null,
  modelName: ''
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
      price: String(p.price),
      stock: String(p.stock),
      categoryId: p.categoryId || '',
      images: (p.images || []).map(i => ({ id: i.id, url: i.url })),
      // El producto trae el modelo como URL, no como id editable; al editar no
      // lo recargamos salvo que el vendedor suba uno nuevo.
      modelId: null,
      modelName: p.model ? 'Modelo 3D actual' : ''
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

  const handleSubmit = async e => {
    e.preventDefault()
    const price = Number(form.price)
    const stock = Number(form.stock)

    if (!form.name.trim()) return setError('El nombre es obligatorio.')
    if (!form.categoryId) return setError('Elige una categoría.')
    if (!Number.isInteger(price) || price <= 0) return setError('El precio debe ser un entero mayor a 0.')
    if (!Number.isInteger(stock) || stock < 0) return setError('El stock debe ser 0 o más.')

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      stock,
      categoryId: form.categoryId,
      imageIds: form.images.map(i => i.id)
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
            + Publicar producto
          </button>
        )}
      </div>

      {error && !showForm && <div className={styles.error}>{error}</div>}

      {showForm && (
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          style={{
            background: '#fff',
            border: '1px solid #ececec',
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
                placeholder='Ej: Figura de colección 20cm'
                disabled={saving}
              />
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Descripción</span>
              <textarea
                className={styles.textarea}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder='Detalles, materiales, medidas…'
                rows={3}
                disabled={saving}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Precio (CLP)</span>
              <input
                className={styles.input}
                type='number'
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder='9990'
                min='1'
                disabled={saving}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Stock disponible</span>
              <input
                className={styles.input}
                type='number'
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                placeholder='10'
                min='0'
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

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Fotos del producto</span>
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
              <span className={styles.label}>Modelo 3D para Realidad Aumentada (opcional)</span>
              <div className={styles.uploadRow}>
                <label className={styles.ghostBtn}>
                  {uploading ? 'Subiendo…' : 'Subir .glb'}
                  <input
                    type='file'
                    accept='.glb,model/gltf-binary'
                    onChange={handleModelUpload}
                    disabled={saving || uploading}
                    style={{ display: 'none' }}
                  />
                </label>
                <span className={styles.hint}>
                  {form.modelName || 'Archivo .glb, hasta 50MB. Permite "Ver en AR".'}
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
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Publicar producto'}
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
          <p>Todavía no publicaste productos.</p>
          <button
            className={styles.primaryBtn}
            onClick={openCreate}
          >
            Publicar mi primer producto
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
                  {p.categoryName} · {p.stock > 0 ? `${p.stock} en stock` : 'Sin stock'}
                </span>
                <span className={styles.prodPrice}>{formatCLP(p.price)}</span>
              </div>
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
