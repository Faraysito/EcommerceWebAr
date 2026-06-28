import ProductCard from './ProductCard'
import styles from './ProductSection.module.css'

// Grilla de productos. Si recibe title vacío, no muestra encabezado.
// key={title || 'grid'} fuerza el fade al cambiar de categoría.
function ProductSection({ title, products }) {
  return (
    <section
      className={styles.section}
      id='catalogo'
    >
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {products.length === 0 ? (
        <p className={styles.empty}>No hay productos en esta categoría todavía.</p>
      ) : (
        <div
          key={title || 'grid'}
          className={`${styles.grid} ${styles.fadeIn}`}
        >
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default ProductSection
