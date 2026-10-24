# gestion-usuarios Specification

## Purpose
Identificar a cada persona que usa el sistema mediante una cuenta propia y permitir al administrador gestionar el ciclo de vida de esas cuentas.

## Requirements

### Requirement: Registro de cuentas
El sistema SHALL permitir a un visitante sin autenticar registrarse con correo, contraseña, nombre completo y rol `ESTUDIANTE` o `PROFESOR`. La cuenta SHALL quedar activa y la respuesta MUST NOT incluir la contraseña ni su hash. El rol `ADMINISTRADOR` MUST NOT poder elegirse en el registro (403 `ACCESO_DENEGADO`).

#### Scenario: Registro exitoso de un estudiante
- **CUANDO** un visitante se registra con correo "ana@uni.edu", contraseña "Segura123", nombre "Ana Pérez" y rol ESTUDIANTE
- **ENTONCES** el sistema responde 201 con la cuenta activa, rol ESTUDIANTE y sin campos de contraseña

#### Scenario: Registro de un profesor
- **CUANDO** un visitante se registra con rol PROFESOR y datos válidos
- **ENTONCES** el sistema responde 201 con rol PROFESOR

#### Scenario: Autorregistro como administrador
- **CUANDO** un visitante se registra con rol ADMINISTRADOR
- **ENTONCES** el sistema responde 403 con código `ACCESO_DENEGADO` y la cuenta no se crea

### Requirement: Validación de los datos de registro
El sistema MUST rechazar con 400 `DATOS_INVALIDOS` un correo con formato inválido, una contraseña de menos de 8 caracteres, un nombre de menos de 3 caracteres o un rol inexistente; y con 409 `CORREO_YA_REGISTRADO` un correo ya registrado, sin distinguir mayúsculas ni espacios en los extremos.

#### Scenario: Correo ya registrado con distinta escritura
- **DADO** existe la cuenta "ana@uni.edu"
- **CUANDO** un visitante se registra con el correo " ANA@uni.edu "
- **ENTONCES** el sistema responde 409 con código `CORREO_YA_REGISTRADO`

#### Scenario: Correo con formato inválido
- **CUANDO** un visitante se registra con el correo "ana-uni.edu"
- **ENTONCES** el sistema responde 400 con código `DATOS_INVALIDOS`

#### Scenario: Contraseña demasiado corta
- **CUANDO** un visitante se registra con la contraseña "abc123"
- **ENTONCES** el sistema responde 400 con código `DATOS_INVALIDOS`

### Requirement: Almacenamiento seguro de contraseñas
El sistema MUST almacenar las contraseñas únicamente como hash unidireccional con sal y MUST NOT exponerlas en ninguna respuesta.

#### Scenario: La contraseña no se guarda en texto plano
- **CUANDO** un visitante se registra con la contraseña "Segura123"
- **ENTONCES** el valor almacenado es distinto de "Segura123" y permite verificar esa contraseña

### Requirement: Autenticación
El sistema SHALL autenticar a un usuario con correo y contraseña y entregar un token de acceso de duración limitada (1 hora por defecto). Las credenciales incorrectas SHALL responder 401 `CREDENCIALES_INVALIDAS` con el mismo mensaje exista o no el correo. Una cuenta desactivada SHALL responder 403 `CUENTA_INACTIVA`.

#### Scenario: Inicio de sesión exitoso
- **DADO** la cuenta activa "ana@uni.edu" con contraseña "Segura123"
- **CUANDO** inicia sesión con esas credenciales
- **ENTONCES** el sistema responde 200 con un token de acceso y los datos públicos de la cuenta

#### Scenario: Contraseña incorrecta
- **DADO** la cuenta "ana@uni.edu"
- **CUANDO** inicia sesión con la contraseña "Incorrecta1"
- **ENTONCES** el sistema responde 401 con código `CREDENCIALES_INVALIDAS`

#### Scenario: Correo no registrado
- **CUANDO** alguien inicia sesión con el correo "nadie@uni.edu"
- **ENTONCES** el sistema responde 401 con código `CREDENCIALES_INVALIDAS` y el mismo mensaje que con contraseña incorrecta

#### Scenario: Cuenta desactivada
- **DADO** la cuenta desactivada "ana@uni.edu"
- **CUANDO** inicia sesión con credenciales correctas
- **ENTONCES** el sistema responde 403 con código `CUENTA_INACTIVA`

### Requirement: Perfil propio
El sistema SHALL permitir a un usuario autenticado consultar su perfil y actualizar su nombre completo. El correo y el rol MUST NOT modificarse desde el perfil propio.

#### Scenario: Consultar el perfil propio
- **CUANDO** un usuario autenticado consulta su perfil
- **ENTONCES** el sistema responde 200 con su correo, nombre, rol y estado, sin campos de contraseña

#### Scenario: Actualizar el nombre
- **CUANDO** un usuario autenticado cambia su nombre a "Ana María Pérez" e incluye el rol ADMINISTRADOR en la misma petición
- **ENTONCES** el sistema responde 200 con el nuevo nombre y el rol sin cambios

### Requirement: Administración de cuentas
El sistema SHALL permitir a un ADMINISTRADOR listar las cuentas con filtros por rol y estado, consultar una cuenta por identificador (404 `USUARIO_NO_ENCONTRADO` si no existe) y desactivarla o reactivarla. Una cuenta desactivada MUST NOT poder usar tokens emitidos antes de la desactivación (403 `CUENTA_INACTIVA`).

#### Scenario: Listar cuentas por rol
- **DADO** dos estudiantes y un profesor registrados
- **CUANDO** un administrador lista las cuentas con rol PROFESOR
- **ENTONCES** el sistema responde 200 con únicamente el profesor

#### Scenario: Desactivar una cuenta invalida su acceso
- **DADO** un estudiante con un token vigente
- **CUANDO** un administrador desactiva su cuenta y el estudiante usa ese token
- **ENTONCES** el sistema responde 403 con código `CUENTA_INACTIVA`

#### Scenario: Reactivar una cuenta
- **DADO** un estudiante con la cuenta desactivada
- **CUANDO** un administrador la reactiva
- **ENTONCES** el estudiante puede iniciar sesión de nuevo

#### Scenario: Consultar una cuenta inexistente
- **CUANDO** un administrador consulta una cuenta con un identificador que no existe
- **ENTONCES** el sistema responde 404 con código `USUARIO_NO_ENCONTRADO`
