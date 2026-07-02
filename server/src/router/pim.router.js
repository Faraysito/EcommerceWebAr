import { Router } from 'express'
import auth from '../middlewares/auth.middleware.js'
import { requirePermission } from '../middlewares/permission.middleware.js'
import { uploadAssetMiddleware, uploadCsvMiddleware } from '../middlewares/pim-upload.middleware.js'

import {
  listFamiliesController,
  getFamilyController,
  createFamilyController,
  updateFamilyController,
  deleteFamilyController,
  createAttributeController,
  updateAttributeController,
  deleteAttributeController
} from '../controllers/pim/family.controller.js'
import {
  listProductsController,
  getProductController,
  createProductController,
  updateProductController,
  deleteProductController,
  listCategoriesController
} from '../controllers/pim/pim-product.controller.js'
import {
  uploadAssetController,
  listAssetsController,
  updateAssetController,
  deleteAssetController,
  linkAssetController,
  unlinkAssetController
} from '../controllers/pim/asset.controller.js'
import {
  parseImportController,
  commitImportController
} from '../controllers/pim/import.controller.js'
import {
  listChannelsController,
  getProductChannelsController,
  setProductChannelStatusController,
  syndicateController
} from '../controllers/pim/channel.controller.js'
import { getStatsController } from '../controllers/pim/pim-stats.controller.js'

// Router del PIM + DAM (Weseller). Se monta en /api/pim.
// Todo pasa por auth (cookie JWT del panel admin) + permiso 'pim.access'.
// El superadmin bypasea el permiso.
const pimRouter = Router()
pimRouter.use(auth, requirePermission('pim.access'))

// --- Dashboard ---
pimRouter.get('/stats', getStatsController)

// --- Metadatos para los formularios ---
pimRouter.get('/categories', listCategoriesController)

// --- Familias y atributos ---
pimRouter.get('/families', listFamiliesController)
pimRouter.post('/families', createFamilyController)
pimRouter.get('/families/:id', getFamilyController)
pimRouter.put('/families/:id', updateFamilyController)
pimRouter.delete('/families/:id', deleteFamilyController)
pimRouter.post('/families/:familyId/attributes', createAttributeController)
pimRouter.put('/attributes/:id', updateAttributeController)
pimRouter.delete('/attributes/:id', deleteAttributeController)

// --- Productos ---
pimRouter.get('/products', listProductsController)
pimRouter.post('/products', createProductController)
pimRouter.get('/products/:id', getProductController)
pimRouter.put('/products/:id', updateProductController)
pimRouter.delete('/products/:id', deleteProductController)

// --- DAM: activos ---
pimRouter.get('/assets', listAssetsController)
pimRouter.post('/assets', uploadAssetMiddleware, uploadAssetController)
pimRouter.put('/assets/:id', updateAssetController)
pimRouter.delete('/assets/:id', deleteAssetController)

// --- DAM: vínculo activo <-> producto ---
pimRouter.post('/products/:productId/assets', linkAssetController)
pimRouter.delete('/products/:productId/assets/:assetId', unlinkAssetController)

// --- Importación CSV ---
pimRouter.post('/import/parse', uploadCsvMiddleware, parseImportController)
pimRouter.post('/import/commit', commitImportController)

// --- Canales / sindicación ---
pimRouter.get('/channels', listChannelsController)
pimRouter.get('/products/:productId/channels', getProductChannelsController)
pimRouter.put('/products/:productId/channels', setProductChannelStatusController)
pimRouter.post('/products/:productId/syndicate', syndicateController)

export { pimRouter }
