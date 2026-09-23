import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getApiErrorMessage } from '../utils/apiError.js'
import { API_URL } from '../utils/apiUrl.js'

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Escribe tu correo y contraseña para continuar.')
      return
    }

    setSaving(true)
    try {
      const response = await axios.post(`${API_URL}/login/`, { email: email.trim(), password })
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

  return (
    <main className="auth-panel">
      <h1 style={{ marginTop: 0 }}>Iniciar sesión</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <label>
          <div style={{ marginBottom: 6 }}>Email</div>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" />
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Contraseña</div>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" />
        </label>
        {error && <div className="state-message state-error" role="alert">{error}</div>}
        <button type="submit" disabled={saving} className="auth-button">{saving ? 'Comprobando acceso...' : 'Iniciar sesión'}</button>
      </form>
      <p style={{ marginBottom: 0, textAlign: 'center', color: '#586464' }}>
        ¿No tienes cuenta?{' '}
        <Link to="/registro" style={{ color: '#1d7a5f', fontWeight: 700 }}>Regístrate</Link>
      </p>
    </main>
  )
}
