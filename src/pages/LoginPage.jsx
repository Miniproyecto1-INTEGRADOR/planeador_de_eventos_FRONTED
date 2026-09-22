import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post(`${API_URL}/login/`, { email, password })
      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('userId', response.data.user_id)
      onLogin()
      navigate('/hoy')
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales inválidas.')
    }
  }

  return (
    <main style={{ maxWidth: 440, margin: '5rem auto', padding: '2rem', background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px rgba(15, 25, 25, 0.08)' }}>
      <h1 style={{ marginTop: 0 }}>Iniciar sesión</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <label>
          <div style={{ marginBottom: 6 }}>Email</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }} />
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Contraseña</div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #dfe7e6' }} />
        </label>
        {error && <div style={{ color: '#a43434', background: '#ffe3e3', borderRadius: 8, padding: '0.75rem' }}>{error}</div>}
        <button type="submit" style={{ background: '#1d7a5f', color: '#fff', border: 'none', borderRadius: 10, padding: '0.8rem 1rem', fontWeight: 700 }}>Iniciar sesión</button>
      </form>
      <p style={{ marginBottom: 0, textAlign: 'center', color: '#586464' }}>
        ¿No tienes cuenta?{' '}
        <Link to="/registro" style={{ color: '#1d7a5f', fontWeight: 700 }}>Regístrate</Link>
      </p>
    </main>
  )
}
