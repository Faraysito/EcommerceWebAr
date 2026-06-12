import styles from './ProductSkeleton.module.css'

export function ProductSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.thumb} />
      <div className={styles.body}>
        <div className={styles.line} />
        <div className={`${styles.line} ${styles.short}`} />
        <div className={styles.priceLine} />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  )
}
