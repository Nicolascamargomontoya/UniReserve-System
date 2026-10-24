# prevencion-conflictos Specification

## Purpose
Garantizar que un espacio nunca quede asignado dos veces y que una persona no acapare franjas simultáneas, incluso cuando varias solicitudes llegan al mismo tiempo o se repiten.

## Requirements

### Requirement: Exclusividad del espacio ante solicitudes concurrentes
En ningún momento SHALL existir dos reservas activas solapadas del mismo espacio. Cuando varias solicitudes solapadas para el mismo espacio llegan de forma concurrente, el sistema MUST aceptar exactamente una y rechazar las demás con 409 `ESPACIO_NO_DISPONIBLE`.

#### Scenario: Cinco solicitudes simultáneas por la misma franja
- **DADO** el espacio libre "Lab 1"
- **CUANDO** cinco estudiantes distintos solicitan al mismo tiempo "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **ENTONCES** exactamente una solicitud responde 201 y las otras cuatro responden 409 con código `ESPACIO_NO_DISPONIBLE`

### Requirement: Exclusividad del solicitante
Un usuario MUST NOT tener dos reservas activas que se solapen en el tiempo, aunque sean de espacios distintos. La solicitud que lo provoque SHALL rechazarse con 409 `CONFLICTO_HORARIO_USUARIO`, también cuando las solicitudes llegan de forma concurrente.

#### Scenario: Mismo horario en otro espacio
- **DADO** un estudiante con una solicitud PENDIENTE de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **CUANDO** el mismo estudiante solicita "Lab 2" de 2030-01-07T11:00:00Z a 2030-01-07T13:00:00Z
- **ENTONCES** el sistema responde 409 con código `CONFLICTO_HORARIO_USUARIO`

#### Scenario: Solicitudes simultáneas del mismo usuario en espacios distintos
- **CUANDO** un estudiante envía al mismo tiempo solicitudes para "Lab 1" y "Lab 2" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **ENTONCES** exactamente una responde 201 y la otra responde 409 con código `CONFLICTO_HORARIO_USUARIO`

### Requirement: Detección de solicitudes duplicadas
Si el mismo usuario ya tiene una reserva activa del mismo espacio con el mismo inicio y fin, el sistema MUST rechazar la nueva solicitud con 409 `SOLICITUD_DUPLICADA` e indicar el identificador de la reserva existente.

#### Scenario: El mismo estudiante repite la solicitud
- **DADO** un estudiante con una solicitud PENDIENTE de "Lab 1" de 2030-01-07T10:00:00Z a 2030-01-07T12:00:00Z
- **CUANDO** envía otra vez la misma solicitud
- **ENTONCES** el sistema responde 409 con código `SOLICITUD_DUPLICADA` y el identificador de la solicitud existente

### Requirement: Revalidación al aprobar
Antes de aprobar una solicitud, el sistema MUST verificar que ninguna otra reserva `APROBADA` del mismo espacio se solape con ella. Si existe, SHALL responder 409 `ESPACIO_NO_DISPONIBLE` y la solicitud SHALL permanecer `PENDIENTE`. Esto protege frente a datos inconsistentes, como registros migrados desde las hojas de cálculo.

#### Scenario: Datos inconsistentes al aprobar
- **DADO** dos solicitudes PENDIENTE solapadas de "Lab 1" cargadas directamente en el almacén, y la primera ya aprobada
- **CUANDO** un administrador intenta aprobar la segunda
- **ENTONCES** el sistema responde 409 con código `ESPACIO_NO_DISPONIBLE` y la segunda sigue PENDIENTE
