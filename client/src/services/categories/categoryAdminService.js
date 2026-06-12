import { apiGet, apiPost, apiPut, apiDelete } from '../api'

// CRUD de categorias contra el backend. El GET es la ruta publica (la misma
// que usa el catalogo); create/update/delete son las protegidas de /admin.

export const getCategories = () => apiGet('/categories')
export const createCategory = ({ name }) => apiPost('/admin/categories', { name })
export const updateCategory = ({ id, name }) => apiPut(`/admin/categories/${id}`, { name })
export const deleteCategory = ({ id }) => apiDelete(`/admin/categories/${id}`)
