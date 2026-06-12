import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Crea un usuario. OJO: Supabase devuelve { data, error }, no { success }.
const createUser = async ({ email, password, roleId }) => {
  const { error } = await supabase.from('user').insert({ email, password, role_id: roleId })

  if (error) {
    // 23505 = unique_violation (email ya existe)
    if (error.code === '23505') {
      throw new AppError(HTTP_STATUS.conflict, 'El email ya está registrado')
    }
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo crear el usuario')
  }
}

// Trae un usuario por email junto con su rol. Lo usa el login.
const getUserByEmail = async ({ email }) => {
  const { data, error } = await supabase
    .from('user')
    .select(
      `
        id,
        email,
        password,
        role (
          id,
          name
        ),
        created_at
      `
    )
    .eq('email', email)
    .limit(1)
    .single()

  if (error || !data) {
    throw new AppError(HTTP_STATUS.notFound, 'Usuario no encontrado')
  }

  return data
}

// Devuelve la lista de nombres de permisos de un rol (ej. ['product.read',
// 'product.create', ...]). Se usa en el login para meterlos en el JWT.
const getRolePermissions = async ({ roleId }) => {
  const { data, error } = await supabase
    .from('role_permission')
    .select('permission ( name )')
    .eq('role_id', roleId)

  if (error || !data) return []

  return data.map(row => row.permission?.name).filter(Boolean)
}

// Lista todos los usuarios (para el panel de gestion de usuarios del admin).
const listUsers = async () => {
  const { data, error } = await supabase
    .from('user')
    .select('id, email, role ( id, name ), created_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar los usuarios')
  }

  return data
}

// Elimina un usuario por id.
const deleteUser = async ({ id }) => {
  const { error } = await supabase.from('user').delete().eq('id', id)

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar el usuario')
  }
}

// Lista todos los roles (para el selector del form de crear usuario).
const listRoles = async () => {
  const { data, error } = await supabase
    .from('role')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar los roles')
  }

  return data
}

export { createUser, getUserByEmail, getRolePermissions, listUsers, deleteUser, listRoles }
