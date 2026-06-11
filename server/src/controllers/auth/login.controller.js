import { getUserByEmail, getRolePermissions } from '../../services/user.service.js'
import { COOKIE_OPTIONS } from '../../utils/cookie-options.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'
import { AppError } from '../../utils/AppError.js'
import { env } from '../../config/env.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const bodySchema = z.object({
  email: z.email().min(1),
  password: z.string().min(8)
})

// Nombre del rol que actua como superadmin (acceso total). Coincide con el
// rol sembrado en database/test-values.sql.
const SUPER_ADMIN_ROLE = 'admin'

const loginController = async (req, res) => {
  const { email, password } = bodySchema.parse(req.body)

  const { password: hashedPassword, ...restUser } = await getUserByEmail({ email })

  const checkPassword = await bcrypt.compare(password, hashedPassword)

  if (!checkPassword) {
    throw new AppError(HTTP_STATUS.badRequest, 'Email o contraseña inválidos')
  }

  const isSuperAdmin = restUser.role?.name === SUPER_ADMIN_ROLE

  // Superadmin no necesita lista de permisos (bypasea todo). El resto lleva
  // sus permisos firmados en el token para no consultar la BD en cada request.
  const permissions = isSuperAdmin ? [] : await getRolePermissions({ roleId: restUser.role.id })

  const payload = { ...restUser, isSuperAdmin, permissions }

  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1d' })

  return res
    .status(HTTP_STATUS.ok)
    .cookie('auth-token', token, COOKIE_OPTIONS)
    .json(payload)
}

export { loginController }
