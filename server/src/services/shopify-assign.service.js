import { supabase } from '../config/supabase.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'
import { getStoreBySeller } from './shopify-admin.service.js'

// Asociación producto Shopify <-> modelo AR (Etapa 3).
//
// Reusa la tabla "model" existente (modelos 3D subidos a Storage). Aquí solo
// guardamos la RELACIÓN: qué GID de Shopify usa qué model_id, con qué medidas.

function publicUrl(fileKey) {
  if (!fileKey) return null
  const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(fileKey)
  return data?.publicUrl ?? null
}

// --- Lista de modelos disponibles para reusar ---
// Los modelos son globales (la tabla "model" no tiene seller_id). Devuelve
// todos para que el vendedor elija uno ya subido.
async function listModels() {
  const { data, error } = await supabase
    .from('model')
    .select('id, name, file_key')
    .order('created_at', { ascending: false })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar los modelos')
  }
  return data.map(m => ({ id: m.id, name: m.name, url: publicUrl(m.file_key) }))
}

// --- Asignaciones actuales del vendedor ---
// Devuelve, por GID, qué modelo tiene asignado (para marcar las tarjetas).
async function listAssignments(sellerId) {
  const { shop } = await getStoreBySeller(sellerId)

  const { data, error } = await supabase
    .from('shopify_product_model')
    .select(
      'shopify_product_gid, model_id, width_cm, height_cm, depth_cm, model:model_id ( id, name, file_key )'
    )
    .eq('shop', shop)

  if (error) {
    throw new AppError(
      HTTP_STATUS.internalServerError,
      `Error leyendo asignaciones: ${error.message}`
    )
  }

  // Mapa { gid: { modelId, modelName, url, width, height, depth } } para lookup O(1) en la UI.
  const byGid = {}
  for (const row of data ?? []) {
    byGid[row.shopify_product_gid] = {
      modelId: row.model_id,
      modelName: row.model?.name ?? null,
      url: publicUrl(row.model?.file_key),
      widthCm: row.width_cm,
      heightCm: row.height_cm,
      depthCm: row.depth_cm
    }
  }
  return { shop, assignments: byGid }
}

// --- Asignar (o reasignar) un modelo a un producto Shopify ---
async function assignModel({
  sellerId,
  shopifyProductGid,
  productTitle,
  modelId,
  widthCm,
  heightCm,
  depthCm
}) {
  const { shop } = await getStoreBySeller(sellerId)

  // Valida que el modelo exista.
  const { data: model, error: modelErr } = await supabase
    .from('model')
    .select('id')
    .eq('id', modelId)
    .maybeSingle()

  if (modelErr) {
    throw new AppError(
      HTTP_STATUS.internalServerError,
      `Error validando modelo: ${modelErr.message}`
    )
  }
  if (!model) {
    throw new AppError(HTTP_STATUS.badRequest, 'El modelo indicado no existe')
  }

  const { error } = await supabase.from('shopify_product_model').upsert(
    {
      shop,
      shopify_product_gid: shopifyProductGid,
      product_title: productTitle ?? null,
      model_id: modelId,
      width_cm: widthCm ?? null,
      height_cm: heightCm ?? null,
      depth_cm: depthCm ?? null,
      seller_id: sellerId,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'shop,shopify_product_gid' }
  )

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, `Error asignando modelo: ${error.message}`)
  }

  return { shop, shopifyProductGid, modelId }
}

// --- Quitar la asignación de un producto ---
async function unassignModel({ sellerId, shopifyProductGid }) {
  const { shop } = await getStoreBySeller(sellerId)

  const { error } = await supabase
    .from('shopify_product_model')
    .delete()
    .eq('shop', shop)
    .eq('shopify_product_gid', shopifyProductGid)

  if (error) {
    throw new AppError(
      HTTP_STATUS.internalServerError,
      `Error quitando asignación: ${error.message}`
    )
  }
  return { shop, shopifyProductGid }
}

export { listModels, listAssignments, assignModel, unassignModel }
