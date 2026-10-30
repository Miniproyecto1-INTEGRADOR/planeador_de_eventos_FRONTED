export const aggregateProgress = (events = []) => {
  const safeEvents = Array.isArray(events) ? events : []

  const totals = safeEvents.reduce((summary, event) => ({
    done: summary.done + (Number.isFinite(Number(event?.progreso?.done)) ? Number(event.progreso.done) : 0),
    total: summary.total + (Number.isFinite(Number(event?.progreso?.total)) ? Number(event.progreso.total) : 0),
  }), { done: 0, total: 0 })

  return {
    ...totals,
    percent: totals.total === 0 ? 0 : Math.round((totals.done / totals.total) * 10000) / 100,
  }
}