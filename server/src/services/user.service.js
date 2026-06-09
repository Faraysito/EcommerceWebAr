import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

const createUser = async ({ email, password, roleId }) => {
  const { success } = await supabase.from('user').insert({ email, password, role_id: roleId })

  if (!success) {
    throw new AppError(HTTP_STATUS.internalServerError, 'The user could not be created')
  }

  return
}

const getUserByEmail = async ({ email }) => {
  const { data, success } = await supabase
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

  if (!success) {
    throw new AppError(HTTP_STATUS.notFound, 'User not found')
  }

  return data
}

export { createUser, getUserByEmail }
