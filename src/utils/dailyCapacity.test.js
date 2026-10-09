import test from 'node:test'
import assert from 'node:assert/strict'
import { getProjectedDailyMinutes } from './dailyCapacity.js'

const subtasks = [
  { id: 'one', target_date: '2026-10-09', estimated_minutes: 180 },
  { id: 'two', target_date: '2026-10-09', estimated_minutes: 60 },
]

test('projects a reduced duration against the requested daily limit', () => {
  assert.equal(getProjectedDailyMinutes(subtasks, 'one', '2026-10-09', '2026-10-09', 150), 210)
})

test('removes a task from today when it is moved to another date', () => {
  assert.equal(getProjectedDailyMinutes(subtasks, 'one', '2026-10-09', '2026-10-10', 180), 60)
})