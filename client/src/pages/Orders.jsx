import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { getMyOrders } from '../services/customer/saleService'
import { formatCLP } from '../utils/formatCLP'
import styles from './Orders.module.css'

// Colores del badge según estado de la venta.
const STATUS_CLASS = {
  Cancelado: 'statusCancel',
  Pendiente: 'statusPending',
  'En progreso': 'statusProgress',
  Completado: 'statusDone'
}

export default function Orders() {
  const { customer, loading: authLoading, isAuthenticated } = useCustomerAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Espera a saber si hay sesión. Si no hay, manda al inicio.
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    getMyOrders()
      .then(data => setOrders(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [authLoading, isAuthenticated, navigate])

  const formatDate = iso => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return ''
    }
  }

  return (
    <div className={styles.shell}>
      <Header />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.head}>
            <h1 className={styles.title}>Mis pedidos</h1>
            {customer && (
              <p className={styles.subtitle}>
                {customer.name ? `Hola, ${customer.name}` : customer.email}
              </p>
            )}
          </div>

          {loading ? (
            <p className={styles.muted}>Cargando tus pedidos…</p>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : orders.length === 0 ? (
            <div className={styles.empty}>
              <p>Todavía no tienes pedidos.</p>
              <button
                className={styles.primaryBtn}
                onClick={() => navigate('/')}
              >
                Ver figuras
              </button>
            </div>
          ) : (
            <ul className={styles.orderList}>
              {orders.map(order => (
                <li
                  key={order.id}
                  className={styles.orderCard}
                >
                  <div className={styles.orderHead}>
                    <div>
                      <span className={styles.orderId}>Pedido #{order.id.slice(0, 8)}</span>
                      <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                    </div>
                    <span
                      className={`${styles.status} ${styles[STATUS_CLASS[order.status] ?? '']}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <ul className={styles.lines}>
                    {order.items.map((item, idx) => (
                      <li
                        key={idx}
                        className={styles.line}
                      >
                        <span className={styles.lineName}>
                          {item.quantity}× {item.name}
                        </span>
                        <span className={styles.lineSub}>{formatCLP(item.subTotal)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.orderFoot}>
                    <span>Total</span>
                    <strong className={styles.orderTotal}>{formatCLP(order.total)}</strong>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
