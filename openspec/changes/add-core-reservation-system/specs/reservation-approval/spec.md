# Spec Delta: reservation-approval (M7 — Aprobación y rechazo de solicitudes)

## Purpose

Dar al administrador un mecanismo formal y auditable para decidir sobre las solicitudes pendientes, aprobándolas o rechazándolas con motivo.

## ADDED Requirements

### Requirement: Bandeja de solicitudes pendientes
El sistema SHALL permitir a un ADMINISTRATOR listar las solicitudes `PENDING` en orden de llegada (la más antigua primero), incluyendo el nombre del espacio y el nombre y correo del solicitante.

#### Scenario: Pendientes en orden de llegada
- **GIVEN** una solicitud PENDING creada a las 2030-01-07T08:00:00Z, otra creada a las 2030-01-07T08:05:00Z y una reserva APPROVED
- **WHEN** un administrador consulta la bandeja de pendientes
- **THEN** el sistema responde 200 con las dos pendientes, primero la de las 08:00, cada una con el espacio y el solicitante

### Requirement: Aprobación de solicitudes
El sistema SHALL permitir a un ADMINISTRATOR aprobar una solicitud `PENDING` cuyo inicio aún no ha llegado y cuyo espacio está activo; la solicitud SHALL pasar a `APPROVED` y registrar quién y cuándo la aprobó. Si el inicio ya llegó SHALL responder 422 `RESERVATION_EXPIRED`; si el espacio está inactivo, 422 `SPACE_INACTIVE`.

#### Scenario: Aprobar una solicitud pendiente
- **GIVEN** una solicitud PENDING de "Lab 1" con inicio 2030-01-07T10:00:00Z
- **WHEN** un administrador la aprueba a las 2030-01-07T08:30:00Z
- **THEN** el sistema responde 200, la reserva queda APPROVED y su historial registra el cambio PENDING → APPROVED hecho por ese administrador

#### Scenario: Aprobar una solicitud cuyo inicio ya pasó
- **GIVEN** una solicitud PENDING con inicio 2030-01-07T10:00:00Z
- **WHEN** un administrador intenta aprobarla a las 2030-01-07T10:30:00Z
- **THEN** el sistema responde 422 con código `RESERVATION_EXPIRED` y la solicitud sigue PENDING

#### Scenario: Aprobar una solicitud de un espacio desactivado
- **GIVEN** una solicitud PENDING de "Lab 1" y "Lab 1" desactivado después de crearla
- **WHEN** un administrador intenta aprobarla
- **THEN** el sistema responde 422 con código `SPACE_INACTIVE` y la solicitud sigue PENDING

### Requirement: Rechazo con motivo
El sistema SHALL permitir a un ADMINISTRATOR rechazar una solicitud `PENDING` indicando un motivo obligatorio (5 a 500 caracteres). La solicitud SHALL pasar a `REJECTED`, el motivo SHALL quedar visible para el solicitante y la franja SHALL liberarse.

#### Scenario: Rechazar con motivo
- **GIVEN** una solicitud PENDING
- **WHEN** un administrador la rechaza con el motivo "Mantenimiento programado"
- **THEN** el sistema responde 200, la reserva queda REJECTED y el solicitante ve el motivo en el detalle de la reserva

#### Scenario: Rechazar sin motivo
- **GIVEN** una solicitud PENDING
- **WHEN** un administrador la rechaza sin motivo
- **THEN** el sistema responde 400 con código `VALIDATION_ERROR` y la solicitud sigue PENDING

#### Scenario: El rechazo libera la franja
- **GIVEN** una solicitud PENDING de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z rechazada por un administrador
- **WHEN** otro estudiante solicita "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **THEN** el sistema responde 201

### Requirement: Transiciones de decisión válidas
Solo las solicitudes `PENDING` SHALL poder aprobarse o rechazarse. Sobre cualquier otro estado el sistema MUST responder 409 `INVALID_STATUS_TRANSITION` sin cambiar la reserva. Un identificador inexistente SHALL responder 404 `RESERVATION_NOT_FOUND`.

#### Scenario: Aprobar una solicitud ya rechazada
- **GIVEN** una reserva REJECTED
- **WHEN** un administrador intenta aprobarla
- **THEN** el sistema responde 409 con código `INVALID_STATUS_TRANSITION` y la reserva sigue REJECTED

#### Scenario: Rechazar una reserva aprobada
- **GIVEN** una reserva APPROVED
- **WHEN** un administrador intenta rechazarla
- **THEN** el sistema responde 409 con código `INVALID_STATUS_TRANSITION` y la reserva sigue APPROVED

#### Scenario: Decidir sobre una reserva inexistente
- **WHEN** un administrador aprueba una reserva con un identificador que no existe
- **THEN** el sistema responde 404 con código `RESERVATION_NOT_FOUND`
