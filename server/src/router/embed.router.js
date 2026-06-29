import { Router } from 'express'
import {
  getEmbedModelController,
  registerEmbedViewController
} from '../controllers/embed/embed.controller.js'

// Rutas PÚBLICAS del EMBED (iframe en tiendas externas). Sin auth.
const embedRouter = Router()

embedRouter.get('/embed/:id', getEmbedModelController)
embedRouter.post('/embed/:id/view', registerEmbedViewController)

export { embedRouter }
