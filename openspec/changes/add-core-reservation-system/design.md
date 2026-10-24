# Design: Sistema central de reservas de espacios académicos

## Context

Ver `proposal.md` (Why). El código de la iteración 1 está organizado por tipo técnico (`controllers/`, `services/`, `models/`) en un solo archivo por capa, sin pruebas automatizadas con framework y con el secreto JWT fijo en el código. Restricciones del plan (PLAN_INGENIERIA.md §3): Node.js ≥ 22.12, TypeScript strict, Express 5, sin base de datos externa en la entrega, y ejecución completa con `npm install && npm test`.

## Goals / Non-Goals

**Goals:**

- Correspondencia 1:1 entre capacidad, carpeta `src/modules/<capacidad>/` y archivo `tests/<capacidad>.test.ts`.
- Pruebas deterministas: reloj inyectable y repositorios en memoria.
- Garantía de exclusividad (espacio y usuario) también con peticiones concurrentes.
- Un único contrato de errores para toda la API.

**Non-Goals:**

- Persistencia en una base de datos real (queda el DDL de referencia en el plan, §3.3).
- Paginación, límites de tasa y despliegue multiproceso.
- Interfaz gráfica.

## Decisions

### D1. Módulos verticales sobre capas horizontales

Cada módulo contiene sus rutas (presentación) y sus servicios (negocio). Los modelos están en `src/domain/` y el acceso a datos en `src/repositories/` porque los comparten varios módulos. Los servicios no importan Express. `src/container.ts` crea repositorios y servicios; `src/app.ts` monta las rutas.

- *Alternativa descartada:* carpetas por tipo técnico (iteración 1). Mezcla funcionalidades en un mismo archivo y rompe la trazabilidad con las capacidades.

### D2. API REST

| Método | Ruta | Permiso | Requisito |
| :--- | :--- | :--- | :--- |
| POST | `/auth/register` | público | user-management: Registro de cuentas |
| POST | `/auth/login` | público | user-management: Autenticación |
| GET / PATCH | `/users/me` | autenticado | user-management: Perfil propio |
| GET | `/users`, `/users/:id` | `users:manage` | user-management: Administración de cuentas |
| PATCH | `/users/:id/status` | `users:manage` | Administración de cuentas; Protección del acceso administrativo |
| PATCH | `/users/:id/role` | `users:manage` | roles-permissions: Asignación de roles |
| GET | `/spaces`, `/spaces/:id` | `spaces:read` | space-management: Consulta del catálogo |
| POST | `/spaces` | `spaces:manage` | space-management: Registro de espacios |
| PATCH | `/spaces/:id` | `spaces:manage` | space-management: Edición de espacios |
| PATCH | `/spaces/:id/status` | `spaces:manage` | space-management: Activación y desactivación |
| GET | `/spaces/available` | `spaces:read` | availability: Búsqueda de espacios disponibles |
| GET | `/spaces/:id/occupancy` | `spaces:read` | availability: Consulta de ocupación |
| POST | `/reservations` | `reservations:create` | reservation-requests; availability; conflict-prevention |
| GET | `/reservations/me` | `reservations:read-own` | cancellation-history: Historial del solicitante |
| GET | `/reservations/pending` | `reservations:decide` | reservation-approval: Bandeja de pendientes |
| GET | `/reservations` | `reservations:read-all` | cancellation-history: Consulta administrativa |
| GET | `/reservations/:id` | propia o `reservations:read-all` | cancellation-history |
| PATCH | `/reservations/:id/approve` | `reservations:decide` | reservation-approval: Aprobación |
| PATCH | `/reservations/:id/reject` | `reservations:decide` | reservation-approval: Rechazo con motivo |
| PATCH | `/reservations/:id/cancel` | propia (`reservations:cancel-own`) o `reservations:cancel-any` | cancellation-history: Cancelación |

### D3. Autorización por permisos, no por listas de roles

`roles-permissions/permissions.ts` define la matriz rol → permisos; las rutas exigen permisos (`authorize('spaces:manage')`).

| Permiso | STUDENT | PROFESSOR | ADMINISTRATOR |
| :--- | :---: | :---: | :---: |
| `spaces:read` | ✓ | ✓ | ✓ |
| `reservations:create`, `reservations:read-own`, `reservations:cancel-own` | ✓ | ✓ | |
| `spaces:manage`, `reservations:read-all`, `reservations:decide`, `reservations:cancel-any`, `users:manage` | | | ✓ |

- *Alternativa descartada:* listas de roles en cada ruta (iteración 1). Dispersa la política y obliga a revisar todas las rutas cuando cambia un rol.

### D4. Autenticación: JWT con consulta de la cuenta en cada petición

El token solo contiene el identificador de la cuenta (`sub`). En cada petición, el middleware verifica la firma y la expiración con el reloj inyectado, carga la cuenta y toma el rol y el estado actuales (cambios de rol y desactivaciones con efecto inmediato). `JWT_SECRET` es obligatorio en producción; en desarrollo se genera uno aleatorio por proceso con una advertencia.

- *Alternativa descartada:* confiar en el rol firmado en el token. Mantendría permisos obsoletos hasta que el token expire.

### D5. Contrato de errores

Formato `{ "error": { "code", "message", "details"? } }`. Criterio: **400** = la petición está mal formada; **409** = choca con el estado actual de otro recurso; **422** = está bien formada pero viola una regla de negocio.

| HTTP | Códigos |
| :--- | :--- |
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN`, `ACCOUNT_INACTIVE` |
| 404 | `USER_NOT_FOUND`, `SPACE_NOT_FOUND`, `RESERVATION_NOT_FOUND`, `ROUTE_NOT_FOUND` |
| 409 | `EMAIL_ALREADY_REGISTERED`, `SPACE_NAME_TAKEN`, `DUPLICATE_REQUEST`, `SPACE_NOT_AVAILABLE`, `USER_SCHEDULE_CONFLICT`, `INVALID_STATUS_TRANSITION`, `SELF_MODIFICATION_NOT_ALLOWED` |
| 422 | `INVALID_TIME_RANGE`, `START_IN_PAST`, `INVALID_SLOT_GRANULARITY`, `SPACE_INACTIVE`, `CAPACITY_EXCEEDED`, `RESERVATION_EXPIRED`, `RESERVATION_ALREADY_STARTED` |
| 500 | `INTERNAL_ERROR` (sin detalles internos) |

### D6. Orden de validación al crear una solicitud

1. Forma de la petición (400).
2. `INVALID_TIME_RANGE` → `START_IN_PAST` → `INVALID_SLOT_GRANULARITY`.
3. `SPACE_NOT_FOUND` → `SPACE_INACTIVE` → `CAPACITY_EXCEEDED`.
4. Dentro de la sección crítica: `DUPLICATE_REQUEST` → `SPACE_NOT_AVAILABLE` → `USER_SCHEDULE_CONFLICT` → registro.

Las validaciones baratas y sin estado van primero; las que dependen de otras reservas se ejecutan dentro del bloqueo para que el resultado no cambie antes de escribir.

### D7. Concurrencia: mutex por clave con adquisición ordenada

`KeyedMutex.runExclusive(keys, fn)` serializa las operaciones que comparten alguna clave. Crear una solicitud bloquea `space:<id>` y `user:<id>`; aprobar bloquea `space:<id>`. Las claves se adquieren en orden lexicográfico para evitar interbloqueos.

- *Alternativa descartada:* confiar en que el event loop no intercale las operaciones. Deja de ser cierto en cuanto el repositorio haga E/S real. Las pruebas usan un repositorio con latencia artificial para demostrar que sin el mutex se producen dobles reservas.
- *Alternativa descartada:* bloqueo optimista por versión. No expresa "intervalo libre" y requiere reintentos.
- *Límite:* solo es válido en un proceso. En producción, la restricción de exclusión de PostgreSQL (plan §3.3) es la garantía final.

### D8. Máquina de estados centralizada

`src/domain/reservation-status.ts` define las transiciones permitidas (`PENDING → APPROVED | REJECTED | CANCELLED`, `APPROVED → CANCELLED`) y crea cada entrada del historial. Aprobación, rechazo y cancelación la usan; ningún servicio cambia `status` directamente. Así el historial no se puede omitir y las transiciones inválidas siempre responden 409.

### D9. Reloj inyectable

`Clock = () => Date`. Lo usan todas las reglas temporales (inicio en el pasado, expiración, cancelación tardía) y la firma y verificación de tokens. Las pruebas fijan la fecha en 2030-01-07T08:00:00Z y la avanzan cuando el escenario lo exige.

### D10. Repositorios que devuelven copias

Los adaptadores en memoria guardan y devuelven `structuredClone` de las entidades, de modo que ningún servicio modifique el estado sin pasar por `update`, igual que ocurriría con una base de datos.

### D11. Trazabilidad automatizada

Cada escenario tiene una prueba con el mismo nombre en `tests/<capacidad>*.test.ts`. `scripts/trace.ts` extrae los escenarios de `openspec/specs/` y de los cambios activos, los cruza con los títulos de las pruebas, genera `docs/TRAZABILIDAD.md` y termina con error si falta alguno.

## Risks / Trade-offs

- [El mutex no protege varios procesos] → Documentado; en producción, restricción de exclusión en la base de datos.
- [Una solicitud `PENDING` puede retener una franja indefinidamente] → El administrador la rechaza desde la bandeja; la expiración automática de pendientes queda como evolución.
- [Consultar la cuenta en cada petición añade una lectura] → Despreciable en memoria; en PostgreSQL es una búsqueda por clave primaria.
- [Bloques fijos de 30 minutos pueden no ajustarse a toda actividad] → Constante única (`SLOT_MINUTES`) fácil de cambiar mediante un nuevo cambio de OpenSpec.
- [Los datos se pierden al reiniciar] → Limitación aceptada en el plan (DT-04).

## Migration Plan

Se reemplaza `src/` de la iteración 1. No hay datos que migrar. Reversión: volver al commit `04ca2ef`.
