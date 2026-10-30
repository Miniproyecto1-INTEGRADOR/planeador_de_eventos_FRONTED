
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getApiErrorMessage } from '../utils/apiError.js'
import { API_URL } from '../utils/apiUrl.js'

export default function LoginPage({ onLogin, sessionNotice = '' }) {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [recovering, setRecovering] = useState(false)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail || !password) {
      setError('Escribe tu correo y contraseña para continuar.')
      return
    }

    if (!emailRegex.test(trimmedEmail)) {
      setError('Escribe un correo válido.')
      return
    }

    setSaving(true)

    try {
      const response = await axios.post(`${API_URL}/login/`, {
        email: trimmedEmail,
        password,
      })

      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('userId', response.data.user_id)

      onLogin()
      navigate('/hoy')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Credenciales inválidas.'))
    } finally {
      setSaving(false)
    }
  }

  const handleRecovery = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      setError('Escribe tu correo electrónico para continuar.')
      return
    }

    if (!emailRegex.test(trimmedEmail)) {
      setError('Escribe un correo válido.')
      return
    }

    setSaving(true)

    try {
      const response = await axios.post(
        `${API_URL}/recuperar-contrasena/`,
        { email: trimmedEmail },
      )

      setNotice(
        response.data.message ||
          'Si existe una cuenta asociada a ese correo, recibirás instrucciones para recuperar tu contraseña.',
      )
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'No fue posible solicitar la recuperación. Inténtalo nuevamente.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const startRecovery = () => {
    setError('')
    setNotice('')
    setRecovering(true)
  }

  const cancelRecovery = () => {
    setError('')
    setNotice('')
    setRecovering(false)
  }

  return (
    <main className="login-layout">
      <section className="login-brand-panel" aria-label="Eventos al Día">
        <div className="login-brand-content">
          <img
            className="login-brand-logo"
            src="/Logo.png"
            alt="Eventos al Día"
          />
          <p>
            Planifica con calma.
            <br />
            Disfruta cada momento.
          </p>
        </div>
      </section>

      <section className="login-form-area">
        <div className="auth-panel login-auth-panel">
          <p className="login-eyebrow">BIENVENIDO/A</p>

          <h1>
            {recovering ? 'Recuperar contraseña' : 'Iniciar sesión'}
          </h1>

          <p className="login-subtitle">
            {recovering
              ? 'Escribe el correo asociado a tu cuenta para solicitar las instrucciones de recuperación.'
              : 'Continúa con la planificación de tus eventos.'}
          </p>

          {recovering ? (
            <form
              onSubmit={handleRecovery}
              className="recovery-form"
              style={{ display: 'grid', gap: '1rem' }}
            >
              <label>
                <div style={{ marginBottom: 6 }}>Email</div>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="auth-button"
              >
                {saving ? 'Enviando solicitud...' : 'Enviar instrucciones'}
              </button>

              <button
                type="button"
                disabled={saving}
                className="auth-button"
                onClick={cancelRecovery}
              >
                Volver a iniciar sesión
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'grid', gap: '1rem' }}
            >
              <label>
                <div style={{ marginBottom: 6 }}>Email</div>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  required
                />
              </label>

              <label>
                <div style={{ marginBottom: 6 }}>Contraseña</div>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="auth-button"
              >
                {saving ? 'Comprobando acceso...' : 'Iniciar sesión'}
              </button>

              <button
                type="button"
                className="login-recovery-link"
                onClick={startRecovery}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          )}

          {(error || sessionNotice || notice) && (
            <div
              className={`state-message ${
                error || sessionNotice ? 'state-error' : 'state-success'
              } login-error`}
              role="alert"
            >
              {error || sessionNotice || notice}
            </div>
          )}

          {!recovering && (
            <p className="login-register-prompt">
              ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
