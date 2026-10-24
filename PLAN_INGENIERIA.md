# Plan de Ingeniería de Software: Sistema de Gestión de Reservas de Espacios Académicos

## 1. Análisis del Problema

### Identificación de la problemática
La institución universitaria carece de un sistema automatizado para la reserva de espacios académicos (laboratorios, auditorios y salas de cómputo). El proceso actual depende de comunicaciones informales (correos electrónicos) y herramientas manuales (hojas de cálculo), lo que conlleva a:
- **Conflictos de horario:** Múltiples solicitudes para el mismo espacio en el mismo tiempo.
- **Opacidad de disponibilidad:** Dificultad para que los usuarios sepan qué espacios están libres sin consultar al administrador.
- **Ineficiencia administrativa:** Sobrecarga de trabajo para el personal encargado de coordinar las reservas manualmente.
- **Falta de trazabilidad:** Dificultad para generar reportes de uso de los espacios.

### Necesidades de la institución
- Centralización de todas las solicitudes de reserva.
- Validación automática de disponibilidad en tiempo real.
- Gestión de permisos basada en roles (estudiantes, profesores, administradores).
- Flujo de aprobación formal para las solicitudes.
- Historial de reservas para auditoría y planificación.

### Actores involucrados
- **Solicitante (Estudiante/Profesor):** Usuario que requiere un espacio para una actividad académica. Puede buscar disponibilidad, crear solicitudes y gestionar sus propias reservas.
- **Administrador de Espacios:** Usuario con permisos para gestionar el catálogo de espacios, aprobar o rechazar solicitudes, y supervisar la ocupación general.
- **Sistema:** Encargado de ejecutar las validaciones de negocio y notificar los estados de las solicitudes.

### Alcance y limitaciones
**Alcance:**
- Gestión de catálogo de espacios (nombre, capacidad, equipamiento, ubicación).
- Gestión de usuarios y autenticación.
- Proceso de solicitud $\rightarrow$ Validación $\rightarrow$ Aprobación $\rightarrow$ Confirmación.
- Control de colisiones horarias.

**Limitaciones:**
- El sistema no gestionará la reserva de equipos móviles (solo espacios fijos).
- No se integrará inicialmente con calendarios externos (Google Calendar/Outlook), aunque se dejará la arquitectura abierta para ello.
- El sistema no gestionará el acceso físico (llaves electrónicas), solo la reserva administrativa.

---

## 2. Propuesta de Solución

### Descripción general
Se propone el desarrollo de una aplicación web centralizada donde los usuarios puedan visualizar un catálogo de espacios y solicitar reservas mediante un formulario electrónico. El sistema validará automáticamente que el espacio esté disponible en el rango horario solicitado antes de enviar la solicitud al administrador para su aprobación final.

### Funcionalidades prioritarias
1. **Gestión de Espacios:** CRUD de laboratorios, auditorios y salas.
2. **Autenticación y Perfiles:** Registro de usuarios y asignación de roles.
3. **Flujo de Reservas:** Creación de solicitudes con validación de disponibilidad.
4. **Panel de Administración:** Interfaz para aprobar/rechazar reservas rápidamente.
5. **Consulta de Disponibilidad:** Vista de calendario o lista de espacios libres.

### Organización del sistema en módulos
- **Módulo de Identidad:** Manejo de usuarios, roles y permisos (Auth).
- **Módulo de Catálogo:** Gestión de la información de los espacios académicos.
- **Módulo de Reservas:** Lógica de negocio para la creación, validación y gestión del ciclo de vida de la reserva.
- **Módulo de Notificaciones:** Alertas sobre cambios de estado en las solicitudes (estatus: Pendiente, Aprobado, Rechazado).

### Estrategia de desarrollo progresivo
El proyecto se desarrollará en iteraciones funcionales:
1. **MVP 1 (Core):** Gestión de usuarios y catálogo de espacios básicos.
2. **MVP 2 (Flujo Básico):** Creación de reservas y validación de colisiones.
3. **MVP 3 (Gestión):** Flujo de aprobación administrativa y estados de reserva.
4. **MVP 4 (Refinamiento):** Historial, cancelaciones y optimización de UI.

---

## 3. Decisiones de Arquitectura y Tecnología

### Arquitectura seleccionada
Se implementará una **Arquitectura en Capas (Layered Architecture)** para separar las responsabilidades:
- **Capa de Presentación (API/UI):** Maneja las peticiones HTTP y la respuesta al usuario.
- **Capa de Servicio (Business Logic):** Donde reside la lógica de negocio (ej. "no permitir reservas duplicadas").
- **Capa de Acceso a Datos (Repository):** Abstrae la comunicación con la base de datos.

**Justificación:** Esta arquitectura facilita las pruebas unitarias, permite cambiar la base de datos sin afectar la lógica de negocio y es escalable para el tamaño del proyecto.

### Stack tecnológico propuesto
- **Lenguaje:** TypeScript (para garantizar robustez mediante tipado estático).
- **Entorno de Ejecución:** Node.js con Express (estándar de la industria, rápido desarrollo).
- **Base de Datos:** PostgreSQL (Base de datos relacional esencial para manejar transacciones ACID y asegurar que no existan reservas simultáneas).
- **Control de Versiones:** Git y GitHub.
- **Documentación y Especificación:** OpenSpec.

### Estrategia de persistencia de datos
Se utilizará un modelo relacional para asegurar la integridad referencial:
- **Tablas principales:** `Users`, `Roles`, `Spaces`, `Reservations`.
- **Restricciones:** Se utilizarán índices únicos y transacciones de base de datos para evitar que dos registros de reserva se solapen en el mismo espacio y tiempo.

### Comparación de decisiones técnicas

| Decisión | Alternativa Descartada | Razón del Descarte |
| :--- | :--- | :--- |
| **PostgreSQL** | MongoDB | Las reservas requieren fuertes garantías de consistencia y transacciones ACID para evitar el "double-booking", algo nativo y más eficiente en SQL. |
| **TypeScript** | JavaScript | En un sistema de reservas, los errores de tipo en fechas o IDs pueden ser críticos. TypeScript reduce estos errores en tiempo de desarrollo. |
| **Layered Arch** | Monolito Simple | Un monolito sin capas dificulta la implementación de pruebas automatizadas y la evolución de reglas de negocio complejas. |

---

## 4. Estrategia de Desarrollo

### Metodología de trabajo
Se utilizará **Spec-Driven Development (SDD)**. Ninguna línea de código se escribirá sin que exista una especificación previa en OpenSpec que defina el comportamiento esperado y los criterios de aceptación.

### Etapas de implementación
1. **Planificación:** Definición de este documento (`PLAN_INGENIERIA.md`).
2. **Especificación:** Creación de specs en OpenSpec $\rightarrow$ Revisión $\rightarrow$ Aprobación.
3. **Implementación:** Desarrollo asistido por IA siguiendo estrictamente las specs.
4. **Verificación:** Pruebas automatizadas basadas en los escenarios de aceptación.

### Orden de desarrollo de funcionalidades
1. Usuarios y Roles $\rightarrow$ 2. Catálogo de Espacios $\rightarrow$ 3. Motor de Validación de Disponibilidad $\rightarrow$ 4. Proceso de Reserva $\rightarrow$ 5. Panel de Administración $\rightarrow$ 6. Historial y Reportes.

### Criterios de terminación (Definition of Done)
Una funcionalidad se considera terminada cuando:
- Existe una especificación revisada en OpenSpec.
- El código implementa la funcionalidad sin errores.
- Todas las pruebas automatizadas (unitarias e integración) pasan exitosamente.
- Se ha verificado que no rompe funcionalidades previas (regresión).

---

## 5. Estrategia de Calidad

### Tipos de pruebas
- **Pruebas Unitarias:** Para validar la lógica de cálculo de disponibilidad y validaciones de fechas.
- **Pruebas de Integración:** Para asegurar que el flujo Solicitud $\rightarrow$ DB $\rightarrow$ Aprobación funcione correctamente.
- **Pruebas de Aceptación (E2E):** Basadas en los escenarios definidos en OpenSpec.

### Gestión de Riesgos

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| **Reservas simultáneas** | Alto | Implementar transacciones SQL y bloqueos optimistas/pesimistas en la base de datos. |
| **Uso incorrecto de IA** | Medio | Revisión humana obligatoria de cada commit y validación contra la spec. |
| **Ambigüedad en requisitos** | Medio | Proceso de revisión formal de especificaciones antes de codificar. |
| **Carga excesiva del servidor** | Bajo | Implementar paginación en las consultas de espacios y reservas. |
| **Pérdida de datos** | Alto | Estrategia de backups periódicos de la base de datos. |

---

## 6. Uso de SDD e Inteligencia Artificial

### Implementación de OpenSpec
- **Conversión:** El `PLAN_INGENIERIA.md` servirá como fuente para crear "Feature Specs" detalladas en OpenSpec.
- **Flujo:** Spec $\rightarrow$ Task $\rightarrow$ Code $\rightarrow$ Test.

### Delegación a la IA
- **IA:** Generación de código boilerplate, implementación de funciones basadas en specs, creación de casos de prueba unitarios.
- **Estudiante:** Definición de la arquitectura, redacción y revisión de especificaciones, validación final del código, decisiones de seguridad y diseño de base de datos.

### Verificación del código generado
Cada fragmento de código generado por la IA será sometido a:
1. **Revisión Estática:** Análisis de tipos y estructura.
2. **Pruebas Automatizadas:** Ejecución de tests basados en los criterios de aceptación de la spec.
3. **Prueba Manual:** Verificación del flujo en el entorno de desarrollo.
