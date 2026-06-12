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
const getProductsController = async (req, res) => {
  const products = await listProducts()
  return res.status(HTTP_STATUS.ok).json(products)
}

const getProductController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const product = await getProductById({ id })
  return res.status(HTTP_STATUS.ok).json(product)
}

// --- Admin ---
const bodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
  categoryId: z.uuidv4(),
  modelId: z.uuidv4().nullable().optional(),
  imageIds: z.array(z.uuidv4()).optional()
})

const createProductController = async (req, res) => {
  const body = bodySchema.parse(req.body)
  const product = await createProduct(body)
  return res.status(HTTP_STATUS.created).json(product)
}

const updateProductController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const body = bodySchema.parse(req.body)
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
