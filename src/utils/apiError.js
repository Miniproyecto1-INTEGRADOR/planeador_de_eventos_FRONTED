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

export function getDailyCapacityConflict(error) {
  if (error?.response?.status !== 409) return null

  const responseData = error.response.data || {}
  const detail = responseData.detail && typeof responseData.detail === 'object'
    ? responseData.detail
    : responseData
  const toNumber = (value) => value === null || value === undefined || value === ''
    ? null
    : Number.isFinite(Number(value)) ? Number(value) : null
  const plannedMinutes = toNumber(detail.planned_minutes)
    ?? (toNumber(detail.planned_hours) === null ? null : Math.round(Number(detail.planned_hours) * 60))
  const limitMinutes = toNumber(detail.limit_minutes)
    ?? (toNumber(detail.limit_hours) === null ? null : Math.round(Number(detail.limit_hours) * 60))
  const isCapacityConflict = detail.code === 'daily_capacity_exceeded'
    || (toNumber(detail.planned_hours) !== null && toNumber(detail.limit_hours) !== null)

  if (!isCapacityConflict || plannedMinutes === null || limitMinutes === null) return null

  return {
    ...detail,
    code: 'daily_capacity_exceeded',
    planned_minutes: plannedMinutes,
    limit_minutes: limitMinutes,
  }
}

export function getRegistrationErrorMessage(error) {
  const connectionMessage = 'No pudimos conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.'
  const fallbackMessage = 'No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo.'

  if (!error?.response || error.code === 'ERR_NETWORK' || error.message?.toLowerCase().includes('network')) {
    return connectionMessage
  }

  const responseData = error.response.data || {}
  const detail = responseData.detail
  const rawMessage = typeof detail === 'string'
    ? detail
    : typeof responseData.message === 'string'
      ? responseData.message
      : Array.isArray(detail)
        ? detail.map((item) => typeof item === 'string' ? item : item?.msg).filter(Boolean).join(' ')
        : ''
  const normalized = rawMessage.toLowerCase()

  if (
    error.response.status === 409 ||
    normalized.includes('already registered') ||
    normalized.includes('already exists') ||
    normalized.includes('email already') ||
    normalized.includes('correo ya registrado') ||
    normalized.includes('duplicate key')
  ) {
    return 'Ese correo ya tiene una cuenta. Inicia sesión o prueba con otro correo.'
  }

  if (
    normalized.includes('invalid email') ||
    normalized.includes('email address is invalid') ||
    normalized.includes('valid email') ||
    normalized.includes('correo válido')
  ) {
    return 'Revisa el formato del correo electrónico e inténtalo de nuevo.'
  }

  if (normalized.includes('at least 6 characters') || normalized.includes('at least 6 character')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }

  if (normalized.includes('at most 72 characters') || normalized.includes('too long')) {
    return 'La contraseña no puede superar los 72 caracteres.'
  }

  if (normalized.includes('weak password') || normalized.includes('password is too weak') || normalized.includes('compromised')) {
    return 'Elige una contraseña más segura y vuelve a intentarlo.'
  }

  if (error.response.status === 429 || normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Espera un momento antes de intentar crear otra cuenta.'
  }

  if (error.response.status >= 500 || normalized.includes('database error') || normalized.includes('server')) {
    return 'No pudimos completar el registro ahora. Inténtalo de nuevo en unos minutos.'
  }

  return fallbackMessage
}