# aprobacion-reservas Specification

## Purpose
Dar al administrador un mecanismo formal y auditable para decidir sobre las solicitudes pendientes, aprobándolas o rechazándolas con motivo.

## Requirements

### Requirement: Bandeja de solicitudes pendientes
El sistema SHALL permitir a un ADMINISTRADOR listar las solicitudes `PENDIENTE` en orden de llegada (la más antigua primero), incluyendo el nombre del espacio y el nombre y correo del solicitante.

#### Scenario: Pendientes en orden de llegada
- **DADO** una solicitud PENDIENTE creada a las 2030-01-07T08:00:00Z, otra creada a las 2030-01-07T08:05:00Z y una reserva APROBADA
- **CUANDO** un administrador consulta la bandeja de pendientes
- **ENTONCES** el sistema responde 200 con las dos pendientes, primero la de las 08:00, cada una con el espacio y el solicitante

### Requirement: Aprobación de solicitudes
El sistema SHALL permitir a un ADMINISTRADOR aprobar una solicitud `PENDIENTE` cuyo inicio aún no ha llegado y cuyo espacio está activo; la solicitud SHALL pasar a `APROBADA` y registrar quién y cuándo la aprobó. Si el inicio ya llegó SHALL responder 422 `SOLICITUD_VENCIDA`; si el espacio está inactivo, 422 `ESPACIO_INACTIVO`.

#### Scenario: Aprobar una solicitud pendiente
- **DADO** una solicitud PENDIENTE de "Lab 1" con inicio 2030-01-07T10:00:00Z
- **CUANDO** un administrador la aprueba a las 2030-01-07T08:30:00Z
- **ENTONCES** el sistema responde 200, la reserva queda APROBADA y su historial registra el cambio PENDIENTE → APROBADA hecho por ese administrador

#### Scenario: Aprobar una solicitud cuyo inicio ya pasó
- **DADO** una solicitud PENDIENTE con inicio 2030-01-07T10:00:00Z
- **CUANDO** un administrador intenta aprobarla a las 2030-01-07T10:30:00Z
- **ENTONCES** el sistema responde 422 con código `SOLICITUD_VENCIDA` y la solicitud sigue PENDIENTE

#### Scenario: Aprobar una solicitud de un espacio desactivado
- **DADO** una solicitud PENDIENTE de "Lab 1" y "Lab 1" desactivado después de crearla
- **CUANDO** un administrador intenta aprobarla
- **ENTONCES** el sistema responde 422 con código `ESPACIO_INACTIVO` y la solicitud sigue PENDIENTE

### Requirement: Rechazo con motivo
El sistema SHALL permitir a un ADMINISTRADOR rechazar una solicitud `PENDIENTE` indicando un motivo obligatorio (5 a 500 caracteres). La solicitud SHALL pasar a `RECHAZADA`, el motivo SHALL quedar visible para el solicitante y la franja SHALL liberarse.

#### Scenario: Rechazar con motivo
- **DADO** una solicitud PENDIENTE
- **CUANDO** un administrador la rechaza con el motivo "Mantenimiento programado"
- **ENTONCES** el sistema responde 200, la reserva queda RECHAZADA y el solicitante ve el motivo en el detalle de la reserva

#### Scenario: Rechazar sin motivo
- **DADO** una solicitud PENDIENTE
- **CUANDO** un administrador la rechaza sin motivo
- **ENTONCES** el sistema responde 400 con código `DATOS_INVALIDOS` y la solicitud sigue PENDIENTE

#### Scenario: El rechazo libera la franja
- **DADO** una solicitud PENDIENTE de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z rechazada por un administrador
- **CUANDO** otro estudiante solicita "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **ENTONCES** el sistema responde 201

### Requirement: Transiciones de decisión válidas
Solo las solicitudes `PENDIENTE` SHALL poder aprobarse o rechazarse. Sobre cualquier otro estado el sistema MUST responder 409 `TRANSICION_ESTADO_INVALIDA` sin cambiar la reserva. Un identificador inexistente SHALL responder 404 `RESERVA_NO_ENCONTRADA`.

#### Scenario: Aprobar una solicitud ya rechazada
- **DADO** una reserva RECHAZADA
- **CUANDO** un administrador intenta aprobarla
- **ENTONCES** el sistema responde 409 con código `TRANSICION_ESTADO_INVALIDA` y la reserva sigue RECHAZADA

#### Scenario: Rechazar una reserva aprobada
- **DADO** una reserva APROBADA
- **CUANDO** un administrador intenta rechazarla
- **ENTONCES** el sistema responde 409 con código `TRANSICION_ESTADO_INVALIDA` y la reserva sigue APROBADA

#### Scenario: Decidir sobre una reserva inexistente
- **CUANDO** un administrador aprueba una reserva con un identificador que no existe
- **ENTONCES** el sistema responde 404 con código `RESERVA_NO_ENCONTRADA`
