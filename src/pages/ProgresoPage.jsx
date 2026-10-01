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

export default function ProgresoPage() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      const respuesta = await axios.get(`${API_URL}/eventos/`)
      const eventosConProgreso = await Promise.all(
        respuesta.data.map(async (evento) => {
          const progreso = await axios.get(`${API_URL}/eventos/${evento.id}/progreso`)
          return { ...evento, progreso: progreso.data }
        }),
      )
      setEventos(eventosConProgreso)
    } catch {
      setError('No se pudo cargar el progreso.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  return (
    <main style={panelStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#08734f', fontWeight: 700 }}>Eventos</p>
          <h1 style={{ margin: '0.4rem 0 0' }}>Todos los eventos</h1>
        </div>
        <Link to="/hoy" style={{ padding: '.7rem 1rem', borderRadius: 10, background: '#edf2f3', color: '#243434', fontWeight: 700, textDecoration: 'none' }}>
          Volver a Hoy
        </Link>
      </header>

      {error && (
        <div style={{ ...cardStyle, background: '#fff1f0', borderLeft: '4px solid #d9554c' }} role="alert">
          <p>{error}</p>
          <button type="button" onClick={cargarDatos}>Intentar de nuevo</button>
        </div>
      )}

      {loading ? (
        <div className="operativa-loading-page">
          <div style={cardStyle} className="state-loading operativa-loading-card" role="status">Estamos calculando el avance de tus eventos...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {eventos.length === 0 ? (
            <div style={cardStyle} className="state-empty-block">
              <strong>Aún no tienes eventos para medir</strong>
              <p>Crea un evento y verás aquí cuánto has avanzado en cada gestión.</p>
              <Link to="/crear" className="state-action">Crear evento</Link>
            </div>
          ) : (
            eventos.map((evento) => {
              const porcentaje = Math.round(Math.min(100, Math.max(0, evento.progreso.percent || 0)))
              return (
                <article key={evento.id} className="progress-event-card">
                  <header className="progress-event-heading">
                    <div>
                      <h2>{evento.name}</h2>
                      <span>{evento.event_type}</span>
                    </div>
                    <Link to="/evento/subtareas" onClick={() => sessionStorage.setItem('selectedEventId', evento.id)}>
                      Ver detalle <span aria-hidden="true">↗</span>
                    </Link>
                  </header>
                  <div className="progress-event-summary">
                    <span>{evento.progreso.done} de {evento.progreso.total} gestiones completadas</span>
                    <strong>{porcentaje}%</strong>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label={`Progreso de ${evento.name}`}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={porcentaje}
                  >
                    <div style={{ width: `${porcentaje}%` }} />
                  </div>
                  {evento.progreso.total === 0 && <p className="progress-empty-hint">Añade gestiones para comenzar el seguimiento.</p>}
                </article>
              )
            })
          )}
        </div>
      )}
    </main>
  )
}
