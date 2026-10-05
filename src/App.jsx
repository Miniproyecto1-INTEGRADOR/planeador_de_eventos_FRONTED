import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useLayoutEffect, useState } from 'react'
import axios from 'axios'
import CrearEvento from './pages/CrearEvento.jsx'
import HoyPage from './pages/HoyPage.jsx'
import DetalleEvento from './pages/DetalleEvento.jsx'
import ProgresoPage from './pages/ProgresoPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegistroPage from './pages/RegistroPage.jsx'
import ConfiguracionPage from './pages/ConfiguracionPage.jsx'

const AUTH_SESSION_VERSION = 'supabase-auth-v1'

function ProtectedRoute({ isAuthenticated, children }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppShell({ onLogout, children }) {
  const location = useLocation()
  const isHoy = location.pathname === '/hoy'
  const isProgreso = location.pathname === '/progreso'
  const isConfiguracion = location.pathname === '/configuracion'

  return (
    <div className="app-shell">
      <aside className="today-sidebar">
        <Link className="today-logo" to="/hoy" aria-label="Eventos al Día, inicio"><img src="/Logo.png" alt="Eventos al Día" /></Link>
        <nav aria-label="Navegación principal">
          <p>Tu espacio</p>
          <Link className={isHoy ? 'active' : ''} to="/hoy"><span>01</span>Hoy</Link>
          <Link className={isProgreso ? 'active' : ''} to="/progreso"><span>02</span>Progreso</Link>
          <Link className={isConfiguracion ? 'active' : ''} to="/configuracion"><span>03</span>Configuración</Link>
        </nav>
        <button className="today-logout" type="button" onClick={onLogout}>
          <img src="/Cerrar sesión.png" alt="" aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </aside>
      <div className="app-shell-content">{children}</div>
    </div>
  )
}

function AppRoutes({ isAuthenticated, loginNotice, onLogin, onLogout }) {
  const location = useLocation()

  const showStandaloneLogo = !['/login', '/registro'].includes(location.pathname)
    && !['/hoy', '/crear', '/progreso', '/configuracion'].includes(location.pathname)
    && !location.pathname.startsWith('/evento/')

  return (
    <>
      {showStandaloneLogo && (
        <header className="brand-bar">
          <Link className="brand-lockup" to={isAuthenticated ? '/hoy' : '/login'} aria-label="Eventos al Día, inicio">
            <img src="/Logo.png" alt="Eventos al Día" />
          </Link>
        </header>
      )}
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={onLogin} sessionNotice={loginNotice} />} />
        <Route path="/registro" element={<RegistroPage onLogin={onLogin} />} />
        <Route path="/hoy" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AppShell onLogout={onLogout}><HoyPage /></AppShell></ProtectedRoute>} />
        <Route path="/crear" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AppShell onLogout={onLogout}><CrearEvento /></AppShell></ProtectedRoute>} />
        <Route path="/evento/subtareas" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AppShell onLogout={onLogout}><DetalleEvento /></AppShell></ProtectedRoute>} />
        <Route path="/evento/:id" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AppShell onLogout={onLogout}><DetalleEvento /></AppShell></ProtectedRoute>} />
        <Route path="/progreso" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AppShell onLogout={onLogout}><ProgresoPage /></AppShell></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AppShell onLogout={onLogout}><ConfiguracionPage /></AppShell></ProtectedRoute>} />
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
