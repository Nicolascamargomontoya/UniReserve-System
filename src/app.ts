import express, { type Express } from 'express';
import type { Contenedor } from './contenedor.js';
import { manejadorDeErrores, rutaNoEncontrada } from './compartido/http.js';
import { rutasAprobacion } from './modulos/aprobacion-reservas/rutas-aprobacion.js';
import { rutasHistorial } from './modulos/cancelacion-historial/rutas-historial.js';
import { rutasDisponibilidad } from './modulos/disponibilidad/rutas-disponibilidad.js';
import { rutasEspacios } from './modulos/gestion-espacios/rutas-espacios.js';
import { rutasAutenticacion, rutasUsuarios } from './modulos/gestion-usuarios/rutas-usuarios.js';
import { autenticar } from './modulos/roles-permisos/middleware-acceso.js';
import { rutasRoles } from './modulos/roles-permisos/rutas-roles.js';
import { rutasSolicitudes } from './modulos/solicitudes-reserva/rutas-solicitudes.js';

export function crearApp({ servicios }: Contenedor): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  // Públicas: registro e inicio de sesión.
  app.use(rutasAutenticacion(servicios));

  // Todo lo demás exige token (roles-permisos: Autenticación obligatoria).
  app.use(autenticar(servicios.autenticacion));
  app.use(rutasUsuarios(servicios));
  app.use(rutasRoles(servicios));
  app.use(rutasDisponibilidad(servicios)); // antes que rutasEspacios: /espacios/disponibles
  app.use(rutasEspacios(servicios));
  app.use(rutasSolicitudes(servicios));
  app.use(rutasAprobacion(servicios)); // antes que rutasHistorial: /reservas/pendientes
  app.use(rutasHistorial(servicios));

  app.use(rutaNoEncontrada);
  app.use(manejadorDeErrores);
  return app;
}
