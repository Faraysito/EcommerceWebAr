import styles from './CatalogFilters.module.css'

// Barra de filtros y orden del catálogo. Recibe el objeto que devuelve
// useProductFilters y la lista de categorías. Sin estado propio: todo vive en
// el hook.
export default function CatalogFilters({ filters, categories = [] }) {
  return (
    <div className={styles.bar}>
      <div className={styles.group}>
        <label className={styles.label}>Categoría</label>
        <select
          className={styles.select}
          value={filters.categoryId}
          onChange={e => filters.setCategoryId(e.target.value)}
        >
          <option value=''>Todas</option>
          {categories.map(c => (
            <option
              key={c.id}
              value={c.id}
            >
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Precio</label>
        <div className={styles.priceRange}>
          <input
            className={styles.priceInput}
            type='number'
            min='0'
            placeholder='Mín'
            value={filters.minPrice}
            onChange={e => filters.setMinPrice(e.target.value)}
          />
          <span className={styles.dash}>–</span>
          <input
            className={styles.priceInput}
            type='number'
            min='0'
            placeholder='Máx'
            value={filters.maxPrice}
            onChange={e => filters.setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Ordenar por</label>
        <select
          className={styles.select}
          value={filters.sort}
          onChange={e => filters.setSort(e.target.value)}
        >
          {filters.sortOptions.map(o => (
            <option
              key={o.id}
              value={o.id}
            >
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.checks}>
        <label className={styles.check}>
          <input
            type='checkbox'
            checked={filters.onlyAR}
            onChange={e => filters.setOnlyAR(e.target.checked)}
          />
          Con AR
        </label>
        <label className={styles.check}>
          <input
            type='checkbox'
            checked={filters.onlyOffers}
            onChange={e => filters.setOnlyOffers(e.target.checked)}
          />
          En oferta
        </label>
        <label className={styles.check}>
          <input
            type='checkbox'
            checked={filters.onlyInStock}
            onChange={e => filters.setOnlyInStock(e.target.checked)}
          />
          Con stock
        </label>
      </div>

      <button
        className={styles.reset}
        onClick={filters.resetFilters}
      >
        Limpiar
      </button>
    </div>
  )
}
