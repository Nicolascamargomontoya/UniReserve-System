# Diseño: Sistema central de reservas de espacios académicos

## Contexto

Ver `proposal.md` (Why). El código de la iteración 1 está organizado por tipo técnico (`controllers/`, `services/`, `models/`), no tiene pruebas automatizadas con framework y deja el secreto JWT fijo en el código. Restricciones del plan (PLAN_INGENIERIA.md §3): Node.js ≥ 22.12, TypeScript strict, Express 5, sin base de datos externa en la entrega, y ejecución completa con `npm install && npm test`. Todo el proyecto (código, API, pruebas y documentación) está en español.

## Objetivos / No objetivos

**Objetivos:**

- Correspondencia 1:1 entre capacidad, carpeta `src/modulos/<capacidad>/` y archivo `pruebas/<capacidad>.test.ts`.
- Pruebas deterministas: reloj inyectable y repositorios en memoria.
- Exclusividad garantizada por espacio y por usuario, también con peticiones concurrentes.
- Un único contrato de errores para toda la API.

**No objetivos:**

- Persistencia en una base de datos real (el DDL de referencia está en el plan, §3.3).
- Paginación, límites de tasa y despliegue en varios procesos.
- Interfaz gráfica.

## Decisiones

### D1. Módulos verticales sobre capas horizontales

Cada módulo contiene sus rutas (presentación) y sus servicios (negocio). Los modelos viven en `src/dominio/` y el acceso a datos en `src/repositorios/` porque los comparten varios módulos. Los servicios no importan Express. `src/contenedor.ts` crea repositorios y servicios; `src/app.ts` monta las rutas.

- *Alternativa descartada:* carpetas por tipo técnico (iteración 1). Mezcla funcionalidades en un mismo archivo y rompe la trazabilidad con las capacidades.

### D2. API REST

| Método | Ruta | Permiso | Requisito |
| :--- | :--- | :--- | :--- |
| POST | `/auth/registro` | público | gestion-usuarios: Registro de cuentas |
| POST | `/auth/inicio-sesion` | público | gestion-usuarios: Autenticación |
| GET / PATCH | `/usuarios/perfil` | autenticado | gestion-usuarios: Perfil propio |
| GET | `/usuarios`, `/usuarios/:id` | `usuarios:gestionar` | gestion-usuarios: Administración de cuentas |
| PATCH | `/usuarios/:id/estado` | `usuarios:gestionar` | Administración de cuentas; Protección del acceso administrativo |
| PATCH | `/usuarios/:id/rol` | `usuarios:gestionar` | roles-permisos: Asignación de roles |
| GET | `/espacios`, `/espacios/:id` | `espacios:consultar` | gestion-espacios: Consulta del catálogo |
| POST | `/espacios` | `espacios:gestionar` | gestion-espacios: Registro de espacios |
| PATCH | `/espacios/:id` | `espacios:gestionar` | gestion-espacios: Edición de espacios |
| PATCH | `/espacios/:id/estado` | `espacios:gestionar` | gestion-espacios: Activación y desactivación |
| GET | `/espacios/disponibles` | `espacios:consultar` | disponibilidad: Búsqueda de espacios disponibles |
| GET | `/espacios/:id/ocupacion` | `espacios:consultar` | disponibilidad: Consulta de ocupación |
| POST | `/reservas` | `reservas:crear` | solicitudes-reserva; disponibilidad; prevencion-conflictos |
| GET | `/reservas/mias` | `reservas:consultar-propias` | cancelacion-historial: Historial del solicitante |
| GET | `/reservas/pendientes` | `reservas:decidir` | aprobacion-reservas: Bandeja de pendientes |
| GET | `/reservas` | `reservas:consultar-todas` | cancelacion-historial: Consulta administrativa |
| GET | `/reservas/:id` | propia o `reservas:consultar-todas` | cancelacion-historial |
| PATCH | `/reservas/:id/aprobar` | `reservas:decidir` | aprobacion-reservas: Aprobación |
| PATCH | `/reservas/:id/rechazar` | `reservas:decidir` | aprobacion-reservas: Rechazo con motivo |
| PATCH | `/reservas/:id/cancelar` | propia (`reservas:cancelar-propias`) o `reservas:cancelar-cualquiera` | cancelacion-historial: Cancelación |

Campos JSON principales:

- **Usuario:** `id`, `correo`, `nombreCompleto`, `rol`, `activo`, `creadoEn`. La contraseña entra como `contrasena` y nunca sale.
- **Espacio:** `id`, `nombre`, `tipo`, `capacidad`, `ubicacion`, `equipamiento`, `activo`, `creadoEn`, `actualizadoEn`.
- **Reserva:** `id`, `espacioId`, `usuarioId`, `inicio`, `fin`, `proposito`, `asistentes`, `estado`, `creadaEn`, `actualizadaEn` e `historial` (`estadoAnterior`, `estadoNuevo`, `autorId`, `fecha`, `motivo`).
- **Filtros de consulta:** `tipo`, `capacidadMinima`, `texto`, `incluirInactivos`, `inicio`, `fin`, `desde`, `hasta`, `estado`, `espacioId`, `usuarioId`, `rol`, `activo`.

### D3. Autorización por permisos, no por listas de roles

`roles-permisos/permisos.ts` define la matriz rol → permisos; cada ruta exige un permiso (`autorizar('espacios:gestionar')`).

| Permiso | ESTUDIANTE | PROFESOR | ADMINISTRADOR |
| :--- | :---: | :---: | :---: |
| `espacios:consultar` | ✓ | ✓ | ✓ |
| `reservas:crear`, `reservas:consultar-propias`, `reservas:cancelar-propias` | ✓ | ✓ | |
| `espacios:gestionar`, `reservas:consultar-todas`, `reservas:decidir`, `reservas:cancelar-cualquiera`, `usuarios:gestionar` | | | ✓ |

- *Alternativa descartada:* listas de roles en cada ruta (iteración 1). Dispersa la política y obliga a revisar todas las rutas cuando cambia un rol.

### D4. Autenticación: JWT con consulta de la cuenta en cada petición

El token solo contiene el identificador de la cuenta (`sub`). En cada petición, el middleware verifica la firma y la expiración con el reloj inyectado, carga la cuenta y toma su rol y su estado actuales, así que los cambios de rol y las desactivaciones tienen efecto inmediato. `JWT_SECRETO` es obligatorio en producción; en desarrollo se genera uno aleatorio por proceso y se muestra una advertencia.

- *Alternativa descartada:* confiar en el rol firmado en el token. Mantendría permisos obsoletos hasta que el token expire.

### D5. Contrato de errores

Formato `{ "error": { "codigo", "mensaje", "detalles"? } }`. Criterio: **400** = la petición está mal formada; **409** = choca con el estado actual de otro recurso; **422** = está bien formada pero viola una regla de negocio.

| HTTP | Códigos |
| :--- | :--- |
| 400 | `DATOS_INVALIDOS` |
| 401 | `NO_AUTENTICADO`, `CREDENCIALES_INVALIDAS` |
| 403 | `ACCESO_DENEGADO`, `CUENTA_INACTIVA` |
| 404 | `USUARIO_NO_ENCONTRADO`, `ESPACIO_NO_ENCONTRADO`, `RESERVA_NO_ENCONTRADA`, `RUTA_NO_ENCONTRADA` |
| 409 | `CORREO_YA_REGISTRADO`, `NOMBRE_ESPACIO_DUPLICADO`, `SOLICITUD_DUPLICADA`, `ESPACIO_NO_DISPONIBLE`, `CONFLICTO_HORARIO_USUARIO`, `TRANSICION_ESTADO_INVALIDA`, `AUTOMODIFICACION_NO_PERMITIDA` |
| 422 | `RANGO_HORARIO_INVALIDO`, `INICIO_EN_PASADO`, `BLOQUE_HORARIO_INVALIDO`, `ESPACIO_INACTIVO`, `CAPACIDAD_EXCEDIDA`, `SOLICITUD_VENCIDA`, `RESERVA_YA_INICIADA` |
| 500 | `ERROR_INTERNO` (sin detalles internos) |

### D6. Orden de las validaciones

Al **crear una solicitud**:

1. Forma de la petición (400).
2. `RANGO_HORARIO_INVALIDO` → `INICIO_EN_PASADO` → `BLOQUE_HORARIO_INVALIDO`.
3. `ESPACIO_NO_ENCONTRADO` → `ESPACIO_INACTIVO` → `CAPACIDAD_EXCEDIDA`.
4. Dentro de la sección crítica: `SOLICITUD_DUPLICADA` → `ESPACIO_NO_DISPONIBLE` → `CONFLICTO_HORARIO_USUARIO` → registro.

Las validaciones baratas y sin estado van primero; las que dependen de otras reservas se ejecutan dentro del bloqueo para que el resultado no cambie antes de escribir.

Al **aprobar** (bloqueo `espacio:<id>`): `RESERVA_NO_ENCONTRADA` → `TRANSICION_ESTADO_INVALIDA` → `SOLICITUD_VENCIDA` → `ESPACIO_INACTIVO` → `ESPACIO_NO_DISPONIBLE` (revalidación contra otras `APROBADA`).

Al **rechazar**: forma de la petición (motivo, 400) → `RESERVA_NO_ENCONTRADA` → `TRANSICION_ESTADO_INVALIDA`.

Al **cancelar**: `RESERVA_NO_ENCONTRADA` → `ACCESO_DENEGADO` (ni propietario ni `reservas:cancelar-cualquiera`) → motivo obligatorio si cancela el administrador (400) → `TRANSICION_ESTADO_INVALIDA` → `RESERVA_YA_INICIADA`. El estado se comprueba antes que la hora para que una reserva ya cerrada responda siempre 409, aunque su inicio haya pasado.

### D7. Concurrencia: mutex por clave con adquisición ordenada

`MutexPorClave.ejecutarExclusivo(claves, fn)` serializa las operaciones que comparten alguna clave. Crear una solicitud bloquea `espacio:<id>` y `usuario:<id>`; aprobar bloquea `espacio:<id>`. Las claves se adquieren en orden lexicográfico para evitar interbloqueos.

- *Alternativa descartada:* confiar en que el event loop no intercale las operaciones. Deja de ser cierto en cuanto el repositorio haga E/S real. Las pruebas usan un repositorio con latencia artificial para demostrar que sin el mutex se producen dobles reservas.
- *Alternativa descartada:* bloqueo optimista por versión. No expresa "intervalo libre" y requiere reintentos.
- *Límite:* solo vale dentro de un proceso. En producción, la garantía final es la restricción de exclusión de PostgreSQL (plan §3.3).

### D8. Máquina de estados centralizada

`src/dominio/estados-reserva.ts` define las transiciones permitidas (`PENDIENTE → APROBADA | RECHAZADA | CANCELADA`, `APROBADA → CANCELADA`) y crea cada entrada del historial. Aprobación, rechazo y cancelación la usan; ningún servicio cambia `estado` directamente. Así el historial no se puede omitir y las transiciones inválidas siempre responden 409.

### D9. Reloj inyectable

`Reloj = () => Date`. Lo usan todas las reglas temporales (inicio en el pasado, vencimiento, cancelación tardía) y la firma y verificación de tokens. Las pruebas fijan la fecha en 2030-01-07T08:00:00Z y la avanzan cuando el escenario lo exige.

### D10. Repositorios que devuelven copias

Los adaptadores en memoria guardan y devuelven `structuredClone` de las entidades, de modo que ningún servicio modifique el estado sin pasar por `actualizar`, igual que ocurriría con una base de datos.

### D11. Trazabilidad automatizada

Cada escenario tiene una prueba con el mismo nombre en `pruebas/<capacidad>*.test.ts`. `scripts/trazabilidad.ts` extrae los escenarios de `openspec/specs/` y de los cambios activos, los cruza con los títulos de las pruebas, genera `docs/TRAZABILIDAD.md` y termina con error si falta alguno.

## Riesgos / Compromisos

- [El mutex no protege varios procesos] → Documentado; en producción, restricción de exclusión en la base de datos.
- [Una solicitud `PENDIENTE` puede retener una franja indefinidamente] → El administrador la rechaza desde la bandeja; la expiración automática de pendientes queda como evolución.
- [Consultar la cuenta en cada petición añade una lectura] → Despreciable en memoria; en PostgreSQL es una búsqueda por clave primaria.
- [Los bloques fijos de 30 minutos pueden no ajustarse a toda actividad] → Constante única (`MINUTOS_POR_BLOQUE`) que se cambia mediante un nuevo cambio de OpenSpec.
- [Los datos se pierden al reiniciar] → Limitación aceptada en el plan (DT-04).

## Plan de migración

Se reemplaza `src/` de la iteración 1. No hay datos que migrar. Reversión: volver al commit `04ca2ef`.
