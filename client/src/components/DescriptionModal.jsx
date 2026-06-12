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
        <img
          className={styles.thumb}
          src={product.image}
          alt={product.name}
        />

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
