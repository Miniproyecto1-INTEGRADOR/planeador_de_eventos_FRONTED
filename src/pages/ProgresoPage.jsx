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
      <header style={{ marginBottom: '1rem' }}>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#08734f', fontWeight: 700 }}>Sprint 1 · Progreso</p>
        <h1 style={{ margin: '0.4rem 0 0' }}>Avance por evento</h1>
      </header>

      {error && (
        <div style={{ ...cardStyle, background: '#fff1f0', borderLeft: '4px solid #d9554c' }} role="alert">
          <p>{error}</p>
          <button type="button" onClick={cargarDatos}>Intentar de nuevo</button>
        </div>
      )}

      {loading ? (
        <div style={cardStyle} className="state-loading" role="status">Estamos calculando el avance de tus eventos...</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {eventos.length === 0 ? (
            <div style={cardStyle} className="state-empty-block">
              <strong>Aún no tienes eventos para medir</strong>
              <p>Crea un evento y verás aquí cuánto has avanzado en cada gestión.</p>
              <Link to="/crear" className="state-action">Crear evento</Link>
            </div>
          ) : (
            eventos.map((evento) => (
              <div key={evento.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>{evento.name}</h2>
                    <div style={{ color: '#586464' }}>{evento.event_type}</div>
                  </div>
                  <Link to="/evento/subtareas" onClick={() => sessionStorage.setItem('selectedEventId', evento.id)} style={{ color: '#0d5c3f', fontWeight: 700, textDecoration: 'none' }}>Ver detalle</Link>
                </div>
                <div className="progreso-evento">
                  <div className="progreso-circulo" style={{ '--progreso-grados': `${evento.progreso.percent * 3.6}deg` }} role="img" aria-label={`${evento.progreso.percent}% completado`}>
                    <strong>{evento.progreso.percent}%</strong>
                  </div>
                  <div className="progreso-detalle">
                    <strong>{evento.progreso.done} de {evento.progreso.total} gestiones completadas</strong>
                    <span>{evento.progreso.total === 0 ? 'Añade gestiones para comenzar el seguimiento.' : 'Cada cambio se refleja aquí automáticamente.'}</span>
                  </div>
                </div>
                <div className="progreso-barra" aria-hidden="true">
                  <div style={{ width: `${evento.progreso.percent}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  )
}
