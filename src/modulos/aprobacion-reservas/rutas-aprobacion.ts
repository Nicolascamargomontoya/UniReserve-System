import { Router } from 'express';
import { idDeRuta } from '../../compartido/http.js';
import type { Servicios } from '../../contenedor.js';
import { autorizar, sesionDe } from '../roles-permisos/middleware-acceso.js';

// Se monta antes que las rutas de cancelacion-historial para que /reservas/pendientes no se lea como /reservas/:id.
export function rutasAprobacion({ aprobacion }: Servicios): Router {
  const rutas = Router();

  rutas.get('/reservas/pendientes', autorizar('reservas:decidir'), async (_peticion, respuesta) => {
    respuesta.json(await aprobacion.pendientes());
  });

  rutas.patch('/reservas/:id/aprobar', autorizar('reservas:decidir'), async (peticion, respuesta) => {
    respuesta.json(await aprobacion.aprobar(sesionDe(peticion).usuarioId, idDeRuta(peticion)));
  });

  rutas.patch('/reservas/:id/rechazar', autorizar('reservas:decidir'), async (peticion, respuesta) => {
    respuesta.json(await aprobacion.rechazar(sesionDe(peticion).usuarioId, idDeRuta(peticion), peticion.body));
  });

  return rutas;
}
