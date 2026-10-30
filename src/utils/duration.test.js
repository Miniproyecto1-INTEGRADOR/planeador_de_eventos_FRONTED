import test from 'node:test'
import assert from 'node:assert/strict'
import { durationToMinutes, formatDuration, isValidDuration, minutesToDuration } from './duration.js'

test('converts hours and minutes to integer minutes', () => {
  assert.equal(durationToMinutes(0, 15), 15)
  assert.equal(durationToMinutes(0, 30), 30)
  assert.equal(durationToMinutes(1, 0), 60)
  assert.equal(durationToMinutes(1, 30), 90)
  assert.equal(durationToMinutes(2, 0), 120)
  assert.equal(durationToMinutes(2, 15), 135)
  assert.equal(durationToMinutes(0, 59), 59)
})

test('adds multiple durations in minutes', () => {
  const durations = [[0, 15], [1, 0], [2, 15]]
  const totalMinutes = durations.reduce(
    (total, [hours, minutes]) => total + durationToMinutes(hours, minutes),
    0,
  )

  assert.equal(totalMinutes, 210)
  assert.equal(formatDuration(totalMinutes), '3 h 30 min.')
})

test('rejects minute values outside the allowed range', () => {
  assert.equal(durationToMinutes(1, 60), null)
  assert.equal(durationToMinutes(1, -1), null)
  assert.equal(durationToMinutes(1, 1.5), null)
  assert.equal(isValidDuration(1, 60), false)
  assert.equal(isValidDuration(-1, 15), false)
})

test('rejects a zero duration and non-integer hours', () => {
  assert.equal(isValidDuration(0, 0), false)
  assert.equal(isValidDuration(0, 15), true)
  assert.equal(durationToMinutes(1.5, 0), null)
})

test('formats stored event durations without decimal hours', () => {
  assert.equal(formatDuration(15), '15 min.')
  assert.equal(formatDuration(30), '30 min.')
  assert.equal(formatDuration(59), '59 min.')
  assert.equal(formatDuration(60), '1 h.')
  assert.equal(formatDuration(90), '1 h 30 min.')
  assert.equal(formatDuration(120), '2 h.')
  assert.equal(formatDuration(135), '2 h 15 min.')
})

test('recovers stored integer minutes as exact hour and minute fields', () => {
  assert.deepEqual(minutesToDuration(59), { hours: '0', minutes: '59' })
  assert.deepEqual(minutesToDuration(90), { hours: '1', minutes: '30' })
  assert.deepEqual(minutesToDuration(135), { hours: '2', minutes: '15' })
  assert.equal(
    durationToMinutes(...Object.values(minutesToDuration(59))),
    59,
  )
})
