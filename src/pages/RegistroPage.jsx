import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getApiErrorMessage } from '../utils/apiError.js'
import { API_URL } from '../utils/apiUrl.js'

export default function RegistroPage({ onLogin }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    try {
      const response = await axios.post(`${API_URL}/registro/`, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      if (!response.data.token) {
        setMessage('Cuenta creada. Confirma tu correo electrónico y luego inicia sesión.')
        return
      }
      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('userId', response.data.user_id)
      onLogin()
      navigate('/hoy')
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear la cuenta. Inténtalo de nuevo.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="auth-panel auth-panel-register">
      <h1 style={{ marginTop: 0 }}>Crear cuenta</h1>
      <p style={{ color: '#586464' }}>Registra tus datos para empezar a planear eventos.</p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <label>
          <div style={{ marginBottom: 6 }}>Nombre</div>
          <input autoComplete="given-name" required maxLength={80} value={form.first_name} onChange={update('first_name')} className="auth-input" />
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Apellido</div>
          <input autoComplete="family-name" required maxLength={80} value={form.last_name} onChange={update('last_name')} className="auth-input" />
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Correo electrónico</div>
          <input type="email" autoComplete="email" required value={form.email} onChange={update('email')} className="auth-input" />
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Contraseña</div>
          <input type="password" autoComplete="new-password" required minLength={6} maxLength={72} value={form.password} onChange={update('password')} className="auth-input" />
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Confirmar contraseña</div>
          <input type="password" autoComplete="new-password" required minLength={6} maxLength={72} value={form.confirmPassword} onChange={update('confirmPassword')} className="auth-input" />
        </label>
        {error && <div className="state-message state-error" role="alert">{error}</div>}
        {message && <div className="state-message state-success" role="status">{message}</div>}
        <button type="submit" disabled={saving} className="auth-button">
          {saving ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>
      <p style={{ marginBottom: 0, textAlign: 'center', color: '#586464' }}>
        ¿Ya tienes una cuenta?{' '}
        <Link to="/login" style={{ color: '#1d7a5f', fontWeight: 700 }}>Inicia sesión</Link>
      </p>
    </main>
  )
}
