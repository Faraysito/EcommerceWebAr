import { useEffect, useState } from 'react'
import { Modal } from '../Modal'
import {
  getModels,
  assignModel,
  unassignModel,
  uploadModel
} from '../../services/shopify/shopifyService'
import styles from './SellerForms.module.css'

// Modal para asignar un modelo 3D a un producto de Shopify.
// Dos modos: reusar un modelo ya subido, o subir un .glb nuevo.
// En ambos casos se piden las medidas reales (cm) para escalar el AR.
export default function ShopifyAssignModal({ product, current, isOpen, close, onSaved }) {
  const [mode, setMode] = useState('reuse') // 'reuse' | 'upload'
  const [models, setModels] = useState([])
  const [modelId, setModelId] = useState(current?.modelId || '')
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')

  const [width, setWidth] = useState(current?.widthCm ?? '')
  const [height, setHeight] = useState(current?.heightCm ?? '')
  const [depth, setDepth] = useState(current?.depthCm ?? '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Carga los modelos reusables al abrir.
  useEffect(() => {
    if (!isOpen) return
    getModels()
      .then(setModels)
      .catch(() => setModels([]))
    // Precarga valores si ya había asignación.
    setModelId(current?.modelId || '')
    setWidth(current?.widthCm ?? '')
    setHeight(current?.heightCm ?? '')
    setDepth(current?.depthCm ?? '')
    setMode('reuse')
    setFile(null)
    setName('')
    setError('')
  }, [isOpen, current])

  function validDims() {
    // Las medidas son opcionales individualmente, pero si se escriben deben ser > 0.
    for (const v of [width, height, depth]) {
      if (v !== '' && (isNaN(Number(v)) || Number(v) <= 0)) return false
    }
    return true
  }

  async function handleSave() {
    setError('')
    if (!validDims()) {
      setError('Las medidas deben ser números positivos.')
      return
    }

    setSaving(true)
    try {
      let finalModelId = modelId

      // Modo subir: primero sube el .glb, luego usa el id resultante.
      if (mode === 'upload') {
        if (!file) {
          setError('Selecciona un archivo .glb.')
          setSaving(false)
          return
        }
        const uploaded = await uploadModel(file, name || file.name)
        finalModelId = uploaded.id
      }

      if (!finalModelId) {
        setError('Elige un modelo o sube uno nuevo.')
        setSaving(false)
        return
      }

      await assignModel({
        shopifyProductGid: product.id,
        productTitle: product.title,
        modelId: finalModelId,
        widthCm: width === '' ? null : Number(width),
        heightCm: height === '' ? null : Number(height),
        depthCm: depth === '' ? null : Number(depth)
      })

      onSaved?.()
      close()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUnassign() {
    setError('')
    setSaving(true)
    try {
      await unassignModel(product.id)
      onSaved?.()
      close()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      title={`Modelo AR · ${product?.title ?? ''}`}
    >
      <div className={styles.toolbar}>
        <button
          className={mode === 'reuse' ? styles.primaryBtn : styles.ghostBtn}
          onClick={() => setMode('reuse')}
          type='button'
        >
          Reusar modelo
        </button>
        <button
          className={mode === 'upload' ? styles.primaryBtn : styles.ghostBtn}
          onClick={() => setMode('upload')}
          type='button'
        >
          Subir nuevo
        </button>
      </div>

      {mode === 'reuse' && (
        <label className={styles.label}>
          Modelo existente
          <select
            className={styles.select}
            value={modelId}
            onChange={e => setModelId(e.target.value)}
          >
            <option value=''>— Elige un modelo —</option>
            {models.map(m => (
              <option
                key={m.id}
                value={m.id}
              >
                {m.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {mode === 'upload' && (
        <>
          <label className={styles.label}>
            Archivo .glb
            <input
              className={styles.input}
              type='file'
              accept='.glb,model/gltf-binary'
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className={styles.label}>
            Nombre del modelo (opcional)
            <input
              className={styles.input}
              type='text'
              placeholder='ej. Silla Eames'
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
        </>
      )}

      <div className={styles.formGrid}>
        <label className={styles.field}>
          Ancho (cm)
          <input
            className={styles.input}
            type='number'
            min='0'
            step='0.1'
            value={width}
            onChange={e => setWidth(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          Alto (cm)
          <input
            className={styles.input}
            type='number'
            min='0'
            step='0.1'
            value={height}
            onChange={e => setHeight(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          Profundidad (cm)
          <input
            className={styles.input}
            type='number'
            min='0'
            step='0.1'
            value={depth}
            onChange={e => setDepth(e.target.value)}
          />
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div
        className={styles.toolbar}
        style={{ marginTop: 16 }}
      >
        <button
          className={styles.primaryBtn}
          onClick={handleSave}
          disabled={saving}
          type='button'
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        {current?.modelId && (
          <button
            className={styles.dangerBtn}
            onClick={handleUnassign}
            disabled={saving}
            type='button'
          >
            Quitar modelo
          </button>
        )}
      </div>
    </Modal>
  )
}
