import { apiPost, apiGet } from '../api'

// Login: el backend setea la cookie httpOnly y devuelve los datos del usuario
// (id, email, role, isSuperAdmin, permissions). No guardamos token: la sesion
// vive en la cookie.
export const login = ({ email, password }) => apiPost('/auth/login', { email, password })

// Logout: el backend limpia la cookie.
export const logout = () => apiPost('/auth/logout', {})

// Verifica si hay sesion activa. El frontend lo llama al cargar para saber si
// puede mostrar el panel sin pedir login de nuevo. Si no hay sesion, el
// backend responde 401 y esto lanza -> el caller lo trata como "no logueado".
export const verifySession = () => apiGet('/auth/verify')
