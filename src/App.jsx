import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import CrearEvento from './pages/CrearEvento.jsx'

function App() {
  return <BrowserRouter><Routes><Route path="/hoy" element={<CrearEvento />} /><Route path="*" element={<Navigate to="/hoy" replace />} /></Routes></BrowserRouter>
}

export default App
