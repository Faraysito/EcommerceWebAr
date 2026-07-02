import { z } from 'zod'
import {
  listFamilies,
  getFamily,
  createFamily,
  updateFamily,
  deleteFamily,
  createAttribute,
  updateAttribute,
  deleteAttribute
} from '../../services/pim.service.js'
import { familyBodySchema, attributeBodySchema } from '../../schemas/pim.schema.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// --- Familias ---
const listFamiliesController = async (req, res) => {
  const families = await listFamilies()
  return res.status(HTTP_STATUS.ok).json(families)
}

const getFamilyController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const family = await getFamily({ id })
  return res.status(HTTP_STATUS.ok).json(family)
}

const createFamilyController = async (req, res) => {
  const body = familyBodySchema.parse(req.body)
  const family = await createFamily(body)
  return res.status(HTTP_STATUS.created).json(family)
}

const updateFamilyController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const body = familyBodySchema.partial().parse(req.body)
  const family = await updateFamily({ id, ...body })
  return res.status(HTTP_STATUS.ok).json(family)
}

const deleteFamilyController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  await deleteFamily({ id })
  return res.status(HTTP_STATUS.noContent).end()
}

// --- Atributos (anidados bajo una familia) ---
const createAttributeController = async (req, res) => {
  const { familyId } = z.object({ familyId: z.uuidv4() }).parse(req.params)
  const body = attributeBodySchema.parse(req.body)
  const family = await createAttribute({ familyId, ...body })
  return res.status(HTTP_STATUS.created).json(family)
}

const updateAttributeController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const body = attributeBodySchema.partial().parse(req.body)
  const family = await updateAttribute({ id, ...body })
  return res.status(HTTP_STATUS.ok).json(family)
}

const deleteAttributeController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const family = await deleteAttribute({ id })
  return res.status(HTTP_STATUS.ok).json(family)
}

export {
  listFamiliesController,
  getFamilyController,
  createFamilyController,
  updateFamilyController,
  deleteFamilyController,
  createAttributeController,
  updateAttributeController,
  deleteAttributeController
}
