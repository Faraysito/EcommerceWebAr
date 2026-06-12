import { z } from 'zod'
import bcrypt from 'bcrypt'
import { createUser, listUsers, deleteUser, listRoles } from '../../services/user.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'
import { AppError } from '../../utils/AppError.js'

const getUsersController = async (req, res) => {
  return res.status(HTTP_STATUS.ok).json(await listUsers())
}

const getRolesController = async (req, res) => {
  return res.status(HTTP_STATUS.ok).json(await listRoles())
}

const createUserSchema = z.object({
  email: z.email().min(1),
  password: z.string().min(8),
  roleId: z.uuidv4()
})

const createUserController = async (req, res) => {
  const { email, password, roleId } = createUserSchema.parse(req.body)
  const hashedPassword = await bcrypt.hash(password, 10)
  await createUser({ email, password: hashedPassword, roleId })
  return res.status(HTTP_STATUS.created).json({ message: 'Usuario creado correctamente' })
}

const deleteUserController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)

  // No permitir que un usuario se borre a si mismo.
  if (req.user?.id === id) {
    throw new AppError(HTTP_STATUS.badRequest, 'No puedes eliminar tu propia cuenta')
  }

  await deleteUser({ id })
  return res.status(HTTP_STATUS.noContent).end()
}

export { getUsersController, getRolesController, createUserController, deleteUserController }
