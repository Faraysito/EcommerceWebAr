import { z } from 'zod'
import {
  uploadAsset,
  listAssets,
  updateAsset,
  deleteAsset,
  linkAsset,
  unlinkAsset
} from '../../services/pim-asset.service.js'
import { assetUpdateSchema, assetLinkSchema, ASSET_TYPES } from '../../schemas/pim.schema.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// Sube un activo (multipart: campo 'file', opcional 'name' y 'tags').
const uploadAssetController = async (req, res) => {
  const asset = await uploadAsset({
    file: req.file,
    name: req.body?.name,
    tags: req.body?.tags // string "a,b,c" o ausente
  })
  return res.status(HTTP_STATUS.created).json(asset)
}

const listAssetsController = async (req, res) => {
  const query = z
    .object({
      type: z.enum(ASSET_TYPES).optional(),
      tag: z.string().optional(),
      search: z.string().optional()
    })
    .parse(req.query)
  const assets = await listAssets(query)
  return res.status(HTTP_STATUS.ok).json(assets)
}

const updateAssetController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  const body = assetUpdateSchema.parse(req.body)
  const asset = await updateAsset({ id, ...body })
  return res.status(HTTP_STATUS.ok).json(asset)
}

const deleteAssetController = async (req, res) => {
  const { id } = z.object({ id: z.uuidv4() }).parse(req.params)
  await deleteAsset({ id })
  return res.status(HTTP_STATUS.noContent).end()
}

// Vincula un activo existente a un producto.
const linkAssetController = async (req, res) => {
  const { productId } = z.object({ productId: z.uuidv4() }).parse(req.params)
  const body = assetLinkSchema.parse(req.body)
  await linkAsset({ productId, ...body })
  return res.status(HTTP_STATUS.noContent).end()
}

const unlinkAssetController = async (req, res) => {
  const { productId, assetId } = z
    .object({ productId: z.uuidv4(), assetId: z.uuidv4() })
    .parse(req.params)
  await unlinkAsset({ productId, assetId })
  return res.status(HTTP_STATUS.noContent).end()
}

export {
  uploadAssetController,
  listAssetsController,
  updateAssetController,
  deleteAssetController,
  linkAssetController,
  unlinkAssetController
}
