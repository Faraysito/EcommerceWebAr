// Parser CSV sin dependencias. Soporta comillas, comas dentro de campos,
// saltos de línea escapados y delimitadores , ; o tab (autodetectados en la
// primera línea; Excel en Chile suele exportar con ';').
//
// Devuelve { headers: string[], rows: Array<Record<string,string>> }.

function detectDelimiter(headerLine) {
  const candidates = [',', ';', '\t']
  let best = ','
  let bestCount = -1
  for (const d of candidates) {
    // cuenta ocurrencias fuera de comillas
    let count = 0
    let inQuotes = false
    for (const ch of headerLine) {
      if (ch === '"') inQuotes = !inQuotes
      else if (ch === d && !inQuotes) count++
    }
    if (count > bestCount) {
      bestCount = count
      best = d
    }
  }
  return best
}

function parseCsv(input) {
  const text = String(input).replace(/^\uFEFF/, '') // quita BOM
  if (!text.trim()) return { headers: [], rows: [] }

  // primera línea física (para detectar delimitador)
  const firstLineEnd = text.search(/\r?\n/)
  const firstLine = firstLineEnd === -1 ? text : text.slice(0, firstLineEnd)
  const delimiter = detectDelimiter(firstLine)

  const records = []
  let field = ''
  let record = []
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      record.push(field)
      field = ''
    } else if (ch === '\n') {
      record.push(field)
      records.push(record)
      record = []
      field = ''
    } else if (ch === '\r') {
      // ignora; el \n cierra la fila
    } else {
      field += ch
    }
  }
  // último campo/fila
  if (field.length > 0 || record.length > 0) {
    record.push(field)
    records.push(record)
  }

  if (records.length === 0) return { headers: [], rows: [] }

  const headers = records[0].map(h => h.trim())
  const rows = records.slice(1).map(cols => {
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? '').trim()
    })
    return obj
  })

  // descarta filas totalmente vacías
  const nonEmpty = rows.filter(r => Object.values(r).some(v => v !== ''))

  return { headers, rows: nonEmpty }
}

export { parseCsv }
