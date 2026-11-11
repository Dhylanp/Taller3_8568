import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const [abierto, setAbierto] = useState(false)
  const { usuario, logout, esAdmin } = useAuth()
  const navigate = useNavigate()

  const cerrarMenu = () => setAbierto(false)

  const handleCerrarSesion = async () => {
    cerrarMenu()
    const { isConfirmed } = await Swal.fire({
      title: '¿Cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Quedarme',
      confirmButtonColor: '#0E5A5A',
    })
    if (isConfirmed) {
      logout()
      navigate('/login', { replace: true })
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <span className="navbar-brand mb-0 h1">Reserva de Espacios</span>

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Abrir menú"
          aria-expanded={abierto}
          onClick={() => setAbierto(!abierto)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse justify-content-end ${abierto ? 'show' : ''}`}>
          <ul className="navbar-nav align-items-lg-center gap-lg-2">
            <li className="nav-item">
              <NavLink to="/salas" className="nav-link" onClick={cerrarMenu}>
                Salas
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/mis-reservas" className="nav-link" onClick={cerrarMenu}>
                Mis reservas
              </NavLink>
            </li>
            {esAdmin && (
              <>
                <li className="nav-item">
                  <NavLink to="/admin/solicitudes" className="nav-link" onClick={cerrarMenu}>Solicitudes</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/espacios" className="nav-link" onClick={cerrarMenu}>Espacios</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/panel" className="nav-link" onClick={cerrarMenu}>Panel</NavLink>
                </li>
              </>
            )}
            <li className="nav-item navbar-usuario">{usuario.nombre}</li>
            <li className="nav-item">
              <button className="btn btn-salir" onClick={handleCerrarSesion}>
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar