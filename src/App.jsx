import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import CrearEvento from './pages/CrearEvento.jsx'

function App() {
  return <BrowserRouter><Routes><Route path="/crear" element={<CrearEvento />} /><Route path="*" element={<Navigate to="/crear" replace />} /></Routes></BrowserRouter>
}

export default App
