import styles from './DescriptionModal.module.css'
import { Modal } from './Modal'

// Reemplaza el IngredientsModal de la base. Muestra la descripcion completa
// de la figura + disponibilidad (stock).
export const DescriptionModal = ({ isOpen, close, product }) => {
  const inStock = product.stock > 0

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      title={product.name}
      fitContent
    >
      <div className={styles.wrapper}>
        {product.image ? (
          <img
            className={styles.thumb}
            src={product.image}
            alt={product.name}
          />
        ) : (
          <div
            className={styles.thumbEmpty}
            aria-label='Sin imagen'
          >
            <svg
              width='48'
              height='48'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <rect
                x='3'
                y='3'
                width='18'
                height='18'
                rx='2'
                ry='2'
              />
              <circle
                cx='8.5'
                cy='8.5'
                r='1.5'
              />
              <path d='M21 15l-5-5L5 21' />
            </svg>
          </div>
        )}

        <p className={styles.description}>{product.description}</p>

        <div className={styles.meta}>
          <span className={`${styles.stockBadge} ${inStock ? styles.inStock : styles.outStock}`}>
            {inStock ? `${product.stock} disponibles` : 'Agotado'}
          </span>
        </div>
      </div>
    </Modal>
  )
}
