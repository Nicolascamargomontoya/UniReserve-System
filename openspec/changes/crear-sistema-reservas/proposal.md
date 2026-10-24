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
- **BREAKING** respecto a la iteración 1: rutas, nombres de estados (`PENDIENTE`, `APROBADA`, `RECHAZADA`, `CANCELADA`), roles (`ESTUDIANTE`, `PROFESOR`, `ADMINISTRADOR`) y formato de error `{ error: { codigo, mensaje } }`. No hay datos que migrar (persistencia en memoria).

## Capabilities

### New Capabilities

- `gestion-espacios`: alta, edición, activación/desactivación y consulta del catálogo de espacios (M1).
- `gestion-usuarios`: registro, autenticación, perfil propio y administración de cuentas (M2).
- `roles-permisos`: roles, permisos por rol, autenticación obligatoria, asignación de roles y administrador inicial (M3).
- `solicitudes-reserva`: creación y validación de solicitudes de reserva (M4).
- `disponibilidad`: definición de disponibilidad, consulta de ocupación y búsqueda de espacios libres (M5).
- `prevencion-conflictos`: exclusividad por espacio y por usuario, duplicados y concurrencia (M6).
- `aprobacion-reservas`: bandeja de pendientes, aprobación, rechazo y transiciones válidas (M7).
- `cancelacion-historial`: cancelación, registro de cambios de estado e historial (M8).

### Modified Capabilities

Ninguna: `openspec/specs/` está vacío. Las especificaciones de la iteración 1 no seguían el formato de OpenSpec y se sustituyen por estas.

## Impact

- **Código:** reemplaza `src/` de la iteración 1 por la estructura modular del plan (`src/modulos/<capacidad>/`).
- **API:** nuevas rutas bajo `/auth`, `/usuarios`, `/espacios` y `/reservas` (ver `design.md`).
- **Dependencias:** se retiran `pg`, `uuid`, `ts-node` y `nodemon`; se agregan Vitest, Supertest y tsx.
- **Pruebas:** el script manual `tests/system_test.ts` se reemplaza por una suite automatizada en `pruebas/` con un archivo por capacidad.
