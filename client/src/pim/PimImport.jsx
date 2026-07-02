import { useEffect, useState } from 'react'
import {
  parseImport,
  commitImport,
  getCategories,
  getFamilies,
  getFamily
} from '../services/pim/pimService'
import styles from './Pim.module.css'

export default function PimImport() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  // paso 1
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState(null) // { headers, rows, sample, rowCount }
  const [parsing, setParsing] = useState(false)

  // paso 2
  const [categories, setCategories] = useState([])
  const [families, setFamilies] = useState([])
  const [familyAttrs, setFamilyAttrs] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [supplier, setSupplier] = useState('')
  const [status, setStatus] = useState('draft')
  const [mapping, setMapping] = useState({
    name: '',
    sku: '',
    ean: '',
    brand: '',
    price: '',
    stock: '',
    description: '',
    attributes: {}
  })

  // paso 3
  const [report, setReport] = useState(null)
  const [committing, setCommitting] = useState(false)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getFamilies().then(setFamilies).catch(() => {})
  }, [])

  // Autoselección: intenta mapear columnas por nombre parecido.
  const autoMap = headers => {
    const find = keys => headers.find(h => keys.some(k => h.toLowerCase().includes(k))) || ''
    setMapping(m => ({
      ...m,
      name: find(['nombre', 'name', 'titulo', 'title', 'producto']),
      sku: find(['sku', 'codigo', 'código']),
      ean: find(['ean', 'gtin', 'barcode']),
      brand: find(['marca', 'brand']),
      price: find(['precio', 'price', 'valor']),
      stock: find(['stock', 'inventario', 'cantidad']),
      description: find(['descripcion', 'descripción', 'detalle'])
    }))
  }

  const handleParse = async () => {
    if (!file) return
    setParsing(true)
    setError('')
    try {
      const res = await parseImport(file)
      setParsed(res)
      autoMap(res.headers)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setParsing(false)
    }
  }

  const handleFamilyChange = async fid => {
    setFamilyId(fid)
    setMapping(m => ({ ...m, attributes: {} }))
    if (!fid) {
      setFamilyAttrs([])
      return
    }
    try {
      const fam = await getFamily(fid)
      setFamilyAttrs(fam.attributes)
      // auto-map atributos por label/code
      const auto = {}
      fam.attributes.forEach(a => {
        const match = parsed.headers.find(
          h => h.toLowerCase() === a.code || h.toLowerCase().includes(a.label.toLowerCase())
        )
        if (match) auto[a.code] = match
      })
      setMapping(m => ({ ...m, attributes: auto }))
    } catch (err) {
      setError(err.message)
    }
  }

  const setAttrMap = (code, col) =>
    setMapping(m => ({ ...m, attributes: { ...m.attributes, [code]: col } }))

  const handleCommit = async () => {
    if (!categoryId) return setError('Selecciona una categoría destino')
    if (!mapping.name) return setError('Mapea la columna del nombre')
    setCommitting(true)
    setError('')
    try {
      // limpia atributos sin columna
      const attrs = {}
      for (const [code, col] of Object.entries(mapping.attributes)) if (col) attrs[code] = col
      const payload = {
        categoryId,
        familyId: familyId || null,
        supplier: supplier || null,
        status,
        mapping: {
          name: mapping.name,
          sku: mapping.sku || undefined,
          ean: mapping.ean || undefined,
          brand: mapping.brand || undefined,
          price: mapping.price || undefined,
          stock: mapping.stock || undefined,
          description: mapping.description || undefined,
          attributes: attrs
        },
        rows: parsed.rows
      }
      const r = await commitImport(payload)
      setReport(r)
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setCommitting(false)
    }
  }

  const reset = () => {
    setStep(1)
    setFile(null)
    setParsed(null)
    setReport(null)
    setFamilyId('')
    setFamilyAttrs([])
    setCategoryId('')
    setSupplier('')
  }

  const ColSelect = ({ value, onChange }) => (
    <select
      className={styles.select}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value=''>— ignorar —</option>
      {parsed.headers.map(h => (
        <option
          key={h}
          value={h}
        >
          {h}
        </option>
      ))}
    </select>
  )

  return (
    <div>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.title}>Importar CSV</h2>
          <p className={styles.subtitle}>Carga masiva desde planillas de importadores</p>
        </div>
      </div>

      <div className={styles.steps}>
        <span className={`${styles.step} ${step === 1 ? styles.stepActive : step > 1 ? styles.stepDone : ''}`}>
          1 · Subir archivo
        </span>
        <span className={`${styles.step} ${step === 2 ? styles.stepActive : step > 2 ? styles.stepDone : ''}`}>
          2 · Mapear columnas
        </span>
        <span className={`${styles.step} ${step === 3 ? styles.stepActive : ''}`}>3 · Resultado</span>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* PASO 1 */}
      {step === 1 && (
        <div className={styles.panel}>
          <label className={styles.dropzone}>
            <input
              type='file'
              accept='.csv,text/csv'
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? `📄 ${file.name}` : 'Haz clic para elegir un archivo .csv'}
          </label>
          <div style={{ marginTop: 16 }}>
            <button
              className={styles.btnPrimary}
              onClick={handleParse}
              disabled={!file || parsing}
            >
              {parsing ? 'Leyendo…' : 'Continuar'}
            </button>
          </div>
        </div>
      )}

      {/* PASO 2 */}
      {step === 2 && parsed && (
        <>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Destino</h3>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Categoría<span className={styles.req}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                >
                  <option value=''>— Selecciona —</option>
                  {categories.map(c => (
                    <option
                      key={c.id}
                      value={c.id}
                    >
                      {c.path}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Familia</label>
                <select
                  className={styles.select}
                  value={familyId}
                  onChange={e => handleFamilyChange(e.target.value)}
                >
                  <option value=''>— Sin familia —</option>
                  {families.map(f => (
                    <option
                      key={f.id}
                      value={f.id}
                    >
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Importador</label>
                <input
                  className={styles.input}
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  placeholder='Importadora Andina'
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Estado inicial</label>
                <select
                  className={styles.select}
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value='draft'>Borrador</option>
                  <option value='review'>Revisión</option>
                  <option value='approved'>Aprobado</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Mapeo de columnas ({parsed.rowCount} filas)</h3>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Nombre<span className={styles.req}>*</span>
                </label>
                <ColSelect
                  value={mapping.name}
                  onChange={v => setMapping(m => ({ ...m, name: v }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>SKU</label>
                <ColSelect
                  value={mapping.sku}
                  onChange={v => setMapping(m => ({ ...m, sku: v }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>EAN</label>
                <ColSelect
                  value={mapping.ean}
                  onChange={v => setMapping(m => ({ ...m, ean: v }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Marca</label>
                <ColSelect
                  value={mapping.brand}
                  onChange={v => setMapping(m => ({ ...m, brand: v }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Precio</label>
                <ColSelect
                  value={mapping.price}
                  onChange={v => setMapping(m => ({ ...m, price: v }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Stock</label>
                <ColSelect
                  value={mapping.stock}
                  onChange={v => setMapping(m => ({ ...m, stock: v }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Descripción</label>
                <ColSelect
                  value={mapping.description}
                  onChange={v => setMapping(m => ({ ...m, description: v }))}
                />
              </div>
            </div>

            {familyAttrs.length > 0 && (
              <>
                <h4
                  className={styles.label}
                  style={{ marginTop: 16 }}
                >
                  Atributos de la familia
                </h4>
                <div className={styles.formRow}>
                  {familyAttrs.map(a => (
                    <div
                      key={a.code}
                      className={styles.field}
                    >
                      <label className={styles.label}>
                        {a.label}
                        {a.required && <span className={styles.req}>*</span>}
                      </label>
                      <ColSelect
                        value={mapping.attributes[a.code] ?? ''}
                        onChange={v => setAttrMap(a.code, v)}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Vista previa */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Vista previa</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {parsed.headers.map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.sample.map((row, i) => (
                    <tr key={i}>
                      {parsed.headers.map(h => (
                        <td key={h}>{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.btnRow}>
            <button
              className={styles.btnGhost}
              onClick={() => setStep(1)}
            >
              ← Atrás
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleCommit}
              disabled={committing}
            >
              {committing ? 'Importando…' : `Importar ${parsed.rowCount} productos`}
            </button>
          </div>
        </>
      )}

      {/* PASO 3 */}
      {step === 3 && report && (
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Resultado</h3>
          <div className={styles.cardGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statValue} ${styles.statAccent}`}>{report.created}</div>
              <div className={styles.statLabel}>Creados</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{report.skipped}</div>
              <div className={styles.statLabel}>Omitidos</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{report.total}</div>
              <div className={styles.statLabel}>Filas totales</div>
            </div>
          </div>

          {report.errors?.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Producto</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {report.errors.map((e, i) => (
                    <tr key={i}>
                      <td>{e.line}</td>
                      <td>{e.name ?? '—'}</td>
                      <td>{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button
              className={styles.btnPrimary}
              onClick={reset}
            >
              Importar otro archivo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
