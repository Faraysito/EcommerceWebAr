import { useState } from 'react'
import { Modal } from './Modal'
import { useCart } from '../context/CartContext'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { checkout as checkoutRequest } from '../services/customer/saleService'
import { formatCLP } from '../utils/formatCLP'
import CustomerAuthModal from './CustomerAuthModal'
import styles from './CartModal.module.css'

export default function CartModal() {
  const { items, isOpen, closeCart, setQuantity, removeFromCart, clearCart, total, count } =
    useCart()
  const { isAuthenticated } = useCustomerAuth()

  const [authOpen, setAuthOpen] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState(null) // venta creada

  const linePrice = item => (item.discountActive ? item.discountedPrice : item.price)

  const redirectToPayment = ({ url, token }) => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = url

    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'token_ws'
    input.value = token

    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
  }

  const doCheckout = async () => {
    setPlacing(true)
    setError('')
    try {
      const payload = items.map(p => ({ productId: p.id, quantity: p.quantity }))
      const sale = await checkoutRequest(payload)

      redirectToPayment(sale)

      setConfirmation(sale)
      clearCart()
    } catch (err) {
      setError(err.message)
    } finally {
      setPlacing(false)
    }
  }

  const handleCheckout = () => {
    setError('')
    if (!isAuthenticated) {
      // Pide login/registro primero; al volver, el usuario reintenta.
      setAuthOpen(true)
      return
    }
    doCheckout()
  }

  const handleClose = () => {
    setError('')
    setConfirmation(null)
    closeCart()
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        close={handleClose}
        title='Tu carrito'
        fitContent
      >
        {confirmation ? (
          <div className={styles.success}>
            <div className={styles.checkIcon}>✓</div>
            <h3 className={styles.successTitle}>¡Pedido realizado!</h3>
            <p className={styles.successText}>
              Tu pedido por <strong>{formatCLP(confirmation.total)}</strong> quedó registrado con
              estado <strong>{confirmation.status}</strong>. Nos pondremos en contacto contigo.
            </p>
            <button
              className={styles.primaryBtn}
              onClick={handleClose}
            >
              Seguir comprando
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <p>Tu carrito está vacío.</p>
            <button
              className={styles.ghostBtn}
              onClick={handleClose}
            >
              Ver figuras
            </button>
          </div>
        ) : (
          <div className={styles.body}>
            <ul className={styles.list}>
              {items.map(item => (
                <li
                  key={item.id}
                  className={styles.item}
                >
                  <div className={styles.thumbWrap}>
                    {item.image ? (
                      <img
                        className={styles.thumb}
                        src={item.image}
                        alt={item.name}
                      />
                    ) : (
                      <div className={styles.thumbPlaceholder} />
                    )}
                  </div>

                  <div className={styles.info}>
                    <span className={styles.name}>{item.name}</span>
                    <span className={styles.unit}>
                      {formatCLP(linePrice(item))} c/u
                      {item.discountActive && (
                        <span className={styles.old}>{formatCLP(item.price)}</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.qtyBox}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                      aria-label='Quitar uno'
                    >
                      −
                    </button>
                    <span className={styles.qty}>{item.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      aria-label='Agregar uno'
                    >
                      +
                    </button>
                  </div>

                  <div className={styles.lineTotal}>
                    {formatCLP(linePrice(item) * item.quantity)}
                  </div>

                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromCart(item.id)}
                    aria-label='Eliminar del carrito'
                    title='Eliminar'
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span>
                  Total ({count} {count === 1 ? 'ítem' : 'ítems'})
                </span>
                <strong className={styles.totalValue}>{formatCLP(total)}</strong>
              </div>
              <button
                className={styles.primaryBtn}
                onClick={handleCheckout}
                disabled={placing}
              >
                {placing
                  ? 'Procesando…'
                  : isAuthenticated
                    ? 'Confirmar pedido'
                    : 'Iniciar sesión y comprar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <CustomerAuthModal
        isOpen={authOpen}
        close={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false)
          // Tras loguearse, ejecuta la compra automáticamente.
          doCheckout()
        }}
      />
    </>
  )
}
