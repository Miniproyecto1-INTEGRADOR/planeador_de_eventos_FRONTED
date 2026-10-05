import test from 'node:test'
import assert from 'node:assert/strict'
import { getApiErrorMessage } from './apiError.js'

test('maps invalid login credentials to a Spanish user does not exist message', () => {
  const error = {
    response: {
      data: {
        detail: 'Invalid login credentials',
      },
    },
  }

  assert.equal(getApiErrorMessage(error, 'Credenciales inválidas.'), 'El usuario no existe.')
})

test('maps no active account found to a Spanish user does not exist message', () => {
  const error = {
    response: {
      data: {
        detail: 'No active account found with the given credentials',
      },
    },
  }

  assert.equal(getApiErrorMessage(error, 'Credenciales inválidas.'), 'El usuario no existe.')
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
