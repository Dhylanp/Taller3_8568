import { useEffect, useState } from 'react'
import { api } from './services/api'

// Consulta GET con estados de carga y error; `recargar` vuelve a pedir los datos.
// "cargando" se deriva de la clave de la última respuesta, así no se hace setState dentro del efecto.
export function useApi(ruta, params) {
  const [version, setVersion] = useState(0)
  const [respuesta, setRespuesta] = useState({ clave: null, datos: null, error: '' })
  const clave = `${ruta}|${JSON.stringify(params ?? {})}|${version}`

  useEffect(() => {
    let vigente = true
    api(ruta, { params: JSON.parse(clave.split('|')[1]) })
      .then((datos) => vigente && setRespuesta({ clave, datos, error: '' }))
      .catch((e) => vigente && setRespuesta({ clave, datos: null, error: e.message }))
    return () => { vigente = false }
  }, [ruta, clave])

  const cargando = respuesta.clave !== clave
  return { datos: respuesta.datos, error: cargando ? '' : respuesta.error, cargando, recargar: () => setVersion((v) => v + 1) }
}
