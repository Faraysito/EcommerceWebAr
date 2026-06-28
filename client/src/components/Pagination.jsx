import styles from './Pagination.module.css'

// Paginación simple. Recibe page actual, total de páginas y onChange.
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const go = p => {
    const next = Math.min(Math.max(1, p), totalPages)
    if (next !== page) {
      onChange(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Ventana de páginas alrededor de la actual.
  const pages = []
  const from = Math.max(1, page - 2)
  const to = Math.min(totalPages, page + 2)
  for (let i = from; i <= to; i++) pages.push(i)

  return (
    <nav
      className={styles.nav}
      aria-label='Paginación'
    >
      <button
        className={styles.btn}
        onClick={() => go(page - 1)}
        disabled={page === 1}
      >
        Anterior
      </button>

      {from > 1 && (
        <>
          <button
            className={styles.page}
            onClick={() => go(1)}
          >
            1
          </button>
          {from > 2 && <span className={styles.dots}>…</span>}
        </>
      )}

      {pages.map(p => (
        <button
          key={p}
          className={`${styles.page} ${p === page ? styles.active : ''}`}
          onClick={() => go(p)}
        >
          {p}
        </button>
      ))}

      {to < totalPages && (
        <>
          {to < totalPages - 1 && <span className={styles.dots}>…</span>}
          <button
            className={styles.page}
            onClick={() => go(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className={styles.btn}
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
      >
        Siguiente
      </button>
    </nav>
  )
}
