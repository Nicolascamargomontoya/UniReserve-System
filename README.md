# UniReserve — Sistema de Gestión de Reservas de Espacios Académicos

API REST que centraliza la reserva de laboratorios, auditorios y salas de cómputo de una institución universitaria. Reemplaza el correo y la hoja de cálculo para evitar solicitudes duplicadas, dobles asignaciones y la falta de trazabilidad.

El proyecto se desarrolló con **Spec-Driven Development (SDD) y OpenSpec**: plan de ingeniería → especificaciones revisadas → implementación asistida por IA → verificación automática de que cada escenario tiene su prueba.

| Documento | Contenido |
| :--- | :--- |
| [`PLAN_INGENIERIA.md`](PLAN_INGENIERIA.md) | Planificación y justificación técnica (previa a las especificaciones). |
| [`openspec/`](openspec/) | Especificaciones vigentes (`specs/`) y cambios con propuesta, diseño, tareas y revisión (`changes/`). |
| [`docs/TRAZABILIDAD.md`](docs/TRAZABILIDAD.md) | Matriz requisito → escenario → prueba → módulo, generada automáticamente. |
| [`INFORME_FINAL.md`](INFORME_FINAL.md) | Resultados, dificultades, decisiones modificadas y conclusiones sobre SDD. |

## Módulos

| # | Módulo | Capacidad OpenSpec | Código | Pruebas |
| :--- | :--- | :--- | :--- | :--- |
| M1 | Gestión de espacios académicos | `gestion-espacios` | `src/modulos/gestion-espacios/` | `pruebas/gestion-espacios.test.ts` |
| M2 | Registro y administración de usuarios | `gestion-usuarios` | `src/modulos/gestion-usuarios/` | `pruebas/gestion-usuarios.test.ts` |
| M3 | Roles y permisos | `roles-permisos` | `src/modulos/roles-permisos/` | `pruebas/roles-permisos.test.ts` |
| M4 | Creación de solicitudes de reserva | `solicitudes-reserva` | `src/modulos/solicitudes-reserva/` | `pruebas/solicitudes-reserva.test.ts` |
| M5 | Validación de disponibilidad | `disponibilidad` | `src/modulos/disponibilidad/` | `pruebas/disponibilidad.test.ts` |
| M6 | Prevención de reservas simultáneas | `prevencion-conflictos` | `src/modulos/prevencion-conflictos/` | `pruebas/prevencion-conflictos.test.ts` |
| M7 | Aprobación y rechazo de solicitudes | `aprobacion-reservas` | `src/modulos/aprobacion-reservas/` | `pruebas/aprobacion-reservas.test.ts` |
| M8 | Cancelación e historial de reservas | `cancelacion-historial` | `src/modulos/cancelacion-historial/` | `pruebas/cancelacion-historial.test.ts` |

## Reglas de negocio principales

- Las fechas van en ISO-8601 **con zona horaria** y en **bloques de 30 minutos**; solo se reserva a futuro.
- Toda solicitud nueva queda `PENDIENTE`. Las reservas `PENDIENTE` y `APROBADA` ocupan la franja: atiende primero quien solicita primero.
- Los intervalos son semiabiertos `[inicio, fin)`: una reserva de 10:00 a 12:00 no choca con otra de 12:00 a 14:00.
- Un espacio no puede tener dos reservas activas solapadas, y un usuario tampoco, ni siquiera con solicitudes simultáneas.
- Solo el administrador aprueba o rechaza (el rechazo exige motivo). El solicitante cancela antes del inicio; el administrador puede cancelar cualquier reserva indicando un motivo.
- **CR-01 — máximo 4 horas consecutivas:** ningún usuario puede reservar un mismo espacio más de 4 horas seguidas, contando sus reservas activas contiguas en ese espacio. Exactamente 4 horas sí se permite; una pausa de 30 minutos corta la cadena.

  ```json
  HTTP 422
  {"error":{"codigo":"LIMITE_HORAS_CONSECUTIVAS","mensaje":"Ningún usuario puede reservar un mismo espacio más de 4 horas consecutivas.","detalles":{"inicioBloque":"2030-11-03T09:00:00.000Z","finBloque":"2030-11-03T14:00:00.000Z","horas":5}}}
  ```

## Instalación

Requisitos: **Node.js 22.12 o superior** y npm.

```bash
git clone https://github.com/Nicolascamargomontoya/UniReserve-System.git
cd UniReserve-System
npm install
```

## Configuración

Copie `.env.example` como `.env` y ajuste los valores. Todas las variables son opcionales en desarrollo; en producción (`NODE_ENV=production`) `JWT_SECRETO` y `ADMIN_CONTRASENA` son obligatorias.

| Variable | Por defecto | Descripción |
| :--- | :--- | :--- |
| `PUERTO` | `3000` | Puerto HTTP. |
| `JWT_SECRETO` | aleatorio por proceso | Secreto para firmar los tokens de acceso. |
| `JWT_DURACION_SEGUNDOS` | `3600` | Vigencia del token. |
| `BCRYPT_RONDAS` | `10` | Costo del hash de contraseñas. |
| `ADMIN_CORREO` / `ADMIN_CONTRASENA` / `ADMIN_NOMBRE` | `admin@uni.edu` / `Admin12345` / `Administrador del sistema` | Administrador inicial, que se crea al arrancar si no existe ninguno. |

> La persistencia es en memoria (decisión DT-04 del plan): los datos se pierden al reiniciar el servidor.

## Ejecución

```bash
npm run dev          # desarrollo, con recarga automática (tsx)
npm run build        # compila a dist/
npm start            # ejecuta la versión compilada
```

## Pruebas y verificación

```bash
npm test                    # 152 pruebas automatizadas (Vitest + Supertest)
npm run pruebas:cobertura   # pruebas con informe de cobertura (umbral: 85 % de líneas)
npm run tipos               # verificación de tipos (TypeScript strict)
npm run specs:validar       # openspec validate --all --strict
npm run trazabilidad        # falla si algún escenario de OpenSpec no tiene prueba
npm run verificar           # todo lo anterior, en orden
```

Cada escenario de las especificaciones tiene una prueba **con el mismo nombre** en `pruebas/<capacidad>.test.ts`. `npm run trazabilidad -- --escribir` regenera `docs/TRAZABILIDAD.md`.

## API

Todas las rutas, excepto `/auth/registro` y `/auth/inicio-sesion`, exigen la cabecera `Authorization: Bearer <token>`. Las fechas van en ISO-8601 **con zona horaria** y en bloques de 30 minutos. Los errores tienen la forma `{ "error": { "codigo", "mensaje", "detalles"? } }`.

| Método | Ruta | Quién |
| :--- | :--- | :--- |
| POST | `/auth/registro`, `/auth/inicio-sesion` | Público |
| GET, PATCH | `/usuarios/perfil` | Cualquier usuario |
| GET | `/usuarios`, `/usuarios/:id` | Administrador |
| PATCH | `/usuarios/:id/estado`, `/usuarios/:id/rol` | Administrador |
| GET | `/espacios`, `/espacios/:id`, `/espacios/disponibles`, `/espacios/:id/ocupacion` | Cualquier usuario |
| POST, PATCH | `/espacios`, `/espacios/:id`, `/espacios/:id/estado` | Administrador |
| POST | `/reservas` | Estudiante, profesor |
| GET | `/reservas/mias` | Estudiante, profesor |
| GET | `/reservas/:id` | Propietario o administrador |
| PATCH | `/reservas/:id/cancelar` | Propietario o administrador (con motivo) |
| GET | `/reservas`, `/reservas/pendientes` | Administrador |
| PATCH | `/reservas/:id/aprobar`, `/reservas/:id/rechazar` | Administrador |

El detalle de cada ruta, los códigos de error y el orden de las validaciones están en [`design.md` del cambio archivado](openspec/changes/archive/2026-10-24-crear-sistema-reservas/design.md).

### Flujo de ejemplo con curl

```bash
B=http://localhost:3000; J='Content-Type: application/json'

# Sesión del administrador inicial
ADMIN=$(curl -s -X POST $B/auth/inicio-sesion -H "$J" -d '{"correo":"admin@uni.edu","contrasena":"Admin12345"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# Registro e inicio de sesión de una estudiante
curl -s -X POST $B/auth/registro -H "$J" -d '{"correo":"ana@uni.edu","contrasena":"Segura123","nombreCompleto":"Ana Pérez","rol":"ESTUDIANTE"}'
ANA=$(curl -s -X POST $B/auth/inicio-sesion -H "$J" -d '{"correo":"ana@uni.edu","contrasena":"Segura123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# El administrador registra un espacio
ESP=$(curl -s -X POST $B/espacios -H "$J" -H "Authorization: Bearer $ADMIN" \
  -d '{"nombre":"Laboratorio de Redes","tipo":"LABORATORIO","capacidad":30,"ubicacion":"Bloque B, piso 2"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).id')

# La estudiante solicita (queda PENDIENTE); una solicitud solapada recibe 409 ESPACIO_NO_DISPONIBLE
RES=$(curl -s -X POST $B/reservas -H "$J" -H "Authorization: Bearer $ANA" \
  -d "{\"espacioId\":\"$ESP\",\"inicio\":\"2030-11-03T15:00:00Z\",\"fin\":\"2030-11-03T17:00:00Z\",\"proposito\":\"Práctica de redes\",\"asistentes\":25}" \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).id')

# El administrador aprueba; la estudiante consulta la ocupación, cancela y revisa su historial
curl -s -X PATCH $B/reservas/$RES/aprobar -H "Authorization: Bearer $ADMIN"
curl -s "$B/espacios/$ESP/ocupacion?desde=2030-11-03T00:00:00Z&hasta=2030-11-04T00:00:00Z" -H "Authorization: Bearer $ANA"
curl -s -X PATCH $B/reservas/$RES/cancelar -H "$J" -H "Authorization: Bearer $ANA" -d '{"motivo":"Cambio de fecha"}'
curl -s $B/reservas/mias -H "Authorization: Bearer $ANA"
```

## Estructura del proyecto

```
src/
├── app.ts · servidor.ts · configuracion.ts · contenedor.ts
├── dominio/          modelos y máquina de estados de la reserva
├── compartido/       errores, validación, tiempo, reloj, mutex por clave, HTTP
├── repositorios/     contratos + adaptador en memoria
└── modulos/          un directorio por módulo (M1–M8): servicios + rutas
pruebas/              un archivo por capacidad, pruebas unitarias y arnés
scripts/trazabilidad.ts
openspec/             config.yaml, specs/ (vigentes) y changes/ (propuestas, tareas, revisión, archivo)
docs/TRAZABILIDAD.md
```

## Proceso y evidencia en Git

El historial de commits muestra la secuencia exigida: plan (`docs(plan)`) → especificaciones (`spec:`) → revisión (`spec(revisión)`) → implementación por incrementos (`feat(...)`) → archivo del cambio (`spec(archivo)`) → gestión de cambios con especificación antes del código → cierre. Los commits `Stage 1`–`Stage 5` corresponden a la iteración 1, cuyos hallazgos se documentan en el plan (§7) y en el informe final.
