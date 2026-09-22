import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import CrearEvento from './pages/CrearEvento.jsx'
import HoyPage from './pages/HoyPage.jsx'
import DetalleEvento from './pages/DetalleEvento.jsx'
import ProgresoPage from './pages/ProgresoPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegistroPage from './pages/RegistroPage.jsx'

const AUTH_SESSION_VERSION = 'supabase-auth-v1'

function ProtectedRoute({ isAuthenticated, children }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (localStorage.getItem('authSessionVersion') !== AUTH_SESSION_VERSION) {
      localStorage.removeItem('demoToken')
      localStorage.removeItem('appSessionToken')
      localStorage.removeItem('authToken')
      localStorage.removeItem('userId')
      localStorage.setItem('authSessionVersion', AUTH_SESSION_VERSION)
      delete axios.defaults.headers.common.Authorization
      return false
    }
    const token = localStorage.getItem('authToken')
    if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`
    return Boolean(token)
  })

  const handleLogin = () => {
    localStorage.setItem('authSessionVersion', AUTH_SESSION_VERSION)
    const token = localStorage.getItem('authToken')
    if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`
    setIsAuthenticated(true)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/registro" element={<RegistroPage onLogin={handleLogin} />} />
        <Route path="/hoy" element={<ProtectedRoute isAuthenticated={isAuthenticated}><HoyPage /></ProtectedRoute>} />
        <Route path="/crear" element={<ProtectedRoute isAuthenticated={isAuthenticated}><CrearEvento /></ProtectedRoute>} />
        <Route path="/evento/:id" element={<ProtectedRoute isAuthenticated={isAuthenticated}><DetalleEvento /></ProtectedRoute>} />
        <Route path="/progreso" element={<ProtectedRoute isAuthenticated={isAuthenticated}><ProgresoPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/hoy' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
