import { useState } from 'react'
import { useApi } from '../hooks'
import Estado from '../components/Estado'

function Barra({ pct }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" style={{ minWidth: 120 }}>
      <div className="progress-bar" style={{ width: `${Math.min(pct, 100)}%` }}>{pct}%</div>
    </div>
  )
}

function Tarjeta({ titulo, valor }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card shadow-sm h-100"><div className="card-body">
        <small className="text-muted">{titulo}</small>
        <div className="fs-3 fw-bold">{valor}</div>
      </div></div>
    </div>
  )
}

function TablaGrupo({ titulo, filas }) {
  return (
    <div className="col-12 col-lg-6">
      <h2 className="h6 fw-bold">{titulo}</h2>
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead><tr><th>Nombre</th><th>Reservas</th><th>Horas</th><th>Ocupación</th></tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.nombre}><td>{f.nombre}</td><td>{f.reservas}</td><td>{f.horas}</td><td><Barra pct={f.ocupacionPct} /></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Panel() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const { datos: p, cargando, error, recargar } = useApi('/panel/utilizacion', { desde, hasta })

  return (
    <div className="container mt-4 mb-5">
      <h1 className="h3 fw-bold mb-3">Panel de utilización</h1>
      <div className="row g-2 mb-4">
        <div className="col-6 col-md-3">
          <label htmlFor="desde" className="form-label small mb-1">Desde</label>
          <input id="desde" type="date" className="form-control" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <label htmlFor="hasta" className="form-label small mb-1">Hasta (exclusivo)</label>
          <input id="hasta" type="date" className="form-control" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <div className="col-12 col-md-6 d-flex align-items-end">
          <small className="text-muted">Sin fechas se muestra el mes actual.</small>
        </div>
      </div>

      <Estado cargando={cargando} error={error} onReintentar={recargar} />

      {p && (
        <>
          <div className="row g-3 mb-4">
            <Tarjeta titulo="Reservas" valor={p.resumen.reservas} />
            <Tarjeta titulo="Pendientes" valor={p.resumen.pendientes} />
            <Tarjeta titulo="Tasa de aprobación" valor={p.resumen.tasaAprobacionPct == null ? '—' : `${p.resumen.tasaAprobacionPct}%`} />
            <Tarjeta titulo="Ocupación global" valor={`${p.resumen.ocupacionGlobalPct}%`} />
          </div>

          <div className="row g-4 mb-4">
            <TablaGrupo titulo="Por edificio" filas={p.porEdificio} />
            <TablaGrupo titulo="Por tipo de espacio" filas={p.porTipo} />
          </div>

          <div className="row g-4">
            <div className="col-12 col-lg-4">
              <h2 className="h6 fw-bold">Más usados</h2>
              {p.masUsados.length === 0 ? <p className="text-muted">Sin reservas aprobadas.</p> : (
                <ol className="ps-3">{p.masUsados.map((e) => <li key={e.id}>{e.nombre} · {e.reservas} reservas ({e.horas} h)</li>)}</ol>
              )}
            </div>
            <div className="col-12 col-lg-4">
              <h2 className="h6 fw-bold">Sin uso en el período</h2>
              {p.sinUso.length === 0 ? <p className="text-muted">Todos los espacios tuvieron uso.</p> : (
                <ul className="ps-3">{p.sinUso.map((e) => <li key={e.id}>{e.nombre} <small className="text-muted">({e.edificio})</small></li>)}</ul>
              )}
            </div>
            <div className="col-12 col-lg-4">
              <h2 className="h6 fw-bold">Horas punta</h2>
              {p.horasPunta.length === 0 ? <p className="text-muted">Sin datos.</p> : (
                <ul className="list-unstyled">
                  {p.horasPunta.map((h) => (
                    <li key={h.hora} className="d-flex align-items-center gap-2">
                      <span style={{ width: 48 }}>{String(h.hora).padStart(2, '0')}:00</span>
                      <div className="progress flex-grow-1"><div className="progress-bar" style={{ width: `${(h.reservas / Math.max(...p.horasPunta.map((x) => x.reservas))) * 100}%` }}>{h.reservas}</div></div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Panel
