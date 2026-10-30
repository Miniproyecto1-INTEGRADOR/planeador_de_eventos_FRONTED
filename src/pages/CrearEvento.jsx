import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../utils/apiUrl.js'
import { getApiErrorMessage } from '../utils/apiError.js'
import { durationToMinutes, formatDuration, isValidDuration } from '../utils/duration.js'
import DurationFields from '../components/DurationFields.jsx'
import DatePicker from '../DatePicker.jsx'

const valoresIniciales = {
  name: '',
  event_type: 'Bodas',
  event_date: '',
  color: '#FF6B6B',
}

const subtareaBase = [
  { title: '', target_date: '', duration_hours: '', duration_minutes: '' },
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
  const [duracionAlternativaPlan, setDuracionAlternativaPlan] = useState({ hours: '', minutes: '' })
  const [tiposAbierto, setTiposAbierto] = useState(false)
  const [calendarioAbierto, setCalendarioAbierto] = useState(false)
  const [mesCalendario, setMesCalendario] = useState(() => {
    const hoy = new Date()
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  })
  const [horaEvento, setHoraEvento] = useState('05')
  const [minutoEvento, setMinutoEvento] = useState('00')
  const [periodoEvento, setPeriodoEvento] = useState('PM')
  const tiposRef = useRef(null)
  const calendarioRef = useRef(null)

  const tieneCambios = Boolean(
    evento.name.trim() ||
    evento.event_date ||
    evento.color !== valoresIniciales.color ||
    subtareas.some((tarea) => (
      tarea.title.trim() ||
      tarea.target_date ||
      tarea.duration_hours !== '' ||
      tarea.duration_minutes !== ''
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

  useEffect(() => {
    if (!calendarioAbierto) return undefined

    const cerrarCalendarioExterior = (event) => {
      if (!calendarioRef.current?.contains(event.target)) setCalendarioAbierto(false)
    }
    const cerrarCalendarioEscape = (event) => {
      if (event.key === 'Escape') setCalendarioAbierto(false)
    }

    document.addEventListener('mousedown', cerrarCalendarioExterior)
    document.addEventListener('keydown', cerrarCalendarioEscape)
    return () => {
      document.removeEventListener('mousedown', cerrarCalendarioExterior)
      document.removeEventListener('keydown', cerrarCalendarioEscape)
    }
  }, [calendarioAbierto])

  const volverAtras = () => {
    if (tieneCambios && !window.confirm('Tienes datos sin guardar. ¿Deseas salir sin crear el evento?')) return
    navigate('/hoy')
  }

  const totalTiempo = useMemo(
    () => subtareas.reduce(
      (total, item) => total + (durationToMinutes(item.duration_hours, item.duration_minutes) ?? 0),
      0,
    ),
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
    setSubtareas((actuales) => [
      ...actuales,
      { title: '', target_date: '', duration_hours: '', duration_minutes: '' },
    ])
  }

  const eliminarSubtarea = (index) => {
    setSubtareas((actuales) => actuales.filter((_, pos) => pos !== index))
  }

  const fechaSeleccionada = evento.event_date
    ? new Date(`${evento.event_date.slice(0, 10)}T12:00:00`)
    : null
  const hoy = new Date()
  const fechaMinima = [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, '0'),
    String(hoy.getDate()).padStart(2, '0'),
  ].join('-')
  const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const diasCalendario = useMemo(() => {
    const primerDia = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), 1)
    const desplazamiento = (primerDia.getDay() + 6) % 7
    return Array.from({ length: 42 }, (_, index) => (
      new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), index - desplazamiento + 1)
    ))
  }, [mesCalendario])
  const meses = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' })
  const tituloMesCalendario = (date) => {
    const titulo = meses.format(date)
    return `${titulo.charAt(0).toLocaleUpperCase('es-MX')}${titulo.slice(1)}`
  }
  const actualizarFechaHoraEvento = (date, hour = horaEvento, minute = minutoEvento, period = periodoEvento) => {
    if (!date) return
    let hour24 = Number(hour) % 12
    if (period === 'PM') hour24 += 12
    const localDate = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')
    const localTime = `${String(hour24).padStart(2, '0')}:${minute}`
    setEvento((actual) => ({ ...actual, event_date: `${localDate}T${localTime}` }))
  }

  const cambiarFechaHoraManual = (value) => {
    if (value && value.slice(0, 10) < fechaMinima) return
    setEvento((actual) => ({ ...actual, event_date: value }))
    if (!value) return

    const [datePart, timePart] = value.split('T')
    const [hours, minutes] = timePart.split(':').map(Number)
    setHoraEvento(String(hours % 12 || 12).padStart(2, '0'))
    setMinutoEvento(String(minutes).padStart(2, '0'))
    setPeriodoEvento(hours >= 12 ? 'PM' : 'AM')

    const date = new Date(`${datePart}T12:00:00`)
    setMesCalendario(new Date(date.getFullYear(), date.getMonth(), 1))
  }

  const actualizarHoraEvento = (field, value) => {
    const nextHour = field === 'hour' ? value : horaEvento
    const nextMinute = field === 'minute' ? value : minutoEvento
    const nextPeriod = field === 'period' ? value : periodoEvento

    if (field === 'hour') setHoraEvento(value)
    if (field === 'minute') setMinutoEvento(value)
    if (field === 'period') setPeriodoEvento(value)
    if (fechaSeleccionada) actualizarFechaHoraEvento(fechaSeleccionada, nextHour, nextMinute, nextPeriod)
  }

  const seleccionarDiaEvento = (date) => {
    const isoDate = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')
    if (isoDate < fechaMinima) return
    actualizarFechaHoraEvento(date)
    setMesCalendario(new Date(date.getFullYear(), date.getMonth(), 1))
  }

  const cambiarMesCalendario = (amount) => {
    setMesCalendario((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + amount, 1)
      return next < mesActual ? mesActual : next
    })
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

    const subtareasConContenido = subtareasPlan.filter(
      (item) => (
        item.title.trim() ||
        item.target_date ||
        item.duration_hours !== '' ||
        item.duration_minutes !== ''
      ),
    )
    const subtareasValidas = subtareasConContenido.filter(
      (item) => item.title.trim() && isValidDuration(item.duration_hours, item.duration_minutes),
    )

    if (!subtareasConContenido.length) {
      setError('Añade al menos una gestión con título y tiempo estimado.')
      return
    }
    if (subtareasValidas.length !== subtareasConContenido.length) {
      const faltaTitulo = subtareasConContenido.some((item) => !item.title.trim())
      const faltaDuracionValida = subtareasConContenido.some(
        (item) => !isValidDuration(item.duration_hours, item.duration_minutes),
      )

      if (faltaTitulo && faltaDuracionValida) {
        setError('Completa el título y asigna una duración mayor a cero; los minutos deben estar entre 0 y 59.')
      } else if (faltaTitulo) {
        setError('Completa el título de cada gestión que hayas comenzado.')
      } else {
        setError('Asigna una duración mayor a cero y verifica que los minutos estén entre 0 y 59.')
      }
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
          estimated_minutes: durationToMinutes(tarea.duration_hours, tarea.duration_minutes),
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
        const currentMinutes = conflictingTask
          ? durationToMinutes(conflictingTask.duration_hours, conflictingTask.duration_minutes)
          : 60
        const reducedMinutes = Math.max(1, currentMinutes - 30)
        setDuracionAlternativaPlan({
          hours: String(Math.floor(reducedMinutes / 60)),
          minutes: String(reducedMinutes % 60),
        })
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

    const cambios = field === 'duration'
      ? {
          duration_hours: String(Math.floor(value / 60)),
          duration_minutes: String(value % 60),
        }
      : { [field]: value }
    const subtareasActualizadas = subtareas.map((tarea, index) => (
      index === conflictoPlan.taskIndex ? { ...tarea, ...cambios } : tarea
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
          <span>{subtareas.length} {subtareas.length === 1 ? 'gestión' : 'gestiones'}</span>
          <span>{formatDuration(totalTiempo)}</span>
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

          <div className="crear-calendar" ref={calendarioRef}>
            <div className="crear-calendar-control">
              <input
                id="event_date"
                type="datetime-local"
                step="60"
                min={`${fechaMinima}T00:00`}
                value={evento.event_date}
                onChange={(event) => cambiarFechaHoraManual(event.target.value)}
              />
              <button
                type="button"
                className="crear-calendar-trigger"
                aria-label={calendarioAbierto ? 'Cerrar calendario del evento' : 'Abrir calendario del evento'}
                aria-haspopup="dialog"
                aria-expanded={calendarioAbierto}
                aria-controls="event-calendar-panel"
                onClick={() => {
                  if (!calendarioAbierto && fechaSeleccionada) {
                    setMesCalendario(new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1))
                  }
                  setCalendarioAbierto((open) => !open)
                }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="3.5" y="5" width="17" height="16" rx="2" />
                    <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
                  </svg>
                </button>
            </div>

            {calendarioAbierto && (
              <div
                className="crear-calendar-popover"
                id="event-calendar-panel"
                role="dialog"
                aria-label="Selecciona la fecha y hora del evento"
              >
                <section className="crear-calendar-month" aria-label="Calendario">
                  <header className="crear-calendar-month-header">
                    <button
                      type="button"
                      aria-label="Mes anterior"
                      disabled={mesCalendario <= mesActual}
                      onClick={() => cambiarMesCalendario(-1)}
                    >
                      ‹
                    </button>
                    <h3>{tituloMesCalendario(mesCalendario)}</h3>
                    <button
                      type="button"
                      aria-label="Mes siguiente"
                      onClick={() => cambiarMesCalendario(1)}
                    >
                      ›
                    </button>
                  </header>
                  <div className="crear-calendar-grid">
                    {[
                      ['Lu', 'Lunes'],
                      ['Ma', 'Martes'],
                      ['Mi', 'Miércoles'],
                      ['Ju', 'Jueves'],
                      ['Vi', 'Viernes'],
                      ['Sá', 'Sábado'],
                      ['Do', 'Domingo'],
                    ].map(([shortName, fullName]) => (
                      <span className="crear-calendar-weekday" key={fullName}>
                        <span aria-hidden="true">{shortName}</span>
                        <span className="crear-calendar-sr-only">{fullName}</span>
                      </span>
                    ))}
                    {diasCalendario.map((date) => {
                      const isoDate = [
                        date.getFullYear(),
                        String(date.getMonth() + 1).padStart(2, '0'),
                        String(date.getDate()).padStart(2, '0'),
                      ].join('-')
                      const selectedDate = evento.event_date.slice(0, 10) === isoDate
                      const isToday = isoDate === fechaMinima
                      const outsideMonth = date.getMonth() !== mesCalendario.getMonth()
                      const isPast = isoDate < fechaMinima

                      return (
                        <button
                          type="button"
                          className={[
                            'crear-calendar-day',
                            outsideMonth ? 'outside-month' : '',
                            isToday ? 'is-today' : '',
                            isPast ? 'is-past' : '',
                            selectedDate ? 'is-selected' : '',
                          ].filter(Boolean).join(' ')}
                          aria-label={new Intl.DateTimeFormat('es-MX', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }).format(date)}
                          aria-pressed={selectedDate}
                          disabled={isPast}
                          key={isoDate}
                          onClick={() => seleccionarDiaEvento(date)}
                        >
                          {date.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section className="crear-calendar-time" aria-label="Hora del evento">
                  <h3>Hora del evento</h3>
                  <p>Selecciona la hora</p>
                  <div className="crear-calendar-time-columns">
                    <div className="crear-calendar-time-column" aria-label="Hora">
                      <span>Hora</span>
                      <div>
                        {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')).map((hour) => (
                          <button
                            type="button"
                            className={horaEvento === hour ? 'is-selected' : ''}
                            aria-pressed={horaEvento === hour}
                            key={hour}
                            onClick={() => actualizarHoraEvento('hour', hour)}
                          >
                            {hour}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="crear-calendar-time-column" aria-label="Minutos">
                      <span>Minutos</span>
                      <div>
                        {Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0')).map((minute) => (
                          <button
                            type="button"
                            className={minutoEvento === minute ? 'is-selected' : ''}
                            aria-pressed={minutoEvento === minute}
                            key={minute}
                            onClick={() => actualizarHoraEvento('minute', minute)}
                          >
                            {minute}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="crear-calendar-time-column" aria-label="Periodo">
                      <span>Periodo</span>
                      <div>
                        {['AM', 'PM'].map((period) => (
                          <button
                            type="button"
                            className={periodoEvento === period ? 'is-selected' : ''}
                            aria-pressed={periodoEvento === period}
                            key={period}
                            onClick={() => actualizarHoraEvento('period', period)}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="crear-calendar-done"
                    onClick={() => setCalendarioAbierto(false)}
                  >
                    Listo
                  </button>
                </section>
              </div>
            )}
          </div>
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

              <DatePicker
                id={`fecha-${index}`}
                ariaLabel="Fecha límite"
                value={tarea.target_date}
                onValueChange={(value) => actualizarSubtarea(index, 'target_date', value)}
              />
            </div>

            <div className="crear-campo crear-campo-duracion">
              <DurationFields
                idPrefix={`duration-${index}`}
                hours={tarea.duration_hours}
                minutes={tarea.duration_minutes}
                onHoursChange={(value) => actualizarSubtarea(index, 'duration_hours', value)}
                onMinutesChange={(value) => actualizarSubtarea(index, 'duration_minutes', value)}
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
          <p>
            Revisa la información antes de crear el evento.
          </p>
        </div>

        <div className="crear-resumen-acciones">
          <div className="crear-tiempo">
            <strong>{formatDuration(totalTiempo)}</strong>
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
            <strong>Quedarías con {formatDuration(conflictoPlan.planned_minutes)} planificadas (límite {formatDuration(conflictoPlan.limit_minutes)}).</strong>
          </div>
          <p className="reprogram-question">¿Cómo quieres solucionarlo?</p>
          <div className="reprogram-options">
            <section>
              <h3>Mover a otro día</h3>
              <label>
                Nueva fecha para esta gestión
                <DatePicker
                  ariaLabel="Nueva fecha para esta gestión"
                  value={fechaAlternativaPlan}
                  onValueChange={setFechaAlternativaPlan}
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
              <DurationFields
                idPrefix="reduced-duration"
                hours={duracionAlternativaPlan.hours}
                minutes={duracionAlternativaPlan.minutes}
                onHoursChange={(hours) => setDuracionAlternativaPlan((actual) => ({ ...actual, hours }))}
                onMinutesChange={(minutes) => setDuracionAlternativaPlan((actual) => ({ ...actual, minutes }))}
              />
              <button
                type="button"
                onClick={() => resolverConflictoPlan(
                  'duration',
                  durationToMinutes(duracionAlternativaPlan.hours, duracionAlternativaPlan.minutes),
                )}
                disabled={
                  !isValidDuration(duracionAlternativaPlan.hours, duracionAlternativaPlan.minutes) ||
                  durationToMinutes(duracionAlternativaPlan.hours, duracionAlternativaPlan.minutes) >= durationToMinutes(
                    subtareas[conflictoPlan.taskIndex]?.duration_hours,
                    subtareas[conflictoPlan.taskIndex]?.duration_minutes,
                  ) ||
                  Boolean(cargando)
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
