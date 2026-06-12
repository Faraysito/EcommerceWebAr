import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Cliente de la tienda (quien compra). Es independiente de la tabla "user",
// que es para el personal del panel admin. El cliente se autentica con
// email + contraseña, igual que el admin, pero con su propia cookie/sesión.

// Crea un cliente. La contraseña llega YA hasheada desde el controller.
const createCustomer = async ({ email, password, name }) => {
  const { data, error } = await supabase
    .from('customer')
    .insert({ email, password, name: name ?? null })
    .select('id, email, name')
    .single()

  if (error || !data) {
    // 23505 = unique_violation (email ya registrado)
    if (error?.code === '23505') {
      throw new AppError(HTTP_STATUS.conflict, 'Ese email ya está registrado')
    }
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo crear la cuenta')
  }

  return data
}

// Trae un cliente por email (incluye el hash de password, lo usa el login).
const getCustomerByEmail = async ({ email }) => {
  const { data, error } = await supabase
    .from('customer')
    .select('id, email, password, name')
    .eq('email', email)
    .limit(1)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.notFound, 'Cliente no encontrado')
  }

  return data
}

export { createCustomer, getCustomerByEmail }
