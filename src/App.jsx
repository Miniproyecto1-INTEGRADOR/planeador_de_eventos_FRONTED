import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useLayoutEffect, useState } from 'react'
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

function AppRoutes({ isAuthenticated, loginNotice, onLogin, onLogout }) {
  const location = useLocation()

  return (
    <>
      {location.pathname !== '/login' && location.pathname !== '/hoy' && (
        <header className="brand-bar">
          <Link className="brand-lockup" to={isAuthenticated ? '/hoy' : '/login'} aria-label="Eventos al Día, inicio">
            <img src="/Logo.jpg" alt="Eventos al Día" />
          </Link>
        </header>
      )}
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={onLogin} sessionNotice={loginNotice} />} />
        <Route path="/registro" element={<RegistroPage onLogin={onLogin} />} />
        <Route path="/hoy" element={<ProtectedRoute isAuthenticated={isAuthenticated}><HoyPage onLogout={onLogout} /></ProtectedRoute>} />
        <Route path="/crear" element={<ProtectedRoute isAuthenticated={isAuthenticated}><CrearEvento /></ProtectedRoute>} />
        <Route path="/evento/subtareas" element={<ProtectedRoute isAuthenticated={isAuthenticated}><DetalleEvento /></ProtectedRoute>} />
        <Route path="/evento/:id" element={<ProtectedRoute isAuthenticated={isAuthenticated}><DetalleEvento /></ProtectedRoute>} />
        <Route path="/progreso" element={<ProtectedRoute isAuthenticated={isAuthenticated}><ProgresoPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/hoy' : '/login'} replace />} />
      </Routes>
    </>
  )
}

function App() {
  const [loginNotice, setLoginNotice] = useState('')
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

  useLayoutEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const hasSession = Boolean(localStorage.getItem('authToken'))
        const sessionExpired = error?.response?.status === 401 && hasSession

        if (sessionExpired) {
          localStorage.removeItem('authToken')
          localStorage.removeItem('userId')
          sessionStorage.removeItem('selectedEventId')
          delete axios.defaults.headers.common.Authorization
          setLoginNotice('Tu sesión expiró. Inicia sesión de nuevo.')
          setIsAuthenticated(false)
        }

        return Promise.reject(error)
      },
    )

    return () => axios.interceptors.response.eject(interceptorId)
  }, [])

  const handleLogin = () => {
    setLoginNotice('')
    localStorage.setItem('authSessionVersion', AUTH_SESSION_VERSION)
    const token = localStorage.getItem('authToken')
    if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    sessionStorage.removeItem('selectedEventId')
    delete axios.defaults.headers.common.Authorization
    setLoginNotice('')
    setIsAuthenticated(false)
  }

  return (
    <BrowserRouter>
      <AppRoutes
        isAuthenticated={isAuthenticated}
        loginNotice={loginNotice}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  )
}

export default App
