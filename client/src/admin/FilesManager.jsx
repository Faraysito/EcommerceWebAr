import { useEffect, useState } from 'react'
import {
  getImages,
  uploadImage,
  deleteImage,
  getModels,
  uploadModel,
  deleteModel
} from '../services/files/fileAdminService'
import styles from './FilesManager.module.css'

export default function FilesManager() {
  const [images, setImages] = useState([])
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingImg, setUploadingImg] = useState(false)
  const [uploadingModel, setUploadingModel] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [imgs, mdls] = await Promise.all([getImages(), getModels()])
      setImages(imgs)
      setModels(mdls)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleImageUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    setError('')
    try {
      await uploadImage(file, file.name)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingImg(false)
      e.target.value = '' // reset input
    }
  }

  const handleModelUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingModel(true)
    setError('')
    try {
      await uploadModel(file, file.name)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingModel(false)
      e.target.value = ''
    }
  }

  const handleDeleteImage = async img => {
    if (!confirm(`¿Eliminar la imagen "${img.name}"?`)) return
    setError('')
    try {
      await deleteImage(img.id)
      await load()
    } catch (err) {
      setError(err.message) // 409 si está en uso por un producto
    }
  }

  const handleDeleteModel = async model => {
    if (!confirm(`¿Eliminar el modelo "${model.name}"?`)) return
    setError('')
    try {
      await deleteModel(model.id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className={styles.wrapper}>
      {error && <div className={styles.error}>{error}</div>}

      {/* IMAGENES */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>Imágenes</h2>
          <label className={styles.uploadBtn}>
            {uploadingImg ? 'Subiendo…' : '+ Subir imagen'}
            <input
              type='file'
              accept='image/*'
              onChange={handleImageUpload}
              disabled={uploadingImg}
              hidden
            />
          </label>
        </div>

        {loading ? (
          <p className={styles.muted}>Cargando…</p>
        ) : images.length === 0 ? (
          <p className={styles.muted}>No hay imágenes subidas.</p>
        ) : (
          <div className={styles.imageGrid}>
            {images.map(img => (
              <div
                key={img.id}
                className={styles.imageCard}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className={styles.thumb}
                />
                <span
                  className={styles.fileName}
                  title={img.name}
                >
                  {img.name}
                </span>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteImage(img)}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODELOS 3D */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>Modelos 3D</h2>
          <label className={styles.uploadBtn}>
            {uploadingModel ? 'Subiendo…' : '+ Subir modelo (.glb)'}
            <input
              type='file'
              accept='.glb,model/gltf-binary'
              onChange={handleModelUpload}
              disabled={uploadingModel}
              hidden
            />
          </label>
        </div>

        {loading ? (
          <p className={styles.muted}>Cargando…</p>
        ) : models.length === 0 ? (
          <p className={styles.muted}>No hay modelos subidos.</p>
        ) : (
          <div className={styles.modelList}>
            {models.map(model => (
              <div
                key={model.id}
                className={styles.modelItem}
              >
                <span className={styles.modelIcon}>◆</span>
                <span
                  className={styles.fileName}
                  title={model.name}
                >
                  {model.name}
                </span>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteModel(model)}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
