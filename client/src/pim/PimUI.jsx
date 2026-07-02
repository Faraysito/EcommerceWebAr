import styles from './Pim.module.css'

// Badge de estado editorial / de canal.
const STATUS_LABEL = {
  draft: 'Borrador',
  review: 'Revisión',
  approved: 'Aprobado',
  published: 'Publicado',
  pending: 'Pendiente',
  ready: 'Listo',
  error: 'Error'
}
const STATUS_CLASS = {
  draft: styles.stDraft,
  review: styles.stReview,
  approved: styles.stApproved,
  published: styles.stPublished,
  pending: styles.stPending,
  ready: styles.stReady,
  error: styles.stError
}

export function StatusBadge({ status }) {
  return (
    <span className={`${styles.statusBadge} ${STATUS_CLASS[status] ?? styles.stDraft}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

// Barra de completitud (0-100). Colorea según el nivel.
export function Completeness({ percent }) {
  const fillClass =
    percent >= 100 ? '' : percent >= 60 ? styles.progressMid : styles.progressLow
  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${fillClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={styles.progressPct}>{percent}%</span>
    </div>
  )
}
