import { Router } from 'express'
import { registerController } from '../controllers/auth/register.controller.js'
import { loginController } from '../controllers/auth/login.controller.js'
import { logoutController } from '../controllers/auth/logout.controller.js'

const authRouter = Router()

authRouter.post('/register', registerController)
authRouter.post('/login', loginController)
authRouter.post('/logout', logoutController)

export { authRouter }
