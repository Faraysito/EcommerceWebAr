import { supabase } from '../config/supabase.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Resolución PÚBLICA del modelo AR de un producto Shopify, para el visor que
// corre en el storefront del vendedor (Theme App Extension).
//
// El storefront pasa shop + el ID numérico del producto. Reconstruimos el GID
// (gid://shopify/Product/ID) y buscamos su asignación. Devolvemos solo lo
// necesario para renderizar: URL del .glb y medidas. Nada sensible.

function publicUrl(fileKey) {
  if (!fileKey) return null
  const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(fileKey)
  return data?.publicUrl ?? null
}

async function resolveModel({ shop, productId }) {
  if (!shop || !productId) {
    throw new AppError(HTTP_STATUS.badRequest, 'Faltan parámetros shop o productId')
  }

  // El storefront manda el ID numérico; reconstruimos el GID que guardamos.
  const gid = `gid://shopify/Product/${productId}`

  const { data, error } = await supabase
    .from('shopify_product_model')
    .select('width_cm, height_cm, depth_cm, model:model_id ( name, file_key )')
    .eq('shop', shop)
    .eq('shopify_product_gid', gid)
    .maybeSingle()

  if (error) {
    throw new AppError(
      HTTP_STATUS.internalServerError,
      `Error resolviendo modelo: ${error.message}`
    )
  }
  if (!data || !data.model) {
    // No es un error de servidor: este producto simplemente no tiene AR.
    return { hasModel: false }
  }

  return {
    hasModel: true,
    name: data.model.name,
    modelUrl: publicUrl(data.model.file_key),
    widthCm: data.width_cm,
    heightCm: data.height_cm,
    depthCm: data.depth_cm
  }
}

export { resolveModel }
