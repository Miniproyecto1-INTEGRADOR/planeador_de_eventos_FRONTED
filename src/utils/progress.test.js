import test from 'node:test'
import assert from 'node:assert/strict'
import { aggregateProgress } from './progress.js'

test('aggregates progress by task count instead of averaging event percentages', () => {
  const summary = aggregateProgress([
    { progreso: { done: 1, total: 2 } },
    { progreso: { done: 2, total: 2 } },
    { progreso: { done: 0, total: 3 } },
  ])

  assert.deepEqual(summary, { done: 3, total: 7, percent: 42.86 })
})

test('returns zero progress when there are no tasks', () => {
  assert.deepEqual(aggregateProgress([{ progreso: { done: 0, total: 0 } }]), {
    done: 0,
    total: 0,
    percent: 0,
  })
})