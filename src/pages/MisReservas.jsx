import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import { api } from '../services/api'
import { useApi } from '../hooks'
import { fechaDe, rangoHora, ESTADOS } from '../utils/fechas'
import QRReserva from '../components/QRReserva'
import Estado from '../components/Estado'
import HistorialReserva from '../components/HistorialReserva'

function MisReservas() {
  const { datos: reservas, cargando, error, recargar } = useApi('/reservas/mias')

  const handleCancelar = async (r) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Cancelar reserva?',
      text: `${r.espacio.nombre} · ${fechaDe(r.inicio)} · ${rangoHora(r)}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#C0392B',
    })
    if (!isConfirmed) return
    try {
      await api(`/reservas/${r.id}/cancelar`, { metodo: 'PATCH' })
      recargar()
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo cancelar', text: e.message })
    }
  }

  return (
    <div className="container mt-4">
      <h1 className="h3 fw-bold mb-4">Mis reservas</h1>
      <Estado cargando={cargando} error={error} onReintentar={recargar} />

      {reservas && reservas.length === 0 && (
        <div className="vacio">
          <p className="mb-3">Aún no tienes reservas.</p>
          <Link to="/salas" className="btn btn-primary">Ver salas disponibles</Link>
        </div>
      )}

      {reservas && reservas.length > 0 && (
        <ul className="lista-reservas">
          {reservas.map((r) => (
            <li key={r.id} className="reserva-item">
              <div className="reserva-sala">
                <h2>{r.espacio.nombre}</h2>
                <span>{r.espacio.edificio.nombre} · Piso {r.espacio.piso}</span>
                <span className={`badge text-bg-${ESTADOS[r.estado]} align-self-start`}>{r.estado}</span>
                {r.motivo && <span>{r.motivo}</span>}
              </div>
              {r.estado === 'APROBADA' && (
                <QRReserva reserva={{ id: r.id, salaNombre: r.espacio.nombre, fecha: r.inicio.slice(0, 10), horario: rangoHora(r), nombre: r.usuario.nombre }} />
              )}
              <div className="reserva-dato"><small>Fecha</small><strong>{fechaDe(r.inicio)}</strong></div>
              <div className="reserva-dato"><small>Horario</small><strong>{rangoHora(r)}</strong></div>
              <div className="d-flex flex-column gap-2">
                <HistorialReserva id={r.id} />
                {(r.estado === 'PENDIENTE' || r.estado === 'APROBADA') && (
                  <button className="btn btn-cancelar" onClick={() => handleCancelar(r)}>Cancelar</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MisReservas
