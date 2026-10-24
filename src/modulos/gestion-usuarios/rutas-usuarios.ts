import { Router } from 'express';
import { ROLES } from '../../dominio/modelos.js';
import { parametroBooleano, parametroOpcion, type Datos } from '../../compartido/validacion.js';
import { idDeRuta } from '../../compartido/http.js';
import type { Servicios } from '../../contenedor.js';
import { autorizar, sesionDe } from '../roles-permisos/middleware-acceso.js';

// Rutas públicas: no exigen token.
export function rutasAutenticacion({ usuarios, autenticacion }: Servicios): Router {
  const rutas = Router();

  rutas.post('/auth/registro', async (peticion, respuesta) => {
    respuesta.status(201).json(await usuarios.registrar(peticion.body));
  });

  rutas.post('/auth/inicio-sesion', async (peticion, respuesta) => {
    respuesta.json(await autenticacion.iniciarSesion(peticion.body));
  });

  return rutas;
}

export function rutasUsuarios({ usuarios }: Servicios): Router {
  const rutas = Router();

  // /usuarios/perfil se registra antes que /usuarios/:id.
  rutas.get('/usuarios/perfil', async (peticion, respuesta) => {
    respuesta.json(await usuarios.perfil(sesionDe(peticion).usuarioId));
  });

  rutas.patch('/usuarios/perfil', async (peticion, respuesta) => {
    respuesta.json(await usuarios.actualizarPerfil(sesionDe(peticion).usuarioId, peticion.body));
  });

  rutas.get('/usuarios', autorizar('usuarios:gestionar'), async (peticion, respuesta) => {
    const consulta = peticion.query as Datos;
    respuesta.json(
      await usuarios.listar({ rol: parametroOpcion(consulta, 'rol', ROLES), activo: parametroBooleano(consulta, 'activo') }),
    );
  });

  rutas.get('/usuarios/:id', autorizar('usuarios:gestionar'), async (peticion, respuesta) => {
    respuesta.json(await usuarios.obtener(idDeRuta(peticion)));
  });

  rutas.patch('/usuarios/:id/estado', autorizar('usuarios:gestionar'), async (peticion, respuesta) => {
    respuesta.json(await usuarios.cambiarEstado(sesionDe(peticion).usuarioId, idDeRuta(peticion), peticion.body));
  });

  return rutas;
}
