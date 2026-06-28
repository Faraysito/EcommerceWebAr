import { useState } from 'react'
import { Modal } from './Modal'
import styles from './ShareButton.module.css'

// Compartir un producto: copia el enlace y muestra un QR que abre el visor AR
// directo (/ar/:id), pensado para imprimir o escanear desde el teléfono.
//
// El QR se genera con un servicio público (api.qrserver.com); no requiere
// instalar dependencias. Si prefieres no depender de un tercero, puedes
// reemplazarlo luego por una librería local de QR.
export default function ShareButton({ productId, productName }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const productUrl = `${origin}/producto/${productId}`
  const arUrl = `${origin}/ar/${productId}`
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(arUrl)}`

  const copy = async (text, which) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: productName, url: productUrl })
        return
      } catch {
        /* el usuario canceló; seguimos mostrando el modal */
      }
    }
    setOpen(true)
  }

  return (
    <>
      <button
        type='button'
        className={styles.trigger}
        onClick={nativeShare}
        title='Compartir'
      >
        <svg
          width='18'
          height='18'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <circle
            cx='18'
            cy='5'
            r='3'
          />
          <circle
            cx='6'
            cy='12'
            r='3'
          />
          <circle
            cx='18'
            cy='19'
            r='3'
          />
          <line
            x1='8.59'
            y1='13.51'
            x2='15.42'
            y2='17.49'
          />
          <line
            x1='15.41'
            y1='6.51'
            x2='8.59'
            y2='10.49'
          />
        </svg>
        Compartir
      </button>

      <Modal
        isOpen={open}
        close={() => setOpen(false)}
        title='Compartir producto'
        fitContent
      >
        <div className={styles.body}>
          <div className={styles.qrBox}>
            <img
              src={qrSrc}
              alt={`Código QR para ver ${productName} en AR`}
              width={220}
              height={220}
            />
            <p className={styles.qrHint}>Escanea para verlo en Realidad Aumentada</p>
          </div>

          <label className={styles.linkRow}>
            <span className={styles.linkLabel}>Enlace del producto</span>
            <div className={styles.linkField}>
              <input
                className={styles.input}
                readOnly
                value={productUrl}
                onFocus={e => e.target.select()}
              />
              <button
                className={styles.copyBtn}
                onClick={() => copy(productUrl, 'product')}
              >
                {copied === 'product' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </label>

          <label className={styles.linkRow}>
            <span className={styles.linkLabel}>Enlace directo a AR</span>
            <div className={styles.linkField}>
              <input
                className={styles.input}
                readOnly
                value={arUrl}
                onFocus={e => e.target.select()}
              />
              <button
                className={styles.copyBtn}
                onClick={() => copy(arUrl, 'ar')}
              >
                {copied === 'ar' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </label>
        </div>
      </Modal>
    </>
  )
}
