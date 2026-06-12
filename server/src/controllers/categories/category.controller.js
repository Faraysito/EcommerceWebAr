import { z } from 'zod'
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../services/category.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

const getCategoriesController = async (req, res) => {
  const categories = await listCategories()
  return res.status(HTTP_STATUS.ok).json(categories)
}

const nameSchema = z.object({ name: z.string().min(1) })

const createCategoryController = async (req, res) => {
  const { name } = nameSchema.parse(req.body)
  const category = await createCategory({ name })
  return res.status(HTTP_STATUS.created).json(category)
}

const updateCategoryController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const { name } = nameSchema.parse(req.body)
  const category = await updateCategory({ id, name })
  return res.status(HTTP_STATUS.ok).json(category)
}

const deleteCategoryController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  await deleteCategory({ id })
  return res.status(HTTP_STATUS.noContent).end()
}

export {
  getCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController
}
