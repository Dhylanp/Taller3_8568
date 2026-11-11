const dos = (n) => String(n).padStart(2, '0')

export function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
}

// "2026-10-15" -> "15/10/2026"
export function formatearFecha(iso) {
  const [anio, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

// La API guarda la hora tal como se envió (sin zona), así que se muestra el texto ISO sin convertir
export const fechaDe = (iso) => formatearFecha(iso)
export const horaDe = (iso) => iso.slice(11, 16)
export const rangoHora = (r) => `${horaDe(r.inicio)} - ${horaDe(r.fin)}`

export const ESTADOS = {
  PENDIENTE: 'warning',
  APROBADA: 'success',
  RECHAZADA: 'danger',
  CANCELADA: 'secondary',
}
