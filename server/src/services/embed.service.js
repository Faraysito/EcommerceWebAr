import { supabase } from '../config/supabase.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Servicio para el EMBED público (iframe en tiendas externas). Sin auth: solo
// expone lo mínimo para renderizar el visor AR de UN producto por su id.

function publicUrl(fileKey) {
  if (!fileKey) return null
  const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(fileKey)
  return data?.publicUrl ?? null
}

// Datos públicos del modelo para el visor: nombre, URL del .glb y medidas.
const getEmbedModel = async ({ id }) => {
  const { data, error } = await supabase
    .from('product')
    .select('id, name, width_cm, height_cm, depth_cm, model ( file_key )')
    .eq('id', id)
    .single()

  if (error || !data || !data.model?.file_key) {
    throw new AppError(HTTP_STATUS.notFound, 'Modelo no encontrado')
  }

  return {
    id: data.id,
    name: data.name,
    model: publicUrl(data.model.file_key),
    widthCm: data.width_cm ?? null,
    heightCm: data.height_cm ?? null,
    depthCm: data.depth_cm ?? null
  }
}

// Suma +1 a las vistas del producto (atómico vía RPC). Best-effort: si falla,
// no rompe la carga del visor.
const registerEmbedView = async ({ id }) => {
  const { error } = await supabase.rpc('increment_model_view', { p_product_id: id })
  if (error) {
    // No lanzamos: la métrica es secundaria frente a mostrar el modelo.
    return { ok: false }
  }
  return { ok: true }
}

export { getEmbedModel, registerEmbedView }
