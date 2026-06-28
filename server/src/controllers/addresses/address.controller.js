import { z } from 'zod'
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress
} from '../../services/address.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// Direcciones de despacho del cliente logueado.

const listController = async (req, res) => {
  const addresses = await listAddresses({ customerId: req.customer.id })
  return res.status(HTTP_STATUS.ok).json(addresses)
}

const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  recipient: z.string().trim().min(1),
  phone: z.string().trim().max(30).optional(),
  region: z.string().trim().max(80).optional(),
  commune: z.string().trim().max(80).optional(),
  addressLine: z.string().trim().min(1),
  extra: z.string().trim().max(200).optional(),
  isDefault: z.boolean().optional()
})

const createController = async (req, res) => {
  const address = addressSchema.parse(req.body)
  const created = await createAddress({ customerId: req.customer.id, address })
  return res.status(HTTP_STATUS.created).json(created)
}

const updateController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const address = addressSchema.partial().parse(req.body)
  const updated = await updateAddress({ addressId: id, customerId: req.customer.id, address })
  return res.status(HTTP_STATUS.ok).json(updated)
}

const deleteController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  await deleteAddress({ addressId: id, customerId: req.customer.id })
  return res.status(HTTP_STATUS.noContent).end()
}

export { listController, createController, updateController, deleteController }
