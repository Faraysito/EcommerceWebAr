import { useMemo, useState } from 'react'

// Filtrado, orden y paginación del catálogo en el cliente. Opera sobre la
// lista ya cargada por useProducts (no hace fetch). Pensado para enchufarse en
// Catalog con poco cambio.
//
// Uso:
//   const { products } = useProducts()
//   const f = useProductFilters(products)
//   ...render f.pageItems, controles con f.setSort, f.setMinPrice, etc.

const SORTS = {
  relevance: { label: 'Relevancia', fn: null },
  priceAsc: { label: 'Precio: menor a mayor', fn: (a, b) => effPrice(a) - effPrice(b) },
  priceDesc: { label: 'Precio: mayor a menor', fn: (a, b) => effPrice(b) - effPrice(a) },
  nameAsc: { label: 'Nombre: A-Z', fn: (a, b) => a.name.localeCompare(b.name) },
  newest: {
    label: 'Más recientes',
    fn: (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
  }
}

// Precio efectivo (con descuento si aplica) para ordenar.
function effPrice(p) {
  return p.discountActive ? p.discountedPrice : p.price
}

export function useProductFilters(allProducts, { pageSize = 12 } = {}) {
  const [categoryId, setCategoryId] = useState('') // '' = todas
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [onlyAR, setOnlyAR] = useState(false)
  const [onlyOffers, setOnlyOffers] = useState(false)
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [sort, setSort] = useState('relevance')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const min = minPrice === '' ? null : Number(minPrice)
    const max = maxPrice === '' ? null : Number(maxPrice)

    let list = (allProducts ?? []).filter(p => {
      if (categoryId && p.categoryId !== categoryId) return false
      if (onlyAR && !p.model) return false
      if (onlyOffers && !p.discountActive) return false
      if (onlyInStock && p.stock <= 0) return false
      const price = effPrice(p)
      if (min != null && price < min) return false
      if (max != null && price > max) return false
      return true
    })

    const sorter = SORTS[sort]?.fn
    if (sorter) list = [...list].sort(sorter)

    return list
  }, [allProducts, categoryId, minPrice, maxPrice, onlyAR, onlyOffers, onlyInStock, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const resetFilters = () => {
    setCategoryId('')
    setMinPrice('')
    setMaxPrice('')
    setOnlyAR(false)
    setOnlyOffers(false)
    setOnlyInStock(false)
    setSort('relevance')
    setPage(1)
  }

  return {
    // estado
    categoryId,
    minPrice,
    maxPrice,
    onlyAR,
    onlyOffers,
    onlyInStock,
    sort,
    page: safePage,
    // setters (reinician a página 1 cuando cambia un filtro)
    setCategoryId: v => {
      setCategoryId(v)
      setPage(1)
    },
    setMinPrice: v => {
      setMinPrice(v)
      setPage(1)
    },
    setMaxPrice: v => {
      setMaxPrice(v)
      setPage(1)
    },
    setOnlyAR: v => {
      setOnlyAR(v)
      setPage(1)
    },
    setOnlyOffers: v => {
      setOnlyOffers(v)
      setPage(1)
    },
    setOnlyInStock: v => {
      setOnlyInStock(v)
      setPage(1)
    },
    setSort: v => {
      setSort(v)
      setPage(1)
    },
    setPage,
    resetFilters,
    // resultados
    results: filtered,
    pageItems,
    totalPages,
    totalCount: filtered.length,
    sortOptions: Object.entries(SORTS).map(([id, s]) => ({ id, label: s.label }))
  }
}
