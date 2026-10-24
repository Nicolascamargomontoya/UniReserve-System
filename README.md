# Sistema de Gestión de Reservas de Espacios Académicos

## Descripción
Este sistema permite la administración centralizada de reservas de espacios académicos (laboratorios, auditorios y salas de cómputo) para evitar conflictos de horarios y duplicidad de solicitudes.

## Instalación y Configuración

### Requisitos previos
- Node.js (v18+)
- npm

### Pasos de instalación
1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```

### Ejecución
Para ejecutar el servidor de desarrollo:
```bash
npm run dev # (Si nodemon está configurado) o npx ts-node src/index.ts
```

## Estructura del Proyecto
- `src/`: Código fuente del sistema.
  - `controllers/`: Controladores de rutas.
  - `services/`: Lógica de negocio.
  - `repositories/`: Abstracción de acceso a datos.
  - `models/`: Definiciones de tipos.
  - `middleware/`: Autenticación y control de acceso.
- `openspec/`: Especificaciones formales y plan de implementación.
- `tests/`: Pruebas de verificación del sistema.
- `PLAN_INGENIERIA.md`: Planificación técnica inicial.
- `INFORME_FINAL.md`: Análisis de resultados y conclusiones.
