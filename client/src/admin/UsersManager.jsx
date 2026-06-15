import { useEffect, useState } from 'react'
import { getUsers, getRoles, createUser, deleteUser } from '../services/users/userAdminService'
import { useAuth } from '../context/AuthContext'
import styles from './UsersManager.module.css'

export default function UsersManager() {
  const { user: currentUser } = useAuth()

  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Formulario de creacion
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [u, r] = await Promise.all([getUsers(), getRoles()])
      setUsers(u)
      setRoles(r)
      // Preselecciona el primer rol disponible si no hay uno elegido.
      setRoleId(prev => prev || r[0]?.id || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const [u, r] = await Promise.all([getUsers(), getRoles()])
        setUsers(u)
        setRoles(r)
        setRoleId(prev => prev || r[0]?.id || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleCreate = async e => {
    e.preventDefault()
    if (!email.trim() || password.length < 8 || !roleId) return
    setCreating(true)
    setError('')
    try {
      await createUser({ email: email.trim(), password, roleId })
      setEmail('')
      setPassword('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async u => {
    if (u.id === currentUser?.id) {
      setError('No puedes eliminar tu propia cuenta.')
      return
    }
    if (!confirm(`¿Eliminar al usuario "${u.email}"?`)) return
    setError('')
    try {
      await deleteUser({ id: u.id })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const formatDate = iso => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return ''
    }
  }

  const canSubmit = email.trim() && password.length >= 8 && roleId && !creating

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Usuarios</h2>

      <form
        className={styles.createForm}
        onSubmit={handleCreate}
      >
        <input
          className={styles.input}
          type='email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder='correo@ejemplo.cl'
          disabled={creating}
        />
        <input
          className={styles.input}
          type='password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder='Contraseña (mín. 8)'
          disabled={creating}
        />
        <select
          className={styles.select}
          value={roleId}
          onChange={e => setRoleId(e.target.value)}
          disabled={creating || roles.length === 0}
        >
          {roles.length === 0 ? (
            <option value=''>Sin roles</option>
          ) : (
            roles.map(r => (
              <option
                key={r.id}
                value={r.id}
              >
                {r.name}
              </option>
            ))
          )}
        </select>
        <button
          className={styles.btnPrimary}
          type='submit'
          disabled={!canSubmit}
        >
          {creating ? 'Creando…' : 'Crear usuario'}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.muted}>Cargando…</p>
      ) : users.length === 0 ? (
        <p className={styles.muted}>No hay usuarios todavía.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Rol</th>
              <th>Creado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isMe = u.id === currentUser?.id
              return (
                <tr key={u.id}>
                  <td className={styles.emailCell}>
                    {u.email}
                    {isMe && <span className={styles.youBadge}>tú</span>}
                  </td>
                  <td>
                    <span className={styles.roleBadge}>{u.role?.name ?? '—'}</span>
                  </td>
                  <td className={styles.dateCell}>{formatDate(u.created_at)}</td>
                  <td className={styles.actionsCell}>
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleDelete(u)}
                      disabled={isMe}
                      title={isMe ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
