import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import CrearEvento from './pages/CrearEvento.jsx'
import HoyPage from './pages/HoyPage.jsx'
import DetalleEvento from './pages/DetalleEvento.jsx'
import ProgresoPage from './pages/ProgresoPage.jsx'
import LoginPage from './pages/LoginPage.jsx'

function ProtectedRoute({ isAuthenticated, children }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('demoToken')))

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} />
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
