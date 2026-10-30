import { useEffect, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_URL } from '../utils/apiUrl.js'
import { getApiErrorMessage, getDailyCapacityConflict } from '../utils/apiError.js'
import { formatMinutesAsHours } from '../utils/formatters.js'

export default function ConfiguracionPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [returnContext] = useState(() => {
    const pendingLimitHours = Number(location.state?.pendingLimitHours)
    return Number.isFinite(pendingLimitHours) && pendingLimitHours >= 1
      ? {
          pendingLimitHours,
          adjustmentSaved: Boolean(location.state?.adjustmentSaved),
          capacityConflict: location.state?.capacityConflict || null,
          errorMessage: location.state?.errorMessage || '',
        }
      : null
  })
  const userId = localStorage.getItem('userId')
  const [limitHours, setLimitHours] = useState(6)
  const [draftHours, setDraftHours] = useState('6')
  const [loading, setLoading] = useState(Boolean(userId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [capacityConflict, setCapacityConflict] = useState(null)

  useEffect(() => {
    if (!userId) return undefined

    let active = true
    axios.get(`${API_URL}/usuarios/${encodeURIComponent(userId)}/limite`)
      .then(({ data }) => {
        if (!active) return
        const currentLimit = Number(data.daily_limit_hours) || 6
        setLimitHours(currentLimit)
        setDraftHours(String(returnContext?.pendingLimitHours ?? currentLimit))
        if (returnContext?.capacityConflict) setCapacityConflict(returnContext.capacityConflict)
        if (returnContext?.errorMessage) setError(returnContext.errorMessage)
        if (returnContext?.adjustmentSaved) {
          setSuccess(returnContext.capacityConflict
            ? `Gestión ajustada. Todavía hay ${formatMinutesAsHours(returnContext.capacityConflict.planned_minutes)} planificadas; redistribuye las restantes para aplicar el límite de ${returnContext.pendingLimitHours} h.`
            : `Gestión ajustada y límite diario actualizado a ${currentLimit} h.`)
        }
        if (returnContext) navigate(location.pathname, { replace: true, state: null })
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, 'No pudimos cargar tu límite diario.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [location.pathname, navigate, returnContext, userId])

  const saveLimit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setCapacityConflict(null)
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
      const conflict = getDailyCapacityConflict(requestError)
      if (conflict?.conflict_type === 'daily_limit_reduction') {
        setCapacityConflict(conflict)
      } else {
        setError(getApiErrorMessage(requestError, 'No pudimos guardar tu límite diario.'))
      }
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
            onChange={(event) => {
              setDraftHours(event.target.value)
              setCapacityConflict(null)
            }}
          />
          <p className="settings-hint" id="daily-limit-hint">Entre 1 y 16 horas. Tu límite actual es {loading ? '…' : `${limitHours} h`}.</p>
          {error && <div className="state-message state-error" role="alert">{error}</div>}
          {success && <div className="state-message state-success" role="status">{success}</div>}
          {capacityConflict && (
            <section className="settings-capacity-conflict" role="alert">
              <h3>El límite nuevo es menor que lo planificado para hoy</h3>
              <p>
                Hoy tienes {formatMinutesAsHours(capacityConflict.planned_minutes)} planificadas y quieres dejar el límite en {formatMinutesAsHours(capacityConflict.limit_minutes)}.
                Reprograma o reduce alguna gestión; después podrás guardar el nuevo límite.
              </p>
              <ul>
                {capacityConflict.subtasks.map((subtask) => (
                  <li key={subtask.id}>
                    <span>{subtask.title} · {formatMinutesAsHours(subtask.estimated_minutes)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        sessionStorage.setItem('selectedEventId', subtask.event_id)
                        navigate('/evento/subtareas', {
                          state: {
                            reprogramSubtaskId: subtask.id,
                            dailyLimitContext: {
                              target_date: capacityConflict.target_date,
                              planned_minutes: capacityConflict.planned_minutes,
                              limit_minutes: Number(draftHours) * 60,
                              subtasks: capacityConflict.subtasks,
                            },
                          },
                        })
                      }}
                    >
                      Ajustar gestión
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <button type="submit" disabled={loading || saving}>{saving ? 'Guardando…' : 'Guardar límite'}</button>
        </form>
      )}
    </main>
  )
}
