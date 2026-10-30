export const aggregateProgress = (events) => {
  const totals = events.reduce((summary, event) => ({
    done: summary.done + Number(event.progreso?.done || 0),
    total: summary.total + Number(event.progreso?.total || 0),
  }), { done: 0, total: 0 })

  return {
    ...totals,
    percent: totals.total === 0 ? 0 : Math.round((totals.done / totals.total) * 10000) / 100,
  }
}