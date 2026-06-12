import { useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
import styles from './ArModal.module.css'

const MIN_PROGRESS = 0
const MAX_PROGRESS = 100

// Visor 3D + AR. <model-viewer> es un web component (no React), por eso
// enganchamos sus eventos con addEventListener manual.
//   - progress: mientras descarga el .glb
//   - load: listo; intenta lanzar AR directo si el device lo soporta
//   - error: si falla la carga
export const ArModal = ({ isOpen, close, product }) => {
  const modelViewerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(MIN_PROGRESS)

  useEffect(() => {
    const model = modelViewerRef.current
    if (!model || !isOpen) return

    const handleProgress = event => {
      const raw = event.detail?.totalProgress ?? 0
      const next = Math.min(MAX_PROGRESS, Math.max(MIN_PROGRESS, Math.round(raw * 100)))
      setProgress(next)
      setLoading(next < MAX_PROGRESS)
    }

    const handleLoad = () => {
      setProgress(MAX_PROGRESS)
      setLoading(false)
      if (model.canActivateAR) model.activateAR()
    }

    const handleError = () => setLoading(false)

    model.addEventListener('progress', handleProgress)
    model.addEventListener('load', handleLoad)
    model.addEventListener('error', handleError)

    return () => {
      model.removeEventListener('progress', handleProgress)
      model.removeEventListener('load', handleLoad)
      model.removeEventListener('error', handleError)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      title={product.name}
    >
      <model-viewer
        ref={modelViewerRef}
        src={product.model}
        ar
        ar-modes='webxr scene-viewer quick-look'
        camera-controls
        auto-rotate
        auto-rotate-delay='300'
        rotation-per-second='30deg'
        shadow-intensity='1'
        className={styles.modelViewer}
        style={{ width: '100%', height: '100%' }}
      >
        <div slot='progress-bar' />
      </model-viewer>
      {loading && <ModelLoader progress={progress} />}
    </Modal>
  )
}

const ModelLoader = ({ progress }) => (
  <div
    className={styles.loaderWrapper}
    role='status'
    aria-live='polite'
    aria-label={`Cargando modelo 3D: ${progress}%`}
  >
    <div className={styles.loaderTrack}>
      <div
        className={styles.loaderBar}
        style={{ width: `${progress}%` }}
      />
    </div>
    <span className={styles.loaderLabel}>{progress}%</span>
  </div>
)
