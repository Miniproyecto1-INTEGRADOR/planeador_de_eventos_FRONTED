import { useEffect, useMemo, useRef, useState } from 'react'

const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function obtenerFechaLocal(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

function formatoFechaLocal(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function primerDiaDelMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1)
}

export default function DatePicker({
  id,
  value,
  onValueChange,
  min,
  max,
  required = false,
  ariaLabel,
  inputStyle,
  dateTime = false,
}) {
  const [abierto, setAbierto] = useState(false)
  const [mesVisible, setMesVisible] = useState(() => {
    const fechaActual = value?.slice(0, 10)
    return primerDiaDelMes(fechaActual ? obtenerFechaLocal(fechaActual) : new Date())
  })
  const contenedorRef = useRef(null)
  const valorFecha = value?.slice(0, 10) || ''
  const fechaSeleccionada = valorFecha ? obtenerFechaLocal(valorFecha) : null
  const diasCalendario = useMemo(() => {
    const inicioMes = primerDiaDelMes(mesVisible)
    const inicioSemana = new Date(inicioMes)
    const desplazamiento = (inicioMes.getDay() + 6) % 7
    inicioSemana.setDate(inicioMes.getDate() - desplazamiento)
    return Array.from({ length: 42 }, (_, indice) => {
      const dia = new Date(inicioSemana)
      dia.setDate(inicioSemana.getDate() + indice)
      return dia
    })
  }, [mesVisible])

  useEffect(() => {
    if (!abierto) return undefined

    const cerrarFuera = (event) => {
      if (!contenedorRef.current?.contains(event.target)) setAbierto(false)
    }
    const cerrarEscape = (event) => {
      if (event.key === 'Escape') setAbierto(false)
    }

    document.addEventListener('mousedown', cerrarFuera)
    document.addEventListener('keydown', cerrarEscape)
    return () => {
      document.removeEventListener('mousedown', cerrarFuera)
      document.removeEventListener('keydown', cerrarEscape)
    }
  }, [abierto])

  const mesFormateado = mesVisible.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  const tituloMes = `${mesFormateado.charAt(0).toLocaleUpperCase('es-MX')}${mesFormateado.slice(1)}`
  const fechaHoy = formatoFechaLocal(new Date())
  const minimoSolicitado = min?.slice(0, 10) || ''
  const minimo = minimoSolicitado > fechaHoy ? minimoSolicitado : fechaHoy
  const maximo = max?.slice(0, 10) || ''
  const minimoInput = minimoSolicitado > fechaHoy
    ? min
    : dateTime
      ? `${fechaHoy}T00:00`
      : fechaHoy
  const finMesAnterior = formatoFechaLocal(new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 0))
  const inicioMesSiguiente = formatoFechaLocal(new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 1))
  const anteriorDeshabilitado = Boolean(minimo && finMesAnterior < minimo)
  const siguienteDeshabilitado = Boolean(maximo && inicioMesSiguiente > maximo)

  const seleccionarDia = (dia) => {
    const fecha = formatoFechaLocal(dia)
    if ((minimo && fecha < minimo) || (maximo && fecha > maximo)) return
    const valor = dateTime ? `${fecha}${value?.slice(10) || 'T00:00'}` : fecha
    onValueChange(valor)
    setAbierto(false)
  }

  const actualizarValor = (nuevoValor) => {
    const fecha = nuevoValor?.slice(0, 10)
    if (fecha && ((minimo && fecha < minimo) || (maximo && fecha > maximo))) return
    onValueChange(nuevoValor)
    if (fecha) setMesVisible(primerDiaDelMes(obtenerFechaLocal(fecha)))
  }

  const cambiarMes = (cantidad) => {
    setMesVisible((actual) => new Date(actual.getFullYear(), actual.getMonth() + cantidad, 1))
  }

  return (
    <div className="calendar-picker" ref={contenedorRef}>
      <div className="calendar-picker-control">
        <input
          id={id}
          className="calendar-picker-input"
          type={dateTime ? 'datetime-local' : 'date'}
          value={value}
          min={minimoInput}
          max={max}
          required={required}
          aria-label={ariaLabel}
          onChange={(event) => actualizarValor(event.target.value)}
          style={inputStyle}
        />
        <button
          type="button"
          className="calendar-picker-trigger"
          aria-label={abierto ? 'Cerrar calendario' : 'Abrir calendario'}
          aria-haspopup="dialog"
          aria-expanded={abierto}
          onClick={() => {
            if (!abierto) {
              const fechaAbrir = fechaSeleccionada && formatoFechaLocal(fechaSeleccionada) >= minimo
                ? fechaSeleccionada
                : obtenerFechaLocal(fechaHoy)
              setMesVisible(primerDiaDelMes(fechaAbrir))
            }
            setAbierto((actual) => !actual)
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="16" rx="2" />
            <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
          </svg>
        </button>
      </div>
      {abierto && (
        <div className="calendar-picker-popover" role="dialog" aria-label="Selecciona una fecha">
          <header className="calendar-picker-header">
            <button type="button" aria-label="Mes anterior" disabled={anteriorDeshabilitado} onClick={() => cambiarMes(-1)}>‹</button>
            <h2>{tituloMes}</h2>
            <button type="button" aria-label="Mes siguiente" disabled={siguienteDeshabilitado} onClick={() => cambiarMes(1)}>›</button>
          </header>
          <div className="calendar-picker-grid" role="grid" aria-label={tituloMes}>
            {diasSemana.map((dia) => <span className="calendar-picker-weekday" key={dia}>{dia}</span>)}
            {diasCalendario.map((dia) => {
              const fecha = formatoFechaLocal(dia)
              const estaSeleccionada = fecha === valorFecha
              const esHoy = fecha === fechaHoy
              const fueraDeRango = (minimo && fecha < minimo) || (maximo && fecha > maximo)
              const fueraDelMes = dia.getMonth() !== mesVisible.getMonth()
              return (
                <button
                  type="button"
                  className={[
                    'calendar-picker-day',
                    fueraDelMes && 'outside-month',
                    esHoy && 'is-today',
                    estaSeleccionada && 'is-selected',
                  ].filter(Boolean).join(' ')}
                  key={fecha}
                  role="gridcell"
                  aria-label={dia.toLocaleDateString('es-MX', { dateStyle: 'full' })}
                  aria-pressed={estaSeleccionada}
                  disabled={Boolean(fueraDeRango)}
                  onClick={() => seleccionarDia(dia)}
                >
                  {dia.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
