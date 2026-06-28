import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'
import { env } from '../config/env.js'

// Wishlist (favoritos) del comprador. Devuelve productos con la forma mínima
// que necesita la grilla (id, name, price, image...). No recalcula ofertas
// aquí para mantenerlo liviano; el catálogo ya hace ese trabajo.

function publicUrl(fileKey) {
  if (!fileKey) return null
  const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(fileKey)
  return data?.publicUrl ?? null
}

const WISHLIST_SELECT = `
  created_at,
  product:product_id (
    id, name, price, stock, seller_id,
    product_image ( image ( file_key ) ),
    seller:seller_id ( store_name, store_slug )
  )
`

function shapeItem(row) {
  const p = row.product
  if (!p) return null
  const firstKey = p.product_image?.[0]?.image?.file_key ?? null
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    image: publicUrl(firstKey),
    sellerId: p.seller_id ?? null,
    storeName: p.seller?.store_name ?? null,
    storeSlug: p.seller?.store_slug ?? null,
    addedAt: row.created_at
  }
}

const listWishlist = async ({ customerId }) => {
  const { data, error } = await supabase
    .from('wishlist')
    .select(WISHLIST_SELECT)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo leer tu lista de favoritos')
  }

  return (data ?? []).map(shapeItem).filter(Boolean)
}

// Devuelve solo los ids de producto en la wishlist (para pintar el corazón
// activo en la grilla sin traer todo el detalle).
const listWishlistIds = async ({ customerId }) => {
  const { data, error } = await supabase
    .from('wishlist')
    .select('product_id')
    .eq('customer_id', customerId)

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo leer tus favoritos')
  }

  return (data ?? []).map(r => r.product_id)
}

const addToWishlist = async ({ customerId, productId }) => {
  // upsert evita error si ya estaba (idempotente).
  const { error } = await supabase
    .from('wishlist')
    .upsert(
      { customer_id: customerId, product_id: productId },
      { onConflict: 'customer_id,product_id' }
    )

  if (error) {
    if (error.code === '23503') {
      throw new AppError(HTTP_STATUS.notFound, 'Producto no encontrado')
    }
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo agregar a favoritos')
  }
}

const removeFromWishlist = async ({ customerId, productId }) => {
  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('customer_id', customerId)
    .eq('product_id', productId)

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo quitar de favoritos')
  }
}

export { listWishlist, listWishlistIds, addToWishlist, removeFromWishlist }
