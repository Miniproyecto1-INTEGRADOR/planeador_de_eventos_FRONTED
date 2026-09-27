# Documento Unico - Sprint 2

## Estado de implementacion

Este documento registra el estado del codigo y las evidencias pendientes. No se considera cerrada una verificacion que dependa de Supabase, del tablero del equipo o de capturas que aun no se hayan adjuntado.

## C1 - Login, rutas protegidas y aislamiento

### Implementado en codigo

- `/hoy`, `/crear`, `/evento/:id` y `/progreso` estan protegidas en el frontend.
- El frontend envia el access token de Supabase al backend.
- El backend reenvia ese token al Data API de Supabase.
- `back/supabase/supabase_auth_rls.sql` define politicas para que los eventos pertenezcan a `auth.uid()` y las subtareas solo sean accesibles a traves de eventos propios.

### Evidencia pendiente

- [ ] Confirmar que `supabase_auth_rls.sql` se ejecuto en el proyecto Supabase conectado a Render.
- [ ] Crear dos cuentas de prueba independientes, A y B.
- [ ] Crear un evento y una subtarea con A; iniciar sesion con B e intentar abrir el ID de A. Comprobar que B no puede leer, cambiar ni borrar esos datos.
- [ ] Adjuntar capturas de `/login`, redireccion a login sin sesion y prueba de aislamiento A/B.

El aislamiento no se marca como verificado hasta completar la prueba contra Supabase.

## C2 - Vista Hoy y prioridades

`GET /api/hoy/` devuelve las gestiones agrupadas en `vencidas`, `hoy` y `proximas`. Cada grupo se ordena por fecha limite ascendente y, si coincide la fecha, por `estimated_minutes` ascendente. Las gestiones sin fecha quedan al final de `proximas`. Si no se envia `status`, se excluyen las completadas.

La interfaz destaca las gestiones vencidas con **Atencion inmediata** y las del dia con **Vence hoy**.

- [ ] Adjuntar captura de `/hoy` con ejemplos de los tres grupos y sus prioridades.

## C3 - Ayuda de orden

La regla de priorizacion se muestra en un icono de informacion junto a **Tu plan del dia**. Al pasar el cursor o enfocar el icono con teclado aparece:

> Primero van las vencidas, despues las que vencen hoy y luego las proximas. En cada grupo, se ordena por fecha limite mas antigua y, si coincide, por menor duracion.

- [ ] Adjuntar captura con el tooltip abierto y las gestiones ordenadas.

## C4 - Estados UX en Hoy

- Vacio: mensaje **Tu plan comienza aqui** y accion para crear un evento.
- Carga: mensaje de carga centrado.
- Error: mensaje amigable con boton **Reintentar**.

- [ ] Adjuntar capturas de los estados vacio, carga y error con reintento.

## C5 - Contrato de `/api/hoy/`

Disponible en Swagger UI del backend: `/docs`.

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/hoy/` | Agrupa las gestiones propias. Por defecto omite estado `done`. |
| GET | `/api/hoy/?event_id={uuid}` | Limita el resultado al evento indicado. |
| GET | `/api/hoy/?status={pending\|done\|postponed}` | Filtra por estado. |
| GET | `/api/hoy/?event_id={uuid}&status={pending\|done\|postponed}` | Combina ambos filtros. |

Autenticacion: `Authorization: Bearer <access_token_de_Supabase>`.

Ejemplo de solicitud:

```http
GET /api/hoy/?event_id=550e8400-e29b-41d4-a716-446655440000&status=pending HTTP/1.1
Host: <host-del-backend>
Authorization: Bearer <access_token_de_Supabase>
```

No se envia body en una solicitud GET.

Respuesta `200 OK` de ejemplo:

```json
{
  "vencidas": [],
  "hoy": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "event_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Confirmar catering",
      "target_date": "2026-09-27",
      "estimated_minutes": 45,
      "status": "pending"
    }
  ],
  "proximas": []
}
```

Respuestas relevantes:

- `200`: filtros validos; incluye los tres grupos, que pueden estar vacios.
- `400`: UUID o estado invalido.
- `401`: Supabase rechaza el token por ausente, invalido o expirado.

Pruebas focalizadas que no escriben en Supabase:

```powershell
cd back
.\venv\Scripts\python.exe -m pytest -q tests/test_api.py -k "today_filters_and_orders or today_defaults_to_excluding"
```

Resultado local: `2 passed`. OpenAPI publica los parametros `event_id` y `status`, y un ejemplo de respuesta `200`.

## C6 - Evidencia UX/HCI y tablero

### Decisiones de diseño

1. **Urgencia antes que proximidad.** Las vencidas aparecen primero y con mayor contraste; despues se muestran las que vencen hoy y finalmente las proximas. Esto ayuda al organizador a identificar las gestiones que requieren accion inmediata.
2. **Menor esfuerzo primero ante empate.** Si varias gestiones tienen la misma fecha limite, se muestra primero la de menor duracion estimada para facilitar la planificacion del tiempo disponible.

### Bitacora de iteracion

| Hallazgo | Cambio aplicado | Verificacion |
|---|---|---|
| La lista no distinguia suficientemente las gestiones urgentes. | Se resaltaron vencidas y gestiones que vencen hoy con fondos y etiquetas distintos. | Lint y build frontend correctos; captura pendiente. |
| La regla de prioridad debia ser visible sin ocupar espacio permanente. | Se cambio el banner por un icono con tooltip junto al titulo de Hoy. | Lint y build frontend correctos; captura del tooltip pendiente. |

### Tablero y responsables

- URL de Jira/Taiga: **pendiente de completar por el equipo**.
- Captura del tablero To Do / Doing / Done: **pendiente**.

| Tarea Sprint 2 | Responsable | Estimacion | Definition of Done | Evidencia |
|---|---|---|---|---|
| Verificar aislamiento entre organizadores A/B | Pendiente | Pendiente | B no puede consultar ni modificar eventos/subtareas de A en Supabase | Captura/video pendiente |
| Verificar prioridades, tooltip y estados de `/hoy` | Pendiente | Pendiente | Tres grupos, orden, prioridades y estados UX comprobados | Capturas pendientes |
| Documentar y probar filtros de `/api/hoy/` | Pendiente | Pendiente | Swagger y pruebas de filtros/orden aprobadas | Pruebas locales aprobadas; captura Swagger pendiente |

## Evidencias por completar antes de entregar

- [ ] Captura de login y redireccion de ruta protegida.
- [ ] Evidencia de aislamiento real entre dos cuentas.
- [ ] Captura de `/hoy` con grupos y etiquetas de prioridad.
- [ ] Captura del tooltip de orden abierto.
- [ ] Capturas de estados vacio, carga y error/reintento.
- [ ] Captura de Swagger con filtros y ejemplo de respuesta.
- [ ] URL del tablero, responsables, estimaciones y captura de avance.
