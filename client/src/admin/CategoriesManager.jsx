import { useEffect, useState } from 'react'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../services/categories/categoryAdminService'
import styles from './CategoriesManager.module.css'

export default function CategoriesManager() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Estado del formulario de creacion
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  // Estado de edicion inline: id de la categoria que se esta editando + su valor
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async e => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    try {
      await createCategory({ name: newName.trim() })
      setNewName('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const startEdit = cat => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const saveEdit = async id => {
    if (!editName.trim()) return
    setError('')
    try {
      await updateCategory({ id, name: editName.trim() })
      cancelEdit()
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async cat => {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return
    setError('')
    try {
      await deleteCategory({ id: cat.id })
      await load()
    } catch (err) {
      // El backend rechaza borrar categorias con productos (409).
      setError(err.message)
    }
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Categorías</h2>

      <form
        className={styles.createForm}
        onSubmit={handleCreate}
      >
        <input
          className={styles.input}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder='Nueva categoría (ej. Anime)'
          disabled={creating}
        />
        <button
          className={styles.btnPrimary}
          type='submit'
          disabled={creating || !newName.trim()}
        >
          {creating ? 'Creando…' : 'Agregar'}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.muted}>Cargando…</p>
      ) : categories.length === 0 ? (
        <p className={styles.muted}>No hay categorías todavía.</p>
      ) : (
        <ul className={styles.list}>
          {categories.map(cat => (
            <li
              key={cat.id}
              className={styles.item}
            >
              {editingId === cat.id ? (
                <>
                  <input
                    className={styles.inputInline}
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.actions}>
                    <button
                      className={styles.btnSave}
                      onClick={() => saveEdit(cat.id)}
                    >
                      Guardar
                    </button>
                    <button
                      className={styles.btnGhost}
                      onClick={cancelEdit}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className={styles.name}>{cat.name}</span>
                  <div className={styles.actions}>
                    <button
                      className={styles.btnGhost}
                      onClick={() => startEdit(cat)}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleDelete(cat)}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
