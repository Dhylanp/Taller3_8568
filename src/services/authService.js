import { api, guardarSesion, borrarSesion } from './api'

export async function iniciarSesion(correo, clave) {
  const { token, usuario } = await api('/auth/login', {
    metodo: 'POST',
    cuerpo: { correo: correo.trim(), clave },
  })
  const sesion = { ...usuario, token }
  guardarSesion(sesion)
  return sesion
}

export { obtenerSesion } from './api'
export const cerrarSesion = borrarSesion
