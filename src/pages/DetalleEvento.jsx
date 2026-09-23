import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
  const [evento, setEvento] = useState(null)
  const [subtareas, setSubtareas] = useState([])
  const [progreso, setProgreso] = useState({ done: 0, total: 0, percent: 0 })
  const [titulo, setTitulo] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(60)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  const cargarDatos = async () => {
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [eventoResponse, subtareasResponse] = await Promise.all([
        axios.get(`${API_URL}/eventos/${id}/`),
        axios.get(`${API_URL}/eventos/${id}/subtareas/`),
      ])
      setEvento(eventoResponse.data)
      setSubtareas(subtareasResponse.data)
      const progresoResponse = await axios.get(`${API_URL}/eventos/${id}/progreso`)
      setProgreso(progresoResponse.data)
    } catch {
      setError('No se pudo cargar el evento.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [id])

  const crearSubtarea = async () => {
    setError('')
    setSuccess('')
    if (!titulo.trim()) {
      setError('Escribe el nombre de la gestión que quieres organizar.')
      return
    }
    if (Number(estimatedMinutes) <= 0) {
      setError('Indica un tiempo estimado mayor que 0 minutos.')
      return
    }
    setActionLoading('create')
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
      setSuccess('Gestión añadida al plan del evento.')
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo guardar la subtarea.')
    } finally {
      setActionLoading('')
    }
  }

  const cambiarEstado = async (subtaskId, status) => {
    setError('')
    setSuccess('')
    setActionLoading(subtaskId)
    try {
      await axios.patch(`${API_URL}/eventos/${id}/subtareas/${subtaskId}`, { status })
      setSuccess(status === 'done' ? 'Gestión marcada como completada.' : 'Gestión pospuesta para revisarla después.')
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo actualizar el estado.')
    } finally {
      setActionLoading('')
    }
  }

  const eliminarSubtarea = async (subtaskId) => {
    setError('')
    setSuccess('')
    setActionLoading(subtaskId)
    try {
      await axios.delete(`${API_URL}/eventos/${id}/subtareas/${subtaskId}`)
      setSuccess('Gestión eliminada del evento.')
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo eliminar la gestión.')
    } finally {
      setActionLoading('')
    }
  }

  const eliminarEvento = async () => {
    if (!window.confirm('¿Querés eliminar este evento y todas sus subtareas?')) return
    setError('')
    setActionLoading('event')
    try {
      await axios.delete(`${API_URL}/eventos/${id}`)
      window.location.href = '/hoy'
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo eliminar el evento.')
      setActionLoading('')
    }
  }

  if (loading) {
    return <main style={panelStyle}><div style={cardStyle} className="state-loading" role="status">Estamos preparando el detalle del evento...</div></main>
  }

  if (!id || !evento) {
    return (
      <main style={panelStyle}>
        <div style={cardStyle} className="state-empty-block">
          <strong>No encontramos ese evento</strong>
          <p>Puede que el enlace haya caducado o que todavía no hayas creado un evento.</p>
          <Link to="/crear" className="state-action">Crear evento</Link>
        </div>
      </main>
    )
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
          <Link to="/hoy" style={{ ...baseButton, background: '#edf2f3', color: '#243434', textDecoration: 'none' }}>Volver a la agenda</Link>

          <button onClick={eliminarEvento} disabled={actionLoading === 'event'} style={{ ...baseButton, background: '#ffe5e1', color: '#9b2a24' }}>{actionLoading === 'event' ? 'Eliminando...' : 'Eliminar evento'}</button>
        </div>
      </div>

      {error && <div style={{ ...cardStyle, background: '#fff1f0', borderLeft: '4px solid #d9554c' }} role="alert">{error}</div>}
      {success && <div style={{ ...cardStyle, background: '#edfaf3', borderLeft: '4px solid #1d7a5f' }} role="status">{success}</div>}

      <div style={cardStyle}>
        <div><strong>Tipo:</strong> {evento.event_type}</div>
        <div><strong>Fecha:</strong> {new Date(evento.event_date).toLocaleString()}</div>
        <div><strong>Subtareas:</strong> {subtareas.length}</div>
        <div className="detalle-progreso">
          <div className="detalle-progreso-cabecera">
            <strong>Avance del evento</strong>
            <span>{progreso.done} de {progreso.total} completadas · {progreso.percent}%</span>
          </div>
          <div className="progreso-barra" aria-label={`Avance del evento: ${progreso.percent}%`} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progreso.percent}>
            <div style={{ width: `${progreso.percent}%` }} />
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Agregar subtarea</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título de la subtarea" style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }} />
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }} />
          <input type="number" min="1" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }} />
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <button onClick={crearSubtarea} disabled={actionLoading === 'create'} style={{ ...baseButton, background: '#1d7a5f', color: '#fff' }}>{actionLoading === 'create' ? 'Guardando...' : 'Guardar gestión'}</button>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Subtareas</h2>
        {subtareas.length === 0 ? (
          <p className="state-empty">Todavía no hay gestiones. Añade la primera arriba para empezar a organizar este evento.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {subtareas.map((subtask) => (
              <div key={subtask.id} style={{ border: '1px solid #e7ecec', borderRadius: 12, padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>{subtask.title}</strong>
                  <div style={{ color: '#586464', marginTop: 4 }}>Fecha: {subtask.target_date || 'Sin fecha'} · {subtask.estimated_minutes} min</div>
                  <div style={{ marginTop: 8, fontSize: '0.9rem' }}>Estado: {subtask.status === 'done' ? 'Completada' : subtask.status === 'postponed' ? 'Pospuesta' : 'Pendiente'}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button onClick={() => cambiarEstado(subtask.id, 'done')} disabled={actionLoading === subtask.id} style={{ ...baseButton, background: '#dff8ed', color: '#0f5a3a' }}>Hecha</button>
                  <button onClick={() => cambiarEstado(subtask.id, 'postponed')} disabled={actionLoading === subtask.id} style={{ ...baseButton, background: '#eef3ff', color: '#2b4d96' }}>Posponer</button>
                  <button onClick={() => eliminarSubtarea(subtask.id)} disabled={actionLoading === subtask.id} style={{ ...baseButton, background: '#ffe5e1', color: '#9b2a24' }}>{actionLoading === subtask.id ? 'Guardando...' : 'Eliminar'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}