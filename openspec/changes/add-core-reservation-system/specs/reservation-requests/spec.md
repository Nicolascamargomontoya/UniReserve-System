# Spec Delta: reservation-requests (M4 — Creación de solicitudes de reserva)

## Purpose

Recibir las solicitudes de reserva por un canal único y validar que cumplan las reglas de fecha, espacio y capacidad antes de registrarlas como pendientes.

## ADDED Requirements

### Requirement: Creación de solicitudes
El sistema SHALL permitir a un STUDENT o PROFESSOR crear una solicitud con espacio, inicio, fin, propósito (5 a 200 caracteres) y número de asistentes (entero mayor o igual a 1). Si supera todas las validaciones, la solicitud SHALL registrarse con estado `PENDING`, el solicitante y la fecha de creación, y responder 201. Los campos faltantes o mal formados SHALL responder 400 `VALIDATION_ERROR`.

#### Scenario: Solicitud válida
- **GIVEN** la fecha actual 2030-01-07T08:00:00Z y el espacio activo "Lab 1" con capacidad 30 sin reservas
- **WHEN** un estudiante solicita "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z para "Práctica de redes" con 25 asistentes
- **THEN** el sistema responde 201 con la solicitud en estado PENDING a nombre del estudiante

#### Scenario: Faltan datos obligatorios
- **WHEN** un estudiante envía una solicitud sin propósito
- **THEN** el sistema responde 400 con código `VALIDATION_ERROR`

### Requirement: Formato de fechas con zona horaria
El inicio y el fin MUST expresarse en ISO-8601 con zona horaria explícita (`Z` o `±hh:mm`). Cualquier otro formato SHALL responder 400 `VALIDATION_ERROR`.

#### Scenario: Fecha sin zona horaria
- **WHEN** un estudiante envía el inicio "2030-01-07T10:00:00" sin zona horaria
- **THEN** el sistema responde 400 con código `VALIDATION_ERROR`

#### Scenario: Fecha con desplazamiento horario
- **GIVEN** la fecha actual 2030-01-07T08:00:00Z
- **WHEN** un estudiante solicita de 2030-01-07T10:00:00-05:00 a 2030-01-07T11:00:00-05:00
- **THEN** el sistema responde 201 y registra el inicio 2030-01-07T15:00:00.000Z

### Requirement: Intervalo de tiempo válido
El fin MUST ser posterior al inicio (si no, 422 `INVALID_TIME_RANGE`) y el inicio MUST ser posterior a la fecha actual (si no, 422 `START_IN_PAST`).

#### Scenario: Fin anterior o igual al inicio
- **WHEN** un estudiante solicita de 2030-01-07T12:00:00Z a 2030-01-07T10:00:00Z
- **THEN** el sistema responde 422 con código `INVALID_TIME_RANGE`

#### Scenario: Inicio en el pasado
- **GIVEN** la fecha actual 2030-01-07T08:00:00Z
- **WHEN** un estudiante solicita de 2030-01-07T07:00:00Z a 2030-01-07T09:00:00Z
- **THEN** el sistema responde 422 con código `START_IN_PAST`

### Requirement: Bloques de 30 minutos
El inicio y el fin MUST coincidir con un límite de bloque de 30 minutos (minuto 00 o 30, sin segundos). En caso contrario el sistema SHALL responder 422 `INVALID_SLOT_GRANULARITY`. La duración mínima resultante es de 30 minutos.

#### Scenario: Hora fuera de bloque
- **WHEN** un estudiante solicita de 2030-01-07T10:15:00Z a 2030-01-07T11:00:00Z
- **THEN** el sistema responde 422 con código `INVALID_SLOT_GRANULARITY`

#### Scenario: Bloque mínimo de 30 minutos
- **WHEN** un estudiante solicita de 2030-01-07T10:30:00Z a 2030-01-07T11:00:00Z
- **THEN** el sistema responde 201

### Requirement: Espacio válido y capacidad
El espacio solicitado MUST existir (404 `SPACE_NOT_FOUND`) y estar activo (422 `SPACE_INACTIVE`), y el número de asistentes MUST NOT superar su capacidad (422 `CAPACITY_EXCEEDED`).

#### Scenario: Espacio inexistente
- **WHEN** un estudiante solicita un espacio con un identificador que no existe
- **THEN** el sistema responde 404 con código `SPACE_NOT_FOUND`

#### Scenario: Espacio inactivo
- **GIVEN** el espacio inactivo "Sala Antigua"
- **WHEN** un estudiante lo solicita
- **THEN** el sistema responde 422 con código `SPACE_INACTIVE`

#### Scenario: Asistentes por encima de la capacidad
- **GIVEN** el espacio "Lab 1" con capacidad 30
- **WHEN** un estudiante lo solicita para 31 asistentes
- **THEN** el sistema responde 422 con código `CAPACITY_EXCEEDED`
