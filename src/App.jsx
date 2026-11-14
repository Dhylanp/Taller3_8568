import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import RutaProtegida from './components/RutaProtegida'
import Login from './pages/Login'
import Salas from './pages/Salas'
import MisReservas from './pages/MisReservas'
import Solicitudes from './pages/Solicitudes'
import AdminEspacios from './pages/AdminEspacios'
import Panel from './pages/Panel'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
          <Route path="/salas" element={<Salas />} />
          <Route path="/mis-reservas" element={<MisReservas />} />
          <Route path="/admin/solicitudes" element={<RutaProtegida soloAdmin><Solicitudes /></RutaProtegida>} />
          <Route path="/admin/espacios" element={<RutaProtegida soloAdmin><AdminEspacios /></RutaProtegida>} />
          <Route path="/admin/panel" element={<RutaProtegida soloAdmin><Panel /></RutaProtegida>} />
        </Route>

        <Route path="*" element={<Navigate to="/salas" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
