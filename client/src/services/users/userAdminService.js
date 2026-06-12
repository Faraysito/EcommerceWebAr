import { apiGet, apiPost, apiDelete } from '../api'

// Gestión de usuarios del panel admin. Todas las rutas son protegidas (/admin)
// y exigen permisos user.read / user.create / user.delete en el backend.

export const getUsers = () => apiGet('/admin/users')
export const getRoles = () => apiGet('/admin/roles')
export const createUser = ({ email, password, roleId }) =>
  apiPost('/admin/users', { email, password, roleId })
export const deleteUser = ({ id }) => apiDelete(`/admin/users/${id}`)
