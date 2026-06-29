import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { getEmbedModel, registerEmbedView } from '../services/seller/embedService'

// Página DESNUDA que carga el iframe en tiendas externas: ruta /ver/:id.
// Sin header, sin footer, sin nada del sitio. Solo el visor 3D/AR a pantalla
// completa, porque vive dentro de la página de otro.
//
// - Busca el modelo por id en el backend (endpoint público).
// - Muestra <model-viewer> (3D + AR en iPhone y Android, sin app).
// - Si el producto tiene medidas reales, escala el modelo a su tamaño físico
//   al colocarlo en AR (misma lógica que ArModalScaled).
// - Registra una vista al abrir (estadística para el vendedor).

export default function EmbedViewer() {
  const { id } = useParams()
  const ref = useRef(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  // Carga datos del modelo + registra la vista (una sola vez).
  useEffect(() => {
    let alive = true
    getEmbedModel(id)
      .then(d => {
        if (!alive) return
        setData(d)
        registerEmbedView(id)
      })
      .catch(e => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  // Escala a tamaño real y barra de progreso del modelo.
  useEffect(() => {
    const model = ref.current
    if (!model || !data) return

    const onProgress = e => {
      const raw = e.detail?.totalProgress ?? 0
      setProgress(Math.min(100, Math.max(0, Math.round(raw * 100))))
    }

    const onLoad = () => {
      setProgress(100)
      // Escala usando la altura objetivo (cm -> m) sobre el tamaño nativo del .glb.
      if (data.heightCm && typeof model.getDimensions === 'function') {
        try {
          const dims = model.getDimensions() // metros, tamaño nativo
          const targetMeters = Number(data.heightCm) / 100
          if (dims?.y > 0 && targetMeters > 0) {
            const factor = targetMeters / dims.y
            model.scale = `${factor} ${factor} ${factor}`
          }
        } catch {
          /* si falla, queda el tamaño nativo */
        }
      }
    }

    model.addEventListener('progress', onProgress)
    model.addEventListener('load', onLoad)
    return () => {
      model.removeEventListener('progress', onProgress)
      model.removeEventListener('load', onLoad)
    }
  }, [data])

  const launchAr = () => {
    if (ref.current?.canActivateAR) ref.current.activateAR()
  }

  if (loading) return <div style={S.center}>Cargando…</div>
  if (error || !data?.model) return <div style={S.center}>{error || 'Modelo no encontrado'}</div>

  return (
    <div style={S.fullScreen}>
      <model-viewer
        ref={ref}
        src={data.model}
        alt={data.name}
        ar
        ar-modes='webxr scene-viewer quick-look'
        ar-scale='fixed'
        camera-controls
        auto-rotate
        shadow-intensity='1'
        style={S.viewer}
      >
        <button
          slot='ar-button'
          style={S.arButton}
          onClick={launchAr}
        >
          Ver en mi espacio
        </button>
        <div slot='progress-bar' />
      </model-viewer>

      {progress < 100 && (
        <div
          style={S.loader}
          role='status'
          aria-label={`Cargando modelo 3D: ${progress}%`}
        >
          <div style={S.track}>
            <div style={{ ...S.bar, width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  fullScreen: {
    width: '100vw',
    height: '100vh',
    margin: 0,
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  viewer: { width: '100%', height: '100%' },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    color: '#444',
    fontFamily: 'sans-serif'
  },
  arButton: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #ff6a00, #ff4747)',
    color: '#fff',
    border: 'none',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
    cursor: 'pointer',
    zIndex: 10
  },
  loader: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px'
  },
  track: {
    width: '100%',
    height: '4px',
    background: 'rgba(0,0,0,0.1)',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  bar: {
    height: '100%',
    background: '#ff6a00',
    transition: 'width 0.2s ease'
  }
}
