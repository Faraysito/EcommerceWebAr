import { useEffect, useState } from 'react'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../services/products/productAdminService'
import { getCategories } from '../services/categories/categoryAdminService'
import { getImages, getModels } from '../services/files/fileAdminService'
import { getOffers, createOffer, deleteOffer } from '../services/offers/offerAdminService'
import styles from './ProductsManager.module.css'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  stock: '',
  categoryId: '',
  modelId: '',
  imageIds: []
}

export default function ProductsManager() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [images, setImages] = useState([])
  const [models, setModels] = useState([])
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Formulario: si editingId es null => creando; si tiene valor => editando
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [prods, cats, imgs, mdls, offs] = await Promise.all([
        getProducts(),
        getCategories(),
        getImages(),
        getModels(),
        getOffers()
      ])
      setProducts(prods)
      setCategories(cats)
      setImages(imgs)
      setModels(mdls)
      setOffers(offs)
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
    setForm(EMPTY_FORM)
    setShowForm(true)
    setError('')
  }

  const openEdit = product => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.categoryId || '',
      modelId: product.model ? findModelId(product) : '',
      imageIds: (product.images || []).map(i => i.id)
    })
    setShowForm(true)
    setError('')
  }

  // El producto trae el modelo como URL; para preseleccionar en el form
  // buscamos su id en la lista de modelos por coincidencia de URL.
  const findModelId = product => {
    const match = models.find(m => m.url === product.model)
    return match?.id || ''
  }

  const toggleImage = imageId => {
    setForm(f => {
      const has = f.imageIds.includes(imageId)
      return {
        ...f,
        imageIds: has ? f.imageIds.filter(id => id !== imageId) : [...f.imageIds, imageId]
      }
    })
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseInt(form.price, 10),
        stock: parseInt(form.stock, 10),
        categoryId: form.categoryId,
        modelId: form.modelId || null,
        imageIds: form.imageIds
      }
      if (editingId) {
        await updateProduct(editingId, payload)
      } else {
        await createProduct(payload)
      }
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async product => {
    if (!confirm(`¿Eliminar el producto "${product.name}"?`)) return
    setError('')
    try {
      await deleteProduct(product.id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  // ----- Ofertas de un producto -----
  const offersOf = productId => offers.filter(o => o.product_id === productId)

  const [offerForm, setOfferForm] = useState(null) // { productId } o null
  const [offerData, setOfferData] = useState({
    discountType: 'PERCENTAGE',
    discountValue: '',
    startDate: '',
    endDate: ''
  })

  const handleCreateOffer = async e => {
    e.preventDefault()
    setError('')
    try {
      await createOffer({
        productId: offerForm.productId,
        discountType: offerData.discountType,
        discountValue: parseInt(offerData.discountValue, 10),
        startDate: new Date(offerData.startDate).toISOString(),
        endDate: new Date(offerData.endDate).toISOString()
      })
      setOfferForm(null)
      setOfferData({ discountType: 'PERCENTAGE', discountValue: '', startDate: '', endDate: '' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteOffer = async id => {
    if (!confirm('¿Eliminar esta oferta?')) return
    try {
      await deleteOffer(id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const formatCLP = n => '$' + Number(n).toLocaleString('es-CL')

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Productos</h2>
        <button
          className={styles.btnPrimary}
          onClick={openCreate}
        >
          + Nuevo producto
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.muted}>Cargando…</p>
      ) : products.length === 0 ? (
        <p className={styles.muted}>No hay productos todavía. Crea el primero.</p>
      ) : (
        <div className={styles.productList}>
          {products.map(product => {
            const productOffers = offersOf(product.id)
            return (
              <div
                key={product.id}
                className={styles.productCard}
              >
                <img
                  src={product.image || ''}
                  alt={product.name}
                  className={styles.productThumb}
                />
                <div className={styles.productInfo}>
                  <strong className={styles.productName}>{product.name}</strong>
                  <span className={styles.productMeta}>
                    {formatCLP(product.price)} · Stock: {product.stock} ·{' '}
                    {product.categoryName || 'Sin categoría'}
                  </span>
                  {product.model && <span className={styles.tag}>Tiene modelo 3D</span>}
                  {product.discountActive && (
                    <span className={styles.tagOffer}>
                      Oferta activa: {formatCLP(product.discountedPrice)}
                    </span>
                  )}

                  {/* Ofertas del producto */}
                  {productOffers.length > 0 && (
                    <div className={styles.offersBox}>
                      {productOffers.map(o => (
                        <div
                          key={o.id}
                          className={styles.offerRow}
                        >
                          <span>
                            {o.discount_type === 'PERCENTAGE'
                              ? `${o.discount_value}%`
                              : formatCLP(o.discount_value)}{' '}
                            · {new Date(o.start_date).toLocaleDateString()} →{' '}
                            {new Date(o.end_date).toLocaleDateString()}
                          </span>
                          <button
                            className={styles.linkDanger}
                            onClick={() => handleDeleteOffer(o.id)}
                          >
                            quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.productActions}>
                  <button
                    className={styles.btnGhost}
                    onClick={() => openEdit(product)}
                  >
                    Editar
                  </button>
                  <button
                    className={styles.btnGhost}
                    onClick={() => setOfferForm({ productId: product.id })}
                  >
                    + Oferta
                  </button>
                  <button
                    className={styles.btnDanger}
                    onClick={() => handleDelete(product)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL: formulario de producto */}
      {showForm && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowForm(false)}
        >
          <form
            className={styles.modal}
            onClick={e => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <h3 className={styles.modalTitle}>
              {editingId ? 'Editar producto' : 'Nuevo producto'}
            </h3>

            <label className={styles.label}>
              Nombre
              <input
                className={styles.input}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            <label className={styles.label}>
              Descripción
              <textarea
                className={styles.textarea}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </label>

            <div className={styles.row}>
              <label className={styles.label}>
                Precio (CLP)
                <input
                  type='number'
                  className={styles.input}
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  min='1'
                  required
                />
              </label>
              <label className={styles.label}>
                Stock
                <input
                  type='number'
                  className={styles.input}
                  value={form.stock}
                  onChange={e => setForm({ ...form, stock: e.target.value })}
                  min='0'
                  required
                />
              </label>
            </div>

            <label className={styles.label}>
              Categoría
              <select
                className={styles.input}
                value={form.categoryId}
                onChange={e => setForm({ ...form, categoryId: e.target.value })}
                required
              >
                <option value=''>Seleccionar…</option>
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

            <label className={styles.label}>
              Modelo 3D (opcional)
              <select
                className={styles.input}
                value={form.modelId}
                onChange={e => setForm({ ...form, modelId: e.target.value })}
              >
                <option value=''>Sin modelo</option>
                {models.map(m => (
                  <option
                    key={m.id}
                    value={m.id}
                  >
                    {m.name}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.label}>
              Imágenes (galería)
              {images.length === 0 ? (
                <p className={styles.muted}>
                  No hay imágenes subidas. Ve a la pestaña Archivos para subir.
                </p>
              ) : (
                <div className={styles.imagePicker}>
                  {images.map(img => {
                    const selected = form.imageIds.includes(img.id)
                    return (
                      <button
                        type='button'
                        key={img.id}
                        className={`${styles.pickItem} ${selected ? styles.pickSelected : ''}`}
                        onClick={() => toggleImage(img.id)}
                        title={img.name}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                        />
                        {selected && <span className={styles.check}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                type='button'
                className={styles.btnGhost}
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
              <button
                type='submit'
                className={styles.btnPrimary}
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: nueva oferta */}
      {offerForm && (
        <div
          className={styles.modalOverlay}
          onClick={() => setOfferForm(null)}
        >
          <form
            className={styles.modal}
            onClick={e => e.stopPropagation()}
            onSubmit={handleCreateOffer}
          >
            <h3 className={styles.modalTitle}>Nueva oferta</h3>

            <label className={styles.label}>
              Tipo de descuento
              <select
                className={styles.input}
                value={offerData.discountType}
                onChange={e => setOfferData({ ...offerData, discountType: e.target.value })}
              >
                <option value='PERCENTAGE'>Porcentaje (%)</option>
                <option value='FIXED'>Monto fijo (CLP)</option>
              </select>
            </label>

            <label className={styles.label}>
              {offerData.discountType === 'PERCENTAGE' ? 'Porcentaje (1-100)' : 'Monto (CLP)'}
              <input
                type='number'
                className={styles.input}
                value={offerData.discountValue}
                onChange={e => setOfferData({ ...offerData, discountValue: e.target.value })}
                min='1'
                required
              />
            </label>

            <div className={styles.row}>
              <label className={styles.label}>
                Inicio
                <input
                  type='date'
                  className={styles.input}
                  value={offerData.startDate}
                  onChange={e => setOfferData({ ...offerData, startDate: e.target.value })}
                  required
                />
              </label>
              <label className={styles.label}>
                Fin
                <input
                  type='date'
                  className={styles.input}
                  value={offerData.endDate}
                  onChange={e => setOfferData({ ...offerData, endDate: e.target.value })}
                  required
                />
              </label>
            </div>

            <div className={styles.modalActions}>
              <button
                type='button'
                className={styles.btnGhost}
                onClick={() => setOfferForm(null)}
              >
                Cancelar
              </button>
              <button
                type='submit'
                className={styles.btnPrimary}
              >
                Crear oferta
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
