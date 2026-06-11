import ProductCard from "./ProductCard";
import styles from "./ProductSection.module.css";

// El grid de cards vive dentro de un container con borde (como Route 66).
// key={title} fuerza remount al cambiar categoria -> reinicia fadeIn.
function ProductSection({ title, products }) {
  return (
    <section className={styles.section} id="catalogo">
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        {products.length === 0 ? (
          <p className={styles.empty}>No hay figuras en esta categoría todavía.</p>
        ) : (
          <div key={title} className={`${styles.grid} ${styles.fadeIn}`}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductSection;
