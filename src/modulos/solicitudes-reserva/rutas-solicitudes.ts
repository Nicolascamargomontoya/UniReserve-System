import { Router } from 'express';
import type { Servicios } from '../../contenedor.js';
import { autorizar, sesionDe } from '../roles-permisos/middleware-acceso.js';

export function rutasSolicitudes({ solicitudes }: Servicios): Router {
  const rutas = Router();

  rutas.post('/reservas', autorizar('reservas:crear'), async (peticion, respuesta) => {
    respuesta.status(201).json(await solicitudes.crear(sesionDe(peticion), peticion.body));
  });

  return rutas;
}
