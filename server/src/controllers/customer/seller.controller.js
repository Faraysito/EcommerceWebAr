import { z } from 'zod'
import {
  becomeSeller,
  getSellerPayoutInfo,
  getStoreBySlug,
  listStores
} from '../../services/customer.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// Datos de pago del vendedor (cómo se le liquida el dinero de sus ventas).
const payoutSchema = z
  .object({
    bank: z.string().trim().min(1).optional(),
    accountType: z.string().trim().min(1).optional(),
    accountNumber: z.string().trim().min(1).optional(),
    holderName: z.string().trim().min(1).optional(),
    holderDoc: z.string().trim().min(1).optional()
  })
  .optional()

// --- Abrir tienda / actualizar perfil de vendedor (auto-aprobado) ---
const becomeSellerSchema = z.object({
  storeName: z.string().trim().min(2).max(60),
  storeBio: z.string().trim().max(500).optional(),
  payout: payoutSchema
})

const becomeSellerController = async (req, res) => {
  const { storeName, storeBio, payout } = becomeSellerSchema.parse(req.body)

  const customer = await becomeSeller({
    customerId: req.customer.id,
    storeName,
    storeBio,
    payout
  })

  // Devuelve el perfil actualizado. El frontend reemite sesión vía /verify.
  return res.status(HTTP_STATUS.ok).json({
    id: customer.id,
    email: customer.email,
    name: customer.name,
    isSeller: Boolean(customer.is_seller),
    storeName: customer.store_name,
    storeSlug: customer.store_slug,
    storeBio: customer.store_bio,
    sellerSince: customer.seller_since
  })
}

// --- Leer mis datos de pago (solo el vendedor) ---
const getMyPayoutInfoController = async (req, res) => {
  const info = await getSellerPayoutInfo({ customerId: req.customer.id })
  return res.status(HTTP_STATUS.ok).json(info)
}

// --- Perfil público de una tienda por slug ---
const getStoreController = async (req, res) => {
  const { slug } = z.object({ slug: z.string().min(1) }).parse(req.params)
  const store = await getStoreBySlug({ slug })
  return res.status(HTTP_STATUS.ok).json(store)
}

// --- Directorio público de tiendas ---
const listStoresController = async (req, res) => {
  const stores = await listStores()
  // En la versión pública no exponemos el email del vendedor.
  return res.status(HTTP_STATUS.ok).json(
    stores.map(({ email, ...rest }) => rest)
  )
}

export {
  becomeSellerController,
  getMyPayoutInfoController,
  getStoreController,
  listStoresController
}
