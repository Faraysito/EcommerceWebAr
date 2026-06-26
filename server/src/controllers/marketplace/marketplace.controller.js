import { z } from 'zod'
import {
  getSettings,
  updateSettings,
  listPayouts,
  updatePayoutStatus
} from '../../services/marketplace.service.js'
import { listStores } from '../../services/customer.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// Panel ADMIN del marketplace: comisión global, directorio de vendedores y
// gestión de payouts (liquidaciones a vendedores).

// --- Configuración (comisión) ---
const getSettingsController = async (req, res) => {
  return res.status(HTTP_STATUS.ok).json(await getSettings())
}

const updateSettingsSchema = z.object({
  commissionPercent: z.number().int().min(0).max(100)
})

const updateSettingsController = async (req, res) => {
  const { commissionPercent } = updateSettingsSchema.parse(req.body)
  const settings = await updateSettings({ commissionPercent })
  return res.status(HTTP_STATUS.ok).json(settings)
}

// --- Vendedores ---
const listSellersController = async (req, res) => {
  return res.status(HTTP_STATUS.ok).json(await listStores())
}

// --- Payouts ---
const listPayoutsController = async (req, res) => {
  const { status } = z
    .object({ status: z.enum(['Pendiente', 'Pagado', 'Retenido']).optional() })
    .parse(req.query)
  return res.status(HTTP_STATUS.ok).json(await listPayouts({ status }))
}

const updatePayoutSchema = z.object({
  status: z.enum(['Pendiente', 'Pagado', 'Retenido'])
})

const updatePayoutController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const { status } = updatePayoutSchema.parse(req.body)
  const result = await updatePayoutStatus({ id, status })
  return res.status(HTTP_STATUS.ok).json(result)
}

export {
  getSettingsController,
  updateSettingsController,
  listSellersController,
  listPayoutsController,
  updatePayoutController
}
