import { Router } from 'express';
import { idDeRuta } from '../../compartido/http.js';
import type { Servicios } from '../../contenedor.js';
import { autorizar, sesionDe } from './middleware-acceso.js';

export function rutasRoles({ roles }: Servicios): Router {
  const rutas = Router();

  rutas.patch('/usuarios/:id/rol', autorizar('usuarios:gestionar'), async (peticion, respuesta) => {
    respuesta.json(await roles.cambiarRol(sesionDe(peticion).usuarioId, idDeRuta(peticion), peticion.body));
  });

  return rutas;
}
