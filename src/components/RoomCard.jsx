const CLASES_TIPO = {
  'Laboratorio': 'badge-laboratorio',
  'Auditorio': 'badge-auditorio',
  'Sala de Estudio': 'badge-estudio',
  'Sala Pequeña': 'badge-sala',
  'Sala Mediana': 'badge-sala',
}

function RoomCard({ room, onReservar }) {
  const { nombre, tipo, edificio, piso, capacidad, descripcion, disponible, equipamiento } = room

  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body">
        <span className={`badge ${CLASES_TIPO[tipo] ?? 'badge-sala'} me-2 mb-2`}>{tipo}</span>
        <span className={`badge ${disponible ? 'badge-disponible' : 'badge-ocupado'} mb-2`}>
          {disponible ? 'Disponible' : 'No disponible'}
        </span>
        <h5 className="card-title fw-bold">{nombre}</h5>
        <p className="card-text text-muted mb-1"><strong>Ubicación:</strong> {edificio.nombre}</p>
        <p className="card-text text-muted mb-1"><strong>Piso:</strong> {piso}</p>
        <p className="card-text text-muted mb-2"><strong>Capacidad:</strong> {capacidad} personas</p>
        {descripcion && <p className="card-text">{descripcion}</p>}
        {equipamiento.length > 0 && (
          <p className="card-text small text-muted mb-0">
            <strong>Equipamiento:</strong>{' '}
            {equipamiento.map((e) => `${e.equipamiento.nombre} (${e.cantidad})`).join(', ')}
          </p>
        )}
      </div>
      <div className="card-footer bg-transparent border-0 pb-3">
        <button className="btn btn-primary w-100" disabled={!disponible} onClick={() => onReservar(room)}>
          Solicitar reserva
        </button>
      </div>
    </div>
  )
}

export default RoomCard
