import { z } from 'zod'
import {
  listProductsBySeller,
  createProduct,
  updateProduct,
  deleteProduct
} from '../../services/product.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// CRUD de productos PARA EL VENDEDOR logueado. A diferencia del admin, aquí el
// seller_id se toma del JWT (req.customer.id) y toda mutación valida que el
// producto sea de su tienda.

// Lista los productos del vendedor.
const myProductsController = async (req, res) => {
  const products = await listProductsBySeller({ sellerId: req.customer.id })
  return res.status(HTTP_STATUS.ok).json(products)
}

const bodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
  categoryId: z.uuidv4(),
  modelId: z.uuidv4().nullable().optional(),
  imageIds: z.array(z.uuidv4()).optional()
})

const createMyProductController = async (req, res) => {
  const body = bodySchema.parse(req.body)
  const product = await createProduct({ sellerId: req.customer.id, ...body })
  return res.status(HTTP_STATUS.created).json(product)
}

const updateMyProductController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const body = bodySchema.parse(req.body)
  const product = await updateProduct({
    id,
    requireOwner: req.customer.id, // fuerza ownership
    ...body
  })
  return res.status(HTTP_STATUS.ok).json(product)
}

const deleteMyProductController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  await deleteProduct({ id, requireOwner: req.customer.id })
  return res.status(HTTP_STATUS.noContent).end()
}

export {
  myProductsController,
  createMyProductController,
  updateMyProductController,
  deleteMyProductController
}
