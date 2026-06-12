import { useState } from 'react'
import styles from './ProductCard.module.css'
import { ArModal } from './ArModal'
import { DescriptionModal } from './DescriptionModal'
import { useCart } from '../context/CartContext'
import { formatCLP } from '../utils/formatCLP'

function ProductCard({ product }) {
  const [isArOpen, setIsArOpen] = useState(false)
  const [isDescOpen, setIsDescOpen] = useState(false)
  const { addToCart } = useCart()

  // El backend ya manda calculado el descuento. El front solo lee.
  const hasDiscount = Boolean(product.discountActive)
  const oldPrice = formatCLP(product.price)
  const newPrice = hasDiscount ? formatCLP(product.discountedPrice) : oldPrice
  const outOfStock = product.stock <= 0

  return (
    <>
      <article className={styles.card}>
        <div className={styles.thumbWrap}>
          {hasDiscount && <span className={styles.discountBadge}>-{product.discountPercent}%</span>}
          {outOfStock && <span className={styles.soldOut}>Agotado</span>}
          <img
            className={styles.thumb}
            src={product.image}
            alt={product.name}
            loading='lazy'
          />
        </div>

        <div className={styles.content}>
          <h3 className={styles.name}>{product.name}</h3>

          <div className={styles.priceRow}>
            <strong className={styles.price}>{newPrice}</strong>
            {hasDiscount && <span className={styles.oldPrice}>{oldPrice}</span>}
          </div>

          <div className={styles.stockLine}>
            {outOfStock ? 'Sin stock' : `${product.stock} disponibles`}
          </div>

          <div className={styles.actions}>
            <button
              type='button'
              className={styles.btnCart}
              onClick={() => addToCart(product)}
              disabled={outOfStock}
              title={outOfStock ? 'Sin stock' : 'Agregar al carrito'}
            >
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <circle
                  cx='9'
                  cy='21'
                  r='1'
                />
                <circle
                  cx='20'
                  cy='21'
                  r='1'
                />
                <path d='M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' />
              </svg>
              {outOfStock ? 'Agotado' : 'Agregar'}
            </button>
          </div>

          <div className={styles.actions}>
            <button
              type='button'
              className={styles.btnDesc}
              onClick={() => setIsDescOpen(true)}
              title='Ver detalles'
            >
              Detalles
            </button>

            {product.model && (
              <button
                type='button'
                className={styles.btnAr}
                onClick={() => setIsArOpen(true)}
                title='Ver en tu espacio (AR)'
                aria-label={`Ver ${product.name} en AR`}
              >
                <svg
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2' />
                  <path d='M12 8l4 2v4l-4 2-4-2v-4l4-2z' />
                </svg>
                Ver AR
              </button>
            )}
          </div>
        </div>
      </article>

      <ArModal
        isOpen={isArOpen}
        close={() => setIsArOpen(false)}
        product={product}
      />
      <DescriptionModal
        isOpen={isDescOpen}
        close={() => setIsDescOpen(false)}
        product={product}
      />
    </>
  )
}

export default ProductCard
