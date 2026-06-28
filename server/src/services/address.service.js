import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Direcciones de despacho del comprador. Solo el dueño accede a las suyas.
// Regla "una sola predeterminada": al marcar una como default, el backend
// desmarca las demás del mismo cliente.

const ADDRESS_SELECT = `
  id, label, recipient, phone, region, commune,
  address_line, extra, is_default, created_at
`

function shapeAddress(row) {
  return {
    id: row.id,
    label: row.label,
    recipient: row.recipient,
    phone: row.phone,
    region: row.region,
    commune: row.commune,
    addressLine: row.address_line,
    extra: row.extra,
    isDefault: row.is_default,
    createdAt: row.created_at
  }
}

const listAddresses = async ({ customerId }) => {
  const { data, error } = await supabase
    .from('customer_address')
    .select(ADDRESS_SELECT)
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron leer tus direcciones')
  }

  return (data ?? []).map(shapeAddress)
}

// Si la nueva dirección viene como default, desmarca el resto primero.
async function clearDefault(customerId) {
  await supabase
    .from('customer_address')
    .update({ is_default: false })
    .eq('customer_id', customerId)
    .eq('is_default', true)
}

const createAddress = async ({ customerId, address }) => {
  if (address.isDefault) await clearDefault(customerId)

  const { data, error } = await supabase
    .from('customer_address')
    .insert({
      customer_id: customerId,
      label: address.label ?? null,
      recipient: address.recipient,
      phone: address.phone ?? null,
      region: address.region ?? null,
      commune: address.commune ?? null,
      address_line: address.addressLine,
      extra: address.extra ?? null,
      is_default: Boolean(address.isDefault)
    })
    .select(ADDRESS_SELECT)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo guardar la dirección')
  }

  return shapeAddress(data)
}

// Verifica que la dirección sea del cliente antes de mutarla.
async function assertOwnership(addressId, customerId) {
  const { data } = await supabase
    .from('customer_address')
    .select('id, customer_id')
    .eq('id', addressId)
    .maybeSingle()

  if (!data) throw new AppError(HTTP_STATUS.notFound, 'Dirección no encontrada')
  if (data.customer_id !== customerId) {
    throw new AppError(HTTP_STATUS.unauthorized, 'Esta dirección no es tuya')
  }
}

const updateAddress = async ({ addressId, customerId, address }) => {
  await assertOwnership(addressId, customerId)
  if (address.isDefault) await clearDefault(customerId)

  const patch = {}
  if (address.label !== undefined) patch.label = address.label
  if (address.recipient !== undefined) patch.recipient = address.recipient
  if (address.phone !== undefined) patch.phone = address.phone
  if (address.region !== undefined) patch.region = address.region
  if (address.commune !== undefined) patch.commune = address.commune
  if (address.addressLine !== undefined) patch.address_line = address.addressLine
  if (address.extra !== undefined) patch.extra = address.extra
  if (address.isDefault !== undefined) patch.is_default = Boolean(address.isDefault)

  const { data, error } = await supabase
    .from('customer_address')
    .update(patch)
    .eq('id', addressId)
    .select(ADDRESS_SELECT)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo actualizar la dirección')
  }

  return shapeAddress(data)
}

const deleteAddress = async ({ addressId, customerId }) => {
  await assertOwnership(addressId, customerId)
  const { error } = await supabase.from('customer_address').delete().eq('id', addressId)
  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar la dirección')
  }
}

export { listAddresses, createAddress, updateAddress, deleteAddress }
