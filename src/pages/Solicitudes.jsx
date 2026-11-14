import { useState } from 'react'
import Swal from 'sweetalert2'
import { api } from '../services/api'
import { useApi } from '../hooks'
import { fechaDe, rangoHora, ESTADOS } from '../utils/fechas'
import Estado from '../components/Estado'

const FILTROS = ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA', '']

function Solicitudes() {
  const [estado, setEstado] = useState('PENDIENTE')
  const { datos: reservas, cargando, error, recargar } = useApi('/reservas', { estado })

  const resolver = async (r, accion) => {
    try {
      await api(`/reservas/${r.id}/${accion}`, { metodo: 'PATCH' })
      recargar()
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo completar', text: e.message })
    }
  }

  return (
    <div className="container mt-4">
      <h1 className="h3 fw-bold mb-3">Solicitudes de reserva</h1>
      <div className="btn-group mb-4 flex-wrap" role="group" aria-label="Filtrar por estado">
        {FILTROS.map((f) => (
          <button
            key={f || 'todas'} type="button"
            className={'btn btn-sm ' + (estado === f ? 'btn-primary' : 'btn-outline-primary')}
            onClick={() => setEstado(f)}
          >
            {f ? f.charAt(0) + f.slice(1).toLowerCase() + 's' : 'Todas'}
          </button>
        ))}
      </div>

      <Estado cargando={cargando} error={error} onReintentar={recargar} />
      {reservas && reservas.length === 0 && <div className="vacio"><p className="mb-0">No hay solicitudes en este estado.</p></div>}

      {reservas && reservas.length > 0 && (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr><th>Espacio</th><th>Solicitante</th><th>Fecha</th><th>Horario</th><th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {reservas.map((r) => (
                <tr key={r.id}>
                  <td>{r.espacio.nombre}<br /><small className="text-muted">{r.espacio.edificio.nombre}</small></td>
                  <td>{r.usuario.nombre}<br /><small className="text-muted">{r.usuario.correo}</small></td>
                  <td>{fechaDe(r.inicio)}</td>
                  <td>{rangoHora(r)}</td>
                  <td><span className={`badge text-bg-${ESTADOS[r.estado]}`}>{r.estado}</span></td>
                  <td className="text-end text-nowrap">
                    {r.estado === 'PENDIENTE' && (
                      <>
                        <button className="btn btn-success btn-sm me-2" onClick={() => resolver(r, 'aprobar')}>Aprobar</button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => resolver(r, 'rechazar')}>Rechazar</button>
                      </>
                    )}
                    {r.estado === 'APROBADA' && (
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => resolver(r, 'cancelar')}>Cancelar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Solicitudes
