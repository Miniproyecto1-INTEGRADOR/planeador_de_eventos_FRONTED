import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../utils/apiUrl.js'
import { getApiErrorMessage } from '../utils/apiError.js'

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
]

export default function DetalleEvento() {
  const { id: routeId } = useParams()
  const id = routeId || sessionStorage.getItem('selectedEventId')
  const [evento, setEvento] = useState(null)
  const [subtareas, setSubtareas] = useState([])
  const [progreso, setProgreso] = useState({ done: 0, total: 0, percent: 0 })
  const [titulo, setTitulo] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [estimatedHours, setEstimatedHours] = useState(1)
  const [editando, setEditando] = useState(false)
  const [formEvento, setFormEvento] = useState({ name: '', event_type: 'Bodas', event_date: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [progressError, setProgressError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  const cargarDatos = async () => {
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    setLoadError('')
    setProgressError('')
    try {
      const [eventoResponse, subtareasResponse] = await Promise.all([
        axios.get(`${API_URL}/eventos/${id}/`),
        axios.get(`${API_URL}/eventos/${id}/subtareas/`),
      ])
      setEvento(eventoResponse.data)
      setSubtareas(subtareasResponse.data)
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Se perdió la conexión con el servidor, por favor vuelva a intentarlo.'))
      setLoading(false)
      return
    }

    try {
      const progresoResponse = await axios.get(`${API_URL}/eventos/${id}/progreso`)
      setProgreso(progresoResponse.data)
    } catch (err) {
      setLoadError('Se perdió la conexión con el servidor, por favor vuelva a intentarlo.')
      setProgressError(getApiErrorMessage(err, 'No pudimos cargar el avance de este evento.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const mensajeFlash = sessionStorage.getItem('eventoCreadoMensaje')
    if (mensajeFlash) {
      setSuccess(mensajeFlash)
      sessionStorage.removeItem('eventoCreadoMensaje')
    }

    cargarDatos()
  }, [id])

  const abrirEdicion = () => {
    if (!evento) return
    const fechaLocal = evento.event_date
      ? new Date(evento.event_date).toLocaleString('sv-SE', { timeZone: 'UTC' }).replace(' ', 'T').slice(0, 16)
      : ''
    setFormEvento({
      name: evento.name,
      event_type: evento.event_type,
      event_date: fechaLocal,
    })
    setEditando(true)
  }

  const guardarEvento = async () => {
    setError('')
    setSuccess('')

    if (!formEvento.name.trim()) {
      setError('El nombre del evento es obligatorio.')
      return
    }
    if (!formEvento.event_type.trim()) {
      setError('El tipo de evento es obligatorio.')
      return
    }
    if (!formEvento.event_date) {
      setError('La fecha del evento es obligatoria.')
      return
    }

    setActionLoading('event-edit')
    try {
      const respuesta = await axios.patch(`${API_URL}/eventos/${id}`, {
        name: formEvento.name.trim(),
        event_type: formEvento.event_type.trim(),
        event_date: formEvento.event_date,
      })

      setEvento(respuesta.data)
      setEditando(false)
      setSuccess('Evento actualizado correctamente.')
      await cargarDatos()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Se perdió la conexión con el servidor, por favor vuelva a intentarlo.'))
    } finally {
      setActionLoading('')
    }
  }

  const crearSubtarea = async () => {
    setError('')
    setSuccess('')
    if (!titulo.trim()) {
      setError('Escribe el nombre de la gestión que quieres organizar.')
      return
    }
    if (Number(estimatedHours) <= 0) {
      setError('Indica un tiempo estimado mayor que 0 horas.')
      return
    }
    setActionLoading('create')
    try {
      await axios.post(`${API_URL}/eventos/${id}/subtareas/`, {
        title: titulo,
        description: 'Gestión logística',
        target_date: targetDate || evento.event_date.split('T')[0],
        estimated_minutes: Number(estimatedHours) * 60,
        status: 'pending',
      })
      setTitulo('')
      setTargetDate('')
      setEstimatedHours(1)
      setSuccess('Gestión añadida al plan del evento.')
      await cargarDatos()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Se perdió la conexión con el servidor, por favor vuelva a intentarlo.'))
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
      setError(getApiErrorMessage(err, 'Se perdió la conexión con el servidor, por favor vuelva a intentarlo.'))
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
      setError(getApiErrorMessage(err, 'Se perdió la conexión con el servidor, por favor vuelva a intentarlo.'))
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
      setError(getApiErrorMessage(err, 'Se perdió la conexión con el servidor, por favor vuelva a intentarlo.'))
      setActionLoading('')
    }
  }

  if (loading) {
    return <main style={panelStyle}><div style={cardStyle} className="state-loading" role="status">Estamos preparando el detalle del evento...</div></main>
  }

  if (loadError && !evento) {
    return (
      <main style={panelStyle}>
        <div style={{ ...cardStyle, background: '#fff1f0', borderLeft: '4px solid #d9554c', color: '#8b2f2a' }} className="state-error" role="alert">
          <div aria-hidden="true" style={{ fontSize: '2rem', fontWeight: 800 }}>!</div>
          <strong>No pudimos cargar los componentes</strong>
          <p>Se perdió la conexión con el servidor, por favor vuelva a intentarlo.</p>
          <button type="button" onClick={cargarDatos} className="state-action">Reintentar</button>
        </div>
      </main>
    )
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

          <button onClick={abrirEdicion} disabled={actionLoading === 'event' || actionLoading === 'event-edit'} style={{ ...baseButton, background: '#eaf8f1', color: '#0d5c3f' }}>Editar evento</button>

          <button onClick={eliminarEvento} disabled={actionLoading === 'event'} style={{ ...baseButton, background: '#ffe5e1', color: '#9b2a24' }}>{actionLoading === 'event' ? 'Eliminando...' : 'Eliminar evento'}</button>
        </div>
      </div>

      {loadError && (
        <div style={{ ...cardStyle, background: '#fff1f0', borderLeft: '4px solid #d9554c', color: '#8b2f2a' }} className="state-error" role="alert">
          <div aria-hidden="true" style={{ fontSize: '2rem', fontWeight: 800 }}>!</div>
          <strong>Error crítico de carga</strong>
          <p>{loadError}</p>
          <button type="button" onClick={cargarDatos} className="state-action">Reintentar</button>
        </div>
      )}
      {error && <div style={{ ...cardStyle, background: '#fff1f0', borderLeft: '4px solid #d9554c', color: '#8b2f2a' }} role="alert">{error}</div>}
      {success && (
        <div
          style={{
            ...cardStyle,
            background: '#edfaf3',
            borderLeft: '4px solid #1d7a5f',
            color: '#0d5d42',
            fontWeight: 700,
            boxShadow: '0 4px 18px rgba(29, 122, 95, 0.12)',
          }}
          role="status"
        >
          {success}
        </div>
      )}

      {editando ? (
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Editar evento</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Nombre</label>
              <input value={formEvento.name} onChange={(e) => setFormEvento((prev) => ({ ...prev, name: e.target.value }))} style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Tipo</label>
              <select value={formEvento.event_type} onChange={(e) => setFormEvento((prev) => ({ ...prev, event_type: e.target.value }))} style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }}>
                {tiposEvento.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Fecha</label>
              <input type="datetime-local" value={formEvento.event_date} onChange={(e) => setFormEvento((prev) => ({ ...prev, event_date: e.target.value }))} style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={guardarEvento} disabled={actionLoading === 'event-edit'} style={{ ...baseButton, background: '#1d7a5f', color: '#fff' }}>{actionLoading === 'event-edit' ? 'Guardando...' : 'Guardar cambios'}</button>
            <button onClick={() => setEditando(false)} style={{ ...baseButton, background: '#edf2f3', color: '#243434' }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          <div><strong>Tipo:</strong> {evento.event_type}</div>
          <div><strong>Fecha:</strong> {new Date(evento.event_date).toLocaleString()}</div>
          <div><strong>Subtareas:</strong> {subtareas.length}</div>
          <div className="detalle-progreso">
            <div className="detalle-progreso-cabecera">
              <strong>Avance del evento</strong>
              <span>{progreso.done} de {progreso.total} completadas · {progreso.percent}%</span>
            </div>
            {progressError ? (
              <div className="progreso-error" role="alert">
                <strong>!</strong>
                <span>{progressError}</span>
              </div>
            ) : (
              <div className="progreso-barra" aria-label={`Avance del evento: ${progreso.percent}%`} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progreso.percent}>
                <div style={{ width: `${progreso.percent}%` }} />
              </div>
            )}
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Agregar subtarea</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título de la subtarea" style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }} />
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.25rem', border: '1px solid #dfe7e6', borderRadius: 10, background: '#fff' }}>
            <input type="number" min="0.5" step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', padding: '0.75rem 0.25rem 0.75rem 0.75rem', background: 'transparent' }} />
            <span style={{ color: '#586464', fontWeight: 700, paddingRight: '0.75rem' }}>h</span>
          </div>
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