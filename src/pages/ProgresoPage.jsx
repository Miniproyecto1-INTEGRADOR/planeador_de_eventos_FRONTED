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
    } catch (err) {
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

      {error && <div style={{ ...cardStyle, background: '#fff1f0', borderLeft: '4px solid #d9554c' }}>{error}</div>}

      {loading ? (
        <div style={cardStyle}>Cargando progreso...</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {eventos.length === 0 ? (
            <div style={cardStyle}>Todavía no hay eventos creados.</div>
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
                <div style={{ marginTop: '1rem', color: '#4c5a5a' }}>
                  {evento.progreso.done} de {evento.progreso.total} tarea(s) completadas · {evento.progreso.percent}%
                </div>
                <div style={{ height: 12, borderRadius: 999, background: '#edf1f0', marginTop: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ width: `${evento.progreso.percent}%`, height: '100%', background: '#1d7a5f' }} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  )
}
