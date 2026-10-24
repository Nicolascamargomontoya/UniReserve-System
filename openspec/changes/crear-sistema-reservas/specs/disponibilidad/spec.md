# Especificación delta: disponibilidad (M5 — Validación de disponibilidad)

## Purpose

Definir de forma única cuándo un espacio está disponible, rechazar solicitudes que ocupen franjas tomadas y permitir consultar la ocupación y los espacios libres antes de solicitar.

## ADDED Requirements

### Requirement: Definición de disponibilidad
Un espacio SHALL considerarse disponible en un intervalo `[inicio, fin)` si está activo y ninguna de sus reservas activas (`PENDIENTE` o `APROBADA`) se solapa con ese intervalo. Dos intervalos `[a, b)` y `[c, d)` se solapan si y solo si `a < d` y `c < b`; por tanto, los intervalos contiguos no se solapan.

#### Scenario: Reserva contigua permitida
- **DADO** una reserva APROBADA de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **CUANDO** otro estudiante solicita "Lab 1" de 2030-01-07T12:00:00Z a 2030-01-07T14:00:00Z
- **ENTONCES** el sistema responde 201

#### Scenario: Las reservas rechazadas o canceladas no ocupan la franja
- **DADO** una reserva CANCELADA y otra RECHAZADA de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **CUANDO** un estudiante solicita "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **ENTONCES** el sistema responde 201

### Requirement: Validación de disponibilidad al solicitar
El sistema MUST rechazar con 409 `ESPACIO_NO_DISPONIBLE` toda solicitud que se solape con una reserva activa del mismo espacio, sea `PENDIENTE` o `APROBADA`. La respuesta SHALL incluir los intervalos en conflicto (inicio, fin y estado).

#### Scenario: Solapamiento con una reserva aprobada
- **DADO** una reserva APROBADA de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **CUANDO** otro estudiante solicita "Lab 1" de 2030-01-07T11:00:00Z a 2030-01-07T13:00:00Z
- **ENTONCES** el sistema responde 409 con código `ESPACIO_NO_DISPONIBLE` y el intervalo 10:00–12:00 APROBADA entre los conflictos

#### Scenario: Solapamiento con una solicitud pendiente
- **DADO** una solicitud PENDIENTE de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **CUANDO** otro estudiante solicita "Lab 1" de 2030-01-07T09:00:00Z a 2030-01-07T10:30:00Z
- **ENTONCES** el sistema responde 409 con código `ESPACIO_NO_DISPONIBLE`

### Requirement: Consulta de ocupación de un espacio
El sistema SHALL permitir a cualquier usuario autenticado consultar, ordenados por inicio, los intervalos ocupados por reservas activas de un espacio entre `desde` y `hasta`. A los solicitantes MUST NOT mostrárseles quién hizo cada reserva. Un rango invertido SHALL responder 422 `RANGO_HORARIO_INVALIDO`; uno mayor de 31 días, 400 `DATOS_INVALIDOS`; un espacio inexistente, 404 `ESPACIO_NO_ENCONTRADO`.

#### Scenario: Consultar la ocupación de un día
- **DADO** reservas activas de "Lab 1" de 14:00 a 16:00 y de 10:00 a 12:00 del 2030-01-07 (UTC), y una CANCELADA de 12:00 a 13:00
- **CUANDO** un estudiante consulta la ocupación de "Lab 1" de 2030-01-07T00:00:00Z a 2030-01-08T00:00:00Z
- **ENTONCES** el sistema responde 200 con los intervalos 10:00–12:00 y 14:00–16:00 en ese orden

#### Scenario: Los solicitantes no ven quién reservó
- **DADO** una reserva activa de "Lab 1" hecha por otro usuario
- **CUANDO** un estudiante consulta la ocupación de "Lab 1"
- **ENTONCES** los intervalos no incluyen el identificador del solicitante

#### Scenario: Rango de consulta invertido
- **CUANDO** un estudiante consulta la ocupación con `desde` 2030-01-08T00:00:00Z y `hasta` 2030-01-07T00:00:00Z
- **ENTONCES** el sistema responde 422 con código `RANGO_HORARIO_INVALIDO`

#### Scenario: Rango de consulta demasiado amplio
- **CUANDO** un estudiante consulta la ocupación de 2030-01-01T00:00:00Z a 2030-02-02T00:00:00Z
- **ENTONCES** el sistema responde 400 con código `DATOS_INVALIDOS`

### Requirement: Búsqueda de espacios disponibles
El sistema SHALL permitir a cualquier usuario autenticado buscar los espacios activos disponibles durante todo un intervalo `[inicio, fin)`, con filtros opcionales por tipo y capacidad mínima. Un intervalo invertido SHALL responder 422 `RANGO_HORARIO_INVALIDO`.

#### Scenario: Buscar espacios libres en una franja
- **DADO** los espacios activos "Lab 1" y "Lab 2" y una reserva APROBADA de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **CUANDO** un profesor busca espacios disponibles de 2030-01-07T11:00:00Z a 2030-01-07T12:00:00Z
- **ENTONCES** el sistema responde 200 con "Lab 2" y sin "Lab 1"
