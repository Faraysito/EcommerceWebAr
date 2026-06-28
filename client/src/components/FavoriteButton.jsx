import { useState } from 'react'
import { useWishlist } from '../context/WishlistContext'
import CustomerAuthModal from './CustomerAuthModal'
import styles from './FavoriteButton.module.css'

// Botón de corazón para guardar/quitar de favoritos. Si no hay sesión, abre el
// modal de login. Usable en cards y en la ficha de producto.
export default function FavoriteButton({ productId, size = 20, className = '' }) {
  const { isFavorite, toggleFavorite } = useWishlist()
  const [authOpen, setAuthOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const fav = isFavorite(productId)

  const handle = async e => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      await toggleFavorite(productId)
    } catch {
      // Sin sesión: pedir login.
      setAuthOpen(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type='button'
        className={`${styles.btn} ${fav ? styles.active : ''} ${className}`}
        onClick={handle}
        aria-pressed={fav}
        aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        title={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill={fav ? 'currentColor' : 'none'}
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' />
        </svg>
      </button>

      <CustomerAuthModal
        isOpen={authOpen}
        close={() => setAuthOpen(false)}
        onSuccess={async () => {
          setAuthOpen(false)
          // Tras loguearse, completa la acción.
          try {
            await toggleFavorite(productId)
          } catch {
            /* noop */
          }
        }}
      />
    </>
  )
}
