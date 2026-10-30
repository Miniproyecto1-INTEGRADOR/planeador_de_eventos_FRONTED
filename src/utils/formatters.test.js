import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDateDMY, formatPercent } from './formatters.js'

test('formats dates as day/month/year without timezone conversion', () => {
  assert.equal(formatDateDMY('2026-10-06'), '06/10/2026')
})

test('keeps the exact progress percentage to two decimal places', () => {
  assert.equal(formatPercent(66.67), '66,67')
})