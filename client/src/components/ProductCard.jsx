import { useState } from 'react'
import { Link } from 'react-router'
import styles from './ProductCard.module.css'
import { ArModal } from './ArModal'
import { useCart } from '../context/CartContext'
import { formatCLP } from '../utils/formatCLP'
import FavoriteButton from './FavoriteButton'

// Card de producto estilo marketplace (AliExpress) con tema HubLab:
// imagen cuadrada con badges, rating + vendidos, precio destacado y acciones.
// La imagen y el nombre llevan a la ficha /producto/:id.
function ProductCard({ product }) {
  const [isArOpen, setIsArOpen] = useState(false)
  const { addToCart } = useCart()

  const hasDiscount = Boolean(product.discountActive)
  const oldPrice = formatCLP(product.price)
  const newPrice = hasDiscount ? formatCLP(product.discountedPrice) : oldPrice
  const outOfStock = product.stock <= 0

  // Datos opcionales (si el backend los manda). Si no, no se muestran.
  const rating = product.ratingAverage ?? product.rating ?? null
  const ratingCount = product.ratingCount ?? null
  const sold = product.soldCount ?? null

  return (
    <>
      <article className={styles.card}>
        <Link
          to={`/producto/${product.id}`}
          className={styles.thumbLink}
        >
          <div className={styles.thumbWrap}>
            {hasDiscount && (
              <span className={styles.discountBadge}>-{product.discountPercent}%</span>
            )}
            {product.model && (
              <span
                className={styles.arBadge}
                title='Disponible en Realidad Aumentada'
              >
                <svg
                  width='13'
                  height='13'
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
                AR
              </span>
            )}
            {outOfStock && <span className={styles.soldOut}>Agotado</span>}
            {product.image ? (
              <img
                className={styles.thumb}
                src={product.image}
                alt={product.name}
                loading='lazy'
              />
            ) : (
              <div
                className={styles.thumbPlaceholder}
                aria-label='Sin imagen'
              >
                <svg
                  width='40'
                  height='40'
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
          </div>
        </Link>

        {/* Corazón flotante */}
        <div className={styles.favFloat}>
          <FavoriteButton
            productId={product.id}
            size={18}
          />
        </div>

        <div className={styles.content}>
          <Link
            to={`/producto/${product.id}`}
            className={styles.nameLink}
          >
            <h3 className={styles.name}>{product.name}</h3>
          </Link>

          <div className={styles.priceRow}>
            <strong className={styles.price}>{newPrice}</strong>
            {hasDiscount && <span className={styles.oldPrice}>{oldPrice}</span>}
          </div>

          {/* Rating + vendidos, estilo marketplace */}
          {(rating != null || sold != null) && (
            <div className={styles.meta}>
              {rating != null && (
                <span className={styles.rating}>
                  <svg
                    width='13'
                    height='13'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                  >
                    <path d='M12 17.3l-6.18 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73 1.64 7.03z' />
                  </svg>
                  {Number(rating).toFixed(1)}
                  {ratingCount != null && (
                    <span className={styles.ratingCount}>({ratingCount})</span>
                  )}
                </span>
              )}
              {sold != null && <span className={styles.sold}>{sold} vendidos</span>}
            </div>
          )}

          {product.storeName && product.storeSlug && (
            <Link
              className={styles.seller}
              to={`/tienda/${product.storeSlug}`}
              title={`Ver tienda ${product.storeName}`}
            >
              {product.storeName}
            </Link>
          )}

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
    </>
  )
}

export default ProductCard
