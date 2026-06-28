import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CategoryTabs from '../components/CategoryTabs'
import ProductSection from '../components/ProductSection'
import CatalogFilters from '../components/CatalogFilters'
import Pagination from '../components/Pagination'
import { ProductGridSkeleton } from '../components/ProductSkeleton'

import { useCategories } from '../hooks/useCategories'
import { useProducts } from '../hooks/useProducts'
import { useProductFilters } from '../hooks/useProductFilters'

import styles from './Catalog.module.css'

const Catalog = () => {
  const { categories, activeCategory, setActiveCategory } = useCategories()
  const { products, loading } = useProducts()
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Lee ?cat= y ?q= de la URL (los setea el Header).
  useEffect(() => {
    const cat = params.get('cat')
    const q = params.get('q')
    if (cat) setActiveCategory(cat)
    if (q) setSearch(q)
  }, [params, setActiveCategory])

  const query = search.trim().toLowerCase()
  const isSearching = query.length > 0

  // Filtros avanzados sobre la lista completa.
  const filters = useProductFilters(products, { pageSize: 15 })

  // Lista base: si busca, filtra por nombre en todo; si no, por categoría.
  const baseList = useMemo(() => {
    if (isSearching) return products.filter(p => p.name.toLowerCase().includes(query))
    return products.filter(p => p.categoryId === activeCategory)
  }, [isSearching, query, activeCategory, products])

  // Cuando hay filtros activos los aplicamos sobre baseList vía el hook,
  // pero para mantenerlo simple, el hook ya filtra todo; usamos su resultado
  // si el panel de filtros está abierto, si no la baseList por categoría.
  const visible = showFilters ? filters.pageItems : baseList

  const activeLabel = isSearching
    ? `Resultados para “${search.trim()}”`
    : categories.find(c => c.id === activeCategory)?.name || 'Catálogo'

  return (
    <div className={styles.shell}>
      <Header
        search={search}
        onSearch={setSearch}
      />

      <main className={styles.main}>
        {/* Hero estilo HubLab */}
        {!isSearching && (
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <span className={styles.heroBadge}>Marketplace con Realidad Aumentada</span>
              <h1 className={styles.heroTitle}>
                Míralo en tu espacio <span className={styles.heroAccent}>antes de comprar</span>
              </h1>
              <p className={styles.heroText}>
                Miles de productos de vendedores reales, muchos con modelo 3D para ver en AR.
                Encuentra, compara y compra con confianza.
              </p>
              <div className={styles.heroActions}>
                <a
                  className={styles.heroBtn}
                  href='#catalogo'
                >
                  Explorar productos
                </a>
                <a
                  className={styles.heroBtnGhost}
                  href='/vender'
                >
                  Quiero vender
                </a>
              </div>
            </div>
            <div
              className={styles.heroGlow}
              aria-hidden='true'
            />
          </section>
        )}

        {!isSearching && (
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />
        )}

        <div className={styles.toolbar}>
          <h2
            className={styles.toolbarTitle}
            id='catalogo'
          >
            {activeLabel}
          </h2>
          <button
            className={styles.filterToggle}
            onClick={() => setShowFilters(v => !v)}
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
            >
              <line
                x1='4'
                y1='21'
                x2='4'
                y2='14'
              />
              <line
                x1='4'
                y1='10'
                x2='4'
                y2='3'
              />
              <line
                x1='12'
                y1='21'
                x2='12'
                y2='12'
              />
              <line
                x1='12'
                y1='8'
                x2='12'
                y2='3'
              />
              <line
                x1='20'
                y1='21'
                x2='20'
                y2='16'
              />
              <line
                x1='20'
                y1='12'
                x2='20'
                y2='3'
              />
              <line
                x1='1'
                y1='14'
                x2='7'
                y2='14'
              />
              <line
                x1='9'
                y1='8'
                x2='15'
                y2='8'
              />
              <line
                x1='17'
                y1='16'
                x2='23'
                y2='16'
              />
            </svg>
            {showFilters ? 'Ocultar filtros' : 'Filtros'}
          </button>
        </div>

        {showFilters && (
          <CatalogFilters
            filters={filters}
            categories={categories}
          />
        )}

        {loading ? (
          <ProductGridSkeleton count={10} />
        ) : (
          <>
            <ProductSection
              title=''
              products={visible}
            />
            {showFilters && (
              <Pagination
                page={filters.page}
                totalPages={filters.totalPages}
                onChange={filters.setPage}
              />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

export { Catalog }
