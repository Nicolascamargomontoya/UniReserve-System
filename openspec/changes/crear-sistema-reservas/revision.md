# Revisión de especificaciones (Fase 2)

**Cambio:** `crear-sistema-reservas` · **Fecha:** 2026-10-24 · **Resultado:** aprobado para implementar, con las correcciones de la §4 aplicadas.

Ningún módulo se implementa antes de esta revisión (condición de la Fase 2).

## 1. Verificación de formato

| Verificación | Resultado |
| :--- | :--- |
| `openspec validate crear-sistema-reservas --strict` | Válido |
| Cada capacidad tiene `Purpose` | 8/8 |
| Requisitos con `SHALL`/`MUST` | 40/40 |
| Requisitos con al menos un escenario | 40/40 (95 escenarios) |
| Escenarios con resultado observable (código HTTP, código de error o estado) | 95/95 |
| Nombres de escenario únicos dentro de cada capacidad | Sí (se comprobará automáticamente con `npm run trazabilidad`) |

## 2. Correspondencia con PLAN_INGENIERIA.md

| Elemento del plan | Cubierto por |
| :--- | :--- |
| N1 / M1 | `gestion-espacios` |
| N2 / M2 | `gestion-usuarios` |
| N3 / M3 | `roles-permisos` |
| N4 / M4 | `solicitudes-reserva` |
| N5 / M5 | `disponibilidad` |
| N6 / M6 | `prevencion-conflictos` |
| N7 / M7 | `aprobacion-reservas` |
| N8 / M8 | `cancelacion-historial` |
| RN-01 nombre único | gestion-espacios: Nombre único de espacio |
| RN-02 desactivar sin borrar | gestion-espacios: Activación y desactivación; solicitudes-reserva: Espacio válido y capacidad |
| RN-03 autorregistro limitado | gestion-usuarios: Registro de cuentas; roles-permisos: Asignación de roles |
| RN-04 protección del administrador | roles-permisos: Protección del acceso administrativo |
| RN-05 ISO-8601 con zona y bloques de 30 min | solicitudes-reserva: Formato de fechas; Bloques de 30 minutos |
| RN-06 futuro, fin > inicio, capacidad | solicitudes-reserva: Intervalo de tiempo válido; Espacio válido y capacidad |
| RN-07 `PENDIENTE` ocupa la franja | solicitudes-reserva: Creación; disponibilidad: Validación al solicitar |
| RN-08 intervalos semiabiertos | disponibilidad: Definición de disponibilidad |
| RN-09 exclusividad espacio/usuario | prevencion-conflictos (4 requisitos) |
| RN-10 decisión del administrador | aprobacion-reservas (4 requisitos) |
| RN-11 cancelación | cancelacion-historial: Cancelación por el solicitante; Cancelación administrativa |
| RN-12 historial inmutable | cancelacion-historial: Registro inmutable de cambios de estado |
| Riesgo R1 (doble reserva) | prevencion-conflictos: escenarios de concurrencia y revalidación |
| Riesgo R4 (privilegios) | gestion-usuarios: Autorregistro como administrador; roles-permisos: Promover un estudiante a administrador |
| Riesgo R7 (fechas) | solicitudes-reserva: Fecha sin zona horaria; Fecha con desplazamiento horario |

Ninguna regla del plan quedó sin requisito, y ningún requisito introduce funcionalidad ausente del plan.

## 3. Ambigüedades y contradicciones heredadas de la iteración 1

| # | Hallazgo en las especificaciones de la iteración 1 | Tipo | Resolución en este cambio |
| :--- | :--- | :--- | :--- |
| A1 | "Reservations cannot overlap by even one minute" no decía si dos reservas contiguas (10–12 y 12–14) chocan. | Ambigüedad | Intervalos semiabiertos (RN-08) y escenario "Reserva contigua permitida". |
| A2 | No se definía el formato ni la zona horaria de las fechas. | Ambigüedad | ISO-8601 con zona obligatoria; escenarios con y sin zona. |
| A3 | REQ-RES-04 pedía revisar "cualquier" reserva solapada, pero REQ-RES-05 solo bloqueaba con reservas aprobadas; el código aprobaba sin revalidar, así que dos pendientes solapadas podían aprobarse ambas. | Contradicción (defecto) | `PENDIENTE` ocupa la franja (DT-08) y revalidación al aprobar. |
| A4 | Los mensajes de error de los escenarios no coincidían con el código ("Invalid time range" frente a "End time must be after start time"). | Inconsistencia | Códigos de error estables (`RANGO_HORARIO_INVALIDO`, …); las pruebas verifican códigos, no textos. |
| A5 | RES-ROL-02 decía que solo el administrador cambia roles, pero el registro aceptaba cualquier rol, incluido el de administrador. | Contradicción (defecto de seguridad) | Autorregistro solo como `ESTUDIANTE` o `PROFESOR`; escenario "Autorregistro como administrador". |
| A6 | REQ-ROL-03 hablaba de eliminar espacios y REQ-SPC-03 de desactivarlos. | Contradicción | No hay borrado físico; solo desactivación (conserva el historial). |
| A7 | No se definía quién puede cancelar, hasta cuándo ni qué pasa con la franja. | Vacío | Requisitos de cancelación por el solicitante (antes del inicio) y administrativa (con motivo). |
| A8 | No se definía qué pasa al aprobar una solicitud cuyo inicio ya pasó. | Vacío | `SOLICITUD_VENCIDA` (422). |
| A9 | REQ-USR-04 permitía cambiar el correo desde el perfil, sin regla de unicidad ni verificación. | Ambigüedad | El perfil solo permite cambiar el nombre; el correo es la identidad de la cuenta. |
| A10 | REQ-SPC-04 ofrecía el catálogo "a todos los usuarios" sin aclarar si incluía visitantes anónimos. | Ambigüedad | Catálogo solo para usuarios autenticados (roles-permisos: Autenticación obligatoria). |

## 4. Correcciones aplicadas durante esta revisión

1. **disponibilidad — Consulta de ocupación:** el texto del requisito no indicaba los códigos de error que verifican sus escenarios (rango invertido, rango mayor de 31 días). Se agregaron al requisito.
2. **disponibilidad — Búsqueda de espacios disponibles:** no definía qué ocurre con un intervalo invertido. Se agregó `RANGO_HORARIO_INVALIDO`.
3. **design.md — D6:** solo definía el orden de validación al crear. Se agregó el orden al aprobar, rechazar y cancelar, porque los escenarios que combinan condiciones (por ejemplo, cancelar una reserva cancelada cuyo inicio ya pasó) necesitan un resultado único.
4. **Idioma:** por decisión del estudiante, todo el proyecto pasa a español: nombres de capacidades y del cambio, rutas, roles, estados, códigos de error, campos JSON y estructura de carpetas. Se actualizó el plan a la versión 2.1. Solo quedan en inglés las palabras clave que exige el analizador de OpenSpec.

## 5. Decisiones registradas (casos límite sin escenario propio)

- Desactivar una cuenta **no** cancela sus reservas: el administrador puede rechazarlas o cancelarlas. Así se evita un efecto en cascada no solicitado por la institución.
- El inicio de sesión normaliza el correo igual que el registro (minúsculas, sin espacios en los extremos).
- Un administrador no tiene reservas propias, así que `/reservas/mias` le responde 403 (no tiene `reservas:consultar-propias`).

## 6. Resultado de la prueba de mutación (tarea 4.6)

Ejecutada el 2026-10-24 durante el incremento 3.

| Paso | Resultado |
| :--- | :--- |
| Suite de `prevencion-conflictos` con el mutex activo, repetida 8 veces con un repositorio con latencia artificial | 6/6 pruebas en verde en las 8 ejecuciones |
| Mutación: `GuardiaConflictos.ejecutarExclusivo` ejecuta la operación sin adquirir claves | **Fallan** "Cinco solicitudes simultáneas por la misma franja" y "Solicitudes simultáneas del mismo usuario en espacios distintos" |
| Código restaurado | Suite de nuevo en verde |

Conclusión: las pruebas de concurrencia detectan la ausencia del mutex. Para que esta evidencia quede automatizada se agregó la prueba de control "control: sin mutex por clave la misma franja se asigna más de una vez", que inyecta una exclusión vacía y verifica que se producen dobles reservas.
