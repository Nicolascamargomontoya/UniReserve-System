# Spec Delta: user-management (M2 — Registro y administración de usuarios)

## Purpose

Identificar a cada persona que usa el sistema mediante una cuenta propia y permitir al administrador gestionar el ciclo de vida de esas cuentas.

## ADDED Requirements

### Requirement: Registro de cuentas
El sistema SHALL permitir a un visitante sin autenticar registrarse con correo, contraseña, nombre completo y rol `STUDENT` o `PROFESSOR`. La cuenta SHALL quedar activa y la respuesta MUST NOT incluir la contraseña ni su hash. El rol `ADMINISTRATOR` MUST NOT poder elegirse en el registro (403 `FORBIDDEN`).

#### Scenario: Registro exitoso de un estudiante
- **WHEN** un visitante se registra con correo "ana@uni.edu", contraseña "Segura123", nombre "Ana Pérez" y rol STUDENT
- **THEN** el sistema responde 201 con la cuenta activa, rol STUDENT y sin campos de contraseña

#### Scenario: Registro de un profesor
- **WHEN** un visitante se registra con rol PROFESSOR y datos válidos
- **THEN** el sistema responde 201 con rol PROFESSOR

#### Scenario: Autorregistro como administrador
- **WHEN** un visitante se registra con rol ADMINISTRATOR
- **THEN** el sistema responde 403 con código `FORBIDDEN` y la cuenta no se crea

### Requirement: Validación de los datos de registro
El sistema MUST rechazar con 400 `VALIDATION_ERROR` un correo con formato inválido, una contraseña de menos de 8 caracteres, un nombre de menos de 3 caracteres o un rol inexistente; y con 409 `EMAIL_ALREADY_REGISTERED` un correo ya registrado, sin distinguir mayúsculas ni espacios en los extremos.

#### Scenario: Correo ya registrado con distinta escritura
- **GIVEN** existe la cuenta "ana@uni.edu"
- **WHEN** un visitante se registra con el correo " ANA@uni.edu "
- **THEN** el sistema responde 409 con código `EMAIL_ALREADY_REGISTERED`

#### Scenario: Correo con formato inválido
- **WHEN** un visitante se registra con el correo "ana-uni.edu"
- **THEN** el sistema responde 400 con código `VALIDATION_ERROR`

#### Scenario: Contraseña demasiado corta
- **WHEN** un visitante se registra con la contraseña "abc123"
- **THEN** el sistema responde 400 con código `VALIDATION_ERROR`

### Requirement: Almacenamiento seguro de contraseñas
El sistema MUST almacenar las contraseñas únicamente como hash unidireccional con sal y MUST NOT exponerlas en ninguna respuesta.

#### Scenario: La contraseña no se guarda en texto plano
- **WHEN** un visitante se registra con la contraseña "Segura123"
- **THEN** el valor almacenado es distinto de "Segura123" y permite verificar esa contraseña

### Requirement: Autenticación
El sistema SHALL autenticar a un usuario con correo y contraseña y entregar un token de acceso de duración limitada (1 hora por defecto). Las credenciales incorrectas SHALL responder 401 `INVALID_CREDENTIALS` con el mismo mensaje exista o no el correo. Una cuenta desactivada SHALL responder 403 `ACCOUNT_INACTIVE`.

#### Scenario: Inicio de sesión exitoso
- **GIVEN** la cuenta activa "ana@uni.edu" con contraseña "Segura123"
- **WHEN** inicia sesión con esas credenciales
- **THEN** el sistema responde 200 con un token de acceso y los datos públicos de la cuenta

#### Scenario: Contraseña incorrecta
- **GIVEN** la cuenta "ana@uni.edu"
- **WHEN** inicia sesión con la contraseña "Incorrecta1"
- **THEN** el sistema responde 401 con código `INVALID_CREDENTIALS`

#### Scenario: Correo no registrado
- **WHEN** alguien inicia sesión con el correo "nadie@uni.edu"
- **THEN** el sistema responde 401 con código `INVALID_CREDENTIALS` y el mismo mensaje que con contraseña incorrecta

#### Scenario: Cuenta desactivada
- **GIVEN** la cuenta desactivada "ana@uni.edu"
- **WHEN** inicia sesión con credenciales correctas
- **THEN** el sistema responde 403 con código `ACCOUNT_INACTIVE`

### Requirement: Perfil propio
El sistema SHALL permitir a un usuario autenticado consultar su perfil y actualizar su nombre completo. El correo y el rol MUST NOT modificarse desde el perfil propio.

#### Scenario: Consultar el perfil propio
- **WHEN** un usuario autenticado consulta su perfil
- **THEN** el sistema responde 200 con su correo, nombre, rol y estado, sin campos de contraseña

#### Scenario: Actualizar el nombre
- **WHEN** un usuario autenticado cambia su nombre a "Ana María Pérez" e incluye el rol ADMINISTRATOR en la misma petición
- **THEN** el sistema responde 200 con el nuevo nombre y el rol sin cambios

### Requirement: Administración de cuentas
El sistema SHALL permitir a un ADMINISTRATOR listar las cuentas con filtros por rol y estado, consultar una cuenta por identificador (404 `USER_NOT_FOUND` si no existe) y desactivarla o reactivarla. Una cuenta desactivada MUST NOT poder usar tokens emitidos antes de la desactivación (403 `ACCOUNT_INACTIVE`).

#### Scenario: Listar cuentas por rol
- **GIVEN** dos estudiantes y un profesor registrados
- **WHEN** un administrador lista las cuentas con rol PROFESSOR
- **THEN** el sistema responde 200 con únicamente el profesor

#### Scenario: Desactivar una cuenta invalida su acceso
- **GIVEN** un estudiante con un token vigente
- **WHEN** un administrador desactiva su cuenta y el estudiante usa ese token
- **THEN** el sistema responde 403 con código `ACCOUNT_INACTIVE`

#### Scenario: Reactivar una cuenta
- **GIVEN** un estudiante con la cuenta desactivada
- **WHEN** un administrador la reactiva
- **THEN** el estudiante puede iniciar sesión de nuevo

#### Scenario: Consultar una cuenta inexistente
- **WHEN** un administrador consulta una cuenta con un identificador que no existe
- **THEN** el sistema responde 404 con código `USER_NOT_FOUND`
