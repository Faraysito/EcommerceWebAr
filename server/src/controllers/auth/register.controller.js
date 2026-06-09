import bcrypt from 'bcrypt'
import { z } from 'zod'
import { createUser } from '../../services/user.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

const bodySchema = z.object({
  email: z.email().min(1),
  password: z.string().min(8),
  roleId: z.uuidv4()
})

const registerController = async (req, res) => {
  const { email, password, roleId } = bodySchema.parse(req.body)

  const hashedPassword = await bcrypt.hash(password, 10)

  createUser({ email, password: hashedPassword, roleId })

  return res.status(HTTP_STATUS.created).json({ message: 'User created successfully' })
}

export { registerController }
