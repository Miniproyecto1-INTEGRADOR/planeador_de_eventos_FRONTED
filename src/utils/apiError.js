export function getApiErrorMessage(error, fallback) {
  const friendlyServerError = 'Se perdió la conexión con el servidor, por favor vuelva a intentarlo.'
  const detail = error?.response?.data?.detail

  if (!error || !error.response || error.code === 'ERR_NETWORK' || error.message?.toLowerCase().includes('network')) {
    return friendlyServerError
  }

  let message = ''

  if (typeof detail === 'string' && detail.trim()) message = detail.trim()
  else if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item === 'string' ? item : item?.msg))
      .filter(Boolean)
    if (messages.length) message = messages.join(' ')
  } else if (detail && typeof detail === 'object' && typeof detail.msg === 'string') {
    message = detail.msg
  }

  if (message) {
    const normalized = message.toLowerCase()
    if (
      normalized.includes('data api') ||
      normalized.includes('network error') ||
      normalized.includes('failed to fetch') ||
      normalized.includes('connection') ||
      normalized.includes('server')
    ) {
      return friendlyServerError
    }

    return message
  }

  return fallback || friendlyServerError
}