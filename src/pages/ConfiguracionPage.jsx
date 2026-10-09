import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_URL } from '../utils/apiUrl.js'
import { getApiErrorMessage } from '../utils/apiError.js'

export default function ConfiguracionPage() {
  const userId = localStorage.getItem('userId')
  const [limitHours, setLimitHours] = useState(6)
  const [draftHours, setDraftHours] = useState('6')
  const [loading, setLoading] = useState(Boolean(userId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!userId) return undefined

    let active = true
    axios.get(`${API_URL}/usuarios/${encodeURIComponent(userId)}/limite`)
      .then(({ data }) => {
        if (!active) return
        const currentLimit = Number(data.daily_limit_hours) || 6
        setLimitHours(currentLimit)
        setDraftHours(String(currentLimit))
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, 'No pudimos cargar tu límite diario.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [userId])

  const saveLimit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    const value = Number(draftHours)

    if (!Number.isInteger(value) || value < 1 || value > 16) {
      setError('El límite debe ser un número entero entre 1 y 16 horas.')
      return
    }

    setSaving(true)
    try {
      const { data } = await axios.put(
        `${API_URL}/usuarios/${encodeURIComponent(userId)}/limite`,
        null,
        { params: { value } },
      )
      setLimitHours(data.daily_limit_hours)
      setDraftHours(String(data.daily_limit_hours))
      setSuccess('Límite diario actualizado.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No pudimos guardar tu límite diario.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="settings-page">
      <p className="eyebrow">Tu disponibilidad</p>
      <h2>Límite diario</h2>
      <p>Define cuántas horas de gestiones puedes organizar por día. Usaremos este límite para avisarte si una reprogramación concentra demasiado trabajo.</p>

      {!userId ? (
        <div className="state-message state-error" role="alert">No encontramos tu cuenta. Vuelve a iniciar sesión.</div>
      ) : (
        <form className="settings-limit-form" noValidate onSubmit={saveLimit}>
          <label htmlFor="daily-limit">Límite diario de gestión</label>
          <input
            id="daily-limit"
            type="number"
            min="1"
            max="16"
            step="1"
            required
            value={draftHours}
            disabled={loading || saving}
            aria-describedby="daily-limit-hint"
            onChange={(event) => setDraftHours(event.target.value)}
          />
          <p className="settings-hint" id="daily-limit-hint">Entre 1 y 16 horas. Tu límite actual es {loading ? '…' : `${limitHours} h`}.</p>
          {error && <div className="state-message state-error" role="alert">{error}</div>}
          {success && <div className="state-message state-success" role="status">{success}</div>}
          <button type="submit" disabled={loading || saving}>{saving ? 'Guardando…' : 'Guardar límite'}</button>
        </form>
      )}
    </main>
  )
}
