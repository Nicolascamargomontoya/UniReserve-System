import { Router } from 'express';
import { TIPOS_ESPACIO } from '../../dominio/modelos.js';
import { idDeRuta } from '../../compartido/http.js';
import { fechaHora, parametroEntero, parametroOpcion, type Datos } from '../../compartido/validacion.js';
import type { Servicios } from '../../contenedor.js';
import { autorizar, sesionDe } from '../roles-permisos/middleware-acceso.js';
import { tienePermiso } from '../roles-permisos/permisos.js';

// Se monta antes que las rutas de gestion-espacios para que /espacios/disponibles no se lea como /espacios/:id.
export function rutasDisponibilidad({ disponibilidad }: Servicios): Router {
  const rutas = Router();

  rutas.get('/espacios/disponibles', autorizar('espacios:consultar'), async (peticion, respuesta) => {
    const consulta = peticion.query as Datos;
    const intervalo = { inicio: fechaHora(consulta, 'inicio'), fin: fechaHora(consulta, 'fin') };
    const filtro = {
      tipo: parametroOpcion(consulta, 'tipo', TIPOS_ESPACIO),
      capacidadMinima: parametroEntero(consulta, 'capacidadMinima'),
    };
    respuesta.json(await disponibilidad.espaciosDisponibles(intervalo, filtro));
  });

  rutas.get('/espacios/:id/ocupacion', autorizar('espacios:consultar'), async (peticion, respuesta) => {
    const consulta = peticion.query as Datos;
    const intervalo = { inicio: fechaHora(consulta, 'desde'), fin: fechaHora(consulta, 'hasta') };
    const verSolicitante = tienePermiso(sesionDe(peticion).rol, 'reservas:consultar-todas');
    respuesta.json(await disponibilidad.ocupacion(idDeRuta(peticion), intervalo, verSolicitante));
  });

  return rutas;
}
