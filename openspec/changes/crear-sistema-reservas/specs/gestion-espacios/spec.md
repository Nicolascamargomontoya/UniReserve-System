# Especificación delta: gestion-espacios (M1 — Gestión de espacios académicos)

## Purpose

Mantener el catálogo único de espacios académicos reservables (laboratorios, auditorios y salas de cómputo) y su estado de disponibilidad administrativa.

## ADDED Requirements

### Requirement: Registro de espacios
El sistema SHALL permitir a un ADMINISTRADOR registrar un espacio con nombre (3 a 100 caracteres), tipo (`LABORATORIO`, `AUDITORIO` o `SALA_COMPUTO`), capacidad (entero positivo), ubicación (no vacía) y una lista opcional de equipamiento. Todo espacio nuevo SHALL quedar activo. Los datos inválidos SHALL rechazarse con 400 `DATOS_INVALIDOS` sin crear el espacio.

#### Scenario: Registro exitoso de un laboratorio
- **CUANDO** un administrador registra el espacio "Laboratorio de Redes" de tipo LABORATORIO, capacidad 30, ubicación "Bloque B, piso 2" y equipamiento ["Proyector", "30 PC"]
- **ENTONCES** el sistema responde 201 con el espacio creado, un identificador asignado y `activo` igual a verdadero

#### Scenario: Tipo de espacio no permitido
- **CUANDO** un administrador registra un espacio de tipo "GYM"
- **ENTONCES** el sistema responde 400 con código `DATOS_INVALIDOS` y el espacio no se crea

#### Scenario: Capacidad no válida
- **CUANDO** un administrador registra un espacio con capacidad 0, -5 o 10.5
- **ENTONCES** el sistema responde 400 con código `DATOS_INVALIDOS` en cada caso

### Requirement: Nombre único de espacio
El sistema MUST rechazar con 409 `NOMBRE_ESPACIO_DUPLICADO` el registro o la edición de un espacio cuyo nombre coincida con el de otro espacio existente, sin distinguir mayúsculas ni espacios en los extremos, aunque el otro espacio esté inactivo.

#### Scenario: Nombre repetido con distinta escritura
- **DADO** existe el espacio "Auditorio Central"
- **CUANDO** un administrador registra un espacio llamado "  auditorio central "
- **ENTONCES** el sistema responde 409 con código `NOMBRE_ESPACIO_DUPLICADO`

### Requirement: Edición de espacios
El sistema SHALL permitir a un ADMINISTRADOR modificar el nombre, tipo, capacidad, ubicación y equipamiento de un espacio existente, aplicando las mismas validaciones del registro. Un identificador inexistente SHALL responder 404 `ESPACIO_NO_ENCONTRADO`.

#### Scenario: Actualizar la capacidad
- **DADO** el espacio "Sala de Cómputo 1" con capacidad 25
- **CUANDO** un administrador cambia la capacidad a 35
- **ENTONCES** el sistema responde 200 y el espacio queda con capacidad 35 y los demás datos sin cambios

#### Scenario: Renombrar con el nombre de otro espacio
- **DADO** existen "Sala A" y "Sala B"
- **CUANDO** un administrador renombra "Sala B" como "sala a"
- **ENTONCES** el sistema responde 409 con código `NOMBRE_ESPACIO_DUPLICADO`

#### Scenario: Editar un espacio inexistente
- **CUANDO** un administrador edita un espacio con un identificador que no existe
- **ENTONCES** el sistema responde 404 con código `ESPACIO_NO_ENCONTRADO`

### Requirement: Activación y desactivación de espacios
El sistema SHALL permitir a un ADMINISTRADOR desactivar y reactivar un espacio. Los espacios MUST NOT eliminarse físicamente. Desactivar un espacio SHALL impedir solicitudes nuevas sin modificar las reservas que ya tiene.

#### Scenario: Desactivar un espacio
- **DADO** el espacio activo "Auditorio Central"
- **CUANDO** un administrador lo desactiva
- **ENTONCES** el sistema responde 200 con `activo` igual a falso y el espacio deja de aparecer en el catálogo de los solicitantes

#### Scenario: Las reservas existentes se conservan
- **DADO** el espacio "Auditorio Central" con una reserva APROBADA
- **CUANDO** un administrador desactiva el espacio
- **ENTONCES** la reserva sigue en estado APROBADA

#### Scenario: Reactivar un espacio
- **DADO** el espacio inactivo "Auditorio Central"
- **CUANDO** un administrador lo reactiva
- **ENTONCES** el espacio vuelve a aparecer en el catálogo de los solicitantes

### Requirement: Consulta del catálogo
El sistema SHALL permitir a cualquier usuario autenticado listar los espacios activos ordenados por nombre, con filtros opcionales por tipo, capacidad mínima y texto contenido en el nombre, y consultar el detalle de un espacio por su identificador. Solo un ADMINISTRADOR SHALL poder incluir los espacios inactivos en el listado.

#### Scenario: Filtrar por tipo y capacidad mínima
- **DADO** los espacios activos "Lab 1" (LABORATORIO, 20), "Lab 2" (LABORATORIO, 40) y "Auditorio" (AUDITORIO, 200)
- **CUANDO** un estudiante lista los espacios con tipo LABORATORIO y capacidad mínima 30
- **ENTONCES** el sistema responde 200 con únicamente "Lab 2"

#### Scenario: Búsqueda por texto en el nombre
- **DADO** los espacios activos "Laboratorio de Redes" y "Sala de Cómputo 1"
- **CUANDO** un profesor lista los espacios con el texto "redes"
- **ENTONCES** el sistema responde 200 con únicamente "Laboratorio de Redes"

#### Scenario: Un solicitante no ve espacios inactivos
- **DADO** el espacio inactivo "Sala Antigua"
- **CUANDO** un estudiante lista los espacios solicitando incluir inactivos
- **ENTONCES** la respuesta no incluye "Sala Antigua"

#### Scenario: El administrador incluye espacios inactivos
- **DADO** el espacio inactivo "Sala Antigua"
- **CUANDO** un administrador lista los espacios solicitando incluir inactivos
- **ENTONCES** la respuesta incluye "Sala Antigua" con `activo` igual a falso

#### Scenario: Consultar un espacio inexistente
- **CUANDO** un usuario autenticado consulta un espacio con un identificador que no existe
- **ENTONCES** el sistema responde 404 con código `ESPACIO_NO_ENCONTRADO`
