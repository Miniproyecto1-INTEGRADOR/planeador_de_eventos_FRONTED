import { useMemo, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const valoresIniciales = {
  name: '',
  event_type: 'Boda',
  event_date: '',
  color: '#FF6B6B',
}

const subtareaBase = [
  { title: 'Reservar salón', target_date: '2026-09-25', estimated_minutes: 90 },
  { title: 'Enviar invitaciones', target_date: '2026-09-27', estimated_minutes: 45 },
  { title: 'Confirmar catering', target_date: '2026-09-30', estimated_minutes: 60 },
]

export default function CrearEvento() {
  const [evento, setEvento] = useState(valoresIniciales)
  const [subtareas, setSubtareas] = useState(subtareaBase)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const totalTiempo = useMemo(
    () => subtareas.reduce((total, item) => total + Number(item.estimated_minutes || 0), 0),
    [subtareas],
  )

  const actualizarSubtarea = (index, campo, valor) => {
    setSubtareas((actuales) =>
      actuales.map((tarea, pos) =>
        pos === index
          ? {
              ...tarea,
              [campo]: campo === 'estimated_minutes' ? Number(valor) : valor,
            }
          : tarea,
      ),
    )
  }

  const guardarEvento = async () => {
    setError('')
    setMensaje('')

    if (!evento.name.trim()) {
      setError('El nombre del evento es obligatorio.')
      return
    }
    if (!evento.event_type.trim()) {
      setError('El tipo de evento es obligatorio.')
      return
    }
    if (!evento.event_date) {
      setError('La fecha del evento es obligatoria.')
      return
    }

    const subtareasValidas = subtareas.every(
      (item) => item.title.trim() && Number(item.estimated_minutes) > 0,
    )

    if (!subtareasValidas) {
      setError('Cada gestión logística necesita título y horas estimadas mayores que 0.')
      return
    }

    setCargando(true)

    try {
      const eventoPayload = {
        ...evento,
        name: evento.name.trim(),
        event_type: evento.event_type.trim(),
        user_id: 'usuario-demo-sprint-1',
      }

      const respuestaEvento = await axios.post(`${API_URL}/eventos/`, eventoPayload)
      const eventoCreado = respuestaEvento.data

      const subtareasPayload = subtareas.map((tarea) => ({
        title: tarea.title.trim(),
        description: `Gestión logística para ${eventoCreado.name}`,
        target_date: tarea.target_date || eventoCreado.event_date.split('T')[0],
        estimated_minutes: Number(tarea.estimated_minutes),
        status: 'pending',
      }))

      await Promise.all(
        subtareasPayload.map((subtarea) =>
          axios.post(`${API_URL}/eventos/${eventoCreado.id}/subtareas/`, subtarea),
        ),
      )

      setMensaje('Evento y gestiones logísticas creados correctamente.')
      setEvento(valoresIniciales)
      setSubtareas(subtareaBase)
    } catch (err) {
      const mensajeError = err.response?.data?.detail || 'No se pudo crear el evento.'
      setError(mensajeError)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="panel sprint1-layout">
      <header className="encabezado">
        <div>
          <p className="eyebrow">Sprint 1 · Crear evento</p>
          <h1>Nuevo evento</h1>
          <p className="subtitulo">Crea el evento y sus gestiones logísticas para no perder tiempo operativo.</p>
        </div>
        <div className="metricas">
          <span>{subtareas.length} gestiones</span>
          <span>{totalTiempo} min estimados</span>
        </div>
      </header>

      {mensaje && <p className="aviso success" role="status">{mensaje}</p>}
      {error && <p className="aviso error" role="alert">{error}</p>}

      <section className="form-card">
        <div className="fieldset">
          <label htmlFor="name">Nombre del evento</label>
          <input
            id="name"
            value={evento.name}
            onChange={(event) => setEvento((actual) => ({ ...actual, name: event.target.value }))}
            placeholder="Boda María y Juan"
          />
        </div>

        <div className="grid two-cols">
          <div className="fieldset">
            <label htmlFor="event_type">Tipo de evento</label>
            <select
              id="event_type"
              value={evento.event_type}
              onChange={(event) => setEvento((actual) => ({ ...actual, event_type: event.target.value }))}
            >
              <option value="Boda">Boda</option>
              <option value="Cumpleaños">Cumpleaños</option>
              <option value="Corporativo">Corporativo</option>
              <option value="Conferencia">Conferencia</option>
            </select>
          </div>

          <div className="fieldset">
            <label htmlFor="event_date">Fecha del evento</label>
            <input
              id="event_date"
              type="datetime-local"
              value={evento.event_date}
              onChange={(event) => setEvento((actual) => ({ ...actual, event_date: event.target.value }))}
            />
          </div>
        </div>

        <div className="fieldset">
          <label htmlFor="color">Color</label>
          <input
            id="color"
            type="color"
            value={evento.color}
            onChange={(event) => setEvento((actual) => ({ ...actual, color: event.target.value }))}
          />
        </div>

        <div className="subtasks-box">
          <div className="section-title-row">
            <h2>Gestiones logísticas</h2>
            <span>{subtareas.length} tareas</span>
          </div>

          {subtareas.map((tarea, index) => (
            <div key={`${tarea.title}-${index}`} className="subtask-row">
              <div className="fieldset">
                <label>Título</label>
                <input
                  value={tarea.title}
                  onChange={(event) => actualizarSubtarea(index, 'title', event.target.value)}
                />
              </div>

              <div className="fieldset">
                <label>Fecha objetivo</label>
                <input
                  type="date"
                  value={tarea.target_date}
                  onChange={(event) => actualizarSubtarea(index, 'target_date', event.target.value)}
                />
              </div>

              <div className="fieldset small-field">
                <label>Minutos</label>
                <input
                  type="number"
                  min="1"
                  value={tarea.estimated_minutes}
                  onChange={(event) => actualizarSubtarea(index, 'estimated_minutes', event.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <button className="primary-button" type="button" onClick={guardarEvento} disabled={cargando}>
          {cargando ? 'Guardando...' : 'Crear evento'}
        </button>
      </section>
    </main>
  )
}