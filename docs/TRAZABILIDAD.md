# Matriz de trazabilidad

Generada por `npm run trazabilidad -- --escribir` a partir de las especificaciones de OpenSpec y de los títulos de las pruebas. No se edita a mano.

**Escenarios:** 105 · **Con prueba:** 105 · **Sin prueba:** 0

| Capacidad | Escenarios | Con prueba | Módulo |
| :--- | ---: | ---: | :--- |
| aprobacion-reservas | 10 | 10 | `src/modulos/aprobacion-reservas/` |
| cancelacion-historial | 13 | 13 | `src/modulos/cancelacion-historial/` |
| disponibilidad | 9 | 9 | `src/modulos/disponibilidad/` |
| gestion-espacios | 15 | 15 | `src/modulos/gestion-espacios/` |
| gestion-usuarios | 17 | 17 | `src/modulos/gestion-usuarios/` |
| prevencion-conflictos | 5 | 5 | `src/modulos/prevencion-conflictos/` |
| roles-permisos | 15 | 15 | `src/modulos/roles-permisos/` |
| solicitudes-reserva | 21 | 21 | `src/modulos/solicitudes-reserva/` |

| Capacidad | Requisito | Escenario | Prueba | Estado |
| :--- | :--- | :--- | :--- | :---: |
| aprobacion-reservas | Bandeja de solicitudes pendientes | Pendientes en orden de llegada | `pruebas/aprobacion-reservas.test.ts` | ✅ |
| aprobacion-reservas | Aprobación de solicitudes | Aprobar una solicitud pendiente | `pruebas/aprobacion-reservas.test.ts` | ✅ |
| aprobacion-reservas | Aprobación de solicitudes | Aprobar una solicitud cuyo inicio ya pasó | `pruebas/aprobacion-reservas.test.ts` | ✅ |
| aprobacion-reservas | Aprobación de solicitudes | Aprobar una solicitud de un espacio desactivado | `pruebas/aprobacion-reservas.test.ts` | ✅ |
| aprobacion-reservas | Rechazo con motivo | Rechazar con motivo | `pruebas/aprobacion-reservas.test.ts` | ✅ |
| aprobacion-reservas | Rechazo con motivo | Rechazar sin motivo | `pruebas/aprobacion-reservas.test.ts` | ✅ |
| aprobacion-reservas | Rechazo con motivo | El rechazo libera la franja | `pruebas/aprobacion-reservas.test.ts` | ✅ |
| aprobacion-reservas | Transiciones de decisión válidas | Aprobar una solicitud ya rechazada | `pruebas/aprobacion-reservas.test.ts` | ✅ |
| aprobacion-reservas | Transiciones de decisión válidas | Rechazar una reserva aprobada | `pruebas/aprobacion-reservas.test.ts` | ✅ |
| aprobacion-reservas | Transiciones de decisión válidas | Decidir sobre una reserva inexistente | `pruebas/aprobacion-reservas.test.ts` | ✅ |
| cancelacion-historial | Cancelación por el solicitante | Cancelar una reserva aprobada propia | `pruebas/cancelacion-historial.test.ts` | ✅ |
| cancelacion-historial | Cancelación por el solicitante | La cancelación libera la franja | `pruebas/cancelacion-historial.test.ts` | ✅ |
| cancelacion-historial | Cancelación por el solicitante | Cancelar una reserva ajena | `pruebas/cancelacion-historial.test.ts` | ✅ |
| cancelacion-historial | Cancelación por el solicitante | Cancelar una reserva ya iniciada | `pruebas/cancelacion-historial.test.ts` | ✅ |
| cancelacion-historial | Cancelación por el solicitante | Cancelar una reserva ya cancelada | `pruebas/cancelacion-historial.test.ts` | ✅ |
| cancelacion-historial | Cancelación administrativa | El administrador cancela con motivo | `pruebas/cancelacion-historial.test.ts` | ✅ |
| cancelacion-historial | Cancelación administrativa | El administrador cancela sin motivo | `pruebas/cancelacion-historial.test.ts` | ✅ |
| cancelacion-historial | Registro inmutable de cambios de estado | Historial de una reserva aprobada y cancelada | `pruebas/cancelacion-historial.test.ts` | ✅ |
| cancelacion-historial | Historial del solicitante | El historial incluye todos los estados | `pruebas/cancelacion-historial.test.ts` | ✅ |
| cancelacion-historial | Historial del solicitante | Filtrar el historial por estado | `pruebas/cancelacion-historial.test.ts` | ✅ |
| cancelacion-historial | Historial del solicitante | Consultar el detalle de una reserva ajena | `pruebas/cancelacion-historial.test.ts` | ✅ |
| cancelacion-historial | Consulta administrativa del historial | Filtrar por espacio y estado | `pruebas/cancelacion-historial.test.ts` | ✅ |
| cancelacion-historial | Consulta administrativa del historial | Filtrar por rango de fechas | `pruebas/cancelacion-historial.test.ts` | ✅ |
| disponibilidad | Definición de disponibilidad | Reserva contigua permitida | `pruebas/disponibilidad.test.ts` | ✅ |
| disponibilidad | Definición de disponibilidad | Las reservas rechazadas o canceladas no ocupan la franja | `pruebas/disponibilidad.test.ts` | ✅ |
| disponibilidad | Validación de disponibilidad al solicitar | Solapamiento con una reserva aprobada | `pruebas/disponibilidad.test.ts` | ✅ |
| disponibilidad | Validación de disponibilidad al solicitar | Solapamiento con una solicitud pendiente | `pruebas/disponibilidad.test.ts` | ✅ |
| disponibilidad | Consulta de ocupación de un espacio | Consultar la ocupación de un día | `pruebas/disponibilidad.test.ts` | ✅ |
| disponibilidad | Consulta de ocupación de un espacio | Los solicitantes no ven quién reservó | `pruebas/disponibilidad.test.ts` | ✅ |
| disponibilidad | Consulta de ocupación de un espacio | Rango de consulta invertido | `pruebas/disponibilidad.test.ts` | ✅ |
| disponibilidad | Consulta de ocupación de un espacio | Rango de consulta demasiado amplio | `pruebas/disponibilidad.test.ts` | ✅ |
| disponibilidad | Búsqueda de espacios disponibles | Buscar espacios libres en una franja | `pruebas/disponibilidad.test.ts` | ✅ |
| gestion-espacios | Registro de espacios | Registro exitoso de un laboratorio | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Registro de espacios | Tipo de espacio no permitido | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Registro de espacios | Capacidad no válida | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Nombre único de espacio | Nombre repetido con distinta escritura | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Edición de espacios | Actualizar la capacidad | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Edición de espacios | Renombrar con el nombre de otro espacio | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Edición de espacios | Editar un espacio inexistente | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Activación y desactivación de espacios | Desactivar un espacio | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Activación y desactivación de espacios | Las reservas existentes se conservan | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Activación y desactivación de espacios | Reactivar un espacio | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Consulta del catálogo | Filtrar por tipo y capacidad mínima | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Consulta del catálogo | Búsqueda por texto en el nombre | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Consulta del catálogo | Un solicitante no ve espacios inactivos | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Consulta del catálogo | El administrador incluye espacios inactivos | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-espacios | Consulta del catálogo | Consultar un espacio inexistente | `pruebas/gestion-espacios.test.ts` | ✅ |
| gestion-usuarios | Registro de cuentas | Registro exitoso de un estudiante | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Registro de cuentas | Registro de un profesor | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Registro de cuentas | Autorregistro como administrador | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Validación de los datos de registro | Correo ya registrado con distinta escritura | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Validación de los datos de registro | Correo con formato inválido | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Validación de los datos de registro | Contraseña demasiado corta | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Almacenamiento seguro de contraseñas | La contraseña no se guarda en texto plano | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Autenticación | Inicio de sesión exitoso | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Autenticación | Contraseña incorrecta | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Autenticación | Correo no registrado | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Autenticación | Cuenta desactivada | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Perfil propio | Consultar el perfil propio | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Perfil propio | Actualizar el nombre | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Administración de cuentas | Listar cuentas por rol | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Administración de cuentas | Desactivar una cuenta invalida su acceso | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Administración de cuentas | Reactivar una cuenta | `pruebas/gestion-usuarios.test.ts` | ✅ |
| gestion-usuarios | Administración de cuentas | Consultar una cuenta inexistente | `pruebas/gestion-usuarios.test.ts` | ✅ |
| prevencion-conflictos | Exclusividad del espacio ante solicitudes concurrentes | Cinco solicitudes simultáneas por la misma franja | `pruebas/prevencion-conflictos.test.ts` | ✅ |
| prevencion-conflictos | Exclusividad del solicitante | Mismo horario en otro espacio | `pruebas/prevencion-conflictos.test.ts` | ✅ |
| prevencion-conflictos | Exclusividad del solicitante | Solicitudes simultáneas del mismo usuario en espacios distintos | `pruebas/prevencion-conflictos.test.ts` | ✅ |
| prevencion-conflictos | Detección de solicitudes duplicadas | El mismo estudiante repite la solicitud | `pruebas/prevencion-conflictos.test.ts` | ✅ |
| prevencion-conflictos | Revalidación al aprobar | Datos inconsistentes al aprobar | `pruebas/prevencion-conflictos.test.ts` | ✅ |
| roles-permisos | Roles del sistema | Cada cuenta tiene un único rol | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Permisos de los solicitantes | Un estudiante intenta registrar un espacio | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Permisos de los solicitantes | Un profesor intenta aprobar una solicitud | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Permisos de los solicitantes | Un estudiante intenta listar las cuentas | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Permisos del administrador | El administrador consulta todas las reservas | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Permisos del administrador | El administrador intenta crear una solicitud | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Autenticación obligatoria | Petición sin token | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Autenticación obligatoria | Token alterado | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Autenticación obligatoria | Token expirado | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Asignación de roles | Promover un estudiante a administrador | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Asignación de roles | Asignar un rol inexistente | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Protección del acceso administrativo | El administrador intenta quitarse el rol | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Protección del acceso administrativo | El administrador intenta desactivarse | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Administrador inicial | Arranque sin administradores | `pruebas/roles-permisos.test.ts` | ✅ |
| roles-permisos | Administrador inicial | Arranque con un administrador existente | `pruebas/roles-permisos.test.ts` | ✅ |
| solicitudes-reserva | Creación de solicitudes | Solicitud válida | `pruebas/solicitudes-reserva.test.ts` | ✅ |
| solicitudes-reserva | Creación de solicitudes | Faltan datos obligatorios | `pruebas/solicitudes-reserva.test.ts` | ✅ |
| solicitudes-reserva | Formato de fechas con zona horaria | Fecha sin zona horaria | `pruebas/solicitudes-reserva.test.ts` | ✅ |
| solicitudes-reserva | Formato de fechas con zona horaria | Fecha con desplazamiento horario | `pruebas/solicitudes-reserva.test.ts` | ✅ |
| solicitudes-reserva | Intervalo de tiempo válido | Fin anterior o igual al inicio | `pruebas/solicitudes-reserva.test.ts` | ✅ |
| solicitudes-reserva | Intervalo de tiempo válido | Inicio en el pasado | `pruebas/solicitudes-reserva.test.ts` | ✅ |
| solicitudes-reserva | Bloques de 30 minutos | Hora fuera de bloque | `pruebas/solicitudes-reserva.test.ts` | ✅ |
| solicitudes-reserva | Bloques de 30 minutos | Bloque mínimo de 30 minutos | `pruebas/solicitudes-reserva.test.ts` | ✅ |
| solicitudes-reserva | Espacio válido y capacidad | Espacio inexistente | `pruebas/solicitudes-reserva.test.ts` | ✅ |
| solicitudes-reserva | Espacio válido y capacidad | Espacio inactivo | `pruebas/solicitudes-reserva.test.ts` | ✅ |
| solicitudes-reserva | Espacio válido y capacidad | Asistentes por encima de la capacidad | `pruebas/solicitudes-reserva.test.ts` | ✅ |
| solicitudes-reserva | Límite de cuatro horas consecutivas | Reserva de exactamente cuatro horas | `pruebas/solicitudes-reserva.horas-consecutivas.test.ts` | ✅ |
| solicitudes-reserva | Límite de cuatro horas consecutivas | Reserva individual de más de cuatro horas | `pruebas/solicitudes-reserva.horas-consecutivas.test.ts` | ✅ |
| solicitudes-reserva | Límite de cuatro horas consecutivas | Encadenar después de una reserva propia | `pruebas/solicitudes-reserva.horas-consecutivas.test.ts` | ✅ |
| solicitudes-reserva | Límite de cuatro horas consecutivas | Encadenar antes de una reserva propia | `pruebas/solicitudes-reserva.horas-consecutivas.test.ts` | ✅ |
| solicitudes-reserva | Límite de cuatro horas consecutivas | Completar el hueco entre dos reservas propias | `pruebas/solicitudes-reserva.horas-consecutivas.test.ts` | ✅ |
| solicitudes-reserva | Límite de cuatro horas consecutivas | Cadena de exactamente cuatro horas | `pruebas/solicitudes-reserva.horas-consecutivas.test.ts` | ✅ |
| solicitudes-reserva | Límite de cuatro horas consecutivas | Una pausa de 30 minutos corta la cadena | `pruebas/solicitudes-reserva.horas-consecutivas.test.ts` | ✅ |
| solicitudes-reserva | Límite de cuatro horas consecutivas | Otro espacio no se encadena | `pruebas/solicitudes-reserva.horas-consecutivas.test.ts` | ✅ |
| solicitudes-reserva | Límite de cuatro horas consecutivas | Las reservas canceladas o rechazadas no cuentan | `pruebas/solicitudes-reserva.horas-consecutivas.test.ts` | ✅ |
| solicitudes-reserva | Límite de cuatro horas consecutivas | Las reservas de otro usuario no se encadenan | `pruebas/solicitudes-reserva.horas-consecutivas.test.ts` | ✅ |
