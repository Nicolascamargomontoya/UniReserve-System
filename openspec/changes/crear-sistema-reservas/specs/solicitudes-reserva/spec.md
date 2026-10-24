# Especificación delta: solicitudes-reserva (M4 — Creación de solicitudes de reserva)

## Purpose

Recibir las solicitudes de reserva por un canal único y validar que cumplan las reglas de fecha, espacio y capacidad antes de registrarlas como pendientes.

## ADDED Requirements

### Requirement: Creación de solicitudes
El sistema SHALL permitir a un ESTUDIANTE o PROFESOR crear una solicitud con espacio, inicio, fin, propósito (5 a 200 caracteres) y número de asistentes (entero mayor o igual a 1). Si supera todas las validaciones, la solicitud SHALL registrarse con estado `PENDIENTE`, el solicitante y la fecha de creación, y responder 201. Los campos faltantes o mal formados SHALL responder 400 `DATOS_INVALIDOS`.

#### Scenario: Solicitud válida
- **DADO** la fecha actual 2030-01-07T08:00:00Z y el espacio activo "Lab 1" con capacidad 30 sin reservas
- **CUANDO** un estudiante solicita "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z para "Práctica de redes" con 25 asistentes
- **ENTONCES** el sistema responde 201 con la solicitud en estado PENDIENTE a nombre del estudiante

#### Scenario: Faltan datos obligatorios
- **CUANDO** un estudiante envía una solicitud sin propósito
- **ENTONCES** el sistema responde 400 con código `DATOS_INVALIDOS`

### Requirement: Formato de fechas con zona horaria
El inicio y el fin MUST expresarse en ISO-8601 con zona horaria explícita (`Z` o `±hh:mm`). Cualquier otro formato SHALL responder 400 `DATOS_INVALIDOS`.

#### Scenario: Fecha sin zona horaria
- **CUANDO** un estudiante envía el inicio "2030-01-07T10:00:00" sin zona horaria
- **ENTONCES** el sistema responde 400 con código `DATOS_INVALIDOS`

#### Scenario: Fecha con desplazamiento horario
- **DADO** la fecha actual 2030-01-07T08:00:00Z
- **CUANDO** un estudiante solicita de 2030-01-07T10:00:00-05:00 a 2030-01-07T11:00:00-05:00
- **ENTONCES** el sistema responde 201 y registra el inicio 2030-01-07T15:00:00.000Z

### Requirement: Intervalo de tiempo válido
El fin MUST ser posterior al inicio (si no, 422 `RANGO_HORARIO_INVALIDO`) y el inicio MUST ser posterior a la fecha actual (si no, 422 `INICIO_EN_PASADO`).

#### Scenario: Fin anterior o igual al inicio
- **CUANDO** un estudiante solicita de 2030-01-07T12:00:00Z a 2030-01-07T10:00:00Z
- **ENTONCES** el sistema responde 422 con código `RANGO_HORARIO_INVALIDO`

#### Scenario: Inicio en el pasado
- **DADO** la fecha actual 2030-01-07T08:00:00Z
- **CUANDO** un estudiante solicita de 2030-01-07T07:00:00Z a 2030-01-07T09:00:00Z
- **ENTONCES** el sistema responde 422 con código `INICIO_EN_PASADO`

### Requirement: Bloques de 30 minutos
El inicio y el fin MUST coincidir con un límite de bloque de 30 minutos (minuto 00 o 30, sin segundos). En caso contrario el sistema SHALL responder 422 `BLOQUE_HORARIO_INVALIDO`. La duración mínima resultante es de 30 minutos.

#### Scenario: Hora fuera de bloque
- **CUANDO** un estudiante solicita de 2030-01-07T10:15:00Z a 2030-01-07T11:00:00Z
- **ENTONCES** el sistema responde 422 con código `BLOQUE_HORARIO_INVALIDO`

#### Scenario: Bloque mínimo de 30 minutos
- **CUANDO** un estudiante solicita de 2030-01-07T10:30:00Z a 2030-01-07T11:00:00Z
- **ENTONCES** el sistema responde 201

### Requirement: Espacio válido y capacidad
El espacio solicitado MUST existir (404 `ESPACIO_NO_ENCONTRADO`) y estar activo (422 `ESPACIO_INACTIVO`), y el número de asistentes MUST NOT superar su capacidad (422 `CAPACIDAD_EXCEDIDA`).

#### Scenario: Espacio inexistente
- **CUANDO** un estudiante solicita un espacio con un identificador que no existe
- **ENTONCES** el sistema responde 404 con código `ESPACIO_NO_ENCONTRADO`

#### Scenario: Espacio inactivo
- **DADO** el espacio inactivo "Sala Antigua"
- **CUANDO** un estudiante lo solicita
- **ENTONCES** el sistema responde 422 con código `ESPACIO_INACTIVO`

#### Scenario: Asistentes por encima de la capacidad
- **DADO** el espacio "Lab 1" con capacidad 30
- **CUANDO** un estudiante lo solicita para 31 asistentes
- **ENTONCES** el sistema responde 422 con código `CAPACIDAD_EXCEDIDA`
