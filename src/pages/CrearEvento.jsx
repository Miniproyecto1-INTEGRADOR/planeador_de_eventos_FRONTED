import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../utils/apiUrl.js'
import { getApiErrorMessage } from '../utils/apiError.js'
import { formatMinutesAsHoursAndMinutes } from '../utils/formatters.js'

const valoresIniciales = {
  name: '',
  event_type: 'Bodas',
  event_date: '',
  color: '#FF6B6B',
}

const subtareaBase = [
  { title: '', target_date: '', estimated_hours: '', estimated_minutes: '' },
]

const getDurationMinutes = (task) => (
  Number(task.estimated_hours || 0) * 60 + Number(task.estimated_minutes || 0)
)

const isValidDuration = (task) => {
  const hours = Number(task.estimated_hours || 0)
  const minutes = Number(task.estimated_minutes || 0)
  return Number.isInteger(hours)
    && hours >= 0
    && Number.isInteger(minutes)
    && minutes >= 0
    && minutes < 60
    && hours * 60 + minutes > 0
}

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
  'Otros',
]

export default function CrearEvento() {
  const navigate = useNavigate()
  const [evento, setEvento] = useState(valoresIniciales)
  const [subtareas, setSubtareas] = useState(subtareaBase)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [conflictoPlan, setConflictoPlan] = useState(null)
  const [fechaAlternativaPlan, setFechaAlternativaPlan] = useState('')
  const [minutosAlternativosPlan, setMinutosAlternativosPlan] = useState('')
  const [tiposAbierto, setTiposAbierto] = useState(false)
  const tiposRef = useRef(null)

  const tieneCambios = Boolean(
    evento.name.trim() ||
    evento.event_date ||
    evento.color !== valoresIniciales.color ||
    subtareas.some((tarea) => (
      tarea.title.trim() || tarea.target_date || tarea.estimated_hours || tarea.estimated_minutes
    )),
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
    () => subtareas.reduce((total, item) => total + getDurationMinutes(item), 0),
    [subtareas],
  )

  const actualizarSubtarea = (index, campo, valor) => {
    setSubtareas((actuales) =>
      actuales.map((tarea, pos) =>
        pos === index
          ? {
              ...tarea,
              [campo]: valor,
            }
          : tarea,
      ),
    )
  }

  const agregarSubtarea = () => {
    setSubtareas((actuales) => [...actuales, {
      title: '',
      target_date: '',
      estimated_hours: '',
      estimated_minutes: '',
    }])
  }

  const eliminarSubtarea = (index) => {
    setSubtareas((actuales) => actuales.filter((_, pos) => pos !== index))
  }

  const guardarEvento = async (subtareasPlan = subtareas) => {
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

    const fechaEvento = evento.event_date.slice(0, 10)

    const subtareasConContenido = subtareasPlan.filter(
      (item) => (
        item.title.trim() || item.target_date || item.estimated_hours || item.estimated_minutes
      ),
    )
    const subtareasValidas = subtareasConContenido.filter(
      (item) => item.title.trim() && isValidDuration(item),
    )

    if (!subtareasConContenido.length) {
      setError('Añade al menos una gestión con título y tiempo estimado.')
      return
    }
    if (subtareasValidas.length !== subtareasConContenido.length) {
      const faltaTitulo = subtareasConContenido.some((item) => !item.title.trim())
      const faltaDuracionValida = subtareasConContenido.some((item) => !isValidDuration(item))

      if (faltaTitulo && faltaDuracionValida) {
        setError('Completa el título y asigna una duración válida mayor a cero; los minutos deben estar entre 0 y 59.')
      } else if (faltaTitulo) {
        setError('Completa el título de cada gestión que hayas comenzado.')
      } else {
        setError('Asigna una duración válida mayor a cero; los minutos deben estar entre 0 y 59.')
      }
      return
    }
    const subtareaPosterior = subtareasValidas.find((tarea) => tarea.target_date && tarea.target_date > fechaEvento)
    if (subtareaPosterior) {
      setError(`La fecha de "${subtareaPosterior.title.trim()}" no puede ser posterior a la fecha del evento.`)
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
          estimated_minutes: getDurationMinutes(tarea),
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
      const detail = err?.response?.data?.detail
      if (err?.response?.status === 409 && detail?.code === 'daily_capacity_exceeded') {
        const conflictingTask = subtareasValidas[Number(detail.subtask_index)]
        const taskIndex = conflictingTask ? subtareasPlan.indexOf(conflictingTask) : -1
        setFechaAlternativaPlan('')
        setMinutosAlternativosPlan(String(Math.max(1, getDurationMinutes(conflictingTask || {}) - 30)))
        setConflictoPlan({ ...detail, taskIndex })
      } else {
        const mensajeError = getApiErrorMessage(
          err,
          'Se perdió la conexión con el servidor, por favor vuelva a intentarlo.',
        )
        setError(mensajeError)
      }
    } finally {
      setCargando(false)
    }
  }

  const resolverConflictoPlan = async (field, value) => {
    if (!conflictoPlan || conflictoPlan.taskIndex < 0) {
      setError('No pudimos identificar la gestión que causa el conflicto. Revisa el plan y vuelve a intentarlo.')
      setConflictoPlan(null)
      return
    }

    const updatedValues = field === 'target_date'
      ? { target_date: value }
      : {
          estimated_hours: String(Math.floor(Number(value) / 60)),
          estimated_minutes: String(Number(value) % 60),
        }
    const subtareasActualizadas = subtareas.map((tarea, index) => (
      index === conflictoPlan.taskIndex ? { ...tarea, ...updatedValues } : tarea
    ))
    setSubtareas(subtareasActualizadas)
    setConflictoPlan(null)
    setFechaAlternativaPlan('')
    await guardarEvento(subtareasActualizadas)
  }


return (
  <main className="panel crear-panel">
    <header className="encabezado">
      <div className="crear-encabezado-copy">
        <p className="eyebrow">Ritmo consciente · Planificación</p>
        <h2>Crear nuevo evento</h2>
        <p className="subtitulo">
          Organiza la información principal y prepara las primeras gestiones de tu evento.
        </p>
      </div>

      <div className="crear-encabezado-lateral">
        <div className="metricas">
          <span>{subtareas.length} tareas</span>
          <span>{formatMinutesAsHoursAndMinutes(totalTiempo)} estimadas</span>
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

        <div className="crear-campo crear-campo-color">
          <span>Color</span>

          <div className="crear-color">
            <input
              id="color"
              aria-label="Color"
              className="crear-color-picker"
              type="color"
              value={evento.color}
              onChange={(event) =>
                setEvento((actual) => ({
                  ...actual,
                  color: event.target.value,
                }))
              }
            />
            <div className="crear-color-display" aria-hidden="true">
              <span className="crear-color-swatch" style={{ backgroundColor: evento.color }} />
            </div>
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
                max={evento.event_date ? evento.event_date.slice(0, 10) : undefined}
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
                Horas
              </label>

              <input
                id={`horas-${index}`}
                type="number"
                min="0"
                step="1"
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

            <div className="crear-campo">
              <label htmlFor={`minutos-${index}`}>
                Minutos
              </label>

              <input
                id={`minutos-${index}`}
                type="number"
                min="0"
                max="59"
                step="1"
                value={tarea.estimated_minutes}
                onChange={(event) =>
                  actualizarSubtarea(
                    index,
                    'estimated_minutes',
                    event.target.value,
                  )
                }
              />
            </div>

            {subtareas.length > 1 && (
              <button
                type="button"
                className="crear-quitar-subtarea"
                aria-label={`Quitar gestión ${index + 1}`}
                title={`Quitar gestión ${index + 1}`}
                onClick={() => eliminarSubtarea(index)}
                disabled={cargando}
              >
                <img src="/Basura.png" alt="" aria-hidden="true" />
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
          <p className="aviso crear-mensaje" role="status">
            Revisa la información antes de crear el evento.
          </p>
        </div>

        <div className="crear-resumen-acciones">
          <div className="crear-tiempo">
            <strong>{formatMinutesAsHoursAndMinutes(totalTiempo)}</strong>
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
              onClick={() => guardarEvento()}
              disabled={cargando}
            >
              {cargando ? 'Creando evento...' : 'Crear evento'}
            </button>
          </div>
        </div>
      </div>

    </section>

    {conflictoPlan && (
      <div className="reprogram-overlay">
        <section className="reprogram-dialog" role="dialog" aria-modal="true" aria-labelledby="crear-conflicto-title">
          <p className="reprogram-task-name">{conflictoPlan.subtask_title}</p>
          <div className="reprogram-conflict" role="alert">
            <h2 id="crear-conflicto-title">Conflicto de sobrecarga</h2>
            <strong>Quedarías con {formatMinutesAsHours(conflictoPlan.planned_minutes)} planificadas (límite {formatMinutesAsHours(conflictoPlan.limit_minutes)}).</strong>
          </div>
          <p className="reprogram-question">¿Cómo quieres solucionarlo?</p>
          <div className="reprogram-options">
            <section>
              <h3>Mover a otro día</h3>
              <label>
                Nueva fecha para esta gestión
                <input
                  type="date"
                  max={evento.event_date ? evento.event_date.slice(0, 10) : undefined}
                  value={fechaAlternativaPlan}
                  onChange={(event) => setFechaAlternativaPlan(event.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => resolverConflictoPlan('target_date', fechaAlternativaPlan)}
                disabled={!fechaAlternativaPlan || Boolean(cargando)}
              >
                Guardar en esa fecha
              </button>
            </section>
            <section>
              <h3>Reducir duración</h3>
              <label>
                Nueva duración (minutos)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={minutosAlternativosPlan}
                  onChange={(event) => setMinutosAlternativosPlan(event.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => resolverConflictoPlan('estimated_minutes', minutosAlternativosPlan)}
                disabled={
                  !Number.isInteger(Number(minutosAlternativosPlan))
                  || Number(minutosAlternativosPlan) < 1
                  || Number(minutosAlternativosPlan) >= getDurationMinutes(subtareas[conflictoPlan.taskIndex] || {})
                  || Boolean(cargando)
                }
              >
                Guardar duración reducida
              </button>
            </section>
          </div>
          <button type="button" className="reprogram-cancel" onClick={() => setConflictoPlan(null)} disabled={Boolean(cargando)}>
            Seguir editando el evento
          </button>
        </section>
      </div>
    )}
  </main>
)
}
