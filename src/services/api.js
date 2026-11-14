const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const CLAVE_SESION = 'sesionUsuario'

export function obtenerSesion() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_SESION))
  } catch {
    return null
  }
}
export const guardarSesion = (s) => sessionStorage.setItem(CLAVE_SESION, JSON.stringify(s))
export const borrarSesion = () => sessionStorage.removeItem(CLAVE_SESION)

export async function api(ruta, { metodo = 'GET', cuerpo, params } = {}) {
  const query = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    : ''
  const token = obtenerSesion()?.token
  let resp
  try {
    resp = await fetch(BASE + ruta + query, {
      method: metodo,
      headers: {
        ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor')
  }
  if (resp.status === 401 && token) {
    borrarSesion()
    window.location.assign('/login')
  }
  const datos = await resp.json().catch(() => null)
  if (!resp.ok) {
    const m = datos?.message
    throw new Error(Array.isArray(m) ? m.join('. ') : m ?? 'Error inesperado')
  }
  return datos
}
