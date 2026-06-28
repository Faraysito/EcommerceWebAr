import styles from './StarRating.module.css'

// Estrellas para mostrar o elegir una calificación 1-5.
// - Modo lectura (default): muestra `value` con media estrella aproximada.
// - Modo interactivo (onChange): el usuario hace click para elegir.
export default function StarRating({ value = 0, onChange, size = 18, count }) {
  const interactive = typeof onChange === 'function'
  const stars = [1, 2, 3, 4, 5]

  return (
    <span
      className={styles.wrap}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? 'Elegir calificación' : `Calificación: ${value} de 5`}
    >
      {stars.map(n => {
        const filled = value >= n
        const half = !filled && value >= n - 0.5
        const Star = (
          <svg
            width={size}
            height={size}
            viewBox='0 0 24 24'
            aria-hidden='true'
            className={`${styles.star} ${filled ? styles.filled : half ? styles.half : styles.empty}`}
          >
            <path d='M12 17.3l-6.18 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73 1.64 7.03z' />
          </svg>
        )

        if (!interactive) return <span key={n}>{Star}</span>

        return (
          <button
            key={n}
            type='button'
            className={styles.btn}
            onClick={() => onChange(n)}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            aria-checked={value === n}
            role='radio'
          >
            {Star}
          </button>
        )
      })}
      {typeof count === 'number' && (
        <span className={styles.count}>
          {value ? value.toFixed(1) : '—'} ({count})
        </span>
      )}
    </span>
  )
}
