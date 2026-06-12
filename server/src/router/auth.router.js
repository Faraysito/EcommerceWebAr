import { Router } from 'express'
import { registerController } from '../controllers/auth/register.controller.js'
import { loginController } from '../controllers/auth/login.controller.js'
import { logoutController } from '../controllers/auth/logout.controller.js'
import { verifyController } from '../controllers/auth/verify.controller.js'
import auth from '../middlewares/auth.middleware.js'

const authRouter = Router()

authRouter.post('/register', registerController)
authRouter.post('/login', loginController)
authRouter.post('/logout', logoutController)
authRouter.get('/verify', auth, verifyController)

export { authRouter }
