# Spec Delta: roles-permissions (M3 — Roles y permisos)

## Purpose

Definir qué puede hacer cada tipo de usuario, exigir autenticación en las operaciones protegidas y controlar la asignación de roles sin perder el acceso administrativo.

## ADDED Requirements

### Requirement: Roles del sistema
El sistema SHALL manejar exactamente tres roles: `STUDENT`, `PROFESSOR` y `ADMINISTRATOR`. Cada cuenta MUST tener un único rol en todo momento.

#### Scenario: Cada cuenta tiene un único rol
- **WHEN** un visitante se registra con rol STUDENT y consulta su perfil
- **THEN** el perfil muestra un único rol, STUDENT

### Requirement: Permisos de los solicitantes
Los roles `STUDENT` y `PROFESSOR` SHALL tener los mismos permisos: consultar el catálogo y la disponibilidad, crear solicitudes de reserva y consultar y cancelar sus propias reservas. Cualquier operación administrativa SHALL responder 403 `FORBIDDEN`.

#### Scenario: Un estudiante intenta registrar un espacio
- **WHEN** un estudiante registra un espacio
- **THEN** el sistema responde 403 con código `FORBIDDEN`

#### Scenario: Un profesor intenta aprobar una solicitud
- **GIVEN** una solicitud PENDING
- **WHEN** un profesor intenta aprobarla
- **THEN** el sistema responde 403 con código `FORBIDDEN` y la solicitud sigue PENDING

#### Scenario: Un estudiante intenta listar las cuentas
- **WHEN** un estudiante lista las cuentas de usuario
- **THEN** el sistema responde 403 con código `FORBIDDEN`

### Requirement: Permisos del administrador
Solo el rol `ADMINISTRATOR` SHALL gestionar espacios, aprobar, rechazar y consultar todas las reservas, cancelar reservas ajenas y administrar cuentas y roles. El `ADMINISTRATOR` MUST NOT crear solicitudes de reserva, porque no es solicitante (403 `FORBIDDEN`).

#### Scenario: El administrador consulta todas las reservas
- **WHEN** un administrador lista todas las reservas
- **THEN** el sistema responde 200

#### Scenario: El administrador intenta crear una solicitud
- **WHEN** un administrador crea una solicitud de reserva
- **THEN** el sistema responde 403 con código `FORBIDDEN`

### Requirement: Autenticación obligatoria
Toda operación, excepto el registro y el inicio de sesión, MUST exigir un token de acceso válido. Un token ausente, alterado, expirado o de una cuenta inexistente SHALL responder 401 `UNAUTHENTICATED`.

#### Scenario: Petición sin token
- **WHEN** alguien lista los espacios sin token de acceso
- **THEN** el sistema responde 401 con código `UNAUTHENTICATED`

#### Scenario: Token alterado
- **WHEN** alguien usa un token cuya firma fue modificada
- **THEN** el sistema responde 401 con código `UNAUTHENTICATED`

#### Scenario: Token expirado
- **GIVEN** un token emitido a las 2030-01-07T08:00:00Z con duración de 1 hora
- **WHEN** se usa a las 2030-01-07T09:00:01Z
- **THEN** el sistema responde 401 con código `UNAUTHENTICATED`

### Requirement: Asignación de roles
El sistema SHALL permitir a un ADMINISTRATOR cambiar el rol de otra cuenta a cualquiera de los tres roles. El nuevo rol SHALL aplicarse desde la siguiente petición de esa cuenta, incluso con tokens emitidos antes del cambio. Un rol inexistente SHALL responder 400 `VALIDATION_ERROR`.

#### Scenario: Promover un estudiante a administrador
- **GIVEN** un estudiante con un token vigente
- **WHEN** un administrador le asigna el rol ADMINISTRATOR y el estudiante lista todas las reservas con el mismo token
- **THEN** el sistema responde 200

#### Scenario: Asignar un rol inexistente
- **WHEN** un administrador asigna el rol "SUPERUSER" a una cuenta
- **THEN** el sistema responde 400 con código `VALIDATION_ERROR`

### Requirement: Protección del acceso administrativo
Un ADMINISTRATOR MUST NOT cambiar su propio rol ni desactivar su propia cuenta (409 `SELF_MODIFICATION_NOT_ALLOWED`), de modo que el sistema siempre conserve al menos un administrador activo.

#### Scenario: El administrador intenta quitarse el rol
- **WHEN** un administrador cambia su propio rol a STUDENT
- **THEN** el sistema responde 409 con código `SELF_MODIFICATION_NOT_ALLOWED` y conserva el rol ADMINISTRATOR

#### Scenario: El administrador intenta desactivarse
- **WHEN** un administrador desactiva su propia cuenta
- **THEN** el sistema responde 409 con código `SELF_MODIFICATION_NOT_ALLOWED` y la cuenta sigue activa

### Requirement: Administrador inicial
Al arrancar, si no existe ninguna cuenta ADMINISTRATOR, el sistema SHALL crear una con el correo, la contraseña y el nombre definidos en la configuración. Si ya existe un administrador, MUST NOT crear otro.

#### Scenario: Arranque sin administradores
- **GIVEN** un sistema sin cuentas y la configuración ADMIN_EMAIL "admin@uni.edu" y ADMIN_PASSWORD "Admin12345"
- **WHEN** el sistema arranca
- **THEN** existe una cuenta ADMINISTRATOR activa que puede iniciar sesión con esas credenciales

#### Scenario: Arranque con un administrador existente
- **GIVEN** un sistema que ya tiene una cuenta ADMINISTRATOR
- **WHEN** el sistema arranca de nuevo con la misma configuración
- **THEN** sigue existiendo exactamente una cuenta ADMINISTRATOR
