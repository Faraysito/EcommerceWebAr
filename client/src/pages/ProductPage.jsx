import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import ArModalScaled from '../components/ArModalScaled'
import ProductReviews from '../components/ProductReviews'
import FavoriteButton from '../components/FavoriteButton'
import ShareButton from '../components/ShareButton'
import { ProductGridSkeleton } from '../components/ProductSkeleton'
import { useCart } from '../context/CartContext'
import { getProductById, getSimilarProducts } from '../services/products/getProduct'
import { getProductReviews } from '../services/reviews/reviewService'
import StarRating from '../components/StarRating'
import { formatCLP } from '../utils/formatCLP'
import styles from './ProductPage.module.css'

// Ficha de producto dedicada: galería de imágenes, precio, stock, vendedor,
// botones de carrito/AR/favorito/compartir, reseñas y productos similares.
export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [similar, setSimilar] = useState([])
  const [summary, setSummary] = useState({ average: 0, count: 0 })
  const [activeImg, setActiveImg] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [arOpen, setArOpen] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setActiveImg(0)
    ;(async () => {
      try {
        const p = await getProductById(id)
        if (!active) return
        setProduct(p)
        // Cargas secundarias en paralelo, sin bloquear la ficha.
        getSimilarProducts(id, 8)
          .then(s => active && setSimilar(s))
          .catch(() => {})
        getProductReviews(id)
          .then(r => active && setSummary(r.summary))
          .catch(() => {})
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className={styles.shell}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <ProductGridSkeleton count={3} />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className={styles.shell}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.notFound}>
              <h1>Producto no encontrado</h1>
              <p>Puede que el enlace esté mal o que el producto ya no exista.</p>
              <button
                className={styles.primaryBtn}
                onClick={() => navigate('/')}
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const hasDiscount = Boolean(product.discountActive)
  const outOfStock = product.stock <= 0
  const images = product.images?.length
    ? product.images
    : product.image
      ? [{ id: 'main', url: product.image }]
      : []
  const current = images[activeImg]?.url ?? null

  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.layout}>
            {/* Galería */}
            <div className={styles.gallery}>
              <div className={styles.mainImageWrap}>
                {hasDiscount && (
                  <span className={styles.discountBadge}>-{product.discountPercent}%</span>
                )}
                {current ? (
                  <img
                    className={styles.mainImage}
                    src={current}
                    alt={product.name}
                  />
                ) : (
                  <div className={styles.noImage}>Sin imagen</div>
                )}
              </div>
              {images.length > 1 && (
                <div className={styles.thumbs}>
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`}
                      onClick={() => setActiveImg(i)}
                    >
                      <img
                        src={img.url}
                        alt={`${product.name} ${i + 1}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className={styles.info}>
              <h1 className={styles.name}>{product.name}</h1>

              {product.storeName && product.storeSlug && (
                <a
                  className={styles.seller}
                  href={`/tienda/${product.storeSlug}`}
                >
                  Vendido por {product.storeName}
                </a>
              )}

              <div className={styles.ratingRow}>
                <StarRating
                  value={summary.average}
                  count={summary.count}
                />
              </div>

              <div className={styles.priceRow}>
                <strong className={styles.price}>
                  {formatCLP(hasDiscount ? product.discountedPrice : product.price)}
                </strong>
                {hasDiscount && <span className={styles.oldPrice}>{formatCLP(product.price)}</span>}
              </div>

              <div className={styles.stock}>
                {outOfStock ? 'Sin stock' : `${product.stock} disponibles`}
              </div>

              {(product.heightCm || product.widthCm || product.depthCm) && (
                <ul className={styles.specs}>
                  {product.heightCm && (
                    <li>Alto: {Number(product.heightCm).toLocaleString('es-CL')} cm</li>
                  )}
                  {product.widthCm && (
                    <li>Ancho: {Number(product.widthCm).toLocaleString('es-CL')} cm</li>
                  )}
                  {product.depthCm && (
                    <li>Profundidad: {Number(product.depthCm).toLocaleString('es-CL')} cm</li>
                  )}
                  {product.weightG && (
                    <li>Peso: {Number(product.weightG).toLocaleString('es-CL')} g</li>
                  )}
                </ul>
              )}

              {product.description && <p className={styles.description}>{product.description}</p>}

              <div className={styles.actions}>
                <button
                  className={styles.addBtn}
                  onClick={() => addToCart(product)}
                  disabled={outOfStock}
                >
                  {outOfStock ? 'Agotado' : 'Agregar al carrito'}
                </button>
                {product.model && (
                  <button
                    className={styles.arBtn}
                    onClick={() => setArOpen(true)}
                  >
                    Ver en mi espacio (AR)
                  </button>
                )}
              </div>

              <div className={styles.secondaryActions}>
                <FavoriteButton productId={product.id} />
                <ShareButton
                  productId={product.id}
                  productName={product.name}
                />
              </div>
            </div>
          </div>

          {/* Reseñas */}
          <ProductReviews productId={product.id} />

          {/* Similares */}
          {similar.length > 0 && (
            <section className={styles.similar}>
              <h2 className={styles.similarTitle}>Productos similares</h2>
              <div className={styles.similarGrid}>
                {similar.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />

      {product.model && (
        <ArModalScaled
          isOpen={arOpen}
          close={() => setArOpen(false)}
          product={product}
        />
      )}
    </div>
  )
}
