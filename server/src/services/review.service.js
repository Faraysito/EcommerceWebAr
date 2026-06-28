import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Reseñas y calificación (1-5) por producto. Una reseña por comprador por
// producto (lo garantiza el UNIQUE en BD). El "upsert" permite que el cliente
// edite su propia reseña sin crear duplicados.

const REVIEW_SELECT = `
  id,
  product_id,
  rating,
  comment,
  created_at,
  customer:customer_id ( id, name )
`

function shapeReview(row) {
  return {
    id: row.id,
    productId: row.product_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    // Nombre público del autor; si no tiene nombre, "Anónimo".
    author: row.customer?.name ?? 'Anónimo',
    customerId: row.customer?.id ?? null
  }
}

// --- Listado público de reseñas de un producto ---
const listReviewsByProduct = async ({ productId }) => {
  const { data, error } = await supabase
    .from('review')
    .select(REVIEW_SELECT)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar las reseñas')
  }

  return (data ?? []).map(shapeReview)
}

// --- Resumen de calificación (promedio + total) de un producto ---
const getRatingSummary = async ({ productId }) => {
  const { data, error } = await supabase.from('review').select('rating').eq('product_id', productId)

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo calcular la calificación')
  }

  const ratings = (data ?? []).map(r => r.rating)
  const count = ratings.length
  const average =
    count === 0 ? 0 : Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 10) / 10

  return { average, count }
}

// --- Crear o actualizar la reseña del cliente logueado ---
// onConflict (product_id, customer_id): si ya reseñó, actualiza la suya.
const upsertReview = async ({ productId, customerId, rating, comment }) => {
  // Verifica que el producto exista (mensaje claro en vez de error de FK).
  const { data: product } = await supabase
    .from('product')
    .select('id')
    .eq('id', productId)
    .maybeSingle()

  if (!product) {
    throw new AppError(HTTP_STATUS.notFound, 'Producto no encontrado')
  }

  const { data, error } = await supabase
    .from('review')
    .upsert(
      {
        product_id: productId,
        customer_id: customerId,
        rating,
        comment: comment ?? null
      },
      { onConflict: 'product_id,customer_id' }
    )
    .select(REVIEW_SELECT)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo guardar la reseña')
  }

  return shapeReview(data)
}

// --- Borrar la reseña propia (el cliente borra la suya) ---
const deleteOwnReview = async ({ reviewId, customerId }) => {
  const { data: review } = await supabase
    .from('review')
    .select('id, customer_id')
    .eq('id', reviewId)
    .maybeSingle()

  if (!review) {
    throw new AppError(HTTP_STATUS.notFound, 'Reseña no encontrada')
  }
  if (review.customer_id !== customerId) {
    throw new AppError(HTTP_STATUS.unauthorized, 'Esta reseña no es tuya')
  }

  const { error } = await supabase.from('review').delete().eq('id', reviewId)
  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar la reseña')
  }
}

// --- Borrado por admin (moderación, sin chequeo de dueño) ---
const deleteReviewAsAdmin = async ({ reviewId }) => {
  const { error } = await supabase.from('review').delete().eq('id', reviewId)
  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar la reseña')
  }
}

export {
  listReviewsByProduct,
  getRatingSummary,
  upsertReview,
  deleteOwnReview,
  deleteReviewAsAdmin
}
