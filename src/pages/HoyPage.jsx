import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../utils/apiUrl.js'

const panelStyle = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '2rem 1rem 4rem',
  fontFamily: 'Inter, sans-serif',
}

const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: '1.25rem',
  boxShadow: '0 4px 18px rgba(13, 26, 26, 0.08)',
  marginBottom: '1rem',
}

const baseButton = {
  border: 'none',
  borderRadius: 10,
  padding: '0.7rem 1rem',
  fontWeight: 700,
  cursor: 'pointer',
}

export default function HoyPage({ onLogout }) {
  const [data, setData] = useState({ vencidas: [], hoy: [], proximas: [] })
  const [eventos, setEventos] = useState([])
  const [nombresEventos, setNombresEventos] = useState({})
  const [filtroEvento, setFiltroEvento] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      const [respuesta, eventosRespuesta] = await Promise.all([
        axios.get(`${API_URL}/hoy/`),
        axios.get(`${API_URL}/eventos/`),
      ])
      setData(respuesta.data)
      setEventos(eventosRespuesta.data)
      setNombresEventos(Object.fromEntries(eventosRespuesta.data.map((evento) => [
        evento.id,
        { name: evento.name, color: evento.color || '#1d7a5f' },
      ])))
    } catch {
      setError('No pudimos cargar tus tareas de hoy.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const renderLista = (titulo, items, grupo) => (
    <div style={cardStyle}>
      <h2 style={{ marginBottom: '1rem' }}>{titulo}</h2>
      {items.length === 0 ? (
        <p className="state-empty">No hay gestiones en este bloque. Tu agenda está despejada por ahora.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {items.map((item) => (
            (() => {
              const eventoInfo = nombresEventos[item.event_id] || { name: 'Evento', color: '#1d7a5f' }
              return (
            <div
              key={item.id}
              className={`hoy-tarea hoy-tarea-${grupo}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                alignItems: 'center',
                border: '1px solid #e7ecec',
                borderLeft: `5px solid ${eventoInfo.color}`,
                borderRadius: 12,
                padding: '0.8rem 1rem',
              }}
            >
              <div>
                <strong>{item.event_name || item.event?.name || item.event_title || eventoInfo.name}</strong>
                <div style={{ color: '#586464', fontSize: '0.9rem', marginTop: 4 }}>
                  Tarea: {item.title} · {item.target_date || 'Sin fecha'} · {item.estimated_minutes} min
                </div>
              </div>
              {grupo === 'vencidas' && <span className="hoy-prioridad hoy-prioridad-urgente">Atención inmediata</span>}
              {grupo === 'hoy' && <span className="hoy-prioridad hoy-prioridad-hoy">Vence hoy</span>}
              <Link
                to="/evento/subtareas"
                onClick={() => sessionStorage.setItem('selectedEventId', item.event_id)}
                style={{ ...baseButton, background: '#eaf8f1', color: '#0d5c3f', textDecoration: 'none' }}
              >
                Ver detalle
              </Link>
            </div>
              )
            })()
          ))}
        </div>
      )}
    </div>
  )

  const totalGestiones = data.vencidas.length + data.hoy.length + data.proximas.length
  const grupos = ['vencidas', 'hoy', 'proximas']
  const gruposFiltrados = grupos
    .filter((grupo) => !filtroEstado || filtroEstado === grupo)
    .map((grupo) => [
      grupo,
      data[grupo].filter((tarea) => !filtroEvento || String(tarea.event_id) === filtroEvento),
    ])
  const totalFiltradas = gruposFiltrados.reduce((total, [, tareas]) => total + tareas.length, 0)

  return (
    <main style={panelStyle}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#08734f', fontWeight: 700 }}>
            Sprint 1 · Hoy
          </p>
          <div className="hoy-titulo-fila">
            <h1 style={{ margin: '0.4rem 0 0' }}>Tu plan del día</h1>
            <button
              type="button"
              className="hoy-regla-ayuda"
              aria-label="Cómo se ordenan las tareas"
              aria-describedby="hoy-regla-tooltip"
            >
              <span aria-hidden="true">i</span>
              <span className="hoy-regla-tooltip" id="hoy-regla-tooltip" role="tooltip">
              <p>¿Cómo se ordenan las tareas?</p>
              Primero van las vencidas, después las que vencen hoy y luego las próximas. En cada grupo, se ordena por fecha límite, más antigua y, si coincide, por menor duración.
              </span>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/progreso"
            style={{ ...baseButton, background: '#edf2f3', color: '#243434', textDecoration: 'none' }}
          >
            Todos los eventos
          </Link>
          <Link
            to="/crear"
            style={{ ...baseButton, background: '#1d7a5f', color: '#fff', textDecoration: 'none' }}
          >
            Crear evento
          </Link>
          <button
            type="button"
            onClick={onLogout}
            style={{ ...baseButton, background: '#ffe5e1', color: '#9b2a24' }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {error ? (
        <div className="hoy-error" style={{ ...cardStyle, background: '#fff1f0', borderLeft: '4px solid #d9554c' }} role="alert">
          <span>{error}</span>
          <button type="button" onClick={cargarDatos} style={{ ...baseButton, background: '#f3d5d2' }}>
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <div className="operativa-loading-page">
          <div style={cardStyle} className="state-loading operativa-loading-card" role="status">Estamos ordenando tus gestiones...</div>
        </div>
      ) : (
        totalGestiones === 0 ? (
          <div style={{ ...cardStyle, background: '#edfaf3', borderLeft: '4px solid #1d7a5f' }} className="state-empty-block hoy-empty-block">
            <strong>Tu plan comienza aquí</strong>
            <p>Aún no tienes gestiones. Crea tu primer evento para comenzar.</p>
            <Link to="/crear" style={{ ...baseButton, background: '#1d7a5f', color: '#fff', textDecoration: 'none' }}>Crear mi primer evento</Link>
          </div>
        ) : (
          <>
            <section className="hoy-filtros" aria-label="Filtros de tareas">
              <label className="hoy-filtro-campo">
                <span>Evento</span>
                <select value={filtroEvento} onChange={(event) => setFiltroEvento(event.target.value)}>
                  <option value="">Todos los eventos</option>
                  {eventos.map((evento) => (
                    <option key={evento.id} value={evento.id}>{evento.name}</option>
                  ))}
                </select>
              </label>
              <label className="hoy-filtro-campo">
                <span>Estado</span>
                <select value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)}>
                  <option value="">Todos los estados</option>
                  <option value="vencidas">Vencidas</option>
                  <option value="hoy">Para hoy</option>
                  <option value="proximas">Próximas</option>
                </select>
              </label>
              {(filtroEvento || filtroEstado) && (
                <button
                  type="button"
                  className="hoy-filtros-limpiar"
                  onClick={() => {
                    setFiltroEvento('')
                    setFiltroEstado('')
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </section>

            {totalFiltradas === 0 ? (
              <div className="state-empty-block hoy-filtro-vacio" role="status">
                No hay tareas que coincidan con estos filtros.
              </div>
            ) : (
              gruposFiltrados.map(([grupo, tareas]) => renderLista(
                grupo === 'vencidas' ? 'Vencidas' : grupo === 'hoy' ? 'Para hoy' : 'Próximas',
                tareas,
                grupo,
              ))
            )}
          </>
        )
      )}
    </main>
  )
}
