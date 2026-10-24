# Especificación delta: solicitudes-reserva (CR-01 — Límite de cuatro horas consecutivas)

## ADDED Requirements

### Requirement: Límite de cuatro horas consecutivas
El sistema MUST rechazar con 422 `LIMITE_HORAS_CONSECUTIVAS` toda solicitud que, sola o unida a reservas activas (`PENDIENTE` o `APROBADA`) contiguas del mismo usuario en el mismo espacio, forme un bloque continuo de más de cuatro horas. Dos reservas son contiguas si una termina exactamente cuando empieza la otra. Un bloque de exactamente cuatro horas SHALL aceptarse.

#### Scenario: Reserva de exactamente cuatro horas
- **DADO** la fecha actual 2030-01-07T08:00:00Z y el espacio libre "Lab 1"
- **CUANDO** un estudiante solicita "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T14:00:00Z
- **ENTONCES** el sistema responde 201

#### Scenario: Reserva individual de más de cuatro horas
- **CUANDO** un estudiante solicita "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T14:30:00Z
- **ENTONCES** el sistema responde 422 con código `LIMITE_HORAS_CONSECUTIVAS`

#### Scenario: Encadenar después de una reserva propia
- **DADO** un estudiante con una solicitud PENDIENTE de "Lab 1" de 2030-01-07T09:00:00Z a 2030-01-07T12:00:00Z
- **CUANDO** el mismo estudiante solicita "Lab 1" de 2030-01-07T12:00:00Z a 2030-01-07T14:00:00Z
- **ENTONCES** el sistema responde 422 con código `LIMITE_HORAS_CONSECUTIVAS`, porque el bloque continuo sería de 09:00 a 14:00 (5 horas)

#### Scenario: Encadenar antes de una reserva propia
- **DADO** un estudiante con una reserva APROBADA de "Lab 1" de 2030-01-07T12:00:00Z a 2030-01-07T14:00:00Z
- **CUANDO** el mismo estudiante solicita "Lab 1" de 2030-01-07T09:00:00Z a 2030-01-07T12:00:00Z
- **ENTONCES** el sistema responde 422 con código `LIMITE_HORAS_CONSECUTIVAS`

#### Scenario: Completar el hueco entre dos reservas propias
- **DADO** un estudiante con reservas activas de "Lab 1" de 2030-01-07T09:00:00Z a 2030-01-07T11:00:00Z y de 2030-01-07T12:00:00Z a 2030-01-07T14:00:00Z
- **CUANDO** el mismo estudiante solicita "Lab 1" de 2030-01-07T11:00:00Z a 2030-01-07T12:00:00Z
- **ENTONCES** el sistema responde 422 con código `LIMITE_HORAS_CONSECUTIVAS`, porque el bloque continuo sería de 09:00 a 14:00

#### Scenario: Cadena de exactamente cuatro horas
- **DADO** un estudiante con una solicitud PENDIENTE de "Lab 1" de 2030-01-07T09:00:00Z a 2030-01-07T11:00:00Z
- **CUANDO** el mismo estudiante solicita "Lab 1" de 2030-01-07T11:00:00Z a 2030-01-07T13:00:00Z
- **ENTONCES** el sistema responde 201

#### Scenario: Una pausa de 30 minutos corta la cadena
- **DADO** un estudiante con una solicitud PENDIENTE de "Lab 1" de 2030-01-07T09:00:00Z a 2030-01-07T13:00:00Z
- **CUANDO** el mismo estudiante solicita "Lab 1" de 2030-01-07T13:30:00Z a 2030-01-07T15:00:00Z
- **ENTONCES** el sistema responde 201

#### Scenario: Otro espacio no se encadena
- **DADO** un estudiante con una solicitud PENDIENTE de "Lab 1" de 2030-01-07T09:00:00Z a 2030-01-07T13:00:00Z
- **CUANDO** el mismo estudiante solicita "Lab 2" de 2030-01-07T13:00:00Z a 2030-01-07T15:00:00Z
- **ENTONCES** el sistema responde 201

#### Scenario: Las reservas canceladas o rechazadas no cuentan
- **DADO** un estudiante con una reserva CANCELADA y otra RECHAZADA de "Lab 1" de 2030-01-07T09:00:00Z a 2030-01-07T13:00:00Z
- **CUANDO** el mismo estudiante solicita "Lab 1" de 2030-01-07T13:00:00Z a 2030-01-07T15:00:00Z
- **ENTONCES** el sistema responde 201

#### Scenario: Las reservas de otro usuario no se encadenan
- **DADO** otro estudiante con una solicitud PENDIENTE de "Lab 1" de 2030-01-07T09:00:00Z a 2030-01-07T13:00:00Z
- **CUANDO** un estudiante solicita "Lab 1" de 2030-01-07T13:00:00Z a 2030-01-07T15:00:00Z
- **ENTONCES** el sistema responde 201
