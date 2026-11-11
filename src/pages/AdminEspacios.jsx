import { useState } from 'react'
import Swal from 'sweetalert2'
import { api } from '../services/api'
import { useApi } from '../hooks'
import Estado from '../components/Estado'

const VACIO = { nombre: '', tipo: 'Sala Mediana', piso: 1, capacidad: 10, descripcion: '', edificioId: '', disponible: true, equipo: [] }
const TIPOS = ['Laboratorio', 'Auditorio', 'Sala de Estudio', 'Sala Pequeña', 'Sala Mediana']

const avisarError = (e) => Swal.fire({ icon: 'error', title: 'No se pudo completar', text: e.message })

function AdminEspacios() {
  const edificios = useApi('/edificios')
  const espacios = useApi('/espacios')
  const equipos = useApi('/equipamiento')
  const [form, setForm] = useState(null) // null = cerrado; con id = edición
  const [nuevoEdificio, setNuevoEdificio] = useState('')

  const recargar = () => { edificios.recargar(); espacios.recargar() }
  const cargando = edificios.cargando || espacios.cargando || equipos.cargando
  const error = edificios.error || espacios.error || equipos.error

  const ejecutar = async (fn) => {
    try { await fn(); recargar(); return true } catch (e) { avisarError(e); return false }
  }

  const crearEdificio = async (e) => {
    e.preventDefault()
    if (!nuevoEdificio.trim()) return
    if (await ejecutar(() => api('/edificios', { metodo: 'POST', cuerpo: { nombre: nuevoEdificio.trim() } }))) setNuevoEdificio('')
  }

  const eliminar = async (titulo, ruta) => {
    const { isConfirmed } = await Swal.fire({ title: titulo, icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Volver', confirmButtonColor: '#C0392B' })
    if (isConfirmed) ejecutar(() => api(ruta, { metodo: 'DELETE' }))
  }

  const editar = (esp) => setForm({
    id: esp.id, nombre: esp.nombre, tipo: esp.tipo, piso: esp.piso, capacidad: esp.capacidad,
    descripcion: esp.descripcion ?? '', edificioId: esp.edificioId, disponible: esp.disponible,
    equipo: esp.equipamiento.map((x) => x.equipamientoId),
  })

  const guardar = async (e) => {
    e.preventDefault()
    const cuerpo = {
      nombre: form.nombre.trim(), tipo: form.tipo, piso: Number(form.piso), capacidad: Number(form.capacidad),
      descripcion: form.descripcion.trim() || undefined, edificioId: Number(form.edificioId), disponible: form.disponible,
      equipamiento: form.equipo.map((id) => ({ equipamientoId: id })),
    }
    const ok = await ejecutar(() => form.id
      ? api(`/espacios/${form.id}`, { metodo: 'PATCH', cuerpo })
      : api('/espacios', { metodo: 'POST', cuerpo }))
    if (ok) setForm(null)
  }

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const alternarEquipo = (id) => setForm({ ...form, equipo: form.equipo.includes(id) ? form.equipo.filter((x) => x !== id) : [...form.equipo, id] })

  return (
    <div className="container mt-4 mb-5">
      <h1 className="h3 fw-bold mb-4">Edificios y espacios</h1>
      <Estado cargando={cargando} error={error} onReintentar={recargar} />

      {edificios.datos && espacios.datos && equipos.datos && (
        <>
          <h2 className="h5 fw-bold">Edificios</h2>
          <ul className="list-group mb-3">
            {edificios.datos.map((ed) => (
              <li key={ed.id} className="list-group-item d-flex justify-content-between align-items-center">
                {ed.nombre}
                <button className="btn btn-outline-danger btn-sm" onClick={() => eliminar(`¿Eliminar ${ed.nombre}?`, `/edificios/${ed.id}`)}>Eliminar</button>
              </li>
            ))}
          </ul>
          <form className="input-group mb-5" onSubmit={crearEdificio}>
            <input className="form-control" placeholder="Nombre del nuevo edificio" aria-label="Nombre del nuevo edificio" value={nuevoEdificio} onChange={(e) => setNuevoEdificio(e.target.value)} />
            <button className="btn btn-primary">Agregar edificio</button>
          </form>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 fw-bold mb-0">Espacios</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...VACIO, edificioId: edificios.datos[0]?.id ?? '' })}>Nuevo espacio</button>
          </div>

          {form && (
            <form className="card card-body shadow-sm mb-4" onSubmit={guardar}>
              <h3 className="h6 fw-bold">{form.id ? 'Editar espacio' : 'Nuevo espacio'}</h3>
              <div className="row g-3">
                <div className="col-12 col-md-6"><label className="form-label small" htmlFor="e-nombre">Nombre</label>
                  <input id="e-nombre" className="form-control" required value={form.nombre} onChange={cambiar('nombre')} /></div>
                <div className="col-6 col-md-3"><label className="form-label small" htmlFor="e-tipo">Tipo</label>
                  <select id="e-tipo" className="form-select" value={form.tipo} onChange={cambiar('tipo')}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select></div>
                <div className="col-6 col-md-3"><label className="form-label small" htmlFor="e-edificio">Edificio</label>
                  <select id="e-edificio" className="form-select" required value={form.edificioId} onChange={cambiar('edificioId')}>
                    {edificios.datos.map((ed) => <option key={ed.id} value={ed.id}>{ed.nombre}</option>)}</select></div>
                <div className="col-6 col-md-3"><label className="form-label small" htmlFor="e-piso">Piso</label>
                  <input id="e-piso" type="number" className="form-control" value={form.piso} onChange={cambiar('piso')} /></div>
                <div className="col-6 col-md-3"><label className="form-label small" htmlFor="e-cap">Capacidad</label>
                  <input id="e-cap" type="number" min="1" className="form-control" value={form.capacidad} onChange={cambiar('capacidad')} /></div>
                <div className="col-12 col-md-6"><label className="form-label small" htmlFor="e-desc">Descripción</label>
                  <input id="e-desc" className="form-control" value={form.descripcion} onChange={cambiar('descripcion')} /></div>
                <div className="col-12">
                  <span className="form-label small d-block">Equipamiento</span>
                  {equipos.datos.map((q) => (
                    <div className="form-check form-check-inline" key={q.id}>
                      <input id={`q-${q.id}`} type="checkbox" className="form-check-input" checked={form.equipo.includes(q.id)} onChange={() => alternarEquipo(q.id)} />
                      <label htmlFor={`q-${q.id}`} className="form-check-label">{q.nombre}</label>
                    </div>
                  ))}
                </div>
                <div className="col-12 form-check ms-2">
                  <input id="e-disp" type="checkbox" className="form-check-input" checked={form.disponible} onChange={cambiar('disponible')} />
                  <label htmlFor="e-disp" className="form-check-label">Disponible para reservas</label>
                </div>
              </div>
              <div className="mt-3 d-flex gap-2">
                <button className="btn btn-primary">Guardar</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setForm(null)}>Cancelar</button>
              </div>
            </form>
          )}

          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Nombre</th><th>Edificio</th><th>Tipo</th><th>Piso</th><th>Cap.</th><th>Estado</th><th /></tr></thead>
              <tbody>
                {espacios.datos.map((esp) => (
                  <tr key={esp.id}>
                    <td>{esp.nombre}</td><td>{esp.edificio.nombre}</td><td>{esp.tipo}</td><td>{esp.piso}</td><td>{esp.capacidad}</td>
                    <td><span className={`badge text-bg-${esp.disponible ? 'success' : 'secondary'}`}>{esp.disponible ? 'Disponible' : 'No disponible'}</span></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-outline-primary btn-sm me-2" onClick={() => editar(esp)}>Editar</button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => eliminar(`¿Eliminar ${esp.nombre}?`, `/espacios/${esp.id}`)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminEspacios
