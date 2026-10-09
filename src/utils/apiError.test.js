import test from 'node:test'
import assert from 'node:assert/strict'
import { getApiErrorMessage, getDailyCapacityConflict, getRegistrationErrorMessage } from './apiError.js'

test('normalizes the local daily-capacity conflict response', () => {
  const conflict = getDailyCapacityConflict({
    response: {
      status: 409,
      data: {
        detail: {
          code: 'daily_capacity_exceeded',
          planned_minutes: 420,
          limit_minutes: 360,
        },
      },
    },
  })

  assert.equal(conflict.planned_minutes, 420)
  assert.equal(conflict.limit_minutes, 360)
})

test('normalizes the documented daily-capacity conflict response', () => {
  const conflict = getDailyCapacityConflict({
    response: {
      status: 409,
      data: {
        detail: 'La carga del día supera tu límite diario.',
        planned_hours: 4.5,
        limit_hours: 4,
      },
    },
  })

  assert.equal(conflict.code, 'daily_capacity_exceeded')
  assert.equal(conflict.planned_minutes, 270)
  assert.equal(conflict.limit_minutes, 240)
})

test('maps invalid login credentials to a Spanish invalid credentials message', () => {
  const error = {
    response: {
      data: {
        detail: 'Invalid login credentials',
      },
    },
  }

  assert.equal(getApiErrorMessage(error, 'Credenciales inválidas.'), 'El usuario o contraseña son incorrectos.')
})

test('maps no active account found to a Spanish invalid credentials message', () => {
  const error = {
    response: {
      data: {
        detail: 'No active account found with the given credentials',
      },
    },
  }

  assert.equal(getApiErrorMessage(error, 'Credenciales inválidas.'), 'El usuario o contraseña son incorrectos.')
})

test('maps duplicate email registration response to a Spanish message', () => {
  const error = {
    response: {
      data: {
        detail: 'A user with that email already exists.',
      },
    },
  }

  assert.equal(
    getApiErrorMessage(error, 'No se pudo crear la cuenta. Inténtalo de nuevo.'),
    'El correo electrónico ya está registrado. Inténtalo con otro correo.'
  )
})

test('maps invalid registration email to a clear Spanish message', () => {
  const error = { response: { status: 400, data: { detail: 'Invalid email address' } } }

  assert.equal(getRegistrationErrorMessage(error), 'Revisa el formato del correo electrónico e inténtalo de nuevo.')
})

test('maps weak registration password to a helpful Spanish message', () => {
  const error = { response: { status: 422, data: { detail: 'Password should be at least 6 characters' } } }

  assert.equal(getRegistrationErrorMessage(error), 'La contraseña debe tener al menos 6 caracteres.')
})

test('maps registration rate limits to a calm retry message', () => {
  const error = { response: { status: 429, data: { detail: 'Email rate limit exceeded' } } }

  assert.equal(getRegistrationErrorMessage(error), 'Espera un momento antes de intentar crear otra cuenta.')
})

test('does not expose unknown registration server details', () => {
  const error = { response: { status: 500, data: { detail: 'internal database trace' } } }

  assert.equal(getRegistrationErrorMessage(error), 'No pudimos completar el registro ahora. Inténtalo de nuevo en unos minutos.')
})
