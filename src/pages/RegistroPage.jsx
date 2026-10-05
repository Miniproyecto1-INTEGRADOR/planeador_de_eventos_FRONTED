import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getRegistrationErrorMessage } from '../utils/apiError.js'
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
    if (!form.first_name.trim()) {
      setError('Escribe tu nombre para continuar.')
      return
    }
    if (form.first_name.trim().length > 80) {
      setError('El nombre no puede superar los 80 caracteres.')
      return
    }
    if (!form.last_name.trim()) {
      setError('Escribe tu apellido para continuar.')
      return
    }
    if (form.last_name.trim().length > 80) {
      setError('El apellido no puede superar los 80 caracteres.')
      return
    }
    const email = form.email.trim()
    if (!email) {
      setError('Escribe tu correo electrónico.')
      return
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Revisa el formato del correo electrónico e inténtalo de nuevo.')
      return
    }
    if (!form.password) {
      setError('Crea una contraseña para proteger tu cuenta.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (form.password.length > 72) {
      setError('La contraseña no puede superar los 72 caracteres.')
      return
    }
    if (!form.confirmPassword) {
      setError('Confirma tu contraseña para continuar.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    try {
      const response = await axios.post(`${API_URL}/registro/`, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email,
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
      setError(getRegistrationErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="register-page">
      <main className="auth-panel auth-panel-register">
        <Link className="register-brand" to="/login" aria-label="Eventos al Día, inicio">
          <img src="/Logo.png" alt="Eventos al Día" />
        </Link>
        <h1 className="register-title">Crear cuenta</h1>
        <p className="register-intro">Registra tus datos para empezar a planear eventos.</p>
        <form className="register-form" noValidate onSubmit={handleSubmit}>
          <label className="register-field">
            <div style={{ marginBottom: 6 }}>Nombre</div>
            <input autoComplete="given-name" required maxLength={80} value={form.first_name} onChange={update('first_name')} className="auth-input" />
          </label>
          <label className="register-field">
            <div style={{ marginBottom: 6 }}>Apellido</div>
            <input autoComplete="family-name" required maxLength={80} value={form.last_name} onChange={update('last_name')} className="auth-input" />
          </label>
          <label className="register-field">
            <div style={{ marginBottom: 6 }}>Correo electrónico</div>
            <input type="email" autoComplete="email" required value={form.email} onChange={update('email')} className="auth-input" />
          </label>
          <label className="register-field">
            <div style={{ marginBottom: 6 }}>Contraseña</div>
            <input type="password" autoComplete="new-password" required minLength={6} maxLength={72} value={form.password} onChange={update('password')} className="auth-input" />
          </label>
          <label className="register-field">
            <div style={{ marginBottom: 6 }}>Confirmar contraseña</div>
            <input type="password" autoComplete="new-password" required minLength={6} maxLength={72} value={form.confirmPassword} onChange={update('confirmPassword')} className="auth-input" />
          </label>
          {error && <div className="state-message state-error" role="alert">{error}</div>}
          {message && <div className="state-message state-success" role="status">{message}</div>}
          <button type="submit" disabled={saving} className="auth-button">
            {saving ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>
        <p className="register-footer">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login">Inicia sesión</Link>
        </p>
      </main>
    </div>
  )
}
