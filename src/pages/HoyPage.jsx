import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../utils/apiUrl.js'

const grupos = [
  ['vencidas', 'Vencidas'],
  ['hoy', 'Para hoy'],
  ['proximas', 'Próximas'],
]

const estados = [
  ['pending', 'Pendiente'],
  ['postponed', 'Pospuesta'],
  ['done', 'Completada'],
]

const fechaCorta = (value) => {
  if (!value) return 'Sin fecha'
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(new Date(year, month - 1, day))
}

export default function HoyPage({ onLogout }) {
  const [data, setData] = useState({ vencidas: [], hoy: [], proximas: [] })
  const [eventos, setEventos] = useState([])
  const [eventoFiltro, setEventoFiltro] = useState('todos')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
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
  const hoy = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return (
    <main className="today-app">
      <aside className="today-sidebar">
        <Link className="today-logo" to="/hoy" aria-label="Eventos al Día, inicio"><img src="/Logo.jpg" alt="Eventos al Día" /></Link>
        <nav aria-label="Navegación principal">
          <p>Tu espacio</p>
          <Link className="active" to="/hoy"><span>01</span>Hoy</Link>
          <Link to="/progreso"><span>02</span>Progreso</Link>
        </nav>
        <button className="today-logout" type="button" onClick={onLogout}>Cerrar sesión</button>
      </aside>

      <section className="today-content">
        <header className="today-heading">
          <div>
            <p>{hoy}</p>
            <h1>Hoy</h1>
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
              <option value="todos">Todos los estados</option>
              {estados.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <p><strong>{total}</strong> gestiones</p>
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
                <section className="today-group" key={key}>
                  <header><h2>{title}</h2><span>{String(tareas.length).padStart(2, '0')}</span></header>
                  {tareas.length ? tareas.map((tarea) => {
                    const nombre = tarea.event_name || tarea.event?.name || eventosPorId[tarea.event_id]?.name || 'Evento'
                    const estado = estados.find(([value]) => value === tarea.status)?.[1] || 'Pendiente'
                    return (
                      <article className="today-task" key={tarea.id}>
                        <time dateTime={tarea.target_date || undefined}>{fechaCorta(tarea.target_date)}</time>
                        <div className="today-task-name"><span>{nombre}</span><strong>{tarea.title}</strong></div>
                        <span className={`today-status status-${tarea.status}`}>{estado}</span>
                        <span className="today-minutes">{tarea.estimated_minutes || 0} min</span>
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
