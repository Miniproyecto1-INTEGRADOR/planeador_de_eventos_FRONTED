import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatDateDMY,
  formatMinutesAsHours,
  formatMinutesAsHoursAndMinutes,
  formatPercent,
} from './formatters.js'

test('formats dates as day/month/year without timezone conversion', () => {
  assert.equal(formatDateDMY('2026-10-06'), '06/10/2026')
})

test('formats stored minutes as localized hours', () => {
  assert.equal(formatMinutesAsHours(390), '6,5 h')
  assert.equal(formatMinutesAsHours(45), '0,75 h')
})

test('formats estimated time as hours and remaining minutes', () => {
  assert.equal(formatMinutesAsHoursAndMinutes(90), '1 h 30 min.')
  assert.equal(formatMinutesAsHoursAndMinutes(60), '1 h')
  assert.equal(formatMinutesAsHoursAndMinutes(30), '30 min.')
  assert.equal(formatMinutesAsHoursAndMinutes(0), '0 min.')
})

test('keeps the exact progress percentage to two decimal places', () => {
  assert.equal(formatPercent(66.67), '66,67')
})