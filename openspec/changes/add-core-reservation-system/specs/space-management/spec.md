# Spec Delta: space-management (M1 — Gestión de espacios académicos)

## Purpose

Mantener el catálogo único de espacios académicos reservables (laboratorios, auditorios y salas de cómputo) y su estado de disponibilidad administrativa.

## ADDED Requirements

### Requirement: Registro de espacios
El sistema SHALL permitir a un ADMINISTRATOR registrar un espacio con nombre (3 a 100 caracteres), tipo (`LABORATORY`, `AUDITORIUM` o `COMPUTER_ROOM`), capacidad (entero positivo), ubicación (no vacía) y una lista opcional de equipamiento. Todo espacio nuevo SHALL quedar activo. Los datos inválidos SHALL rechazarse con 400 `VALIDATION_ERROR` sin crear el espacio.

#### Scenario: Registro exitoso de un laboratorio
- **WHEN** un administrador registra el espacio "Laboratorio de Redes" de tipo LABORATORY, capacidad 30, ubicación "Bloque B, piso 2" y equipamiento ["Proyector", "30 PC"]
- **THEN** el sistema responde 201 con el espacio creado, un identificador asignado y `active` igual a true

#### Scenario: Tipo de espacio no permitido
- **WHEN** un administrador registra un espacio de tipo "GYM"
- **THEN** el sistema responde 400 con código `VALIDATION_ERROR` y el espacio no se crea

#### Scenario: Capacidad no válida
- **WHEN** un administrador registra un espacio con capacidad 0, -5 o 10.5
- **THEN** el sistema responde 400 con código `VALIDATION_ERROR` en cada caso

### Requirement: Nombre único de espacio
El sistema MUST rechazar con 409 `SPACE_NAME_TAKEN` el registro o la edición de un espacio cuyo nombre coincida con el de otro espacio existente, sin distinguir mayúsculas ni espacios en los extremos, aunque el otro espacio esté inactivo.

#### Scenario: Nombre repetido con distinta escritura
- **GIVEN** existe el espacio "Auditorio Central"
- **WHEN** un administrador registra un espacio llamado "  auditorio central "
- **THEN** el sistema responde 409 con código `SPACE_NAME_TAKEN`

### Requirement: Edición de espacios
El sistema SHALL permitir a un ADMINISTRATOR modificar el nombre, tipo, capacidad, ubicación y equipamiento de un espacio existente, aplicando las mismas validaciones del registro. Un identificador inexistente SHALL responder 404 `SPACE_NOT_FOUND`.

#### Scenario: Actualizar la capacidad
- **GIVEN** el espacio "Sala de Cómputo 1" con capacidad 25
- **WHEN** un administrador cambia la capacidad a 35
- **THEN** el sistema responde 200 y el espacio queda con capacidad 35 y los demás datos sin cambios

#### Scenario: Renombrar con el nombre de otro espacio
- **GIVEN** existen "Sala A" y "Sala B"
- **WHEN** un administrador renombra "Sala B" como "sala a"
- **THEN** el sistema responde 409 con código `SPACE_NAME_TAKEN`

#### Scenario: Editar un espacio inexistente
- **WHEN** un administrador edita un espacio con un identificador que no existe
- **THEN** el sistema responde 404 con código `SPACE_NOT_FOUND`

### Requirement: Activación y desactivación de espacios
El sistema SHALL permitir a un ADMINISTRATOR desactivar y reactivar un espacio. Los espacios MUST NOT eliminarse físicamente. Desactivar un espacio SHALL impedir solicitudes nuevas sin modificar las reservas que ya tiene.

#### Scenario: Desactivar un espacio
- **GIVEN** el espacio activo "Auditorio Central"
- **WHEN** un administrador lo desactiva
- **THEN** el sistema responde 200 con `active` igual a false y el espacio deja de aparecer en el catálogo de los solicitantes

#### Scenario: Las reservas existentes se conservan
- **GIVEN** el espacio "Auditorio Central" con una reserva APPROVED
- **WHEN** un administrador desactiva el espacio
- **THEN** la reserva sigue en estado APPROVED

#### Scenario: Reactivar un espacio
- **GIVEN** el espacio inactivo "Auditorio Central"
- **WHEN** un administrador lo reactiva
- **THEN** el espacio vuelve a aparecer en el catálogo de los solicitantes

### Requirement: Consulta del catálogo
El sistema SHALL permitir a cualquier usuario autenticado listar los espacios activos ordenados por nombre, con filtros opcionales por tipo, capacidad mínima y texto contenido en el nombre, y consultar el detalle de un espacio por su identificador. Solo un ADMINISTRATOR SHALL poder incluir los espacios inactivos en el listado.

#### Scenario: Filtrar por tipo y capacidad mínima
- **GIVEN** los espacios activos "Lab 1" (LABORATORY, 20), "Lab 2" (LABORATORY, 40) y "Auditorio" (AUDITORIUM, 200)
- **WHEN** un estudiante lista los espacios con tipo LABORATORY y capacidad mínima 30
- **THEN** el sistema responde 200 con únicamente "Lab 2"

#### Scenario: Búsqueda por texto en el nombre
- **GIVEN** los espacios activos "Laboratorio de Redes" y "Sala de Cómputo 1"
- **WHEN** un profesor lista los espacios con el texto "redes"
- **THEN** el sistema responde 200 con únicamente "Laboratorio de Redes"

#### Scenario: Un solicitante no ve espacios inactivos
- **GIVEN** el espacio inactivo "Sala Antigua"
- **WHEN** un estudiante lista los espacios solicitando incluir inactivos
- **THEN** la respuesta no incluye "Sala Antigua"

#### Scenario: El administrador incluye espacios inactivos
- **GIVEN** el espacio inactivo "Sala Antigua"
- **WHEN** un administrador lista los espacios solicitando incluir inactivos
- **THEN** la respuesta incluye "Sala Antigua" con `active` igual a false

#### Scenario: Consultar un espacio inexistente
- **WHEN** un usuario autenticado consulta un espacio con un identificador que no existe
- **THEN** el sistema responde 404 con código `SPACE_NOT_FOUND`
