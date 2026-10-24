import { describe, expect, it, vi } from 'vitest';
import { manejadorDeErrores } from '../../src/compartido/http.js';
import { crearEntornoDePrueba } from '../apoyo/app-de-prueba.js';

describe('aplicación HTTP: contrato de errores', () => {
  it('responde 400 DATOS_INVALIDOS ante un cuerpo que no es JSON válido', async () => {
    const { api } = crearEntornoDePrueba();

    const respuesta = await api.post('/auth/registro').set('Content-Type', 'application/json').send('{"correo":');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  });

  it('responde 404 RUTA_NO_ENCONTRADA ante una ruta inexistente', async () => {
    const { api } = crearEntornoDePrueba();

    const respuesta = await api.get('/no-existe');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('RUTA_NO_ENCONTRADA');
  });

  it('responde 500 ERROR_INTERNO sin exponer detalles ante un error inesperado', () => {
    const respuesta = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.spyOn(console, 'error').mockImplementation(() => {});

    manejadorDeErrores(new Error('detalle interno'), {} as never, respuesta as never, () => {});

    expect(respuesta.status).toHaveBeenCalledWith(500);
    expect(respuesta.json).toHaveBeenCalledWith({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado.' } });
  });
});
