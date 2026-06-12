import { useEffect, useRef } from 'react'
import styles from './Modal.module.css'

export const Modal = ({ isOpen, close, title, children, fitContent = false }) => {
  const modalRef = useRef(null)

  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return
    if (isOpen) modal.showModal()
    else modal.close()
  }, [isOpen])

  const contentClass = `${styles.contentModal} ${fitContent ? styles.fitContent : ''}`

  return (
    <dialog
      ref={modalRef}
      onClose={close}
      className={styles.modal}
      onClick={close}
    >
      <div className={styles.container}>
        <div
          className={contentClass}
          onClick={e => e.stopPropagation()}
        >
          <header className={styles.headerModal}>
            <p className={styles.headerTitle}>{title ?? ''}</p>
            <button
              title='Cerrar'
              className={styles.btnClose}
              onClick={close}
              aria-label='Cerrar'
            >
              <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <line
                  x1='18'
                  y1='6'
                  x2='6'
                  y2='18'
                />
                <line
                  x1='6'
                  y1='6'
                  x2='18'
                  y2='18'
                />
              </svg>
            </button>
          </header>
          <div className={styles.modalBody}>{children}</div>
        </div>
      </div>
    </dialog>
  )
}
