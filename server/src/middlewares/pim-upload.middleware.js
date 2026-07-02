import multer from 'multer'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

// Uploader del DAM: acepta imágenes, modelos 3D (.glb/.usdz), documentos PDF y
// video mp4. Guarda en memoria (buffer) para subir a Supabase Storage, igual
// que upload.middleware.js del storefront (que no tocamos).

const storage = multer.memoryStorage()

const ALLOWED_MIME = new Set([
  // imágenes
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // modelos 3D
  'model/gltf-binary',
  'model/vnd.usdz+zip',
  // documentos
  'application/pdf',
  // video
  'video/mp4',
  'video/webm',
  // fallback binario (glb/usdz suelen llegar así)
  'application/octet-stream'
])

// 50MB cubre modelos 3D y PDFs de fichas técnicas.
const MAX_SIZE_MB = 50

const uploader = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = file.originalname.toLowerCase()
    const okMime = ALLOWED_MIME.has(file.mimetype)
    const okExt =
      name.endsWith('.glb') ||
      name.endsWith('.usdz') ||
      name.endsWith('.pdf') ||
      name.endsWith('.mp4')
    if (okMime || okExt) return cb(null, true)
    cb(new AppError(HTTP_STATUS.badRequest, 'Tipo de archivo no permitido en el DAM'))
  }
}).single('file')

function uploadAssetMiddleware(req, res, next) {
  uploader(req, res, err => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(HTTP_STATUS.badRequest, 'El archivo supera 50MB'))
      }
      return next(err)
    }
    if (!req.file) {
      return next(new AppError(HTTP_STATUS.badRequest, 'No se recibió ningún archivo'))
    }
    next()
  })
}

// El uploader del import solo acepta CSV.
const csvUploader = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = file.originalname.toLowerCase()
    const ok =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'application/octet-stream' ||
      name.endsWith('.csv')
    if (ok) return cb(null, true)
    cb(new AppError(HTTP_STATUS.badRequest, 'Sube un archivo .csv'))
  }
}).single('file')

function uploadCsvMiddleware(req, res, next) {
  csvUploader(req, res, err => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(HTTP_STATUS.badRequest, 'El CSV supera 10MB'))
      }
      return next(err)
    }
    if (!req.file) {
      return next(new AppError(HTTP_STATUS.badRequest, 'No se recibió ningún archivo'))
    }
    next()
  })
}

export { uploadAssetMiddleware, uploadCsvMiddleware }
