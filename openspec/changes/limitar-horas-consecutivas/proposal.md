# Propuesta: Límite de cuatro horas consecutivas por usuario y espacio (CR-01)

## Why

La institución solicitó una nueva regla de negocio después de implementar las funcionalidades principales: **"Ningún usuario podrá reservar un espacio académico durante más de cuatro horas consecutivas."** Hoy un solicitante puede ocupar un laboratorio o un auditorio toda una jornada, lo que concentra el uso de espacios escasos en pocas personas.

## What Changes

- Toda solicitud que, **sola o unida a reservas activas contiguas del mismo usuario en el mismo espacio**, forme un bloque continuo de más de 4 horas se rechaza con 422 `LIMITE_HORAS_CONSECUTIVAS`.
- Un bloque de exactamente 4 horas sigue permitido ("más de cuatro" excluye el 4).
- Nuevo código de error `LIMITE_HORAS_CONSECUTIVAS` (422) en el contrato de errores.
- Sin cambios en rutas, campos ni en las demás capacidades.

## Análisis de impacto

### Interpretación de la regla (ambigüedad detectada)

"Consecutivas" admite dos lecturas:

1. **Duración de cada reserva ≤ 4 h.** Es la lectura literal más simple, pero se elude dividiendo la actividad: 08:00–12:00 y 12:00–14:00 suman 6 horas consecutivas en el mismo espacio.
2. **Bloque continuo ≤ 4 h**, sumando las reservas activas contiguas del mismo usuario en el mismo espacio. Incluye la lectura 1 y cierra el resquicio.

Se adopta la **lectura 2**. Gracias a los bloques de 30 minutos (solicitudes-reserva › Bloques de 30 minutos), "contiguas" queda bien definido: dos reservas son contiguas si una termina exactamente cuando empieza la otra; cualquier pausa (mínimo 30 minutos) corta la cadena. La regla es **por espacio** porque así la formula la institución ("un espacio académico"). Moverse a otro espacio no encadena; la simultaneidad entre espacios ya la impide prevencion-conflictos.

### Capacidades afectadas

| Capacidad | Impacto |
| :--- | :--- |
| `solicitudes-reserva` | **Nuevo requisito** "Límite de cuatro horas consecutivas" (delta `ADDED`). |
| `disponibilidad` | Ninguno: la definición de disponibilidad no cambia. |
| `prevencion-conflictos` | Ninguno. La exclusividad del solicitante garantiza que las reservas propias no se solapan; por eso la cadena solo puede formarse por contigüidad. |
| `aprobacion-reservas` | Ninguno. La regla se aplica al crear la solicitud; la aprobación no la vuelve a evaluar (ver design.md). |
| `cancelacion-historial` | Ninguno. Las reservas `CANCELADA` y `RECHAZADA` no cuentan para la cadena. |
| `gestion-espacios`, `gestion-usuarios`, `roles-permisos` | Ninguno. |

### Impacto en el plan de ingeniería

No cambia la arquitectura, el stack ni la estrategia de persistencia. Se agrega la regla **RN-13** al plan (§2.4) y una entrada **CR-01** en el control de cambios (§7). La mitigación prevista para el riesgo R6 (reglas aisladas en políticas, suite de regresión) se aplica tal como se planificó.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `solicitudes-reserva`: se agrega el requisito "Límite de cuatro horas consecutivas".

## Impact

- **Código:** nueva política `src/modulos/solicitudes-reserva/politica-horas-consecutivas.ts`; `ServicioSolicitudes` la invoca; nuevo código en `src/compartido/errores.ts`.
- **API:** nueva respuesta 422 `LIMITE_HORAS_CONSECUTIVAS` en `POST /reservas`.
- **Pruebas:** nuevo archivo `pruebas/solicitudes-reserva.horas-consecutivas.test.ts` y pruebas unitarias de la política; la suite existente se ejecuta completa como regresión.
- **Datos existentes:** la regla no es retroactiva; las reservas ya registradas no se cancelan.
