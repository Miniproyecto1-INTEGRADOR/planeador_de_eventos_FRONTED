import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../utils/apiUrl.js'
import { formatDateDMY, formatMinutesAsHours } from '../utils/formatters.js'

const grupos = [
  ['vencidas', 'Vencidas'],
  ['hoy', 'Para hoy'],
  ['proximas', 'Próximas'],
]

const estados = [
  ['pending', 'Pendiente'],
  ['postponed', 'Pospuesta'],
  ['done', 'Ejecutada'],
]

export default function HoyPage() {
  const [data, setData] = useState({ vencidas: [], hoy: [], proximas: [] })
  const [eventos, setEventos] = useState([])
  const [eventoFiltro, setEventoFiltro] = useState('todos')
  const [estadoFiltro, setEstadoFiltro] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      const [eventosRespuesta, ...respuestas] = await Promise.all([
        axios.get(`${API_URL}/eventos/`),
        ...estados.map(([status]) => axios.get(`${API_URL}/hoy/`, { params: { status } })),
      ])
      const agrupadas = { vencidas: [], hoy: [], proximas: [] }

      respuestas.forEach(({ data: resumen }) => {
        grupos.forEach(([key]) => agrupadas[key].push(...(resumen[key] || [])))
      })
      Object.values(agrupadas).forEach((tareas) => tareas.sort((a, b) =>
        (a.target_date || '9999-12-31').localeCompare(b.target_date || '9999-12-31') ||
        Number(a.estimated_minutes || 0) - Number(b.estimated_minutes || 0),
      ))

      setEventos(eventosRespuesta.data)
      setData(agrupadas)
    } catch {
      setError('No pudimos cargar tus tareas de hoy.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const eventosPorId = Object.fromEntries(eventos.map((evento) => [evento.id, evento]))
  const tareasVisibles = (key) => data[key].filter((tarea) =>
    (eventoFiltro === 'todos' || tarea.event_id === eventoFiltro) &&
    (estadoFiltro === 'todos' || tarea.status === estadoFiltro),
  )
  const total = grupos.reduce((sum, [key]) => sum + tareasVisibles(key).length, 0)
  const totalGeneral = grupos.reduce((sum, [key]) => sum + data[key].length, 0)
  const horasPendientesHoy = data.hoy
    .filter((tarea) => tarea.status === 'pending')
    .reduce((totalMinutes, tarea) => totalMinutes + Number(tarea.estimated_minutes || 0), 0)
  const hoy = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return (
    <main className="today-app">
      <section className="today-content">
        <header className="today-heading">
          <div>
            <p>{hoy}</p>
            <div className="today-title">
              <h2>Hoy</h2>
              <details className="today-sort-help">
                <summary aria-label="Ver regla de ordenamiento">i</summary>
                <div className="today-sort-tooltip">
                  Primero van las vencidas, después las que vencen hoy y luego las próximas. En cada grupo, se ordena por fecha límite, más antigua y, si coincide, por menor duración.
                </div>
              </details>
            </div>
            <span>Gestiona y planifica tus eventos</span>
          </div>
          <Link className="today-create" to="/crear"><span aria-hidden="true">+</span>Crear evento</Link>
        </header>

        <section className="today-filters" aria-label="Filtros de tareas">
          <label>Evento
            <select value={eventoFiltro} onChange={(event) => setEventoFiltro(event.target.value)}>
              <option value="todos">Todos los eventos</option>
              {eventos.map((evento) => <option key={evento.id} value={evento.id}>{evento.name}</option>)}
            </select>
          </label>
          <label>Estado
            <select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)}>
              {estados.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              <option value="todos">Todos los estados</option>
            </select>
          </label>
          <p><strong>{total}</strong> gestiones en la vista</p>
          <p><strong>{formatMinutesAsHours(horasPendientesHoy)}</strong> pendientes hoy</p>
        </section>

        {error && <div className="today-error" role="alert">{error}<button type="button" onClick={cargarDatos}>Reintentar</button></div>}
        {loading ? (
          <p className="today-message" role="status">Cargando tareas...</p>
        ) : !error && total === 0 ? (
          <div className="today-empty">
            <span>{totalGeneral ? '—' : '0'}</span>
            <div>
              <strong>{totalGeneral ? 'No hay tareas con estos filtros' : 'Tu agenda está despejada'}</strong>
              <p>{totalGeneral ? 'Prueba con otro evento o estado.' : 'Crea un evento para comenzar tu planificación.'}</p>
            </div>
            {totalGeneral ? (
              <button type="button" onClick={() => { setEventoFiltro('todos'); setEstadoFiltro('todos') }}>Limpiar filtros</button>
            ) : <Link className="today-create" to="/crear">Crear mi primer evento</Link>}
          </div>
        ) : !error && (
          <div className="today-groups">
            {grupos.map(([key, title]) => {
              const tareas = tareasVisibles(key)
              return (
                <section className={`today-group${key === 'vencidas' ? ' today-group-overdue' : ''}`} key={key}>
                  <header><h2>{title}</h2><span>{String(tareas.length).padStart(2, '0')}</span></header>
                  {tareas.length ? tareas.map((tarea) => {
                    const nombre = tarea.event_name || tarea.event?.name || eventosPorId[tarea.event_id]?.name || 'Evento'
                    const estado = estados.find(([value]) => value === tarea.status)?.[1] || 'Pendiente'
                    return (
                      <article
                        className="today-task"
                        key={tarea.id}
                        style={{ '--event-color': eventosPorId[tarea.event_id]?.color || '#1d7a5f' }}
                      >
                        <time dateTime={tarea.target_date || undefined}>{formatDateDMY(tarea.target_date)}</time>
                        <div className="today-task-name"><span>{nombre}</span><strong>{tarea.title}</strong></div>
                        {tarea.status === 'postponed' && tarea.postponed_note && (
                          <p className="today-task-note">Nota: {tarea.postponed_note}</p>
                        )}
                        <span className={`today-status status-${tarea.status}`}>{estado}</span>
                        <span className="today-hours">{formatMinutesAsHours(tarea.estimated_minutes)}</span>
                        <Link to="/evento/subtareas" onClick={() => sessionStorage.setItem('selectedEventId', tarea.event_id)}>Ver detalle</Link>
                      </article>
                    )
                  }) : <p className="today-no-tasks">No hay gestiones en este bloque.</p>}
                </section>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
