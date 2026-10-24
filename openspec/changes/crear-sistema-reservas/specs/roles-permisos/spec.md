# Especificación delta: roles-permisos (M3 — Roles y permisos)

## Purpose

Definir qué puede hacer cada tipo de usuario, exigir autenticación en las operaciones protegidas y controlar la asignación de roles sin perder el acceso administrativo.

## ADDED Requirements

### Requirement: Roles del sistema
El sistema SHALL manejar exactamente tres roles: `ESTUDIANTE`, `PROFESOR` y `ADMINISTRADOR`. Cada cuenta MUST tener un único rol en todo momento.

#### Scenario: Cada cuenta tiene un único rol
- **CUANDO** un visitante se registra con rol ESTUDIANTE y consulta su perfil
- **ENTONCES** el perfil muestra un único rol, ESTUDIANTE

### Requirement: Permisos de los solicitantes
Los roles `ESTUDIANTE` y `PROFESOR` SHALL tener los mismos permisos: consultar el catálogo y la disponibilidad, crear solicitudes de reserva y consultar y cancelar sus propias reservas. Cualquier operación administrativa SHALL responder 403 `ACCESO_DENEGADO`.

#### Scenario: Un estudiante intenta registrar un espacio
- **CUANDO** un estudiante registra un espacio
- **ENTONCES** el sistema responde 403 con código `ACCESO_DENEGADO`

#### Scenario: Un profesor intenta aprobar una solicitud
- **DADO** una solicitud PENDIENTE
- **CUANDO** un profesor intenta aprobarla
- **ENTONCES** el sistema responde 403 con código `ACCESO_DENEGADO` y la solicitud sigue PENDIENTE

#### Scenario: Un estudiante intenta listar las cuentas
- **CUANDO** un estudiante lista las cuentas de usuario
- **ENTONCES** el sistema responde 403 con código `ACCESO_DENEGADO`

### Requirement: Permisos del administrador
Solo el rol `ADMINISTRADOR` SHALL gestionar espacios, aprobar, rechazar y consultar todas las reservas, cancelar reservas ajenas y administrar cuentas y roles. El `ADMINISTRADOR` MUST NOT crear solicitudes de reserva, porque no es solicitante (403 `ACCESO_DENEGADO`).

#### Scenario: El administrador consulta todas las reservas
- **CUANDO** un administrador lista todas las reservas
- **ENTONCES** el sistema responde 200

#### Scenario: El administrador intenta crear una solicitud
- **CUANDO** un administrador crea una solicitud de reserva
- **ENTONCES** el sistema responde 403 con código `ACCESO_DENEGADO`

### Requirement: Autenticación obligatoria
Toda operación, excepto el registro y el inicio de sesión, MUST exigir un token de acceso válido. Un token ausente, alterado, expirado o de una cuenta inexistente SHALL responder 401 `NO_AUTENTICADO`.

#### Scenario: Petición sin token
- **CUANDO** alguien lista los espacios sin token de acceso
- **ENTONCES** el sistema responde 401 con código `NO_AUTENTICADO`

#### Scenario: Token alterado
- **CUANDO** alguien usa un token cuya firma fue modificada
- **ENTONCES** el sistema responde 401 con código `NO_AUTENTICADO`

#### Scenario: Token expirado
- **DADO** un token emitido a las 2030-01-07T08:00:00Z con duración de 1 hora
- **CUANDO** se usa a las 2030-01-07T09:00:01Z
- **ENTONCES** el sistema responde 401 con código `NO_AUTENTICADO`

### Requirement: Asignación de roles
El sistema SHALL permitir a un ADMINISTRADOR cambiar el rol de otra cuenta a cualquiera de los tres roles. El nuevo rol SHALL aplicarse desde la siguiente petición de esa cuenta, incluso con tokens emitidos antes del cambio. Un rol inexistente SHALL responder 400 `DATOS_INVALIDOS`.

#### Scenario: Promover un estudiante a administrador
- **DADO** un estudiante con un token vigente
- **CUANDO** un administrador le asigna el rol ADMINISTRADOR y el estudiante lista todas las reservas con el mismo token
- **ENTONCES** el sistema responde 200

#### Scenario: Asignar un rol inexistente
- **CUANDO** un administrador asigna el rol "SUPERUSER" a una cuenta
- **ENTONCES** el sistema responde 400 con código `DATOS_INVALIDOS`

### Requirement: Protección del acceso administrativo
Un ADMINISTRADOR MUST NOT cambiar su propio rol ni desactivar su propia cuenta (409 `AUTOMODIFICACION_NO_PERMITIDA`), de modo que el sistema siempre conserve al menos un administrador activo.

#### Scenario: El administrador intenta quitarse el rol
- **CUANDO** un administrador cambia su propio rol a ESTUDIANTE
- **ENTONCES** el sistema responde 409 con código `AUTOMODIFICACION_NO_PERMITIDA` y conserva el rol ADMINISTRADOR

#### Scenario: El administrador intenta desactivarse
- **CUANDO** un administrador desactiva su propia cuenta
- **ENTONCES** el sistema responde 409 con código `AUTOMODIFICACION_NO_PERMITIDA` y la cuenta sigue activa

### Requirement: Administrador inicial
Al arrancar, si no existe ninguna cuenta ADMINISTRADOR, el sistema SHALL crear una con el correo, la contraseña y el nombre definidos en la configuración. Si ya existe un administrador, MUST NOT crear otro.

#### Scenario: Arranque sin administradores
- **DADO** un sistema sin cuentas y la configuración ADMIN_CORREO "admin@uni.edu" y ADMIN_CONTRASENA "Admin12345"
- **CUANDO** el sistema arranca
- **ENTONCES** existe una cuenta ADMINISTRADOR activa que puede iniciar sesión con esas credenciales

#### Scenario: Arranque con un administrador existente
- **DADO** un sistema que ya tiene una cuenta ADMINISTRADOR
- **CUANDO** el sistema arranca de nuevo con la misma configuración
- **ENTONCES** sigue existiendo exactamente una cuenta ADMINISTRADOR
