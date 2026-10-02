export function getApiErrorMessage(error, fallback) {
  const friendlyServerError = 'Se perdió la conexión con el servidor, por favor vuelva a intentarlo.'
  const userDoesNotExistMessage = 'El usuario no existe.'
  const invalidCredentialsMessage = 'Credenciales inválidas.'
  const emailAlreadyRegisteredMessage = 'El correo electrónico ya está registrado. Inténtalo con otro correo.'

  const extractMessage = () => {
    const detail = error?.response?.data?.detail
    const alternativeMessage = error?.response?.data?.message

    if (typeof detail === 'string' && detail.trim()) return detail.trim()
    if (typeof alternativeMessage === 'string' && alternativeMessage.trim()) return alternativeMessage.trim()

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => (typeof item === 'string' ? item : item?.msg))
        .filter(Boolean)
      if (messages.length) return messages.join(' ')
    }

    if (detail && typeof detail === 'object' && typeof detail.msg === 'string') {
      return detail.msg
    }

    return error?.message || ''
  }

  if (!error || !error.response || error.code === 'ERR_NETWORK' || error.message?.toLowerCase().includes('network')) {
    return friendlyServerError
  }

  const message = extractMessage()

  if (message) {
    const normalized = message.toLowerCase()

    if (
      normalized.includes('email already registered') ||
      normalized.includes('correo ya registrado') ||
      normalized.includes('email is already in use') ||
      normalized.includes('already exists') ||
      normalized.includes('ya existe') ||
      normalized.includes('duplicate key') ||
      normalized.includes('user with this email already exists') ||
      normalized.includes('a user with that email already exists') ||
      normalized.includes('email address already exists')
    ) {
      return emailAlreadyRegisteredMessage
    }

    if (
      normalized.includes('user does not exist') ||
      normalized.includes('usuario no existe') ||
      normalized.includes('user not found') ||
      normalized.includes('account not found') ||
      normalized.includes('email not found') ||
      normalized.includes('no active account found') ||
      normalized.includes('invalid login credentials') ||
      normalized.includes('invalid credentials')
    ) {
      return userDoesNotExistMessage
    }

    if (
      normalized.includes('data api') ||
      normalized.includes('network error') ||
      normalized.includes('failed to fetch') ||
      normalized.includes('connection') ||
      normalized.includes('server')
    ) {
      return friendlyServerError
    }

    if (
      normalized.includes('wrong password') ||
      normalized.includes('contraseña incorrecta') ||
      normalized.includes('password is incorrect') ||
      normalized.includes('credenciales inválidas')
    ) {
      return invalidCredentialsMessage
    }

    return message
  }

  return fallback || friendlyServerError
}