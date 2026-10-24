// M3 — Autenticación obligatoria y autorización por permiso.
import type { Request, RequestHandler } from 'express';
import type { Sesion } from '../../dominio/modelos.js';
import { ErrorAplicacion } from '../../compartido/errores.js';
import type { ServicioAutenticacion } from '../gestion-usuarios/servicio-autenticacion.js';
import { tienePermiso, type Permiso } from './permisos.js';

declare global {
  namespace Express {
    interface Request {
      sesion?: Sesion;
    }
  }
}

export function autenticar(autenticacion: ServicioAutenticacion): RequestHandler {
  return async (peticion, _respuesta, siguiente) => {
    const [esquema, token] = (peticion.headers.authorization ?? '').split(' ');
    if (esquema !== 'Bearer' || !token) {
      throw new ErrorAplicacion('NO_AUTENTICADO', 'Falta el token de acceso (cabecera Authorization: Bearer <token>).');
    }
    peticion.sesion = await autenticacion.verificarToken(token);
    siguiente();
  };
}

export function autorizar(permiso: Permiso): RequestHandler {
  return (peticion, _respuesta, siguiente) => {
    if (!tienePermiso(sesionDe(peticion).rol, permiso)) {
      throw new ErrorAplicacion('ACCESO_DENEGADO', 'No tiene permiso para realizar esta operación.');
    }
    siguiente();
  };
}

export function sesionDe(peticion: Request): Sesion {
  if (!peticion.sesion) throw new ErrorAplicacion('NO_AUTENTICADO', 'La petición no está autenticada.');
  return peticion.sesion;
}
