import { parseUpload, commitImport } from '../../services/pim-import.service.js'
import { importCommitSchema } from '../../schemas/pim.schema.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// Paso 1: sube el CSV (multipart 'file') y devuelve columnas + filas.
const parseImportController = async (req, res) => {
  const result = parseUpload({ file: req.file })
  return res.status(HTTP_STATUS.ok).json(result)
}

// Paso 2: crea los productos según el mapeo.
const commitImportController = async (req, res) => {
  const body = importCommitSchema.parse(req.body)
  const report = await commitImport(body)
  return res.status(HTTP_STATUS.ok).json(report)
}

export { parseImportController, commitImportController }
