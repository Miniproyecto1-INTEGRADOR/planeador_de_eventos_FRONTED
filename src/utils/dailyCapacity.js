export const getProjectedDailyMinutes = (subtasks = [], subtaskId, conflictDate, targetDate, estimatedMinutes = 0) => {
  const safeSubtasks = Array.isArray(subtasks) ? subtasks : []
  const safeMinutes = Number.isFinite(Number(estimatedMinutes)) ? Number(estimatedMinutes) : 0

  return safeSubtasks.reduce((total, subtask) => {
    if (subtask.id !== subtaskId) {
      const currentMinutes = Number(subtask?.estimated_minutes ?? 0)
      return total + (Number.isFinite(currentMinutes) ? currentMinutes : 0)
    }

    return total + (targetDate === conflictDate ? safeMinutes : 0)
  }, 0)
}