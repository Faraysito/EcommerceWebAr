import { useMemo, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CategoryTabs from '../components/CategoryTabs'
import ProductSection from '../components/ProductSection'
import { ProductGridSkeleton } from '../components/ProductSkeleton'

import { useCategories } from '../hooks/useCategories'
import { useProducts } from '../hooks/useProducts'

import styles from './Catalog.module.css'

const Catalog = () => {
  const { categories, activeCategory, setActiveCategory } = useCategories()
  const { products, loading } = useProducts()
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()
  const isSearching = query.length > 0

  // Sin búsqueda: filtra por la categoría activa (como antes).
  // Con búsqueda: ignora la categoría y busca por nombre en todo el catálogo.
  const filtered = useMemo(() => {
    if (isSearching) {
      return products.filter(p => p.name.toLowerCase().includes(query))
    }
    return products.filter(p => p.categoryId === activeCategory)
  }, [isSearching, query, activeCategory, products])

  const activeLabel = isSearching
    ? `Resultados para “${search.trim()}”`
    : categories.find(c => c.id === activeCategory)?.name

  return (
    <div className={styles.shell}>
      <Header
        search={search}
        onSearch={setSearch}
      />

      <main className={styles.main}>
        {!isSearching && (
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />
        )}

        <div className={styles.columns}>
          <aside
            className={styles.adColumn}
            aria-label='Publicidad izquierda'
          >
            <div className={styles.adCard}>
              <h3>Publicidad</h3>
              <p>Espacio disponible para marcas asociadas.</p>
            </div>
          </aside>

          <div className={styles.mainColumn}>
            {loading ? (
              <ProductGridSkeleton count={6} />
            ) : (
              <ProductSection
                title={activeLabel}
                products={filtered}
              />
            )}
          </div>

          <aside
            className={styles.adColumn}
            aria-label='Publicidad derecha'
          >
            <div className={styles.adCard}>
              <h3>Publicidad</h3>
              <p>Promociones, lanzamientos o convenios.</p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export { Catalog }
