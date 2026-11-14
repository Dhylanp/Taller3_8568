import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { api } from '../services/api'
import { hoyISO, formatearFecha, horaDe } from '../utils/fechas'

// Bloques de 1 hora entre 08:00 y 18:00 (sin 13:00, colación)
const HORAS = [8, 9, 10, 11, 12, 14, 15, 16, 17]
const dos = (n) => String(n).padStart(2, '0')
const bloque = (h) => ({ inicio: `${dos(h)}:00`, fin: `${dos(h + 1)}:00`, texto: `${dos(h)}:00 - ${dos(h + 1)}:00` })

function ReservationModal({ room, onCerrar }) {
  const [fecha, setFecha] = useState('')
  const [horario, setHorario] = useState('')
  const [motivo, setMotivo] = useState('')
  const [ocupados, setOcupados] = useState([])
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  // Al elegir fecha se consulta la disponibilidad real del espacio ese día
  useEffect(() => {
    if (!fecha) return
    let vigente = true
    api(`/espacios/${room.id}/disponibilidad`, { params: { fecha } })
      .then((d) => vigente && setOcupados(d.ocupado))
      .catch((e) => vigente && setError(e.message))
    return () => { vigente = false }
  }, [fecha, room.id])

  const handleFecha = (e) => {
    setFecha(e.target.value)
    setHorario('')
    setOcupados([])
    setError('')
  }

  const estadoBloque = (h) => {
    const b = bloque(h)
    if (ocupados.some((o) => horaDe(o.inicio) < b.fin && horaDe(o.fin) > b.inicio)) return 'ocupado'
    if (fecha === hoyISO() && new Date(`${fecha}T${b.inicio}:00`) <= new Date()) return 'pasado'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fecha) return setError('Selecciona una fecha')
    if (fecha < hoyISO()) return setError('No puedes reservar en una fecha pasada')
    if (!horario) return setError('Selecciona un horario')
    const b = bloque(Number(horario))
    setEnviando(true)
    try {
      await api('/reservas', {
        metodo: 'POST',
        cuerpo: {
          espacioId: room.id,
          inicio: `${fecha}T${b.inicio}:00`,
          fin: `${fecha}T${b.fin}:00`,
          ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
        },
      })
    } catch (err) {
      setError(err.message)
      setEnviando(false)
      return
    }
    onCerrar()
    Swal.fire({
      icon: 'success',
      title: 'Solicitud enviada',
      text: `${room.nombre} · ${formatearFecha(fecha)} · ${b.texto}. Queda pendiente de aprobación.`,
      confirmButtonColor: '#0E5A5A',
    })
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
        role="dialog" aria-modal="true" aria-labelledby="titulo-reserva"
        onClick={(e) => e.stopPropagation()}
      >
        <form className="modal-content modal-reserva" onSubmit={handleSubmit} noValidate>
          <div className="modal-header border-0">
            <h2 id="titulo-reserva" className="modal-title fs-5">Solicitar reserva</h2>
            <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onCerrar} />
          </div>

          <div className="modal-body">
            <label htmlFor="sala" className="form-label">Sala seleccionada</label>
            <input id="sala" className="form-control mb-3" value={`${room.nombre} · ${room.edificio.nombre}`} readOnly />

            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <label htmlFor="fecha" className="form-label">Fecha</label>
                <input id="fecha" type="date" min={hoyISO()} className="form-control" value={fecha} onChange={handleFecha} />
              </div>
              <div className="col-12 col-sm-6">
                <label htmlFor="horario" className="form-label">Horario</label>
                <select
                  id="horario" className="form-select" value={horario} disabled={!fecha}
                  onChange={(e) => { setHorario(e.target.value); setError('') }}
                >
                  <option value="">{fecha ? 'Selecciona un horario' : 'Primero elige la fecha'}</option>
                  {HORAS.map((h) => {
                    const estado = estadoBloque(h)
                    return (
                      <option key={h} value={h} disabled={estado !== null}>
                        {bloque(h).texto}{estado === 'ocupado' ? ' (ocupado)' : estado === 'pasado' ? ' (ya pasó)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            <label htmlFor="motivo" className="form-label mt-3">Motivo (opcional)</label>
            <input id="motivo" className="form-control" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} />

            {error && <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">{error}</div>}
          </div>

          <div className="modal-footer border-0">
            <button type="submit" className="btn btn-success w-100 fw-bold rounded-pill" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReservationModal
