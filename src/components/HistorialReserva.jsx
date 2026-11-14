import Swal from 'sweetalert2'
import { api } from '../services/api'

const TEXTO = { CREADA: 'Solicitud creada', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada', CANCELADA: 'Cancelada' }

// Historial de una reserva, leído de la auditoría guardada en MongoDB.
// Se arma con nodos DOM (no HTML) para no inyectar texto del servidor.
function HistorialReserva({ id }) {
  const abrir = async () => {
    try {
      const eventos = await api(`/reservas/${id}/historial`)
      const ul = document.createElement('ul')
      ul.style.textAlign = 'left'
      if (eventos.length === 0) eventos.push(null)
      for (const e of eventos) {
        const li = document.createElement('li')
        li.textContent = e
          ? `${new Date(e.fecha).toLocaleString('es-CL')} · ${TEXTO[e.accion] ?? e.accion} (${e.rolUsuario})`
          : 'Sin eventos registrados'
        ul.appendChild(li)
      }
      Swal.fire({ title: `Historial de la reserva #${id}`, html: ul, confirmButtonColor: '#0E5A5A' })
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo cargar', text: e.message })
    }
  }
  return <button className="btn btn-outline-secondary btn-sm" onClick={abrir}>Historial</button>
}

export default HistorialReserva
