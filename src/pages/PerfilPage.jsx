import { useEffect, useState } from 'react'
import axios from 'axios'
import { getApiErrorMessage } from '../utils/apiError.js'
import { API_URL } from '../utils/apiUrl.js'

export default function PerfilPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('authToken')))
  const [error, setError] = useState(() => (
    localStorage.getItem('authToken') ? '' : 'No hay una sesión activa. Inicia sesión para ver tu perfil.'
  ))
  const [notFound, setNotFound] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) return undefined

    let active = true
    axios.get(`${API_URL}/perfil/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => {
        if (active) setProfile(data)
      })
      .catch((requestError) => {
        if (!active) return
        if (requestError.response?.status === 404) {
          setNotFound(true)
        } else {
          setError(getApiErrorMessage(requestError, 'No pudimos cargar tu perfil.'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [retryCount])

  const fields = [
    { label: 'Nombre', value: profile?.first_name },
    { label: 'Apellido', value: profile?.last_name },
    { label: 'Correo electrónico', value: profile?.email },
  ]
  const hasMissingData = fields.some(({ value }) => !value?.trim())

  return (
    <main className="profile-page">
      <p className="eyebrow">Tu cuenta</p>
      <h1>Mi perfil</h1>

      {loading ? (
        <div className="state-message profile-state" role="status">Cargando tu perfil…</div>
      ) : error ? (
        <div className="state-message state-error profile-state" role="alert">
          <p>{error}</p>
          {localStorage.getItem('authToken') && (
            <button
              type="button"
              onClick={() => {
                setError('')
                setNotFound(false)
                setLoading(true)
                setRetryCount((count) => count + 1)
              }}
            >
              Intentar de nuevo
            </button>
          )}
        </div>
      ) : notFound ? (
        <div className="state-message profile-state profile-empty" role="status">
          No encontramos los datos de tu perfil. Si el problema continúa, vuelve a iniciar sesión.
        </div>
      ) : profile ? (
        <section className="profile-card" aria-label="Datos de mi perfil">
          <dl>
            {fields.map(({ label, value }) => (
              <div className="profile-field" key={label}>
                <dt>{label}</dt>
                <dd>{value?.trim() || 'No registrado'}</dd>
              </div>
            ))}
          </dl>
          {hasMissingData && (
            <p className="profile-missing-data" role="status">Hay datos que todavía no están registrados en tu perfil.</p>
          )}
        </section>
      ) : null}
    </main>
  )
}
