
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function RestablecerContrasena() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    let active = true

    const hash = new URLSearchParams(
      window.location.hash.slice(1),
    )
    const hashError = hash.get('error_description')

    if (hashError) {
      setError('El enlace no es válido o ha caducado. Solicita uno nuevo.')
    }

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {
        if (!active) return

        if (event === 'PASSWORD_RECOVERY' && session) {
          setReady(true)
          setError('')
        }
      })

    const checkSession = async () => {
      const { data, error: sessionError } =
        await supabase.auth.getSession()

      if (!active) return

      if (sessionError) {
        setError('No se pudo validar el enlace. Solicita uno nuevo.')
        return
      }

      if (hash.get('type') === 'recovery' && data.session) {
        setReady(true)
      } else if (!hashError) {
        setError(
          'Abre el enlace de recuperación que recibiste por correo. ' +
          'Si ha caducado, solicita uno nuevo.',
        )
      }
    }

    checkSession()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({ password })

      if (updateError) throw updateError

      setCompleted(true)
      setPassword('')
      setConfirmPassword('')
      setNotice('Tu contraseña se actualizó correctamente.')

      await supabase.auth.signOut()
    } catch {
      setError(
        'No se pudo actualizar la contraseña. ' +
        'Solicita un nuevo enlace e inténtalo otra vez.',
      )
    } finally {
      setSaving(false)
    }
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
          <p className="login-eyebrow">EVENTOS AL DÍA</p>
          <h1>Restablecer contraseña</h1>

          {completed ? (
            <>
              <p className="login-subtitle">{notice}</p>
              <Link className="auth-button" to="/login">
                Volver a iniciar sesión
              </Link>
            </>
          ) : !ready ? (
            <p className="login-subtitle">
              {error || 'Validando el enlace de recuperación...'}
            </p>
          ) : (
            <>
              <p className="login-subtitle">
                Escribe tu nueva contraseña y confírmala.
              </p>

              <form
                onSubmit={handleSubmit}
                style={{ display: 'grid', gap: '1rem' }}
              >
                <label>
                  <div style={{ marginBottom: 6 }}>Nueva contraseña</div>
                  <input
                    type="password"
                    className="auth-input"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>

                <label>
                  <div style={{ marginBottom: 6 }}>
                    Confirmar contraseña
                  </div>
                  <input
                    type="password"
                    className="auth-input"
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="auth-button"
                  disabled={saving}
                >
                  {saving ? 'Actualizando...' : 'Guardar nueva contraseña'}
                </button>
              </form>
            </>
          )}

          {error && (
            <div className="state-message state-error login-error" role="alert">
              {error}
            </div>
          )}

          {!completed && (
            <p className="login-register-prompt">
              <Link to="/login">Volver al inicio de sesión</Link>
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
