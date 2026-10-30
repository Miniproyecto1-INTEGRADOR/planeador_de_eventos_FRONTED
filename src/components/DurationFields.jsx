import { durationToMinutes, formatDuration, isValidDuration } from '../utils/duration.js'

export default function DurationFields({
  idPrefix,
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  showPreview = false,
}) {
  const totalMinutes = durationToMinutes(hours, minutes)
  const validDuration = isValidDuration(hours, minutes)

  return (
    <>
      <div className="crear-duracion-fields">
        <label htmlFor={`${idPrefix}-hours`}>
          Horas
          <input
            id={`${idPrefix}-hours`}
            type="number"
            min="0"
            step="1"
            value={hours}
            onChange={(event) => onHoursChange(event.target.value)}
          />
        </label>
        <label htmlFor={`${idPrefix}-minutes`}>
          Minutos
          <input
            id={`${idPrefix}-minutes`}
            type="number"
            min="0"
            max="59"
            step="1"
            value={minutes}
            onChange={(event) => onMinutesChange(event.target.value)}
          />
        </label>
      </div>
      {showPreview && (
        <p className="duration-preview" aria-live="polite">
          {validDuration
            ? `Duración total: ${formatDuration(totalMinutes)}`
            : totalMinutes === null
              ? 'Los minutos deben estar entre 0 y 59 y las horas no pueden ser negativas.'
              : 'La duración total debe ser mayor que cero.'}
        </p>
      )}
    </>
  )
}
