import { useMemo, useState } from 'react'
import { useApi } from '../hooks'
import RoomList from '../components/RoomList'
import FiltroSalas from '../components/FiltroSalas'
import ReservationModal from '../components/ReservationModal'
import Estado from '../components/Estado'

// Quita tildes y pasa a minúsculas: "Computación" -> "computacion"
const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const ordenar = (lista) => [...new Set(lista)].sort((a, b) => a.localeCompare(b, 'es'))

function Salas() {
  const { datos: espacios, cargando, error, recargar } = useApi('/espacios')
  const [salaSeleccionada, setSalaSeleccionada] = useState(null)
  const [tipo, setTipo] = useState('')
  const [edificio, setEdificio] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const tipos = useMemo(() => ordenar((espacios ?? []).map((r) => r.tipo)), [espacios])
  const edificios = useMemo(() => ordenar((espacios ?? []).map((r) => r.edificio.nombre)), [espacios])

  const filtradas = useMemo(() => {
    const texto = normalizar(busqueda.trim())
    return (espacios ?? []).filter((r) => {
      const contenido = normalizar(
        [r.nombre, r.descripcion ?? '', ...r.equipamiento.map((e) => e.equipamiento.nombre)].join(' ')
      )
      return (
        (tipo === '' || r.tipo === tipo) &&
        (edificio === '' || r.edificio.nombre === edificio) &&
        contenido.includes(texto)
      )
    })
  }, [espacios, tipo, edificio, busqueda])

  const hayFiltros = tipo !== '' || edificio !== '' || busqueda.trim() !== ''

  return (
    <div className="container mt-4">
      <h1 className="h3 fw-bold mb-4">Salas disponibles</h1>
      <Estado cargando={cargando} error={error} onReintentar={recargar} />
      {espacios && (
        <>
          <FiltroSalas
            tipos={tipos} edificios={edificios}
            tipo={tipo} onTipo={setTipo}
            edificio={edificio} onEdificio={setEdificio}
            busqueda={busqueda} onBusqueda={setBusqueda}
            hayFiltros={hayFiltros}
            onLimpiar={() => { setTipo(''); setEdificio(''); setBusqueda('') }}
          />
          <RoomList rooms={filtradas} onReservar={setSalaSeleccionada} />
        </>
      )}
      {salaSeleccionada && (
        <ReservationModal key={salaSeleccionada.id} room={salaSeleccionada} onCerrar={() => setSalaSeleccionada(null)} />
      )}
    </div>
  )
}

export default Salas
