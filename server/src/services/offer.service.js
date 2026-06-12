import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// CRUD de ofertas. Una oferta es un descuento (PERCENTAGE o FIXED) sobre un
// producto, vigente entre start_date y end_date. El calculo de si esta activa
// y el precio final lo hace product.service al listar productos.

const OFFER_SELECT = `
  id,
  product_id,
  discount_type,
  discount_value,
  start_date,
  end_date,
  created_at
`

const listOffers = async () => {
  const { data, error } = await supabase
    .from('offer')
    .select(OFFER_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar las ofertas')
  }
  return data
}

const createOffer = async ({ productId, discountType, discountValue, startDate, endDate }) => {
  // Validacion de coherencia que el schema no garantiza por si solo.
  if (new Date(endDate) <= new Date(startDate)) {
    throw new AppError(HTTP_STATUS.badRequest, 'La fecha de fin debe ser posterior al inicio')
  }
  if (discountType === 'PERCENTAGE' && (discountValue <= 0 || discountValue > 100)) {
    throw new AppError(HTTP_STATUS.badRequest, 'El porcentaje debe estar entre 1 y 100')
  }
  if (discountType === 'FIXED' && discountValue <= 0) {
    throw new AppError(HTTP_STATUS.badRequest, 'El monto debe ser mayor a 0')
  }

  const { data, error } = await supabase
    .from('offer')
    .insert({
      product_id: productId,
      discount_type: discountType,
      discount_value: discountValue,
      start_date: startDate,
      end_date: endDate
    })
    .select(OFFER_SELECT)
    .single()

  if (error) {
    if (error.code === '23503') {
      throw new AppError(HTTP_STATUS.badRequest, 'El producto indicado no existe')
    }
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo crear la oferta')
  }
  return data
}

const deleteOffer = async ({ id }) => {
  const { error } = await supabase.from('offer').delete().eq('id', id)
  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar la oferta')
  }
}

export { listOffers, createOffer, deleteOffer }
