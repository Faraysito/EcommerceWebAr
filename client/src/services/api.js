import { env } from '../config/env'

// Cliente HTTP central. Todas las llamadas a la API pasan por aca.
//
// Diferencia clave con un cliente de token: tu backend usa cookies httpOnly,
// asi que NO manejamos tokens manualmente. La cookie 'auth-token' la envia el
// navegador sola, siempre que cada fetch lleve credentials: 'include'.

const API_URL = env.VITE_API_URL

// Helper central: hace fetch con credentials, chequea errores y devuelve JSON.
async function request(path, options = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    credentials: 'include', // imprescindible: envia/recibe la cookie de sesion
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error en ${path}`)
  }

  // 204 No Content no trae body
  if (res.status === 204) return null
  return res.json()
}

// Atajos para los verbos comunes.
export const apiGet = (path) => request(path)
export const apiPost = (path, body) =>
  request(path, { method: 'POST', body: JSON.stringify(body) })
export const apiPut = (path, body) =>
  request(path, { method: 'PUT', body: JSON.stringify(body) })
export const apiDelete = (path) => request(path, { method: 'DELETE' })

// Upload multipart (imagenes / modelos). No pone Content-Type: el navegador lo
// setea solo con el boundary correcto al usar FormData.
export async function apiUpload(path, file, name) {
  const formData = new FormData()
  formData.append('file', file)
  if (name) formData.append('name', name)

  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error en ${path}`)
  }
  return res.json()
}
