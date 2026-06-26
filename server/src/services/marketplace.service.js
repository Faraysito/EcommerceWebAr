import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Configuración global del marketplace (fila única id=1) y gestión de payouts
// desde el panel admin.

// Devuelve la comisión vigente (%). Si por algún motivo no hay fila, asume 10.
const getCommissionPercent = async () => {
  const { data } = await supabase
    .from('marketplace_setting')
    .select('commission_percent')
    .eq('id', 1)
    .maybeSingle()

  return data?.commission_percent ?? 10
}

const getSettings = async () => {
  const { data, error } = await supabase
    .from('marketplace_setting')
    .select('commission_percent, currency, updated_at')
    .eq('id', 1)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo leer la configuración')
  }

  return {
    commissionPercent: data.commission_percent,
    currency: data.currency,
    updatedAt: data.updated_at
  }
}

const updateSettings = async ({ commissionPercent }) => {
  const { data, error } = await supabase
    .from('marketplace_setting')
    .update({ commission_percent: commissionPercent, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select('commission_percent, currency, updated_at')
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo actualizar la configuración')
  }

  return {
    commissionPercent: data.commission_percent,
    currency: data.currency,
    updatedAt: data.updated_at
  }
}

// --- Payouts (admin) ---
// Lista todos los payouts con datos de la tienda y la orden.
const listPayouts = async ({ status } = {}) => {
  let query = supabase
    .from('payout')
    .select(
      `
      id, gross_amount, commission_amount, net_amount, status, paid_at, created_at,
      seller:seller_id ( id, store_name, store_slug, email ),
      sale:sale_id ( id, status, created_at )
    `
    )
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar los payouts')
  }

  return (data ?? []).map(p => ({
    id: p.id,
    grossAmount: p.gross_amount,
    commissionAmount: p.commission_amount,
    netAmount: p.net_amount,
    status: p.status,
    paidAt: p.paid_at,
    createdAt: p.created_at,
    sellerId: p.seller?.id ?? null,
    storeName: p.seller?.store_name ?? null,
    sellerEmail: p.seller?.email ?? null,
    saleId: p.sale?.id ?? null
  }))
}

// Marca un payout como pagado (o cambia su estado). Lo usa el admin tras hacer
// la transferencia al vendedor.
const updatePayoutStatus = async ({ id, status }) => {
  const patch = { status }
  if (status === 'Pagado') patch.paid_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('payout')
    .update(patch)
    .eq('id', id)
    .select('id, status, paid_at')
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo actualizar el payout')
  }

  return { id: data.id, status: data.status, paidAt: data.paid_at }
}

export { getCommissionPercent, getSettings, updateSettings, listPayouts, updatePayoutStatus }
