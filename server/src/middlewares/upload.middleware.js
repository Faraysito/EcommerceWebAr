import multer from 'multer'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Guarda el archivo en memoria (buffer) para subirlo a Supabase Storage.
// No escribe a disco.
const storage = multer.memoryStorage()

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
// .glb suele llegar como model/gltf-binary o application/octet-stream.
const MODEL_TYPES = ['model/gltf-binary', 'application/octet-stream']

function makeUploader({ allowedTypes, maxSizeMb, allowGlbExt = false }) {
  return multer({
    storage,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const okType = allowedTypes.includes(file.mimetype)
      const okExt = allowGlbExt && file.originalname.toLowerCase().endsWith('.glb')
      if (okType || okExt) return cb(null, true)
      cb(new AppError(HTTP_STATUS.badRequest, 'Tipo de archivo no permitido'))
    }
  }).single('file')
}

// Imagenes: hasta 5MB. Modelos .glb: hasta 50MB.
const imageUpload = makeUploader({ allowedTypes: IMAGE_TYPES, maxSizeMb: 5 })
const modelUpload = makeUploader({ allowedTypes: MODEL_TYPES, maxSizeMb: 50, allowGlbExt: true })

// Envuelve el middleware de multer para convertir sus errores (ej. tamaño
// excedido) en AppError con mensaje claro.
function wrapMulter(uploader) {
  return (req, res, next) => {
    uploader(req, res, err => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError(HTTP_STATUS.badRequest, 'El archivo es demasiado grande'))
        }
        return next(err)
      }
      if (!req.file) {
        return next(new AppError(HTTP_STATUS.badRequest, 'No se recibió ningún archivo'))
      }
      next()
    })
  }
}

const uploadImageMiddleware = wrapMulter(imageUpload)
const uploadModelMiddleware = wrapMulter(modelUpload)

export { uploadImageMiddleware, uploadModelMiddleware }
