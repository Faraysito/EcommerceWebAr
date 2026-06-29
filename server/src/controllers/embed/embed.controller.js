import { z } from 'zod'
import { getEmbedModel, registerEmbedView } from '../../services/embed.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

const idSchema = z.object({ id: z.uuidv4() })

// GET /api/embed/:id -> datos del modelo para el visor del iframe (público).
const getEmbedModelController = async (req, res) => {
  const { id } = idSchema.parse(req.params)
  const model = await getEmbedModel({ id })
  return res.status(HTTP_STATUS.ok).json(model)
}

// POST /api/embed/:id/view -> registra una apertura del visor (público).
const registerEmbedViewController = async (req, res) => {
  const { id } = idSchema.parse(req.params)
  await registerEmbedView({ id })
  return res.status(HTTP_STATUS.noContent).end()
}

export { getEmbedModelController, registerEmbedViewController }
