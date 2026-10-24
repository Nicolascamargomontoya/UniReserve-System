import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ErrorAplicacion } from './errores.js';

export const rutaNoEncontrada: RequestHandler = (peticion) => {
  throw new ErrorAplicacion('RUTA_NO_ENCONTRADA', `No existe la ruta ${peticion.method} ${peticion.path}.`);
};

// Traduce cualquier error al contrato { error: { codigo, mensaje, detalles? } } (design.md D5).
export const manejadorDeErrores: ErrorRequestHandler = (error, _peticion, respuesta, _siguiente) => {
  if (error instanceof ErrorAplicacion) {
    respuesta.status(error.estadoHttp).json({
      error: { codigo: error.codigo, mensaje: error.message, ...(error.detalles === undefined ? {} : { detalles: error.detalles }) },
    });
    return;
  }
  if (error?.type === 'entity.parse.failed') {
    respuesta.status(400).json({ error: { codigo: 'DATOS_INVALIDOS', mensaje: 'El cuerpo de la petición no es JSON válido.' } });
    return;
  }
  console.error(error);
  respuesta.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado.' } });
};
