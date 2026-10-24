# Spec Delta: availability (M5 — Validación de disponibilidad)

## Purpose

Definir de forma única cuándo un espacio está disponible, rechazar solicitudes que ocupen franjas tomadas y permitir consultar la ocupación y los espacios libres antes de solicitar.

## ADDED Requirements

### Requirement: Definición de disponibilidad
Un espacio SHALL considerarse disponible en un intervalo `[inicio, fin)` si está activo y ninguna de sus reservas activas (`PENDING` o `APPROVED`) se solapa con ese intervalo. Dos intervalos `[a, b)` y `[c, d)` se solapan si y solo si `a < d` y `c < b`; por tanto, los intervalos contiguos no se solapan.

#### Scenario: Reserva contigua permitida
- **GIVEN** una reserva APPROVED de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **WHEN** otro estudiante solicita "Lab 1" de 2030-01-07T12:00:00Z a 2030-01-07T14:00:00Z
- **THEN** el sistema responde 201

#### Scenario: Las reservas rechazadas o canceladas no ocupan la franja
- **GIVEN** una reserva CANCELLED y otra REJECTED de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **WHEN** un estudiante solicita "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **THEN** el sistema responde 201

### Requirement: Validación de disponibilidad al solicitar
El sistema MUST rechazar con 409 `SPACE_NOT_AVAILABLE` toda solicitud que se solape con una reserva activa del mismo espacio, sea `PENDING` o `APPROVED`. La respuesta SHALL incluir los intervalos en conflicto (inicio, fin y estado).

#### Scenario: Solapamiento con una reserva aprobada
- **GIVEN** una reserva APPROVED de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **WHEN** otro estudiante solicita "Lab 1" de 2030-01-07T11:00:00Z a 2030-01-07T13:00:00Z
- **THEN** el sistema responde 409 con código `SPACE_NOT_AVAILABLE` y el intervalo 10:00–12:00 APPROVED entre los conflictos

#### Scenario: Solapamiento con una solicitud pendiente
- **GIVEN** una solicitud PENDING de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **WHEN** otro estudiante solicita "Lab 1" de 2030-01-07T09:00:00Z a 2030-01-07T10:30:00Z
- **THEN** el sistema responde 409 con código `SPACE_NOT_AVAILABLE`

### Requirement: Consulta de ocupación de un espacio
El sistema SHALL permitir a cualquier usuario autenticado consultar los intervalos ocupados por reservas activas de un espacio entre `from` y `to` (con `from` anterior a `to` y un rango máximo de 31 días), ordenados por inicio. A los solicitantes MUST NOT mostrárseles quién hizo cada reserva. Un espacio inexistente SHALL responder 404 `SPACE_NOT_FOUND`.

#### Scenario: Consultar la ocupación de un día
- **GIVEN** reservas activas de "Lab 1" de 14:00 a 16:00 y de 10:00 a 12:00 del 2030-01-07 (UTC), y una CANCELLED de 12:00 a 13:00
- **WHEN** un estudiante consulta la ocupación de "Lab 1" de 2030-01-07T00:00:00Z a 2030-01-08T00:00:00Z
- **THEN** el sistema responde 200 con los intervalos 10:00–12:00 y 14:00–16:00 en ese orden

#### Scenario: Los solicitantes no ven quién reservó
- **GIVEN** una reserva activa de "Lab 1" hecha por otro usuario
- **WHEN** un estudiante consulta la ocupación de "Lab 1"
- **THEN** los intervalos no incluyen el identificador del solicitante

#### Scenario: Rango de consulta invertido
- **WHEN** un estudiante consulta la ocupación con `from` 2030-01-08T00:00:00Z y `to` 2030-01-07T00:00:00Z
- **THEN** el sistema responde 422 con código `INVALID_TIME_RANGE`

#### Scenario: Rango de consulta demasiado amplio
- **WHEN** un estudiante consulta la ocupación de 2030-01-01T00:00:00Z a 2030-02-02T00:00:00Z
- **THEN** el sistema responde 400 con código `VALIDATION_ERROR`

### Requirement: Búsqueda de espacios disponibles
El sistema SHALL permitir a cualquier usuario autenticado buscar los espacios activos disponibles durante todo un intervalo, con filtros opcionales por tipo y capacidad mínima.

#### Scenario: Buscar espacios libres en una franja
- **GIVEN** los espacios activos "Lab 1" y "Lab 2" y una reserva APPROVED de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **WHEN** un profesor busca espacios disponibles de 2030-01-07T11:00:00Z a 2030-01-07T12:00:00Z
- **THEN** el sistema responde 200 con "Lab 2" y sin "Lab 1"
