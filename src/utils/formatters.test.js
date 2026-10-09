import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDateDMY, formatMinutesAsHours, formatPercent } from './formatters.js'

test('formats dates as day/month/year without timezone conversion', () => {
  assert.equal(formatDateDMY('2026-10-06'), '06/10/2026')
})

test('formats stored minutes as localized hours', () => {
  assert.equal(formatMinutesAsHours(390), '6,5 h')
  assert.equal(formatMinutesAsHours(45), '0,75 h')
})

test('keeps the exact progress percentage to two decimal places', () => {
  assert.equal(formatPercent(66.67), '66,67')
})