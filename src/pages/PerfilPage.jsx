import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_URL } from '../utils/apiUrl.js'
import { getApiErrorMessage } from '../utils/apiError.js'

export default function PerfilPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('authToken')))
  const [error, setError] = useState(() => (
    localStorage.getItem('authToken') ? '' : 'No encontramos tu sesión. Inicia sesión de nuevo.'
  ))

  useEffect(() => {
    let active = true
    const token = localStorage.getItem('authToken')

    if (!token) return undefined

    axios.get(`${API_URL}/perfil/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => {
        if (active) setProfile(data)
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, 'No pudimos cargar tu perfil.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  return (
    <main className="settings-page">
      <p className="eyebrow">Tu cuenta</p>
      <h2>Mi perfil</h2>
      <p>Consulta la información de tu cuenta.</p>
      {loading && <p role="status">Cargando perfil…</p>}
      {error && <div className="state-message state-error" role="alert">{error}</div>}
      {!loading && !error && (
        <section className="profile-card" aria-label="Información del perfil">
          <div className="profile-card-field">
            <h3>Nombre</h3>
            <p>{profile.first_name || 'No registrado'}</p>
          </div>
          <div className="profile-card-field">
            <h3>Apellido</h3>
            <p>{profile.last_name || 'No registrado'}</p>
          </div>
          <div className="profile-card-field">
            <h3>Correo electrónico</h3>
            <p>{profile.email}</p>
          </div>
        </section>
      )}
    </main>
  )
}
