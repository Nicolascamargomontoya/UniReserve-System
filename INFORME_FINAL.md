# Informe final — UniReserve: Sistema de Gestión de Reservas de Espacios Académicos

**Metodología:** Spec-Driven Development (SDD) con OpenSpec 1.15 y un agente de programación (Claude Code).
**Fecha de cierre:** 2026-10-24.

---

## 1. Resumen

El proyecto tuvo dos iteraciones. La **iteración 1** (commits `Stage 1`–`Stage 5`) produjo un prototipo con especificaciones fuera del formato de OpenSpec, sin pruebas automatizadas con framework y con defectos graves (sección 6). La **iteración 2** rehízo el proceso completo con la secuencia exigida: plan de ingeniería v2 → especificaciones OpenSpec → revisión formal → implementación por incrementos → gestión del cambio CR-01 mediante OpenSpec → verificación y cierre.

Resultado: una API REST con los **8 módulos** exigidos, **41 requisitos** y **105 escenarios** de aceptación vigentes, cada uno con su prueba automatizada (**152 pruebas** en total).

## 2. Resultados de la verificación

Comando de verificación integral: `npm run verificar`.

| Verificación | Herramienta | Resultado |
| :--- | :--- | :--- |
| Tipos (TypeScript strict) | `npm run tipos` | Sin errores |
| Especificaciones | `openspec validate --all --strict` | 8/8 capacidades válidas |
| Pruebas automatizadas | Vitest + Supertest | **152/152** en verde (15 archivos) |
| Cobertura | V8 | 99,4 % de líneas, 97,5 % de sentencias (umbral exigido: 85 %) |
| Trazabilidad escenario → prueba | `npm run trazabilidad` | **105/105** escenarios con prueba ([`docs/TRAZABILIDAD.md`](docs/TRAZABILIDAD.md)) |
| Prueba de mutación del mutex | Manual + prueba de control automatizada | Sin el mutex fallan los 2 escenarios de concurrencia (ver `revision.md` del cambio archivado) |
| Estabilidad de concurrencia | 8 ejecuciones repetidas | 8/8 en verde |
| Flujo completo contra el servidor real | `npm run build && npm start` + curl | Registro → espacio → solicitud → 409 por conflicto → aprobación → ocupación → cancelación → historial → 401 sin token; y 422 `LIMITE_HORAS_CONSECUTIVAS` |

## 3. Cumplimiento de requisitos por módulo

| Módulo | Capacidad | Requisitos | Escenarios | Con prueba |
| :--- | :--- | ---: | ---: | ---: |
| M1 Gestión de espacios académicos | `gestion-espacios` | 5 | 15 | 15 |
| M2 Registro y administración de usuarios | `gestion-usuarios` | 6 | 17 | 17 |
| M3 Roles y permisos | `roles-permisos` | 7 | 15 | 15 |
| M4 Creación de solicitudes de reserva (incluye CR-01) | `solicitudes-reserva` | 6 | 21 | 21 |
| M5 Validación de disponibilidad | `disponibilidad` | 4 | 9 | 9 |
| M6 Prevención de reservas simultáneas | `prevencion-conflictos` | 4 | 5 | 5 |
| M7 Aprobación y rechazo de solicitudes | `aprobacion-reservas` | 4 | 10 | 10 |
| M8 Cancelación e historial de reservas | `cancelacion-historial` | 5 | 13 | 13 |
| **Total** | | **41** | **105** | **105** |

Además de las pruebas de escenario hay 47 pruebas complementarias: unitarias (intervalos, mutex, máquina de estados, política de horas, configuración), de contrato de errores y de casos límite (filtros, ordenamientos, prueba de control sin mutex).

## 4. Correspondencia entre especificaciones y código

La correspondencia se mantuvo con tres mecanismos:

1. **Estructura 1:1:** cada capacidad de `openspec/specs/<capacidad>/` tiene su carpeta `src/modulos/<capacidad>/` y su archivo `pruebas/<capacidad>*.test.ts`. Cada servicio indica en comentarios el requisito que implementa.
2. **Nombres idénticos:** el título de cada prueba es exactamente el nombre del escenario. `scripts/trazabilidad.ts` cruza ambos y falla si falta alguno. Durante la implementación el contador pasó de 0/95 a 42, 67 y 95/95; al registrar CR-01 bajó a 95/105 (a propósito, antes del código) y volvió a 105/105 después de implementarlo.
3. **Revisión del diff contra la especificación:** no se aceptaron rutas, campos ni reglas sin requisito. Las pocas decisiones de detalle que surgieron (por ejemplo, que el inicio de sesión normalice el correo) se registraron en `revision.md`.

## 5. Dificultades encontradas y soluciones

| Dificultad | Solución |
| :--- | :--- |
| `node_modules` y `package-lock.json` venían de otra plataforma: el binario nativo de TypeScript 7 (`@typescript/typescript-darwin-arm64`) no existía y `tsc` no arrancaba. | Instalación limpia de dependencias; ni `node_modules` ni `dist` se versionan. |
| El repositorio versionaba la salida compilada (`.js`, `.d.ts`, `.map`) junto al código fuente. | `.gitignore` y limpieza en un commit independiente. |
| Las pruebas de concurrencia pasaban **incluso sin mutex**: con repositorios en memoria, el event loop no intercala las peticiones. | Repositorio con latencia artificial (`pruebas/apoyo/concurrencia.ts`) y una prueba de control que demuestra la doble reserva sin el mutex. |
| Al adelantar el reloj de prueba más de una hora, los tokens de 1 h expiraban y los escenarios fallaban por 401 en lugar de por la regla que se quería probar. | Tokens de 24 h en el arnés de pruebas; el escenario "Token expirado" fija explícitamente 1 h. |
| `/espacios/disponibles` y `/reservas/pendientes` se confundían con `/espacios/:id` y `/reservas/:id`. | Orden de montaje explícito y documentado en `app.ts`. |
| Express 5 tipa `req.params` como `string \| string[]`. | Función `idDeRuta` que valida el parámetro. |
| OpenSpec exige palabras clave en inglés (`Requirement`, `Scenario`, `SHALL/MUST`) aunque el proyecto está en español. | Se configuró `--language es`: contenido en español y solo las palabras clave estructurales en inglés. |
| Ambigüedad de "cuatro horas consecutivas" en CR-01. | Análisis en `proposal.md`: se adoptó la lectura de bloque continuo para cerrar el resquicio de dividir la reserva. |

## 6. Decisiones técnicas que cambiaron durante el desarrollo

| Decisión original | Decisión final | Motivo |
| :--- | :--- | :--- |
| PostgreSQL como persistencia (plan v1). | Repositorio en memoria tras interfaces; PostgreSQL documentado como destino, con DDL y restricción de exclusión (plan v2, DT-04). | Ejecución y pruebas sin infraestructura; la arquitectura permite migrar sin tocar servicios. |
| Solo las reservas aprobadas bloqueaban la franja y la aprobación no revalidaba (iteración 1). | `PENDIENTE` y `APROBADA` ocupan la franja; la aprobación revalida contra otras `APROBADA` (DT-08). | Con la regla anterior, dos pendientes solapadas podían aprobarse ambas: doble reserva. |
| El registro aceptaba cualquier rol, incluido administrador (iteración 1). | Autorregistro solo como `ESTUDIANTE` o `PROFESOR`; el rol de administrador lo asigna otro administrador; existe un administrador inicial. | Escalamiento de privilegios. |
| El secreto JWT estaba fijo en el código y el rol se leía del token. | Secreto por variable de entorno (obligatorio en producción); el rol y el estado se leen del almacén en cada petición (DT-05). | Seguridad, y que los cambios de rol y las desactivaciones tengan efecto inmediato. |
| Script manual con `console.log` como prueba. | Vitest + Supertest, un archivo por capacidad y trazabilidad automática (DT-07). | Aislamiento de casos, cobertura y verificación de requisitos. |
| Módulo de notificaciones (plan v1). | Retirado del alcance. | No es requisito mínimo; el estado se consulta en el historial. |
| CommonJS, `ts-node`, `nodemon`, `uuid`, `pg`. | ESM, `tsx`, `crypto.randomUUID()`; dependencias sin uso retiradas. | Menos dependencias y compatibilidad con TypeScript 7 y Vitest. |
| Identificadores, rutas y códigos en inglés (borrador de especificaciones). | Todo en español (plan v2.1), decidido en la revisión de especificaciones, antes de escribir código. | El equipo, la institución y la sustentación son hispanohablantes. |
| Regla de 4 horas como duración máxima de cada reserva (iteración 1). | Bloque continuo de reservas activas contiguas del mismo usuario en el mismo espacio (CR-01). | La lectura literal se eludía dividiendo la reserva en dos. |

## 7. Gestión del cambio CR-01 (regla de cuatro horas)

| Paso exigido | Evidencia |
| :--- | :--- |
| 1. Analizar el impacto | `openspec/changes/archive/2026-10-24-limitar-horas-consecutivas/proposal.md`: impacto por capacidad, interpretación de la regla y efecto en los datos. |
| 2. Revisar el plan de ingeniería | PLAN_INGENIERIA v2.2: regla RN-13 y entrada CR-01; sin cambios de arquitectura. |
| 3. Actualizar las especificaciones con OpenSpec | Delta `ADDED` en `solicitudes-reserva`, validado con `--strict`. Commit `1f4988e`, **sin código**. |
| 4. Definir escenarios de aceptación | 10 escenarios: límites exactos, encadenamiento antes, después y en huecos, pausa, otro espacio, otro usuario, reservas canceladas o rechazadas. |
| 5. Implementar | Commit `9edbf25`: política aislada `politica-horas-consecutivas.ts` y dos puntos de verificación. |
| 6. Crear las pruebas | 10 escenarios, 1 prueba concurrente y 4 unitarias. |
| 7. Verificar que no se afectó lo existente | Las 137 pruebas previas siguieron en verde sin modificarse; `revision.md` anticipó que ninguna construía cadenas de más de 4 horas. |
| Archivo | Commit `f10d8f4`: el requisito pasa a la especificación vigente. |

## 8. Uso de la inteligencia artificial

**Delegado al agente:** borradores de especificaciones a partir del plan, código de cada incremento siguiendo `tasks.md`, pruebas a partir de los escenarios, ejecución de validaciones y redacción de documentación.

**Controles aplicados:**

- El agente solo implementó tareas de `tasks.md`, en orden, con un commit por incremento.
- Cada prueba debía tener el nombre exacto de un escenario; la trazabilidad automática impidió que hubiera escenarios sin probar o pruebas que inventaran reglas.
- Prueba de mutación sobre el mecanismo más crítico (el mutex), para comprobar que las pruebas detectan su ausencia.
- Revisión humana del diff contra la especificación, y TypeScript strict como primera barrera.

**Decisiones del estudiante:** alcance y limitaciones, arquitectura, reglas de negocio (`PENDIENTE` bloquea, bloques de 30 minutos, intervalos semiabiertos), interpretación de CR-01, idioma del proyecto y decisiones de seguridad.

## 9. Conclusiones sobre SDD con OpenSpec

**Ventajas observadas:**

- **Los defectos aparecieron antes del código.** La revisión de especificaciones detectó 10 ambigüedades y contradicciones de la iteración 1, entre ellas la doble reserva y el autorregistro como administrador, que en la iteración 1 llegaron al código.
- **El alcance de la IA quedó acotado.** Con escenarios concretos (valores, códigos HTTP y de error), el agente tuvo un criterio objetivo de "terminado", y la trazabilidad automática lo hizo verificable.
- **Cambios controlados.** CR-01 tocó un solo requisito, una política nueva y 15 pruebas nuevas, sin modificar ninguna prueba existente. El historial de Git muestra la especificación antes que el código.
- **Documentación viva.** `openspec/specs/` describe el comportamiento real del sistema y el archivo conserva el porqué de cada cambio.

**Limitaciones observadas:**

- **Costo inicial alto:** plan, especificaciones y revisión antes de la primera línea de código útil.
- **El formato no garantiza la calidad:** `openspec validate` comprueba la estructura, no si los requisitos son correctos. Las especificaciones de la iteración 1 eran ambiguas y aun así habrían podido pasar una validación de formato.
- **Riesgo de duplicación:** la especificación, el diseño y las pruebas repiten información. Sin la verificación automática de trazabilidad podrían divergir.
- **Fricción de idioma:** las palabras clave estructurales deben quedar en inglés.

**Frente a dar instrucciones directas a una IA:** las instrucciones directas son más rápidas para prototipos, pero producen lo que se observó en la iteración 1: reglas implícitas, decisiones inseguras que nadie revisó y ninguna forma objetiva de saber qué se cumple. Con SDD, la IA deja de decidir el *qué* y se limita al *cómo*, dentro de límites verificables.

## 10. Preparación para la sustentación

1. **¿Qué decisiones de ingeniería tomó antes de programar?** Monolito modular en capas con 8 módulos alineados a capacidades; repositorio en memoria tras interfaces con PostgreSQL como destino; TypeScript strict; JWT con consulta de la cuenta en cada petición; mutex por clave para la concurrencia; `PENDIENTE` bloquea la franja; intervalos semiabiertos y bloques de 30 minutos (PLAN_INGENIERIA §3.5, DT-01 a DT-09).
2. **¿Qué problemas identificó al transformar la propuesta en especificaciones?** Las 10 ambigüedades y contradicciones de `revision.md` (por ejemplo, la contigüidad, la zona horaria, quién cancela y hasta cuándo, y el borrado frente a la desactivación), además de la interpretación de "consecutivas" en CR-01.
3. **¿Cómo evitó que la IA implementara funcionalidades incorrectas?** Especificaciones revisadas antes del código, tareas que citan su requisito, pruebas con el nombre exacto del escenario, trazabilidad automática, prueba de mutación y revisión del diff.
4. **¿Qué diferencias hubo entre la planificación y la implementación?** Las de la sección 6. Las principales: persistencia en memoria en lugar de PostgreSQL, el retiro del módulo de notificaciones, el paso a español y la interpretación ampliada de la regla de 4 horas.
5. **¿Ventajas y limitaciones de SDD con OpenSpec?** Sección 9.

## 11. Trabajo futuro

- Adaptador PostgreSQL con la restricción de exclusión del plan (§3.3) y pruebas de integración contra la base de datos.
- Expiración automática de solicitudes pendientes y notificaciones por correo.
- Interfaz web para solicitantes y administradores.
- Integración continua en GitHub Actions ejecutando `npm run verificar` en cada push.
