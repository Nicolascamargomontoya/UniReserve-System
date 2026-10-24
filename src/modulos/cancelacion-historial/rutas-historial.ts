import { Router } from 'express';
import { ESTADOS_RESERVA } from '../../dominio/modelos.js';
import { idDeRuta } from '../../compartido/http.js';
import { parametroFecha, parametroOpcion, parametroTexto, type Datos } from '../../compartido/validacion.js';
import type { Servicios } from '../../contenedor.js';
import { autorizar, sesionDe } from '../roles-permisos/middleware-acceso.js';

export function rutasHistorial({ historial, cancelacion }: Servicios): Router {
  const rutas = Router();

  // /reservas/mias se registra antes que /reservas/:id.
  rutas.get('/reservas/mias', autorizar('reservas:consultar-propias'), async (peticion, respuesta) => {
    const estado = parametroOpcion(peticion.query as Datos, 'estado', ESTADOS_RESERVA);
    respuesta.json(await historial.mias(sesionDe(peticion).usuarioId, estado));
  });

  rutas.get('/reservas', autorizar('reservas:consultar-todas'), async (peticion, respuesta) => {
    const consulta = peticion.query as Datos;
    respuesta.json(
      await historial.todas({
        estado: parametroOpcion(consulta, 'estado', ESTADOS_RESERVA),
        espacioId: parametroTexto(consulta, 'espacioId'),
        usuarioId: parametroTexto(consulta, 'usuarioId'),
        desde: parametroFecha(consulta, 'desde'),
        hasta: parametroFecha(consulta, 'hasta'),
      }),
    );
  });

  // Propietario o administrador: lo decide el servicio, porque depende de quién hizo la reserva.
  rutas.get('/reservas/:id', async (peticion, respuesta) => {
    respuesta.json(await historial.detalle(sesionDe(peticion), idDeRuta(peticion)));
  });

  rutas.patch('/reservas/:id/cancelar', async (peticion, respuesta) => {
    respuesta.json(await cancelacion.cancelar(sesionDe(peticion), idDeRuta(peticion), peticion.body));
  });

  return rutas;
}
