import { z } from 'zod'
import { getSimilarProducts } from '../../services/recommendation.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// Público: devuelve los productos similares a uno dado. ?limit= (1-20, def 8).
const getSimilarProductsController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const { limit } = z
    .object({ limit: z.coerce.number().int().min(1).max(20).optional() })
    .parse(req.query)

  const products = await getSimilarProducts({ productId: id, k: limit ?? 8 })
  return res.status(HTTP_STATUS.ok).json(products)
}

export { getSimilarProductsController }
