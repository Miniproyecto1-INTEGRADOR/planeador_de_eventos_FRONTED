export const durationToMinutes = (hours, minutes) => {
  const hoursValue = hours === '' || hours == null ? 0 : Number(hours)
  const minutesValue = minutes === '' || minutes == null ? 0 : Number(minutes)

  if (
    !Number.isInteger(hoursValue) ||
    hoursValue < 0 ||
    !Number.isInteger(minutesValue) ||
    minutesValue < 0 ||
    minutesValue > 59
  ) {
    return null
  }

  return hoursValue * 60 + minutesValue
}

export const minutesToDuration = (minutes) => {
  const totalMinutes = Number(minutes)
  if (!Number.isInteger(totalMinutes) || totalMinutes < 0) {
    return { hours: '', minutes: '' }
  }

  return {
    hours: String(Math.floor(totalMinutes / 60)),
    minutes: String(totalMinutes % 60),
  }
}

export const isValidDuration = (hours, minutes) => {
  const totalMinutes = durationToMinutes(hours, minutes)
  return totalMinutes !== null && totalMinutes > 0
}

export const formatDuration = (minutes) => {
  const numericMinutes = Number(minutes)
  const totalMinutes = Number.isFinite(numericMinutes)
    ? Math.max(0, Math.trunc(numericMinutes))
    : 0
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  if (hours && remainingMinutes) return `${hours} h ${remainingMinutes} min.`
  if (hours) return `${hours} h.`
  return `${remainingMinutes} min.`
}
