import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { supabase } from '../config/supabase.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// ============================================================
// DAM (Digital Asset Management): repositorio central de activos con tags y
// metadata. Sube a Supabase Storage (mismo bucket que el storefront) y guarda
// el registro en la tabla asset.
// ============================================================

function assetUrl(fileKey) {
  const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(fileKey)
  return data?.publicUrl ?? null
}

// Deduce el tipo de activo a partir del mime / extensión.
function detectType(file) {
  const mime = file.mimetype || ''
  const name = file.originalname.toLowerCase()
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm')) return 'video'
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'document'
  if (name.endsWith('.glb') || name.endsWith('.usdz') || mime.startsWith('model/')) return 'model'
  return 'document'
}

async function uploadToStorage(file, folder) {
  const ext = path.extname(file.originalname).toLowerCase()
  const fileName = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`
  const fileKey = `${folder}/${fileName}`
  const { error } = await supabase.storage
    .from(env.SUPABASE_BUCKET)
    .upload(fileKey, file.buffer, { contentType: file.mimetype, upsert: false })
  if (error) throw new AppError(HTTP_STATUS.internalServerError, `Error al subir archivo: ${error.message}`)
  return fileKey
}

function shapeAsset(a) {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    mime: a.mime,
    sizeBytes: a.size_bytes,
    tags: a.tags ?? [],
    metadata: a.metadata ?? {},
    url: assetUrl(a.file_key),
    createdAt: a.created_at
  }
}

const uploadAsset = async ({ file, name, tags }) => {
  const type = detectType(file)
  const fileKey = await uploadToStorage(file, `dam/${type}`)

  let parsedTags = []
  if (Array.isArray(tags)) parsedTags = tags
  else if (typeof tags === 'string' && tags.trim())
    parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean)

  const { data, error } = await supabase
    .from('asset')
    .insert({
      name: name || file.originalname,
      file_key: fileKey,
      type,
      mime: file.mimetype,
      size_bytes: file.size,
      tags: parsedTags
    })
    .select('*')
    .single()

  if (error || !data) {
    await supabase.storage.from(env.SUPABASE_BUCKET).remove([fileKey]) // rollback
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo registrar el activo')
  }
  return shapeAsset(data)
}

const listAssets = async ({ type, tag, search } = {}) => {
  let query = supabase.from('asset').select('*')
  if (type) query = query.eq('type', type)
  if (tag) query = query.contains('tags', [tag])
  if (search) query = query.ilike('name', `%${search}%`)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar los activos')
  return data.map(shapeAsset)
}

const updateAsset = async ({ id, name, tags, metadata }) => {
  const patch = {}
  if (name !== undefined) patch.name = name
  if (tags !== undefined) patch.tags = tags
  if (metadata !== undefined) patch.metadata = metadata
  const { data, error } = await supabase
    .from('asset')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error || !data) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo actualizar el activo')
  return shapeAsset(data)
}

const deleteAsset = async ({ id }) => {
  const { data: asset } = await supabase.from('asset').select('file_key').eq('id', id).single()
  const { error } = await supabase.from('asset').delete().eq('id', id) // product_asset cae por cascade
  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar el activo')
  if (asset?.file_key) await supabase.storage.from(env.SUPABASE_BUCKET).remove([asset.file_key])
}

// --- Vínculo activo <-> producto ---
const linkAsset = async ({ productId, assetId, role, position }) => {
  const { error } = await supabase
    .from('product_asset')
    .upsert(
      { product_id: productId, asset_id: assetId, role: role ?? 'gallery', position: position ?? 0 },
      { onConflict: 'product_id,asset_id' }
    )
  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo vincular el activo')
}

const unlinkAsset = async ({ productId, assetId }) => {
  const { error } = await supabase
    .from('product_asset')
    .delete()
    .eq('product_id', productId)
    .eq('asset_id', assetId)
  if (error) throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo desvincular el activo')
}

export { uploadAsset, listAssets, updateAsset, deleteAsset, linkAsset, unlinkAsset }
