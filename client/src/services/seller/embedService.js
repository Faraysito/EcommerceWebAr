import { env } from '../../config/env'

// Servicios del EMBED público (lo que consume la página /ver/:id dentro del
// iframe). No usa cookies ni auth: son endpoints abiertos.

const API_URL = env.VITE_API_URL

// Trae nombre, URL del modelo y medidas reales del producto.
export async function getEmbedModel(id) {
  const res = await fetch(`${API_URL}/api/embed/${id}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Modelo no encontrado')
  }
  return res.json()
}

// Registra una apertura del visor (estadística). Best-effort: si falla, se
// ignora para no afectar la experiencia.
export async function registerEmbedView(id) {
  try {
    await fetch(`${API_URL}/api/embed/${id}/view`, { method: 'POST' })
  } catch {
    /* métrica secundaria */
  }
}
