import express, { type Express } from 'express';
import type { Contenedor } from './contenedor.js';
import { manejadorDeErrores, rutaNoEncontrada } from './compartido/http.js';

export function crearApp(_contenedor: Contenedor): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  app.use(rutaNoEncontrada);
  app.use(manejadorDeErrores);
  return app;
}
