import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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

export default function DetalleEvento() {
  const { id: routeId } = useParams()
  const id = routeId || sessionStorage.getItem('selectedEventId')
  const navigate = useNavigate() // Inicializamos la función para volver atrás
  const [evento, setEvento] = useState(null)
  const [subtareas, setSubtareas] = useState([])
  const [titulo, setTitulo] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(60)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      const [eventoResponse, subtareasResponse] = await Promise.all([
        axios.get(`${API_URL}/eventos/${id}/`),
        axios.get(`${API_URL}/eventos/${id}/subtareas/`),
      ])
      setEvento(eventoResponse.data)
      setSubtareas(subtareasResponse.data)
    } catch (err) {
      setError('No se pudo cargar el evento.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      cargarDatos()
    }
  }, [id])

  const crearSubtarea = async () => {
    if (!titulo.trim()) {
      setError('El título es obligatorio.')
      return
    }
    try {
      await axios.post(`${API_URL}/eventos/${id}/subtareas/`, {
        title: titulo,
        description: 'Gestión logística',
        target_date: targetDate || evento.event_date.split('T')[0],
        estimated_minutes: Number(estimatedMinutes),
        status: 'pending',
      })
      setTitulo('')
      setTargetDate('')
      setEstimatedMinutes(60)
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo guardar la subtarea.')
    }
  }

  const cambiarEstado = async (subtaskId, status) => {
    try {
      await axios.patch(`${API_URL}/eventos/${id}/subtareas/${subtaskId}`, { status })
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo actualizar el estado.')
    }
  }

  const eliminarSubtarea = async (subtaskId) => {
    try {
      await axios.delete(`${API_URL}/eventos/${id}/subtareas/${subtaskId}`)
      await cargarDatos()
    } catch (err) {
      setError('No se pudo eliminar la subtarea.')
    }
  }

  const eliminarEvento = async () => {
    if (!window.confirm('¿Querés eliminar este evento y todas sus subtareas?')) return
    try {
      await axios.delete(`${API_URL}/eventos/${id}`)
      window.location.href = '/hoy'
    } catch (err) {
      setError('No se pudo eliminar el evento.')
    }
  }

  if (loading) {
    return <main style={panelStyle}><div style={cardStyle}>Cargando evento...</div></main>
  }

  if (!evento) {
    return <main style={panelStyle}><div style={cardStyle}>No existe este evento.</div></main>
  }

  return (
    <main style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#08734f', fontWeight: 700 }}>Detalle del evento</p>
          <h1 style={{ margin: '0.35rem 0 0' }}>{evento.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>

          {/* Botón para volver atrás en el historial (añadido) */}
          <button onClick={() => navigate(-1)} style={{ ...baseButton, background: '#edf2f3', color: '#243434' }}>Atrás</button>

          {/* Enlace original que dirige a /hoy (mantenido) */}
          <Link to="/hoy" style={{ ...baseButton, background: '#edf2f3', color: '#243434', textDecoration: 'none' }}>Volver</Link>

          <button onClick={eliminarEvento} style={{ ...baseButton, background: '#ffe5e1', color: '#9b2a24' }}>Eliminar evento</button>
        </div>
      </div>

      {error && <div style={{ ...cardStyle, background: '#fff1f0', borderLeft: '4px solid #d9554c' }}>{error}</div>}

      <div style={cardStyle}>
        <div><strong>Tipo:</strong> {evento.event_type}</div>
        <div><strong>Fecha:</strong> {new Date(evento.event_date).toLocaleString()}</div>
        <div><strong>Subtareas:</strong> {subtareas.length}</div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Agregar subtarea</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título de la subtarea" style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }} />
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }} />
          <input type="number" min="1" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }} />
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <button onClick={crearSubtarea} style={{ ...baseButton, background: '#1d7a5f', color: '#fff' }}>Guardar subtarea</button>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Subtareas</h2>
        {subtareas.length === 0 ? (
          <p style={{ margin: 0, color: '#586464' }}>Aún no hay subtareas.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {subtareas.map((subtask) => (
              <div key={subtask.id} style={{ border: '1px solid #e7ecec', borderRadius: 12, padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>{subtask.title}</strong>
                  <div style={{ color: '#586464', marginTop: 4 }}>Fecha: {subtask.target_date || 'Sin fecha'} · {subtask.estimated_minutes} min</div>
                  <div style={{ marginTop: 8, fontSize: '0.9rem' }}>Estado: {subtask.status}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button onClick={() => cambiarEstado(subtask.id, 'done')} style={{ ...baseButton, background: '#dff8ed', color: '#0f5a3a' }}>Hecha</button>
                  <button onClick={() => cambiarEstado(subtask.id, 'postponed')} style={{ ...baseButton, background: '#eef3ff', color: '#2b4d96' }}>Posponer</button>
                  <button onClick={() => eliminarSubtarea(subtask.id)} style={{ ...baseButton, background: '#ffe5e1', color: '#9b2a24' }}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}