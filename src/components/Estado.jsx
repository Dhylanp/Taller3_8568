// Muestra carga / error de una consulta a la API; si todo está bien, no dibuja nada
function Estado({ cargando, error, onReintentar }) {
  if (cargando) {
    return (
      <div className="text-center text-muted py-5" role="status">
        <div className="spinner-border spinner-border-sm me-2" />Cargando...
      </div>
    )
  }
  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
        <span>{error}</span>
        {onReintentar && <button className="btn btn-sm btn-outline-danger" onClick={onReintentar}>Reintentar</button>}
      </div>
    )
  }
  return null
}

export default Estado
