import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

export default function HoyPage() {
  const navigate = useNavigate()
  const [data, setData] = useState({ vencidas: [], hoy: [], proximas: [] })
  const [nombresEventos, setNombresEventos] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      const respuesta = await axios.get(`${API_URL}/hoy/`)
      setData(respuesta.data)

      const tareas = [
        ...(respuesta.data.vencidas || []),
        ...(respuesta.data.hoy || []),
        ...(respuesta.data.proximas || []),
      ]
      const idsEventos = [...new Set(tareas.map((item) => item.event_id).filter(Boolean))]
      const nombresRespuesta = await Promise.all(
        idsEventos.map(async (eventId) => {
          try {
            const eventoRespuesta = await axios.get(`${API_URL}/eventos/${eventId}/`)
            return [eventId, eventoRespuesta.data.name]
          } catch (err) {
            return [eventId, 'Evento']
          }
        }),
      )
      setNombresEventos(Object.fromEntries(nombresRespuesta))
    } catch (err) {
      setError('No pudimos cargar tus tareas de hoy.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const renderLista = (titulo, items) => (
    <div style={cardStyle}>
      <h2 style={{ marginBottom: '1rem' }}>{titulo}</h2>
      {items.length === 0 ? (
        <p style={{ margin: 0, color: '#586464' }}>No hay tareas en este bloque.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                alignItems: 'center',
                border: '1px solid #e7ecec',
                borderRadius: 12,
                padding: '0.8rem 1rem',
              }}
            >
              <div>
                <strong>{item.event_name || item.event?.name || item.event_title || nombresEventos[item.event_id] || 'Evento'}</strong>
                <div style={{ color: '#586464', fontSize: '0.9rem', marginTop: 4 }}>
                  Tarea: {item.title} · {item.target_date || 'Sin fecha'} · {item.estimated_minutes} min
                </div>
              </div>
              <Link
                to="/evento/subtareas"
                onClick={() => sessionStorage.setItem('selectedEventId', item.event_id)}
                style={{ ...baseButton, background: '#eaf8f1', color: '#0d5c3f', textDecoration: 'none' }}
              >
                Ver detalle
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )

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
          <h1 style={{ margin: '0.4rem 0 0' }}>Tu plan del día</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ ...baseButton, background: '#edf2f3', color: '#243434' }}
          >
            Atrás
          </button>
          <Link
            to="/crear"
            style={{ ...baseButton, background: '#1d7a5f', color: '#fff', textDecoration: 'none' }}
          >
            Crear evento
          </Link>
        </div>
      </header>

      <div style={{ ...cardStyle, background: '#edfaf3', borderLeft: '4px solid #1d7a5f' }}>
        <strong>Regla de orden:</strong> primero tareas vencidas, luego las de hoy y por último las próximas. Dentro de cada bloque, se ordenan por fecha más temprana y luego por menor esfuerzo estimado.
      </div>

      {error && (
        <div style={{ ...cardStyle, background: '#fff1f0', borderLeft: '4px solid #d9554c' }}>
          {error}
          <button onClick={cargarDatos} style={{ ...baseButton, background: '#f3d5d2', marginLeft: '1rem' }}>
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div style={cardStyle}>Cargando tareas...</div>
      ) : (
        <>
          {renderLista('Vencidas', data.vencidas)}
          {renderLista('Para hoy', data.hoy)}
          {renderLista('Próximas', data.proximas)}
        </>
      )}
    </main>
  )
}
