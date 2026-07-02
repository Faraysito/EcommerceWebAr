import { z } from 'zod'
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories
} from '../../services/pim.service.js'
import { productBodySchema, PIM_STATUS } from '../../schemas/pim.schema.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(PIM_STATUS).optional(),
  familyId: z.uuidv4().optional(),
  supplier: z.string().optional()
})

const listProductsController = async (req, res) => {
  const query = listQuerySchema.parse(req.query)
  const products = await listProducts({
    search: query.search,
    status: query.status,
    familyId: query.familyId,
    supplier: query.supplier
  })
  return res.status(HTTP_STATUS.ok).json(products)
}

const getProductController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const product = await getProduct({ id })
  return res.status(HTTP_STATUS.ok).json(product)
}

const createProductController = async (req, res) => {
  const body = productBodySchema.parse(req.body)
  const product = await createProduct(body)
  return res.status(HTTP_STATUS.created).json(product)
}

const updateProductController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const body = productBodySchema.partial().parse(req.body)
  const product = await updateProduct({ id, ...body })
  return res.status(HTTP_STATUS.ok).json(product)
}

const deleteProductController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  await deleteProduct({ id })
  return res.status(HTTP_STATUS.noContent).end()
}

const listCategoriesController = async (req, res) => {
  const categories = await listCategories()
  return res.status(HTTP_STATUS.ok).json(categories)
}

export {
  listProductsController,
  getProductController,
  createProductController,
  updateProductController,
  deleteProductController,
  listCategoriesController
}
