import { Router } from 'express';
import { TIPOS_ESPACIO } from '../../dominio/modelos.js';
import { idDeRuta } from '../../compartido/http.js';
import { parametroBooleano, parametroEntero, parametroOpcion, parametroTexto, type Datos } from '../../compartido/validacion.js';
import type { Servicios } from '../../contenedor.js';
import { autorizar, sesionDe } from '../roles-permisos/middleware-acceso.js';
import { tienePermiso } from '../roles-permisos/permisos.js';

export function rutasEspacios({ espacios }: Servicios): Router {
  const rutas = Router();

  rutas.get('/espacios', autorizar('espacios:consultar'), async (peticion, respuesta) => {
    const consulta = peticion.query as Datos;
    const filtro = {
      tipo: parametroOpcion(consulta, 'tipo', TIPOS_ESPACIO),
      capacidadMinima: parametroEntero(consulta, 'capacidadMinima'),
      texto: parametroTexto(consulta, 'texto'),
      incluirInactivos: parametroBooleano(consulta, 'incluirInactivos'),
    };
    respuesta.json(await espacios.listar(filtro, tienePermiso(sesionDe(peticion).rol, 'espacios:gestionar')));
  });

  rutas.post('/espacios', autorizar('espacios:gestionar'), async (peticion, respuesta) => {
    respuesta.status(201).json(await espacios.crear(peticion.body));
  });

  rutas.get('/espacios/:id', autorizar('espacios:consultar'), async (peticion, respuesta) => {
    respuesta.json(await espacios.obtener(idDeRuta(peticion)));
  });

  rutas.patch('/espacios/:id', autorizar('espacios:gestionar'), async (peticion, respuesta) => {
    respuesta.json(await espacios.actualizar(idDeRuta(peticion), peticion.body));
  });

  rutas.patch('/espacios/:id/estado', autorizar('espacios:gestionar'), async (peticion, respuesta) => {
    respuesta.json(await espacios.cambiarEstado(idDeRuta(peticion), peticion.body));
  });

  return rutas;
}
