import { useState } from 'react'

const tareasIniciales = [
  { id: 1, evento: 'Boda María & Juan', titulo: 'Confirmar proveedor de catering y degustación final de menú', prioridad: 'Alta prioridad', plazo: 'Hoy, 14:00 h', detalle: '45 min de gestión · Finca Las Acacias' },
  { id: 2, evento: 'Cumpleaños 50 de Carlos', titulo: 'Verificar prueba de sonido y rider técnico con la banda en vivo', prioridad: 'Prioridad media', plazo: 'Mañana', detalle: '30 min de gestión · Salón Principal Jardín Real' },
  { id: 3, evento: 'Feria Corporativa TechSummit 2024', titulo: 'Emitir pases de acreditación QR para expositores VIP', prioridad: 'Logística digital', plazo: 'Mañana', detalle: '1 h 30 min de gestión · 84 acreditaciones prioritarias' },
]

export default function CrearEvento() {
  const [tareas, setTareas] = useState(tareasIniciales)
  const [notas, setNotas] = useState({})
  const [notaAbierta, setNotaAbierta] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const completadas = tareasIniciales.length - tareas.length
  const progreso = Math.round((completadas / tareasIniciales.length) * 100)

  const quitarTarea = (id, accion) => {
    const tarea = tareas.find((item) => item.id === id)
    setTareas((actuales) => actuales.filter((item) => item.id !== id))
    setMensaje(`${accion}: ${tarea.evento}.`)
  }

  const guardarNota = (id) => {
    if (!notas[id]?.trim()) {
      setMensaje('Escribe una nota antes de guardarla.')
      return
    }
    setMensaje('Nota guardada correctamente.')
    setNotas((actuales) => ({ ...actuales, [id]: '' }))
    setNotaAbierta(null)
  }

  return (
    <main className="panel">
      <header className="encabezado">
        <div>
          <p className="eyebrow">Ritmo consciente · Vista diaria</p>
          <h1>Buenos días, Sofía</h1>
          <p className="subtitulo">Tienes {tareas.length} gestiones prioritarias para hoy.</p>
        </div>
        <div className="metricas"><span>{tareas.length} pendientes</span><span>{completadas} completada{completadas === 1 ? '' : 's'}</span></div>
      </header>

      <section className="progreso" aria-label="Progreso de validación operativa">
        <div><span>Progreso de validación operativa hoy</span><strong>{progreso}% completado</strong></div>
        <div className="barra"><div style={{ width: `${progreso}%` }} /></div>
      </section>

      {mensaje && <p className="aviso" role="status">{mensaje}</p>}

      {tareas.length > 0 ? (
        <section aria-labelledby="gestiones-title">
          <div className="seccion-titulo"><h2 id="gestiones-title">Gestiones urgentes de hoy</h2><p>Prioriza las validaciones antes de su hora límite.</p></div>
          <div className="lista-tareas">
            {tareas.map((tarea) => (
              <article className="tarjeta" key={tarea.id}>
                <div className="tarjeta-cabecera"><span className="etiqueta">{tarea.evento}</span><span className={tarea.id === 1 ? 'prioridad alta' : 'prioridad'}>{tarea.prioridad}</span></div>
                <h3>{tarea.titulo}</h3><p className="detalle">{tarea.detalle}</p><p className="plazo">{tarea.plazo}</p>
                {notaAbierta === tarea.id && <div className="nota"><label htmlFor={`nota-${tarea.id}`}>Nota opcional</label><div><input id={`nota-${tarea.id}`} value={notas[tarea.id] ?? ''} onChange={(event) => setNotas((actuales) => ({ ...actuales, [tarea.id]: event.target.value }))} placeholder="Añade una nota para esta gestión" /><button type="button" onClick={() => guardarNota(tarea.id)}>Guardar</button></div></div>}
                <div className="acciones"><button className="enlace" type="button" onClick={() => setNotaAbierta(notaAbierta === tarea.id ? null : tarea.id)}>+ Añadir nota</button><div><button type="button" onClick={() => quitarTarea(tarea.id, 'Gestión pospuesta para mañana')}>Posponer</button><button className="principal" type="button" onClick={() => quitarTarea(tarea.id, 'Gestión completada')}>Marcar como hecho</button></div></div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="vacio"><p aria-hidden="true">✓</p><h2>¡Todo al día!</h2><p>No tienes gestiones urgentes para hoy.</p><button className="principal" type="button" onClick={() => { setTareas(tareasIniciales); setMensaje('Se restauraron las gestiones de prueba.') }}>Restaurar gestiones de prueba</button></section>
      )}
    </main>
  )
}