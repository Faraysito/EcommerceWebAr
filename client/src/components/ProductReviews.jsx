import { useEffect, useState } from 'react'
import StarRating from './StarRating'
import CustomerAuthModal from './CustomerAuthModal'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { getProductReviews, upsertReview, deleteMyReview } from '../services/reviews/reviewService'
import styles from './ProductReviews.module.css'

// Bloque de reseñas de un producto: resumen (promedio + total), formulario para
// dejar/editar la tuya (requiere sesión) y listado. El backend permite una
// reseña por persona; si ya reseñaste, el form precarga y actualiza la tuya.
export default function ProductReviews({ productId }) {
  const { customer, isAuthenticated } = useCustomerAuth()

  const [summary, setSummary] = useState({ average: 0, count: 0 })
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getProductReviews(productId)
      setSummary(data.summary)
      setReviews(data.reviews)
      // Si ya reseñé, precarga mi reseña en el form.
      const mine = data.reviews.find(r => r.customerId && r.customerId === customer?.id)
      if (mine) {
        setRating(mine.rating)
        setComment(mine.comment || '')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, customer?.id])

  const submit = async e => {
    e.preventDefault()
    if (!isAuthenticated) {
      setAuthOpen(true)
      return
    }
    if (rating < 1) {
      setError('Elige al menos una estrella.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await upsertReview(productId, { rating, comment: comment.trim() || undefined })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const removeMine = async reviewId => {
    if (!window.confirm('¿Eliminar tu reseña?')) return
    try {
      await deleteMyReview(reviewId)
      setRating(0)
      setComment('')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>Reseñas</h2>
        <div className={styles.summary}>
          <StarRating
            value={summary.average}
            count={summary.count}
          />
        </div>
      </div>

      <form
        className={styles.form}
        onSubmit={submit}
      >
        <span className={styles.formLabel}>Tu calificación</span>
        <StarRating
          value={rating}
          onChange={setRating}
          size={26}
        />
        <textarea
          className={styles.textarea}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder='Cuenta tu experiencia con el producto (opcional)'
          rows={3}
          disabled={saving}
        />
        {error && <div className={styles.error}>{error}</div>}
        <button
          className={styles.submit}
          type='submit'
          disabled={saving}
        >
          {saving
            ? 'Guardando…'
            : isAuthenticated
              ? 'Publicar reseña'
              : 'Inicia sesión para opinar'}
        </button>
      </form>

      {loading ? (
        <p className={styles.muted}>Cargando reseñas…</p>
      ) : reviews.length === 0 ? (
        <p className={styles.muted}>Todavía no hay reseñas. Sé el primero en opinar.</p>
      ) : (
        <ul className={styles.list}>
          {reviews.map(r => (
            <li
              key={r.id}
              className={styles.item}
            >
              <div className={styles.itemHead}>
                <span className={styles.author}>{r.author}</span>
                <StarRating value={r.rating} />
              </div>
              {r.comment && <p className={styles.comment}>{r.comment}</p>}
              {r.customerId && r.customerId === customer?.id && (
                <button
                  className={styles.delete}
                  onClick={() => removeMine(r.id)}
                >
                  Eliminar mi reseña
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <CustomerAuthModal
        isOpen={authOpen}
        close={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false)
          load()
        }}
      />
    </section>
  )
}
