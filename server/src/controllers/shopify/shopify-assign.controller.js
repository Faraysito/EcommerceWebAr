import { z } from 'zod'
import {
  listModels,
  listAssignments,
  assignModel,
  unassignModel
} from '../../services/shopify-assign.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// GET /api/customer/models
// Modelos 3D disponibles para reusar (lista global).
async function listModelsController(req, res) {
  const models = await listModels()
  return res.status(HTTP_STATUS.ok).json(models)
}

// GET /api/customer/shopify/assignments
// Mapa { gid: {...} } de qué producto Shopify ya tiene modelo asignado.
async function listAssignmentsController(req, res) {
  const result = await listAssignments(req.customer.id)
  return res.status(HTTP_STATUS.ok).json(result)
}

const dim = z.coerce.number().positive().nullable().optional()

const assignSchema = z.object({
  shopifyProductGid: z.string().min(1),
  productTitle: z.string().optional(),
  modelId: z.uuidv4(),
  widthCm: dim,
  heightCm: dim,
  depthCm: dim
})

// POST /api/customer/shopify/assign
// Asigna (o reasigna) un modelo existente + medidas a un producto Shopify.
async function assignModelController(req, res) {
  const body = assignSchema.parse(req.body)
  const result = await assignModel({ sellerId: req.customer.id, ...body })
  return res.status(HTTP_STATUS.ok).json(result)
}

const unassignSchema = z.object({ shopifyProductGid: z.string().min(1) })

// DELETE /api/customer/shopify/assign
// Quita la asignación de un producto Shopify.
async function unassignModelController(req, res) {
  const { shopifyProductGid } = unassignSchema.parse(req.body)
  const result = await unassignModel({ sellerId: req.customer.id, shopifyProductGid })
  return res.status(HTTP_STATUS.ok).json(result)
}

export {
  listModelsController,
  listAssignmentsController,
  assignModelController,
  unassignModelController
}
