# Especificación delta: cancelacion-historial (M8 — Cancelación e historial de reservas)

## Purpose

Permitir liberar las reservas que ya no se necesitan y conservar un historial completo e inmutable de cada reserva, para consulta del solicitante y auditoría del administrador.

## ADDED Requirements

### Requirement: Cancelación por el solicitante
El sistema SHALL permitir al solicitante cancelar sus reservas `PENDIENTE` o `APROBADA` antes de su inicio, con motivo opcional; la reserva SHALL pasar a `CANCELADA` y liberar la franja. Cancelar una reserva ajena SHALL responder 403 `ACCESO_DENEGADO`; una ya iniciada, 422 `RESERVA_YA_INICIADA`; una en estado final, 409 `TRANSICION_ESTADO_INVALIDA`.

#### Scenario: Cancelar una reserva aprobada propia
- **DADO** un estudiante con una reserva APROBADA que inicia a las 2030-01-07T10:00:00Z
- **CUANDO** la cancela a las 2030-01-07T09:00:00Z
- **ENTONCES** el sistema responde 200 y la reserva queda CANCELADA

#### Scenario: La cancelación libera la franja
- **DADO** una reserva de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z cancelada por su solicitante
- **CUANDO** otro estudiante solicita "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **ENTONCES** el sistema responde 201

#### Scenario: Cancelar una reserva ajena
- **DADO** una reserva PENDIENTE de otro estudiante
- **CUANDO** un estudiante intenta cancelarla
- **ENTONCES** el sistema responde 403 con código `ACCESO_DENEGADO` y la reserva no cambia

#### Scenario: Cancelar una reserva ya iniciada
- **DADO** una reserva APROBADA que inició a las 2030-01-07T10:00:00Z
- **CUANDO** su solicitante intenta cancelarla a las 2030-01-07T10:30:00Z
- **ENTONCES** el sistema responde 422 con código `RESERVA_YA_INICIADA`

#### Scenario: Cancelar una reserva ya cancelada
- **DADO** una reserva CANCELADA
- **CUANDO** su solicitante intenta cancelarla de nuevo
- **ENTONCES** el sistema responde 409 con código `TRANSICION_ESTADO_INVALIDA`

### Requirement: Cancelación administrativa
El sistema SHALL permitir a un ADMINISTRADOR cancelar cualquier reserva `PENDIENTE` o `APROBADA` antes de su inicio, indicando un motivo obligatorio (5 a 500 caracteres).

#### Scenario: El administrador cancela con motivo
- **DADO** una reserva APROBADA de un estudiante
- **CUANDO** un administrador la cancela con el motivo "Evento institucional"
- **ENTONCES** el sistema responde 200, la reserva queda CANCELADA y el historial registra al administrador y el motivo

#### Scenario: El administrador cancela sin motivo
- **DADO** una reserva APROBADA de un estudiante
- **CUANDO** un administrador la cancela sin motivo
- **ENTONCES** el sistema responde 400 con código `DATOS_INVALIDOS` y la reserva sigue APROBADA

### Requirement: Registro inmutable de cambios de estado
Cada reserva SHALL conservar la lista ordenada de sus cambios de estado, incluida la creación; cada entrada registra el estado anterior, el nuevo, el autor, la fecha y el motivo si existe. Las entradas MUST NOT modificarse ni eliminarse.

#### Scenario: Historial de una reserva aprobada y cancelada
- **DADO** una solicitud creada por un estudiante, aprobada por un administrador y cancelada por el estudiante con el motivo "Cambio de fecha"
- **CUANDO** el estudiante consulta el detalle de la reserva
- **ENTONCES** el historial tiene tres entradas en orden: creación como PENDIENTE por el estudiante, PENDIENTE → APROBADA por el administrador y APROBADA → CANCELADA por el estudiante con el motivo

### Requirement: Historial del solicitante
El sistema SHALL permitir a un solicitante listar todas sus reservas en cualquier estado, ordenadas por inicio de la más reciente a la más antigua y con filtro opcional por estado, y consultar el detalle de una reserva propia. El detalle de una reserva ajena SHALL responder 403 `ACCESO_DENEGADO`; una inexistente, 404 `RESERVA_NO_ENCONTRADA`.

#### Scenario: El historial incluye todos los estados
- **DADO** un estudiante con una reserva PENDIENTE, una APROBADA, una RECHAZADA y una CANCELADA, y otro estudiante con una reserva
- **CUANDO** el primer estudiante lista sus reservas
- **ENTONCES** el sistema responde 200 con sus cuatro reservas ordenadas por inicio descendente y sin reservas del otro estudiante

#### Scenario: Filtrar el historial por estado
- **DADO** un estudiante con reservas en varios estados
- **CUANDO** lista sus reservas con el estado CANCELADA
- **ENTONCES** el sistema responde 200 con únicamente las canceladas

#### Scenario: Consultar el detalle de una reserva ajena
- **DADO** una reserva de otro estudiante
- **CUANDO** un estudiante consulta su detalle
- **ENTONCES** el sistema responde 403 con código `ACCESO_DENEGADO`

### Requirement: Consulta administrativa del historial
El sistema SHALL permitir a un ADMINISTRADOR listar todas las reservas con filtros combinables por estado, espacio, usuario y rango de fechas (reservas que se solapan con `[desde, hasta)`), y consultar el detalle de cualquier reserva.

#### Scenario: Filtrar por espacio y estado
- **DADO** reservas APROBADA y CANCELADA de "Lab 1" y una APROBADA de "Lab 2"
- **CUANDO** un administrador lista las reservas de "Lab 1" con estado APROBADA
- **ENTONCES** el sistema responde 200 con únicamente las reservas APROBADA de "Lab 1"

#### Scenario: Filtrar por rango de fechas
- **DADO** una reserva el 2030-01-07 y otra el 2030-01-09
- **CUANDO** un administrador lista las reservas de 2030-01-09T00:00:00Z a 2030-01-10T00:00:00Z
- **ENTONCES** el sistema responde 200 con únicamente la reserva del 2030-01-09
