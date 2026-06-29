import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'
import { env } from '../config/env.js'

// Productos del MARKETPLACE: cada producto pertenece a un vendedor (seller_id).
// El listado público trae el nombre de la tienda para mostrar "Vendido por X",
// igual que en Temu/AliExpress.
//
// Herramienta AR: el producto suma medidas reales (width/height/depth_cm) y un
// contador de vistas del visor AR (model_view).

const PRODUCT_SELECT = `
  id,
  name,
  description,
  price,
  stock,
  width_cm,
  height_cm,
  depth_cm,
  seller_id,
  created_at,
  category ( id, name ),
  model ( id, name, file_key ),
  product_image ( image ( id, name, file_key ) ),
  offer ( id, discount_type, discount_value, start_date, end_date ),
  seller:seller_id ( id, store_name, store_slug ),
  model_view ( views )
`

function publicUrl(fileKey) {
  if (!fileKey) return null
  const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(fileKey)
  return data?.publicUrl ?? null
}

// Precio con descuento si hay oferta vigente. El backend lo calcula (nadie
// hace trampa con el reloj del navegador).
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
      discountedPrice = Math.max(0, product.price - activeOffer.discount_value)
      discountPercent = Math.round((activeOffer.discount_value / product.price) * 100)
    }
  }

  return { discountActive, discountedPrice, discountPercent }
}

function shapeProduct(row) {
  const images = (row.product_image ?? [])
    .map(pi => pi.image)
    .filter(Boolean)
    .map(img => ({ id: img.id, name: img.name, url: publicUrl(img.file_key) }))

  const { discountActive, discountedPrice, discountPercent } = applyOffer(row)

  // model_view puede venir como objeto, array o null según la relación.
  const mv = Array.isArray(row.model_view) ? row.model_view[0] : row.model_view
  const views = mv?.views ?? 0

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    stock: row.stock,
    categoryId: row.category?.id ?? null,
    categoryName: row.category?.name ?? null,
    image: images[0]?.url ?? null,
    images,
    model: publicUrl(row.model?.file_key),
    // Medidas reales (cm) para escala correcta en AR
    widthCm: row.width_cm ?? null,
    heightCm: row.height_cm ?? null,
    depthCm: row.depth_cm ?? null,
    // Estadística: veces que se abrió el visor AR
    views,
    discountActive,
    discountedPrice,
    discountPercent,
    // Datos de la tienda vendedora (para "Vendido por X")
    sellerId: row.seller_id ?? null,
    storeName: row.seller?.store_name ?? null,
    storeSlug: row.seller?.store_slug ?? null
  }
}

// --- Catálogo público (todos los vendedores) ---
const listProducts = async ({ sellerId, search } = {}) => {
  let query = supabase.from('product').select(PRODUCT_SELECT)

  if (sellerId) query = query.eq('seller_id', sellerId)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query.order('created_at', { ascending: false })

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

// --- Productos de UN vendedor (su propio panel) ---
// Incluye los productos aunque estén agotados; es la vista de gestión.
const listProductsBySeller = async ({ sellerId }) => {
  return listProducts({ sellerId })
}

// Helper: confirma que el producto existe y pertenece al vendedor. Lanza si no.
async function assertOwnership(productId, sellerId) {
  const { data, error } = await supabase
    .from('product')
    .select('id, seller_id')
    .eq('id', productId)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.notFound, 'Producto no encontrado')
  }
  if (data.seller_id !== sellerId) {
    throw new AppError(HTTP_STATUS.unauthorized, 'Este producto no es de tu tienda')
  }
}

// Crea un producto a nombre del vendedor que lo publica.
const createProduct = async ({
  sellerId,
  name,
  description,
  price,
  stock,
  categoryId,
  modelId,
  imageIds,
  widthCm,
  heightCm,
  depthCm
}) => {
  const { data, error } = await supabase
    .from('product')
    .insert({
      name,
      description,
      price: price ?? 0,
      stock: stock ?? 0,
      category_id: categoryId,
      model_id: modelId ?? null,
      seller_id: sellerId,
      width_cm: widthCm ?? null,
      height_cm: heightCm ?? null,
      depth_cm: depthCm ?? null
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo crear el producto')
  }

  await linkImages(data.id, imageIds)

  return getProductById({ id: data.id })
}

// Actualiza un producto. requireOwner = vendedor (debe ser dueño).
// Si requireOwner es null/undefined, es un admin y puede editar cualquiera.
const updateProduct = async ({
  id,
  requireOwner,
  name,
  description,
  price,
  stock,
  categoryId,
  modelId,
  imageIds,
  widthCm,
  heightCm,
  depthCm
}) => {
  if (requireOwner) await assertOwnership(id, requireOwner)

  // Construye el update solo con los campos provistos (permite updates
  // parciales como el ajuste de stock tras una compra).
  const patch = {}
  if (name !== undefined) patch.name = name
  if (description !== undefined) patch.description = description
  if (price !== undefined) patch.price = price
  if (stock !== undefined) patch.stock = stock
  if (categoryId !== undefined) patch.category_id = categoryId
  if (modelId !== undefined) patch.model_id = modelId ?? null
  if (widthCm !== undefined) patch.width_cm = widthCm ?? null
  if (heightCm !== undefined) patch.height_cm = heightCm ?? null
  if (depthCm !== undefined) patch.depth_cm = depthCm ?? null

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('product').update(patch).eq('id', id)
    if (error) {
      throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo actualizar el producto')
    }
  }

  if (Array.isArray(imageIds)) {
    await supabase.from('product_image').delete().eq('product_id', id)
    await linkImages(id, imageIds)
  }

  return getProductById({ id })
}

const deleteProduct = async ({ id, requireOwner }) => {
  if (requireOwner) await assertOwnership(id, requireOwner)

  await supabase.from('product_image').delete().eq('product_id', id)
  const { error } = await supabase.from('product').delete().eq('id', id)

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar el producto')
  }
}

async function linkImages(productId, imageIds) {
  if (!Array.isArray(imageIds) || imageIds.length === 0) return
  const rows = imageIds.map(imageId => ({ product_id: productId, image_id: imageId }))
  const { error } = await supabase.from('product_image').insert(rows)
  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron vincular las imágenes')
  }
}

export {
  listProducts,
  getProductById,
  listProductsBySeller,
  createProduct,
  updateProduct,
  deleteProduct
}
