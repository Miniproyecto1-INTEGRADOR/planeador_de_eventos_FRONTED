import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../utils/apiUrl.js'
import { getApiErrorMessage } from '../utils/apiError.js'

const valoresIniciales = {
  name: '',
  event_type: 'Bodas',
  event_date: '',
  color: '#FF6B6B',
}

const subtareaBase = [
  { title: '', target_date: '', estimated_hours: '' },
]

const tiposEvento = [
  'Bodas',
  'XV años',
  'Bautizos',
  'Primeras comuniones',
  'Confirmaciones',
  'Baby showers',
  'Cumpleaños y fiestas infantiles',
  'Aniversarios de bodas',
  'Despedidas de soltero(a)',
  'Graduaciones',
  'Comidas o cenas familiares',
  'Fiestas de revelación de género',
  'Renovación de votos',
  'Fiestas de jubilación',
  'Cumpleaños',
  'Corporativo',
  'Conferencia',
]

export default function CrearEvento() {
  const navigate = useNavigate()
  const [evento, setEvento] = useState(valoresIniciales)
  const [subtareas, setSubtareas] = useState(subtareaBase)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [tiposAbierto, setTiposAbierto] = useState(false)
  const tiposRef = useRef(null)

  const tieneCambios = Boolean(
    evento.name.trim() ||
    evento.event_date ||
    evento.color !== valoresIniciales.color ||
    subtareas.some((tarea) => tarea.title.trim() || tarea.target_date || tarea.estimated_hours),
  )

  useEffect(() => {
    const confirmarSalida = (event) => {
      if (!tieneCambios || cargando) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', confirmarSalida)
    return () => window.removeEventListener('beforeunload', confirmarSalida)
  }, [tieneCambios, cargando])

  useEffect(() => {
    if (!tiposAbierto) return undefined

    const cerrarTiposAlHacerClickFuera = (event) => {
      if (!tiposRef.current?.contains(event.target)) setTiposAbierto(false)
    }

    document.addEventListener('mousedown', cerrarTiposAlHacerClickFuera)
    return () => document.removeEventListener('mousedown', cerrarTiposAlHacerClickFuera)
  }, [tiposAbierto])

  const volverAtras = () => {
    if (tieneCambios && !window.confirm('Tienes datos sin guardar. ¿Deseas salir sin crear el evento?')) return
    navigate('/hoy')
  }

  const totalTiempo = useMemo(
    () => subtareas.reduce((total, item) => total + Number(item.estimated_hours || 0), 0),
    [subtareas],
  )

  const actualizarSubtarea = (index, campo, valor) => {
    setSubtareas((actuales) =>
      actuales.map((tarea, pos) =>
        pos === index
          ? {
              ...tarea,
              [campo]: campo === 'estimated_hours' ? (valor === '' ? '' : Number(valor)) : valor,
            }
          : tarea,
      ),
    )
  }

  const agregarSubtarea = () => {
    setSubtareas((actuales) => [...actuales, { title: '', target_date: '', estimated_hours: '' }])
  }

  const eliminarSubtarea = (index) => {
    setSubtareas((actuales) => actuales.filter((_, pos) => pos !== index))
  }

  const guardarEvento = async () => {
    setError('')
    setMensaje('')

    if (!evento.name.trim()) {
      setError('El nombre del evento es obligatorio.')
      return
    }
    if (!evento.event_type.trim()) {
      setError('El tipo de evento es obligatorio.')
      return
    }
    if (!evento.event_date) {
      setError('La fecha del evento es obligatoria.')
      return
    }

    const subtareasConContenido = subtareas.filter(
      (item) => item.title.trim() || item.target_date || item.estimated_hours,
    )
    const subtareasValidas = subtareasConContenido.filter(
      (item) => item.title.trim() && Number(item.estimated_hours) > 0,
    )

    if (!subtareasConContenido.length) {
      setError('Añade al menos una gestión con título y tiempo estimado.')
      return
    }
    if (subtareasValidas.length !== subtareasConContenido.length) {
      setError('Completa el título y el tiempo estimado de cada gestión que hayas comenzado.')
      return
    }

    setCargando(true)

    try {
      const eventoPayload = {
        ...evento,
        name: evento.name.trim(),
        event_type: evento.event_type.trim(),
        user_id: localStorage.getItem('userId'),
        subtasks: subtareasValidas.map((tarea) => ({
          title: tarea.title.trim(),
          description: `Gestión logística para ${evento.name.trim()}`,
          target_date: tarea.target_date || evento.event_date.split('T')[0],
          estimated_minutes: Number(tarea.estimated_hours) * 60,
          status: 'pending',
        })),
      }

      const respuestaPlan = await axios.post(`${API_URL}/eventos/plan-inicial/`, eventoPayload)
      const eventoCreado = respuestaPlan.data.event
      const totalGestiones = subtareasValidas.length

      const mensajeExito = totalGestiones > 0
        ? `¡Evento creado exitosamente! Se añadieron ${totalGestiones} gestiones al plan logístico inicial.`
        : '¡Evento creado exitosamente!'

      sessionStorage.setItem('selectedEventId', eventoCreado.id)
      sessionStorage.setItem('eventoCreadoMensaje', mensajeExito)
      setMensaje(mensajeExito)
      navigate('/evento/subtareas')
    } catch (err) {
      const mensajeError = getApiErrorMessage(
        err,
        'Se perdió la conexión con el servidor, por favor vuelva a intentarlo.',
      )
      setError(mensajeError)
    } finally {
      setCargando(false)
    }
  }

return (
  <main className="panel crear-panel">
    <header className="encabezado">
      <div>
        <p className="eyebrow">Ritmo consciente · Planificación</p>
        <h1>Crear nuevo evento</h1>
        <p className="subtitulo">
          Organiza la información principal y prepara las primeras gestiones de tu evento.
        </p>
      </div>

      <div className="crear-encabezado-lateral">
        <div className="metricas">
          <span>{subtareas.length} tareas</span>
          <span>{totalTiempo} h estimadas</span>
        </div>

        <div className="crear-acciones crear-acciones-superior">
          <button
            className="crear-boton crear-boton-secundario"
            type="button"
            onClick={volverAtras}
            disabled={cargando}
          >
            Volver atrás
          </button>
          <button
            className="crear-boton"
            type="button"
            onClick={guardarEvento}
            disabled={cargando}
          >
            {cargando ? 'Creando evento...' : 'Crear evento'}
          </button>
        </div>
      </div>
    </header>

    {mensaje && (
      <p className="aviso crear-mensaje" role="status">
        {mensaje}
      </p>
    )}

    {error && (
      <p className="aviso error crear-mensaje crear-error" role="alert">
        {error}
      </p>
    )}

    <section className="crear-seccion">
      <div className="crear-seccion-header">
        <span className="crear-numero">01</span>

        <div>
          <h2>Información del evento</h2>
          <p>Define los datos principales para comenzar la planificación.</p>
        </div>
      </div>

      <div className="crear-form-grid">
        <div className="crear-campo campo-nombre">
          <label htmlFor="name">Nombre del evento</label>
          <input
            id="name"
            value={evento.name}
            onChange={(event) =>
              setEvento((actual) => ({
                ...actual,
                name: event.target.value,
              }))
            }
            placeholder="Ej. Boda María & Juan"
          />
        </div>

        <div className="crear-campo">
          <label htmlFor="event_type">Tipo de evento</label>

          <div className="selector-evento" ref={tiposRef}>
            <button
              type="button"
              className="selector-evento-boton"
              aria-haspopup="listbox"
              aria-expanded={tiposAbierto}
              onClick={() => setTiposAbierto((abierto) => !abierto)}
            >
              <span>{evento.event_type}</span>
              <span aria-hidden="true">⌄</span>
            </button>

            {tiposAbierto && (
              <div className="selector-evento-opciones" role="listbox" aria-label="Tipos de evento">
                {tiposEvento.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    role="option"
                    aria-selected={evento.event_type === tipo}
                    className={evento.event_type === tipo ? 'selector-evento-opcion seleccionada' : 'selector-evento-opcion'}
                    onClick={() => {
                      setEvento((actual) => ({ ...actual, event_type: tipo }))
                      setTiposAbierto(false)
                    }}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="crear-campo">
          <label htmlFor="event_date">Fecha del evento</label>

          <input
            id="event_date"
            type="datetime-local"
            value={evento.event_date}
            onChange={(event) =>
              setEvento((actual) => ({
                ...actual,
                event_date: event.target.value,
              }))
            }
          />
        </div>

        <div className="crear-campo">
          <label htmlFor="color">Color del evento</label>

          <div className="crear-color">
            <input
              id="color"
              type="color"
              value={evento.color}
              onChange={(event) =>
                setEvento((actual) => ({
                  ...actual,
                  color: event.target.value,
                }))
              }
            />
          </div>
        </div>
      </div>
    </section>

    <section className="crear-seccion">
      <div className="crear-seccion-header">
        <span className="crear-numero">02</span>

        <div>
          <h2>Plan logístico inicial</h2>
          <p>
            Divide el evento en gestiones pequeñas y establece sus tiempos estimados.
          </p>
        </div>
      </div>

      <div className="crear-plan">
        <div className="crear-plan-header">
          <div>
            <h3>Agregar gestión</h3>
            <p>Añade una o varias gestiones. Solo se enviarán las filas completas.</p>
          </div>

          <span className="crear-plan-count">
            {subtareas.length} agregadas
          </span>
        </div>

        {subtareas.map((tarea, index) => (
          <div
            key={index}
            className="crear-subtarea"
          >
            <div className="crear-campo">
              <label htmlFor={`titulo-${index}`}>
                Gestión o tarea
              </label>

              <input
                id={`titulo-${index}`}
                value={tarea.title}
                onChange={(event) =>
                  actualizarSubtarea(
                    index,
                    'title',
                    event.target.value,
                  )
                }
                placeholder="Ej. Confirmar proveedor de catering"
              />
            </div>

            <div className="crear-campo">
              <label htmlFor={`fecha-${index}`}>
                Fecha límite
              </label>

              <input
                id={`fecha-${index}`}
                type="date"
                value={tarea.target_date}
                onChange={(event) =>
                  actualizarSubtarea(
                    index,
                    'target_date',
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="crear-campo">
              <label htmlFor={`horas-${index}`}>
                Horas estimadas
              </label>

              <input
                id={`horas-${index}`}
                type="number"
                min="0.5"
                step="0.5"
                value={tarea.estimated_hours}
                onChange={(event) =>
                  actualizarSubtarea(
                    index,
                    'estimated_hours',
                    event.target.value,
                  )
                }
              />
            </div>

            {subtareas.length > 1 && (
              <button
                type="button"
                className="crear-quitar-subtarea"
                onClick={() => eliminarSubtarea(index)}
                disabled={cargando}
              >
                Quitar
              </button>
            )}
          </div>
        ))}

        <button type="button" className="crear-agregar-subtarea" onClick={agregarSubtarea} disabled={cargando}>
          + Agregar otra gestión
        </button>
      </div>
    </section>

    <section className="crear-resumen">
      <div className="crear-resumen-header">
        <div>
          <h2>Plan inicial</h2>
          <p>
            Revisa la información antes de crear el evento.
          </p>
        </div>

        <div className="crear-resumen-acciones">
          <div className="crear-tiempo">
            <strong>{totalTiempo} h</strong>
            <span>tiempo estimado</span>
          </div>

          <div className="crear-acciones crear-acciones-inferior">
            <button
              className="crear-boton crear-boton-secundario"
              type="button"
              onClick={volverAtras}
              disabled={cargando}
            >
              Volver atrás
            </button>
            <button
              className="crear-boton"
              type="button"
              onClick={guardarEvento}
              disabled={cargando}
            >
              {cargando ? 'Creando evento...' : 'Crear evento'}
            </button>
          </div>
        </div>
      </div>

    </section>
  </main>
)
}
