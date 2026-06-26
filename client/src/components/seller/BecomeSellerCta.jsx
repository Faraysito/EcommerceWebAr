import { useState } from 'react'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import styles from './SellerForms.module.css'

// Pantalla que ve una cuenta que aún NO vende. Explica el modelo y abre la
// tienda al instante (auto-aprobado) con un formulario mínimo.
export default function BecomeSellerCta() {
  const { becomeSeller } = useCustomerAuth()
  const [storeName, setStoreName] = useState('')
  const [storeBio, setStoreBio] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    if (storeName.trim().length < 2) {
      setError('El nombre de la tienda debe tener al menos 2 caracteres.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await becomeSeller({ storeName: storeName.trim(), storeBio: storeBio.trim() || undefined })
      // El contexto refresca isSeller; el dashboard se re-renderiza solo.
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.ctaWrap}>
      <div className={styles.ctaCard}>
        <span className={styles.badge}>Vende en el marketplace</span>
        <h2 className={styles.ctaTitle}>Abre tu tienda y empieza a vender hoy</h2>
        <p className={styles.ctaText}>
          Publica tus productos, recibe pedidos y gestiona tus ventas desde un solo lugar. Sin
          esperas: tu tienda queda activa al instante.
        </p>

        <ul className={styles.perks}>
          <li>Publica productos ilimitados con fotos y modelos 3D para ver en AR.</li>
          <li>Recibe pagos por Webpay y revisa tus ganancias en tiempo real.</li>
          <li>Tú defines precios y stock; nosotros llevamos el resto.</li>
        </ul>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <label className={styles.field}>
            <span className={styles.label}>Nombre de tu tienda</span>
            <input
              className={styles.input}
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              placeholder='Ej: Coleccionables Pérez'
              disabled={submitting}
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Descripción (opcional)</span>
            <textarea
              className={styles.textarea}
              value={storeBio}
              onChange={e => setStoreBio(e.target.value)}
              placeholder='Cuenta de qué trata tu tienda'
              rows={3}
              disabled={submitting}
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={styles.primaryBtn}
            type='submit'
            disabled={submitting}
          >
            {submitting ? 'Abriendo tu tienda…' : 'Abrir mi tienda'}
          </button>
        </form>
      </div>
    </div>
  )
}
