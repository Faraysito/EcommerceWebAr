import { z } from 'zod'
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../../services/product.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// --- Publico ---
// Catálogo del marketplace. Soporta ?search= y ?seller= para filtrar.
const getProductsController = async (req, res) => {
  const { search, seller } = z
    .object({ search: z.string().optional(), seller: z.uuidv4().optional() })
    .parse(req.query)

  const products = await listProducts({ search, sellerId: seller })
  return res.status(HTTP_STATUS.ok).json(products)
}

const getProductController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const product = await getProductById({ id })
  return res.status(HTTP_STATUS.ok).json(product)
}

// --- Admin (modera cualquier producto; sin restricción de dueño) ---
const bodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
  categoryId: z.uuidv4(),
  modelId: z.uuidv4().nullable().optional(),
  imageIds: z.array(z.uuidv4()).optional(),
  // El admin puede asignar el producto a un vendedor concreto.
  sellerId: z.uuidv4().optional()
})

const createProductController = async (req, res) => {
  const body = bodySchema.parse(req.body)
  const product = await createProduct(body)
  return res.status(HTTP_STATUS.created).json(product)
}

const updateProductController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const body = bodySchema.partial().parse(req.body)
  // requireOwner ausente => admin, edita cualquiera.
  const product = await updateProduct({ id, ...body })
  return res.status(HTTP_STATUS.ok).json(product)
}

const deleteProductController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  await deleteProduct({ id })
  return res.status(HTTP_STATUS.noContent).end()
}

export {
  getProductsController,
  getProductController,
  createProductController,
  updateProductController,
  deleteProductController
}
