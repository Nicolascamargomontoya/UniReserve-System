# Tareas

Cada tarea indica el requisito que implementa y cómo se verifica. Un grupo se cierra cuando sus pruebas, `npm run tipos` y la suite completa están en verde.

## 1. Base técnica (Incremento 0)

- [x] 1.1 Reestructurar `package.json` (retirar `pg`, `uuid`, `ts-node`, `nodemon`; agregar Vitest, Supertest, tsx) y `tsconfig.json` en modo strict; verificar con `npm install` y `npm run tipos`.
- [x] 1.2 Eliminar el código de la iteración 1 (`src/controllers`, `src/services`, `src/middleware`, `src/models`, `src/repositories`, `src/index.ts`, `tests/`); verificar que `npm run tipos` no encuentra referencias.
- [x] 1.3 Implementar `src/compartido/` (errores tipados, validación, solapamiento y bloques, reloj, mutex por clave) según D5, D7 y D9; verificar con `pruebas/unitarias/tiempo.test.ts` y `pruebas/unitarias/mutex-por-clave.test.ts`.
- [x] 1.4 Implementar `configuracion.ts`, `contenedor.ts`, `app.ts` y `servidor.ts` con manejador de errores y ruta 404; verificar con `pruebas/unitarias/app.test.ts` (JSON inválido → 400, ruta inexistente → 404).
- [x] 1.5 Crear el arnés `pruebas/apoyo/app-de-prueba.ts` (reloj falso, administrador inicial, utilidades de registro e inicio de sesión); verificar con su uso en la prueba de la tarea 1.4.
- [x] 1.6 Implementar `scripts/trazabilidad.ts` (D11) y `npm run trazabilidad`; verificar que lista los escenarios del cambio y falla mientras falten pruebas.

## 2. Identidad (Incremento 1): gestion-usuarios y roles-permisos

- [x] 2.1 Modelo de usuario, repositorio en memoria con correo normalizado y hash de contraseñas (gestion-usuarios: Almacenamiento seguro de contraseñas); verificar con su escenario en `pruebas/gestion-usuarios.test.ts`.
- [x] 2.2 Registro y validación de datos (Registro de cuentas; Validación de los datos de registro); verificar con sus escenarios.
- [x] 2.3 Inicio de sesión con JWT firmado con el reloj inyectado (Autenticación); verificar con sus escenarios.
- [x] 2.4 Matriz de permisos y middleware `autenticar`/`autorizar` (roles-permisos: Roles del sistema; Autenticación obligatoria); verificar con sus escenarios en `pruebas/roles-permisos.test.ts`.
- [x] 2.5 Perfil propio y administración de cuentas (Perfil propio; Administración de cuentas) y roles-permisos: "Un estudiante intenta listar las cuentas"; verificar con sus escenarios.
- [x] 2.6 Asignación de roles y protección del acceso administrativo; verificar con sus escenarios.
- [x] 2.7 Administrador inicial al arrancar (Administrador inicial); verificar con sus escenarios.

## 3. Catálogo (Incremento 2): gestion-espacios

- [x] 3.1 Modelo de espacio y repositorio con nombre normalizado (Nombre único de espacio); verificar con su escenario en `pruebas/gestion-espacios.test.ts`.
- [x] 3.2 Registro y edición de espacios (Registro de espacios; Edición de espacios); verificar con sus escenarios.
- [x] 3.3 Activación y desactivación sin borrado (Activación y desactivación de espacios); verificar con sus escenarios, salvo "Las reservas existentes se conservan", que se completa en la tarea 5.2.
- [x] 3.4 Consulta del catálogo con filtros y visibilidad por rol (Consulta del catálogo); verificar con sus escenarios.
- [x] 3.5 roles-permisos: escenario "Un estudiante intenta registrar un espacio"; verificar con su prueba.

## 4. Motor de reservas (Incremento 3): solicitudes-reserva, disponibilidad y prevencion-conflictos

- [ ] 4.1 Modelo de reserva, máquina de estados (D8) y repositorio con filtro por solapamiento; verificar con `pruebas/unitarias/estados-reserva.test.ts`.
- [ ] 4.2 Servicio de disponibilidad (disponibilidad: Definición de disponibilidad; Validación de disponibilidad al solicitar); verificar con sus escenarios en `pruebas/disponibilidad.test.ts`.
- [ ] 4.3 Guardia de conflictos con mutex `[espacio, usuario]`, duplicados y exclusividad del solicitante (prevencion-conflictos); verificar con sus escenarios en `pruebas/prevencion-conflictos.test.ts`.
- [ ] 4.4 Creación de solicitudes con el orden de validación D6 (solicitudes-reserva, todos los requisitos); verificar con sus escenarios en `pruebas/solicitudes-reserva.test.ts`.
- [ ] 4.5 Consulta de ocupación y búsqueda de espacios disponibles; verificar con sus escenarios.
- [ ] 4.6 Prueba de mutación: desactivar temporalmente el mutex y comprobar que las pruebas de concurrencia fallan; registrar el resultado en `revision.md`.
- [ ] 4.7 roles-permisos: escenario "El administrador intenta crear una solicitud"; verificar con su prueba.

## 5. Gestión y trazabilidad (Incremento 4): aprobacion-reservas y cancelacion-historial

- [ ] 5.1 Bandeja de pendientes en orden de llegada (Bandeja de solicitudes pendientes); verificar con su escenario en `pruebas/aprobacion-reservas.test.ts`.
- [ ] 5.2 Aprobación con revalidación (Aprobación de solicitudes; prevencion-conflictos: Revalidación al aprobar); verificar con sus escenarios y con "Las reservas existentes se conservan" de gestion-espacios.
- [ ] 5.3 Rechazo con motivo y transiciones de decisión válidas; verificar con sus escenarios.
- [ ] 5.4 Cancelación por el solicitante y administrativa; verificar con sus escenarios en `pruebas/cancelacion-historial.test.ts`.
- [ ] 5.5 Registro inmutable de cambios de estado, historial del solicitante y consulta administrativa; verificar con sus escenarios.
- [ ] 5.6 roles-permisos: escenarios restantes (profesor intenta aprobar, administrador consulta todas las reservas, promoción a administrador); verificar con sus pruebas.

## 6. Verificación integral

- [ ] 6.1 Ejecutar `npm run verificar` (tipos, `openspec validate --strict`, pruebas con cobertura ≥ 85 % de líneas y trazabilidad sin escenarios faltantes); verificar que termina con código 0.
- [ ] 6.2 Recorrer el flujo completo contra el servidor real (`npm run dev` + curl: registro, espacio, solicitud, aprobación, cancelación, historial); verificar las respuestas y documentar los comandos en `README.md`.

## Workflow follow-up

- Archivar el cambio con `openspec archive crear-sistema-reservas` cuando todas las tareas estén completas.
- Verificar que `openspec/specs/` contiene las 8 capacidades y que `openspec validate --all --strict` pasa.
