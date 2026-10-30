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
import PerfilPage from './pages/PerfilPage.jsx'
import RestablecerContrasena from './pages/RestablecerContrasena.jsx'

const AUTH_SESSION_VERSION = 'supabase-auth-v1'

function ProtectedRoute({ isAuthenticated, children }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppShell({ onLogout, children }) {
  const location = useLocation()
  const isHoy = location.pathname === '/hoy'
  const isEventDetails = location.pathname.startsWith('/evento/')
  const isProgreso = location.pathname === '/progreso'
  const isConfiguracion = location.pathname === '/configuracion'
  const isPerfil = location.pathname === '/perfil'

  return (
    <div className="app-shell">
      <aside className="today-sidebar">
        {isHoy || isEventDetails ? (
          <div className="today-logo"><img src="/Logo.png" alt="Eventos al Día" /></div>
        ) : (
          <Link className="today-logo" to="/hoy" aria-label="Eventos al Día, inicio"><img src="/Logo.png" alt="Eventos al Día" /></Link>
        )}
        <nav aria-label="Navegación principal">
          <p>Tu espacio</p>
          <Link className={isHoy ? 'active' : ''} to="/hoy">
            <svg className="today-nav-icon today-nav-calendar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="16" rx="2" />
              <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
              <g className="today-nav-calendar-dates">
                <circle cx="8" cy="13.5" r=".65" />
                <circle cx="12" cy="13.5" r=".65" />
                <circle cx="16" cy="13.5" r=".65" />
                <circle cx="8" cy="17.5" r=".65" />
                <circle cx="12" cy="17.5" r=".65" />
                <circle className="today-nav-calendar-date" cx="16" cy="17.5" r="1.25" />
              </g>
            </svg>
            Hoy
          </Link>
          <Link className={isProgreso ? 'active' : ''} to="/progreso">
            <svg className="today-nav-icon today-nav-progress" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 3v18h17" />
              <path className="today-nav-progress-line" pathLength="1" d="m6 16 5-5 4 3 6-8" />
              <path d="m16 6h5v5" />
            </svg>
            Progreso
          </Link>
          <Link className={isConfiguracion ? 'active' : ''} to="/configuracion">
            <svg className="today-nav-icon today-nav-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path className="today-nav-clock-hand today-nav-clock-hour" d="M12 6v6" />
              <path className="today-nav-clock-hand today-nav-clock-minute" d="m12 12 4 2" />
            </svg>
            Límite diario
          </Link>
          <Link className={isPerfil ? 'active' : ''} to="/perfil">
            <svg className="today-nav-icon today-nav-profile" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="7" r="3.5" />
              <path d="M4 21v-2a7 7 0 0 1 14 0v2" />
            </svg>
            Mi perfil
          </Link>
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

  const showStandaloneLogo = !['/login', '/registro', '/restablecer-contrasena'].includes(location.pathname)
    && !['/hoy', '/crear', '/progreso', '/perfil', '/configuracion'].includes(location.pathname)
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
        <Route path="/perfil" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AppShell onLogout={onLogout}><PerfilPage /></AppShell></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AppShell onLogout={onLogout}><ConfiguracionPage /></AppShell></ProtectedRoute>} />
        <Route
  path="/restablecer-contrasena"
  element={<RestablecerContrasena />}
/>

<Route
  path="*"
  element={<Navigate to={isAuthenticated ? '/hoy' : '/login'} replace />}
/>
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
