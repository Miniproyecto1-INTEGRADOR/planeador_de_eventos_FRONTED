export const formatDateDMY = (value) => {
  if (!value) return 'Sin fecha'

  const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value)
}

export const formatMinutesAsHours = (minutes) => {
  const hours = Number(minutes || 0) / 60
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(hours)} h`
}

export const formatPercent = (value) => (
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(Number(value || 0))
)