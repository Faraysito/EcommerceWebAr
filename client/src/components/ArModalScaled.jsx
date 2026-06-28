import { useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
import styles from './ArModalScaled.module.css'

// Visor 3D + AR a ESCALA REAL. Igual que ArModal, pero si el producto trae
// dimensiones (width_cm/height_cm/depth_cm), las muestra y fuerza al modelo a
// escalarse a su tamaño físico real al colocarlo en AR. Así el comprador ve el
// producto al tamaño que ocupará de verdad en su espacio.
//
// model-viewer no recibe "centímetros" directamente: se le da una escala
// relativa al tamaño nativo del .glb. Como no conocemos el tamaño nativo de
// antemano, leemos las dimensiones reales del modelo en el evento `load`
// (getDimensions) y calculamos el factor para que la altura coincida con
// height_cm. Si el producto no tiene medidas, se comporta como el visor normal.

const MAX_PROGRESS = 100

export default function ArModalScaled({ isOpen, close, product }) {
  const ref = useRef(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  const hasDims = Boolean(product?.heightCm || product?.widthCm || product?.depthCm)

  useEffect(() => {
    const model = ref.current
    if (!model || !isOpen) return

    const onProgress = e => {
      const raw = e.detail?.totalProgress ?? 0
      const next = Math.min(MAX_PROGRESS, Math.max(0, Math.round(raw * 100)))
      setProgress(next)
      setLoading(next < MAX_PROGRESS)
    }

    const onLoad = () => {
      setProgress(MAX_PROGRESS)
      setLoading(false)

      // Escala a tamaño real usando la altura objetivo (cm -> m).
      if (hasDims && product.heightCm && typeof model.getDimensions === 'function') {
        try {
          const dims = model.getDimensions() // metros, tamaño nativo del .glb
          const targetMeters = Number(product.heightCm) / 100
          if (dims?.y > 0 && targetMeters > 0) {
            const factor = targetMeters / dims.y
            model.scale = `${factor} ${factor} ${factor}`
          }
        } catch {
          /* si falla, queda el tamaño nativo */
        }
      }

      if (model.canActivateAR) model.activateAR()
    }

    const onError = () => setLoading(false)

    model.addEventListener('progress', onProgress)
    model.addEventListener('load', onLoad)
    model.addEventListener('error', onError)
    return () => {
      model.removeEventListener('progress', onProgress)
      model.removeEventListener('load', onLoad)
      model.removeEventListener('error', onError)
    }
  }, [isOpen, hasDims, product])

  if (!isOpen) return null

  const fmt = v => (v ? `${Number(v).toLocaleString('es-CL')} cm` : '—')

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      title={product.name}
    >
      <model-viewer
        ref={ref}
        src={product.model}
        ar
        ar-modes='webxr scene-viewer quick-look'
        ar-scale='fixed'
        camera-controls
        auto-rotate
        shadow-intensity='1'
        className={styles.viewer}
        style={{ width: '100%', height: '100%' }}
      >
        <div slot='progress-bar' />
      </model-viewer>

      {hasDims && (
        <div className={styles.dims}>
          <span className={styles.dimsTitle}>Medidas reales</span>
          <div className={styles.dimsRow}>
            <span>Alto: {fmt(product.heightCm)}</span>
            <span>Ancho: {fmt(product.widthCm)}</span>
            <span>Profundidad: {fmt(product.depthCm)}</span>
          </div>
          <p className={styles.dimsHint}>
            En AR el producto aparece a su tamaño real para que veas cómo se ve en tu espacio.
          </p>
        </div>
      )}

      {loading && (
        <div
          className={styles.loader}
          role='status'
          aria-label={`Cargando modelo 3D: ${progress}%`}
        >
          <div className={styles.track}>
            <div
              className={styles.bar}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.pct}>{progress}%</span>
        </div>
      )}
    </Modal>
  )
}
