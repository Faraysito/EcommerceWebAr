import { useEffect, useState } from 'react'
import {
  getFamilies,
  getFamily,
  createFamily,
  deleteFamily,
  createAttribute,
  deleteAttribute
} from '../services/pim/pimService'
import styles from './Pim.module.css'

const TYPE_LABEL = { text: 'Texto', number: 'Número', select: 'Lista', boolean: 'Sí/No', date: 'Fecha' }

export default function PimFamilies() {
  const [families, setFamilies] = useState([])
  const [selected, setSelected] = useState(null) // familia con atributos
  const [error, setError] = useState('')

  // form familia
  const [famCode, setFamCode] = useState('')
  const [famName, setFamName] = useState('')

  const loadFamilies = async () => {
    try {
      setFamilies(await getFamilies())
    } catch (err) {
      setError(err.message)
    }
  }

  const openFamily = async famId => {
    try {
      setSelected(await getFamily(famId))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadFamilies()
  }, [])

  const handleCreateFamily = async e => {
    e.preventDefault()
    if (!famCode.trim() || !famName.trim()) return
    setError('')
    try {
      const fam = await createFamily({ code: famCode.trim(), name: famName.trim() })
      setFamCode('')
      setFamName('')
      await loadFamilies()
      setSelected(fam)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteFamily = async fam => {
    if (!confirm(`¿Eliminar la familia "${fam.name}" y sus atributos?`)) return
    try {
      await deleteFamily(fam.id)
      if (selected?.id === fam.id) setSelected(null)
      await loadFamilies()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.title}>Familias y atributos</h2>
          <p className={styles.subtitle}>Esquema flexible del catálogo</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.editorGrid}>
        {/* Lista de familias */}
        <div>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Familias</h3>
            {families.length === 0 ? (
              <p className={styles.muted}>No hay familias todavía.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Code</th>
                      <th>Atributos</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {families.map(f => (
                      <tr
                        key={f.id}
                        className={styles.rowClickable}
                        onClick={() => openFamily(f.id)}
                      >
                        <td>{f.name}</td>
                        <td className={styles.mono}>{f.code}</td>
                        <td>{f.attributeCount}</td>
                        <td>
                          <button
                            className={styles.btnDanger}
                            onClick={e => {
                              e.stopPropagation()
                              handleDeleteFamily(f)
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Nueva familia</h3>
            <form
              className={styles.form}
              onSubmit={handleCreateFamily}
            >
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Code (ej. electronica)</label>
                  <input
                    className={styles.input}
                    value={famCode}
                    onChange={e => setFamCode(e.target.value)}
                    placeholder='minusculas_sin_espacios'
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Nombre</label>
                  <input
                    className={styles.input}
                    value={famName}
                    onChange={e => setFamName(e.target.value)}
                    placeholder='Electrónica'
                  />
                </div>
              </div>
              <div>
                <button
                  className={styles.btnPrimary}
                  type='submit'
                >
                  Crear familia
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Atributos de la familia seleccionada */}
        <div>
          {selected ? (
            <AttributesPanel
              family={selected}
              onChanged={async () => {
                await openFamily(selected.id)
                await loadFamilies()
              }}
            />
          ) : (
            <div className={styles.panel}>
              <p className={styles.muted}>Selecciona una familia para ver y editar sus atributos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AttributesPanel({ family, onChanged }) {
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [type, setType] = useState('text')
  const [required, setRequired] = useState(false)
  const [unit, setUnit] = useState('')
  const [options, setOptions] = useState('')
  const [error, setError] = useState('')

  const handleAdd = async e => {
    e.preventDefault()
    if (!code.trim() || !label.trim()) return
    setError('')
    try {
      await createAttribute(family.id, {
        code: code.trim(),
        label: label.trim(),
        type,
        required,
        unit: unit.trim() || null,
        options: type === 'select' ? options.split(',').map(o => o.trim()).filter(Boolean) : [],
        position: (family.attributes?.length ?? 0) + 1
      })
      setCode('')
      setLabel('')
      setUnit('')
      setOptions('')
      setRequired(false)
      setType('text')
      onChanged?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async attr => {
    if (!confirm(`¿Eliminar el atributo "${attr.label}"?`)) return
    try {
      await deleteAttribute(attr.id)
      onChanged?.()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>Atributos — {family.name}</h3>
      {error && <div className={styles.error}>{error}</div>}

      {family.attributes?.length === 0 ? (
        <p className={styles.muted}>Sin atributos. Agrega el primero abajo.</p>
      ) : (
        <div
          className={styles.tableWrap}
          style={{ marginBottom: 16 }}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Etiqueta</th>
                <th>Code</th>
                <th>Tipo</th>
                <th>Oblig.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {family.attributes.map(a => (
                <tr key={a.id}>
                  <td>
                    {a.label}
                    {a.unit ? ` (${a.unit})` : ''}
                  </td>
                  <td className={styles.mono}>{a.code}</td>
                  <td>{TYPE_LABEL[a.type] ?? a.type}</td>
                  <td>{a.required ? 'Sí' : '—'}</td>
                  <td>
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleDelete(a)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form
        className={styles.form}
        onSubmit={handleAdd}
      >
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label}>Code</label>
            <input
              className={styles.input}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder='voltaje'
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Etiqueta</label>
            <input
              className={styles.input}
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder='Voltaje'
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Tipo</label>
            <select
              className={styles.select}
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value='text'>Texto</option>
              <option value='number'>Número</option>
              <option value='select'>Lista</option>
              <option value='boolean'>Sí/No</option>
              <option value='date'>Fecha</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label}>Unidad (opcional)</label>
            <input
              className={styles.input}
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder='W, cm, meses…'
            />
          </div>
          {type === 'select' && (
            <div className={styles.field}>
              <label className={styles.label}>Opciones (separadas por coma)</label>
              <input
                className={styles.input}
                value={options}
                onChange={e => setOptions(e.target.value)}
                placeholder='110V, 220V, Dual'
              />
            </div>
          )}
          <div
            className={styles.field}
            style={{ justifyContent: 'flex-end' }}
          >
            <label className={styles.label}>
              <input
                type='checkbox'
                checked={required}
                onChange={e => setRequired(e.target.checked)}
              />{' '}
              Obligatorio
            </label>
          </div>
        </div>

        <div>
          <button
            className={styles.btnPrimary}
            type='submit'
          >
            + Agregar atributo
          </button>
        </div>
      </form>
    </div>
  )
}
