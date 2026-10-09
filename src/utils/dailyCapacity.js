export const getProjectedDailyMinutes = (subtasks, subtaskId, conflictDate, targetDate, estimatedMinutes) => (
  subtasks.reduce((total, subtask) => {
    if (subtask.id !== subtaskId) return total + Number(subtask.estimated_minutes || 0)
    return total + (targetDate === conflictDate ? estimatedMinutes : 0)
  }, 0)
)