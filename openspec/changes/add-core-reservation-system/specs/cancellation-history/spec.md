# Spec Delta: cancellation-history (M8 — Cancelación e historial de reservas)

## Purpose

Permitir liberar las reservas que ya no se necesitan y conservar un historial completo e inmutable de cada reserva, para consulta del solicitante y auditoría del administrador.

## ADDED Requirements

### Requirement: Cancelación por el solicitante
El sistema SHALL permitir al solicitante cancelar sus reservas `PENDING` o `APPROVED` antes de su inicio, con motivo opcional; la reserva SHALL pasar a `CANCELLED` y liberar la franja. Cancelar una reserva ajena SHALL responder 403 `FORBIDDEN`; una ya iniciada, 422 `RESERVATION_ALREADY_STARTED`; una en estado final, 409 `INVALID_STATUS_TRANSITION`.

#### Scenario: Cancelar una reserva aprobada propia
- **GIVEN** un estudiante con una reserva APPROVED que inicia a las 2030-01-07T10:00:00Z
- **WHEN** la cancela a las 2030-01-07T09:00:00Z
- **THEN** el sistema responde 200 y la reserva queda CANCELLED

#### Scenario: La cancelación libera la franja
- **GIVEN** una reserva de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z cancelada por su solicitante
- **WHEN** otro estudiante solicita "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **THEN** el sistema responde 201

#### Scenario: Cancelar una reserva ajena
- **GIVEN** una reserva PENDING de otro estudiante
- **WHEN** un estudiante intenta cancelarla
- **THEN** el sistema responde 403 con código `FORBIDDEN` y la reserva no cambia

#### Scenario: Cancelar una reserva ya iniciada
- **GIVEN** una reserva APPROVED que inició a las 2030-01-07T10:00:00Z
- **WHEN** su solicitante intenta cancelarla a las 2030-01-07T10:30:00Z
- **THEN** el sistema responde 422 con código `RESERVATION_ALREADY_STARTED`

#### Scenario: Cancelar una reserva ya cancelada
- **GIVEN** una reserva CANCELLED
- **WHEN** su solicitante intenta cancelarla de nuevo
- **THEN** el sistema responde 409 con código `INVALID_STATUS_TRANSITION`

### Requirement: Cancelación administrativa
El sistema SHALL permitir a un ADMINISTRATOR cancelar cualquier reserva `PENDING` o `APPROVED` antes de su inicio, indicando un motivo obligatorio (5 a 500 caracteres).

#### Scenario: El administrador cancela con motivo
- **GIVEN** una reserva APPROVED de un estudiante
- **WHEN** un administrador la cancela con el motivo "Evento institucional"
- **THEN** el sistema responde 200, la reserva queda CANCELLED y el historial registra al administrador y el motivo

#### Scenario: El administrador cancela sin motivo
- **GIVEN** una reserva APPROVED de un estudiante
- **WHEN** un administrador la cancela sin motivo
- **THEN** el sistema responde 400 con código `VALIDATION_ERROR` y la reserva sigue APPROVED

### Requirement: Registro inmutable de cambios de estado
Cada reserva SHALL conservar la lista ordenada de sus cambios de estado, incluida la creación; cada entrada registra el estado anterior, el nuevo, el autor, la fecha y el motivo si existe. Las entradas MUST NOT modificarse ni eliminarse.

#### Scenario: Historial de una reserva aprobada y cancelada
- **GIVEN** una solicitud creada por un estudiante, aprobada por un administrador y cancelada por el estudiante con el motivo "Cambio de fecha"
- **WHEN** el estudiante consulta el detalle de la reserva
- **THEN** el historial tiene tres entradas en orden: creación como PENDING por el estudiante, PENDING → APPROVED por el administrador y APPROVED → CANCELLED por el estudiante con el motivo

### Requirement: Historial del solicitante
El sistema SHALL permitir a un solicitante listar todas sus reservas en cualquier estado, ordenadas por inicio de la más reciente a la más antigua y con filtro opcional por estado, y consultar el detalle de una reserva propia. El detalle de una reserva ajena SHALL responder 403 `FORBIDDEN`; una inexistente, 404 `RESERVATION_NOT_FOUND`.

#### Scenario: El historial incluye todos los estados
- **GIVEN** un estudiante con una reserva PENDING, una APPROVED, una REJECTED y una CANCELLED, y otro estudiante con una reserva
- **WHEN** el primer estudiante lista sus reservas
- **THEN** el sistema responde 200 con sus cuatro reservas ordenadas por inicio descendente y sin reservas del otro estudiante

#### Scenario: Filtrar el historial por estado
- **GIVEN** un estudiante con reservas en varios estados
- **WHEN** lista sus reservas con el estado CANCELLED
- **THEN** el sistema responde 200 con únicamente las canceladas

#### Scenario: Consultar el detalle de una reserva ajena
- **GIVEN** una reserva de otro estudiante
- **WHEN** un estudiante consulta su detalle
- **THEN** el sistema responde 403 con código `FORBIDDEN`

### Requirement: Consulta administrativa del historial
El sistema SHALL permitir a un ADMINISTRATOR listar todas las reservas con filtros combinables por estado, espacio, usuario y rango de fechas (reservas que se solapan con `[from, to)`), y consultar el detalle de cualquier reserva.

#### Scenario: Filtrar por espacio y estado
- **GIVEN** reservas APPROVED y CANCELLED de "Lab 1" y una APPROVED de "Lab 2"
- **WHEN** un administrador lista las reservas de "Lab 1" con estado APPROVED
- **THEN** el sistema responde 200 con únicamente las reservas APPROVED de "Lab 1"

#### Scenario: Filtrar por rango de fechas
- **GIVEN** una reserva el 2030-01-07 y otra el 2030-01-09
- **WHEN** un administrador lista las reservas de 2030-01-09T00:00:00Z a 2030-01-10T00:00:00Z
- **THEN** el sistema responde 200 con únicamente la reserva del 2030-01-09
