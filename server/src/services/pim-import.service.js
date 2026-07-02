import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'
import { parseCsv } from '../utils/csv.js'

// ============================================================
// Ingesta masiva desde CSV (importadores). Flujo en dos pasos:
//   1) parse   -> lee el archivo y devuelve columnas + filas (para mapear en UI)
//   2) commit  -> recibe el mapeo columna->campo y crea los productos
//
// Excel (.xlsx) puede agregarse luego con SheetJS; para la demo el estándar de
// intercambio es CSV (lo exportan todos los ERPs / planillas).
// ============================================================

// Paso 1: parsea el buffer del CSV subido.
const parseUpload = ({ file }) => {
  const { headers, rows } = parseCsv(file.buffer)
  if (headers.length === 0) throw new AppError(HTTP_STATUS.badRequest, 'El CSV está vacío o mal formado')
  return {
    headers,
    rowCount: rows.length,
    sample: rows.slice(0, 5),
    rows
  }
}

function toInt(value) {
  if (value === undefined || value === null || value === '') return null
  const n = parseInt(String(value).replace(/[^\d-]/g, ''), 10)
  return Number.isNaN(n) ? null : n
}

// Paso 2: valida y crea productos según el mapeo. Devuelve un reporte.
const commitImport = async ({ familyId, categoryId, supplier, status, mapping, rows }) => {
  // Definiciones de atributos de la familia (para validar obligatorios).
  let attributeDefs = []
  if (familyId) {
    const { data } = await supabase
      .from('pim_attribute')
      .select('code, label, required, type')
      .eq('family_id', familyId)
    attributeDefs = data ?? []
  }
  const requiredAttrs = attributeDefs.filter(a => a.required)

  const toInsert = []
  const errors = []

  rows.forEach((row, idx) => {
    const line = idx + 2 // +1 header, +1 base-1
    const name = mapping.name ? (row[mapping.name] ?? '').trim() : ''
    if (!name) {
      errors.push({ line, message: 'Sin nombre (columna obligatoria)' })
      return
    }

    // Atributos según el mapeo code->columna.
    const attributes = {}
    for (const [code, col] of Object.entries(mapping.attributes ?? {})) {
      const raw = (row[col] ?? '').trim()
      if (raw === '') continue
      const def = attributeDefs.find(a => a.code === code)
      attributes[code] = def?.type === 'number' ? toInt(raw) : raw
    }

    // Valida atributos obligatorios de la familia.
    const missing = requiredAttrs
      .filter(a => attributes[a.code] === undefined || attributes[a.code] === null || attributes[a.code] === '')
      .map(a => a.label)
    if (missing.length > 0) {
      errors.push({ line, name, message: 'Atributos obligatorios faltantes: ' + missing.join(', ') })
      return
    }

    toInsert.push({
      name,
      description: mapping.description ? (row[mapping.description] ?? '') : '',
      category_id: categoryId,
      family_id: familyId ?? null,
      sku: mapping.sku ? row[mapping.sku] || null : null,
      ean: mapping.ean ? row[mapping.ean] || null : null,
      brand: mapping.brand ? row[mapping.brand] || null : null,
      supplier: supplier ?? null,
      price: mapping.price ? toInt(row[mapping.price]) ?? 0 : 0,
      stock: mapping.stock ? toInt(row[mapping.stock]) ?? 0 : 0,
      pim_status: status ?? 'draft',
      attributes
    })
  })

  let created = 0
  if (toInsert.length > 0) {
    // Inserta en lotes de 100.
    for (let i = 0; i < toInsert.length; i += 100) {
      const batch = toInsert.slice(i, i + 100)
      const { data, error } = await supabase.from('product').insert(batch).select('id')
      if (error) throw new AppError(HTTP_STATUS.internalServerError, `Error al importar: ${error.message}`)
      created += data.length
    }
  }

  return {
    total: rows.length,
    created,
    skipped: errors.length,
    errors: errors.slice(0, 50) // acota el reporte
  }
}

export { parseUpload, commitImport }
