import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Select con todas las relaciones que el frontend necesita por producto:
// categoria, modelo 3D, imagenes (via product_image) y ofertas vigentes.
const PRODUCT_SELECT = `
  id,
  name,
  description,
  price,
  stock,
  created_at,
  category ( id, name ),
  model ( id, name, file_key ),
  product_image ( image ( id, name, file_key ) ),
  offer ( id, discount_type, discount_value, start_date, end_date )
`

// Construye la URL publica de un file_key del bucket de Storage.
import { env } from '../config/env.js'
function publicUrl(fileKey) {
  if (!fileKey) return null
  const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(fileKey)
  return data?.publicUrl ?? null
}

// Calcula el precio con descuento si hay una oferta vigente ahora. Igual que
// MenuWebAR: el backend hace el calculo, el front solo lee discountActive y
// discountedPrice (asi nadie hace trampa con el reloj del navegador).
function applyOffer(product) {
  const now = Date.now()
  const activeOffer = (product.offer ?? []).find(o => {
    const start = new Date(o.start_date).getTime()
    const end = new Date(o.end_date).getTime()
    return now >= start && now <= end
  })

  let discountActive = false
  let discountedPrice = product.price
  let discountPercent = 0

  if (activeOffer) {
    discountActive = true
    if (activeOffer.discount_type === 'PERCENTAGE') {
      discountPercent = activeOffer.discount_value
      discountedPrice = Math.round(product.price * (1 - activeOffer.discount_value / 100))
    } else {
      // FIXED: descuento de monto fijo
      discountedPrice = Math.max(0, product.price - activeOffer.discount_value)
      discountPercent = Math.round((activeOffer.discount_value / product.price) * 100)
    }
  }

  return { discountActive, discountedPrice, discountPercent }
}

// Normaliza la fila cruda de Supabase a la forma que consume el frontend.
function shapeProduct(row) {
  const images = (row.product_image ?? [])
    .map(pi => pi.image)
    .filter(Boolean)
    .map(img => ({ id: img.id, name: img.name, url: publicUrl(img.file_key) }))

  const { discountActive, discountedPrice, discountPercent } = applyOffer(row)

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    stock: row.stock,
    categoryId: row.category?.id ?? null,
    categoryName: row.category?.name ?? null,
    image: images[0]?.url ?? null, // imagen principal
    images, // todas
    model: publicUrl(row.model?.file_key), // .glb para AR (o null)
    discountActive,
    discountedPrice,
    discountPercent
  }
}

const listProducts = async () => {
  const { data, error } = await supabase
    .from('product')
    .select(PRODUCT_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar los productos')
  }

  return data.map(shapeProduct)
}

const getProductById = async ({ id }) => {
  const { data, error } = await supabase
    .from('product')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.notFound, 'Producto no encontrado')
  }

  return shapeProduct(data)
}

// Crea un producto y, si vienen imageIds, las vincula en product_image.
const createProduct = async ({
  name,
  description,
  price,
  stock,
  categoryId,
  modelId,
  imageIds
}) => {
  const { data, error } = await supabase
    .from('product')
    .insert({
      name,
      description,
      price,
      stock,
      category_id: categoryId,
      model_id: modelId ?? null
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo crear el producto')
  }

  await linkImages(data.id, imageIds)

  return getProductById({ id: data.id })
}

const updateProduct = async ({
  id,
  name,
  description,
  price,
  stock,
  categoryId,
  modelId,
  imageIds
}) => {
  const { error } = await supabase
    .from('product')
    .update({
      name,
      description,
      price,
      stock,
      category_id: categoryId,
      model_id: modelId ?? null
    })
    .eq('id', id)

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo actualizar el producto')
  }

  // Si mandan imageIds, resetea los vinculos (borra y revincula).
  if (Array.isArray(imageIds)) {
    await supabase.from('product_image').delete().eq('product_id', id)
    await linkImages(id, imageIds)
  }

  return getProductById({ id })
}

const deleteProduct = async ({ id }) => {
  // Limpia vinculos antes de borrar el producto.
  await supabase.from('product_image').delete().eq('product_id', id)
  const { error } = await supabase.from('product').delete().eq('id', id)

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar el producto')
  }
}

// Helper: vincula imagenes a un producto en la tabla product_image.
async function linkImages(productId, imageIds) {
  if (!Array.isArray(imageIds) || imageIds.length === 0) return
  const rows = imageIds.map(imageId => ({ product_id: productId, image_id: imageId }))
  const { error } = await supabase.from('product_image').insert(rows)
  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron vincular las imágenes')
  }
}

export { listProducts, getProductById, createProduct, updateProduct, deleteProduct }
