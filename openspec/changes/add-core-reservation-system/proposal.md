# Proposal: Sistema central de reservas de espacios académicos

## Why

Las reservas por correo y hoja de cálculo generan solicitudes duplicadas, dobles asignaciones y ninguna trazabilidad (PLAN_INGENIERIA.md §1.1). La iteración 1 del proyecto no resolvió el problema: solo las reservas aprobadas bloqueaban la franja (dos pendientes solapadas podían aprobarse ambas), cualquiera podía autorregistrarse como administrador y faltaban rechazo, cancelación, historial y administración de usuarios. Este cambio especifica de forma verificable los 8 módulos mínimos exigidos por la institución.

## What Changes

- Catálogo de espacios administrable, con nombres únicos, desactivación sin borrado y filtros de consulta.
- Registro, autenticación, perfil y administración de cuentas de usuario.
- Tres roles con una matriz de permisos explícita, autenticación obligatoria, asignación de roles y administrador inicial.
- Creación de solicitudes de reserva con validación de fechas (ISO-8601 con zona, bloques de 30 minutos), espacio y capacidad.
- Definición formal de disponibilidad, consulta de ocupación y búsqueda de espacios libres.
- Prevención de reservas simultáneas por espacio y por usuario, detección de duplicados y garantía ante solicitudes concurrentes.
- Bandeja de pendientes, aprobación y rechazo con motivo y transiciones de estado válidas.
- Cancelación por el solicitante o el administrador, registro inmutable de cambios de estado e historial consultable.
- **BREAKING** respecto a la iteración 1: rutas, nombres de estados (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), roles (`STUDENT`, `PROFESSOR`, `ADMINISTRATOR`) y formato de error `{ error: { code, message } }`. No hay datos que migrar (persistencia en memoria).

## Capabilities

### New Capabilities

- `space-management`: alta, edición, activación/desactivación y consulta del catálogo de espacios (M1).
- `user-management`: registro, autenticación, perfil propio y administración de cuentas (M2).
- `roles-permissions`: roles, permisos por rol, autenticación obligatoria, asignación de roles y administrador inicial (M3).
- `reservation-requests`: creación y validación de solicitudes de reserva (M4).
- `availability`: definición de disponibilidad, consulta de ocupación y búsqueda de espacios libres (M5).
- `conflict-prevention`: exclusividad por espacio y por usuario, duplicados y concurrencia (M6).
- `reservation-approval`: bandeja de pendientes, aprobación, rechazo y transiciones válidas (M7).
- `cancellation-history`: cancelación, registro de cambios de estado e historial (M8).

### Modified Capabilities

Ninguna: `openspec/specs/` está vacío. Las especificaciones de la iteración 1 no seguían el formato de OpenSpec y se sustituyen por estas.

## Impact

- **Código:** reemplaza `src/` de la iteración 1 por la estructura modular del plan (`src/modules/<capacidad>/`).
- **API:** nuevas rutas bajo `/auth`, `/users`, `/spaces` y `/reservations` (ver `design.md`).
- **Dependencias:** se retiran `pg`, `uuid`, `ts-node` y `nodemon`; se agregan Vitest, Supertest y tsx.
- **Pruebas:** el script manual `tests/system_test.ts` se reemplaza por una suite automatizada con un archivo por capacidad.
