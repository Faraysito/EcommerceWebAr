import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { supabase } from '../config/supabase.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Sube un buffer al bucket de Storage en la carpeta indicada y devuelve el
// file_key (ruta dentro del bucket). Nombre unico: timestamp + random + ext.
async function uploadToStorage(file, folder) {
  const ext = path.extname(file.originalname).toLowerCase()
  const fileName = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`
  const fileKey = `${folder}/${fileName}`

  const { error } = await supabase.storage
    .from(env.SUPABASE_BUCKET)
    .upload(fileKey, file.buffer, { contentType: file.mimetype, upsert: false })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, `Error al subir archivo: ${error.message}`)
  }

  return fileKey
}

// Borra un archivo del Storage por su file_key (best-effort, no rompe si falla).
async function removeFromStorage(fileKey) {
  if (!fileKey) return
  await supabase.storage.from(env.SUPABASE_BUCKET).remove([fileKey])
}

function publicUrl(fileKey) {
  const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(fileKey)
  return data?.publicUrl ?? null
}

// ---------- IMAGENES ----------
const uploadImage = async ({ file, name }) => {
  const fileKey = await uploadToStorage(file, 'images')

  const { data, error } = await supabase
    .from('image')
    .insert({ name: name || file.originalname, file_key: fileKey })
    .select('id, name, file_key')
    .single()

  if (error || !data) {
    await removeFromStorage(fileKey) // rollback del archivo huerfano
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo registrar la imagen')
  }

  return { id: data.id, name: data.name, url: publicUrl(data.file_key) }
}

const listImages = async () => {
  const { data, error } = await supabase
    .from('image')
    .select('id, name, file_key')
    .order('created_at', { ascending: false })

  if (error)
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar las imágenes')

  return data.map(img => ({ id: img.id, name: img.name, url: publicUrl(img.file_key) }))
}

const deleteImage = async ({ id }) => {
  const { data: img } = await supabase.from('image').select('file_key').eq('id', id).single()

  const { error } = await supabase.from('image').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new AppError(HTTP_STATUS.conflict, 'La imagen está en uso por un producto')
    }
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar la imagen')
  }

  if (img?.file_key) await removeFromStorage(img.file_key)
}

// ---------- MODELOS 3D ----------
const uploadModel = async ({ file, name }) => {
  const fileKey = await uploadToStorage(file, 'models')

  const { data, error } = await supabase
    .from('model')
    .insert({ name: name || file.originalname, file_key: fileKey })
    .select('id, name, file_key')
    .single()

  if (error || !data) {
    await removeFromStorage(fileKey)
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo registrar el modelo')
  }

  return { id: data.id, name: data.name, url: publicUrl(data.file_key) }
}

const listModels = async () => {
  const { data, error } = await supabase
    .from('model')
    .select('id, name, file_key')
    .order('created_at', { ascending: false })

  if (error)
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar los modelos')

  return data.map(m => ({ id: m.id, name: m.name, url: publicUrl(m.file_key) }))
}

const deleteModel = async ({ id }) => {
  const { data: model } = await supabase.from('model').select('file_key').eq('id', id).single()

  const { error } = await supabase.from('model').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new AppError(HTTP_STATUS.conflict, 'El modelo está en uso por un producto')
    }
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar el modelo')
  }

  if (model?.file_key) await removeFromStorage(model.file_key)
}

export { uploadImage, listImages, deleteImage, uploadModel, listModels, deleteModel }
