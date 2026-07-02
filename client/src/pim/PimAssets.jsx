import { useEffect, useState, useCallback } from 'react'
import { getAssets, uploadAsset, updateAsset, deleteAsset } from '../services/pim/pimService'
import styles from './Pim.module.css'

const TYPE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'image', label: 'Imágenes' },
  { value: 'model', label: 'Modelos 3D' },
  { value: 'document', label: 'Documentos (PDF)' },
  { value: 'video', label: 'Video' }
]

const ICON = { image: '🖼', model: '🧊', document: '📄', video: '🎬' }

export default function PimAssets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')

  // subida
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setAssets(await getAssets({ type: typeFilter || undefined, search: search || undefined }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [typeFilter, search])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await uploadAsset(file, name || file.name, tags)
      setFile(null)
      setName('')
      setTags('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleEditTags = async asset => {
    const next = prompt('Etiquetas (separadas por coma):', (asset.tags ?? []).join(', '))
    if (next === null) return
    try {
      await updateAsset(asset.id, { tags: next.split(',').map(t => t.trim()).filter(Boolean) })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async asset => {
    if (!confirm(`¿Eliminar "${asset.name}"? Se quitará de los productos vinculados.`)) return
    try {
      await deleteAsset(asset.id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.title}>Activos (DAM)</h2>
          <p className={styles.subtitle}>Imágenes, modelos 3D, fichas PDF y video</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Subida */}
      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>Subir activo</h3>
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label}>Archivo</label>
            <input
              className={styles.input}
              type='file'
              accept='image/*,.glb,.usdz,application/pdf,video/mp4'
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Nombre (opcional)</label>
            <input
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Etiquetas (coma)</label>
            <input
              className={styles.input}
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder='invierno, packshot'
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button
            className={styles.btnPrimary}
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Subiendo…' : 'Subir'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder='Buscar por nombre…'
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className={styles.select}
          style={{ maxWidth: 220 }}
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          {TYPE_FILTERS.map(t => (
            <option
              key={t.value}
              value={t.value}
            >
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className={styles.muted}>Cargando…</p>
      ) : assets.length === 0 ? (
        <p className={styles.muted}>No hay activos. Sube el primero arriba.</p>
      ) : (
        <div className={styles.assetGrid}>
          {assets.map(a => (
            <div
              key={a.id}
              className={styles.assetCard}
            >
              <div className={styles.thumb}>
                {a.type === 'image' ? (
                  <img
                    src={a.url}
                    alt={a.name}
                  />
                ) : (
                  <span className={styles.thumbIcon}>{ICON[a.type] ?? '📄'}</span>
                )}
              </div>
              <div className={styles.assetBody}>
                <span
                  className={styles.assetName}
                  title={a.name}
                >
                  {a.name}
                </span>
                <span className={styles.assetType}>{a.type}</span>
                <div>
                  {(a.tags ?? []).map(t => (
                    <span
                      key={t}
                      className={styles.chip}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  className={styles.btnRow}
                  style={{ marginTop: 6 }}
                >
                  <button
                    className={styles.btnGhost}
                    onClick={() => handleEditTags(a)}
                  >
                    Etiquetas
                  </button>
                  <a
                    className={styles.btnGhost}
                    href={a.url}
                    target='_blank'
                    rel='noreferrer'
                  >
                    Ver
                  </a>
                  <button
                    className={styles.btnDanger}
                    onClick={() => handleDelete(a)}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
