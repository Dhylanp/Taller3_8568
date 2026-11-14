import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// `soloAdmin`: además de iniciar sesión se exige rol ADMIN (el backend lo valida igual)
function RutaProtegida({ children, soloAdmin = false }) {
  const { usuario, esAdmin } = useAuth()
  const ubicacion = useLocation()

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion }} />
  }
  if (soloAdmin && !esAdmin) {
    return <Navigate to="/salas" replace />
  }
  return children
}

export default RutaProtegida
