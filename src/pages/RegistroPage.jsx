import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const fieldStyle = { width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6', boxSizing: 'border-box' }

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
      setError(err.response?.data?.detail || 'No se pudo crear la cuenta. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={{ maxWidth: 440, margin: '3rem auto', padding: '2rem', background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px rgba(15, 25, 25, 0.08)' }}>
      <h1 style={{ marginTop: 0 }}>Crear cuenta</h1>
      <p style={{ color: '#586464' }}>Registra tus datos para empezar a planear eventos.</p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <label>
          <div style={{ marginBottom: 6 }}>Nombre</div>
          <input autoComplete="given-name" required maxLength={80} value={form.first_name} onChange={update('first_name')} style={fieldStyle} />
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Apellido</div>
          <input autoComplete="family-name" required maxLength={80} value={form.last_name} onChange={update('last_name')} style={fieldStyle} />
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Correo electrónico</div>
          <input type="email" autoComplete="email" required value={form.email} onChange={update('email')} style={fieldStyle} />
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Contraseña</div>
          <input type="password" autoComplete="new-password" required minLength={6} maxLength={72} value={form.password} onChange={update('password')} style={fieldStyle} />
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Confirmar contraseña</div>
          <input type="password" autoComplete="new-password" required minLength={6} maxLength={72} value={form.confirmPassword} onChange={update('confirmPassword')} style={fieldStyle} />
        </label>
        {error && <div role="alert" style={{ color: '#a43434', background: '#ffe3e3', borderRadius: 8, padding: '0.75rem' }}>{error}</div>}
        {message && <div role="status" style={{ color: '#0f5a3a', background: '#dff8ed', borderRadius: 8, padding: '0.75rem' }}>{message}</div>}
        <button type="submit" disabled={saving} style={{ background: '#1d7a5f', color: '#fff', border: 'none', borderRadius: 10, padding: '0.8rem 1rem', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
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
