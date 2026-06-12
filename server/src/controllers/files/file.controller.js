import { z } from 'zod'
import {
  uploadImage,
  listImages,
  deleteImage,
  uploadModel,
  listModels,
  deleteModel
} from '../../services/file.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

const idSchema = z.object({ id: z.uuidv4() })

// --- Imagenes ---
const uploadImageController = async (req, res) => {
  const image = await uploadImage({ file: req.file, name: req.body?.name })
  return res.status(HTTP_STATUS.created).json(image)
}

const getImagesController = async (req, res) => {
  return res.status(HTTP_STATUS.ok).json(await listImages())
}

const deleteImageController = async (req, res) => {
  const { id } = idSchema.parse(req.params)
  await deleteImage({ id })
  return res.status(HTTP_STATUS.noContent).end()
}

// --- Modelos 3D ---
const uploadModelController = async (req, res) => {
  const model = await uploadModel({ file: req.file, name: req.body?.name })
  return res.status(HTTP_STATUS.created).json(model)
}

const getModelsController = async (req, res) => {
  return res.status(HTTP_STATUS.ok).json(await listModels())
}

const deleteModelController = async (req, res) => {
  const { id } = idSchema.parse(req.params)
  await deleteModel({ id })
  return res.status(HTTP_STATUS.noContent).end()
}

export {
  uploadImageController,
  getImagesController,
  deleteImageController,
  uploadModelController,
  getModelsController,
  deleteModelController
}
