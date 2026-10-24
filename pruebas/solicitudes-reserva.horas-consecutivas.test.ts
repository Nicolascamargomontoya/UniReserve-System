// Escenarios de openspec: solicitudes-reserva › Límite de cuatro horas consecutivas (CR-01, cambio limitar-horas-consecutivas).
import { describe, expect, it } from 'vitest';
import { RepositorioReservasEnMemoria } from '../src/repositorios/en-memoria.js';
import { crearEntornoDePrueba, h } from './apoyo/app-de-prueba.js';
import { conLatencia } from './apoyo/concurrencia.js';

async function preparar(opciones: Parameters<typeof crearEntornoDePrueba>[0] = {}) {
  const entorno = await crearEntornoDePrueba(opciones);
  const estudiante = await entorno.registrar('ESTUDIANTE');
  const lab = await entorno.crearEspacio({ nombre: 'Lab 1' });
  const pedir = (inicio: string, fin: string, espacioId = lab.id, token = estudiante.token) =>
    entorno.solicitar(token, { espacioId, inicio: h(inicio), fin: h(fin) });
  return { entorno, estudiante, lab, pedir };
}

const esRechazoPorLimite = (respuesta: { status: number; body: { error?: { codigo: string } } }) => {
  expect(respuesta.status).toBe(422);
  expect(respuesta.body.error?.codigo).toBe('LIMITE_HORAS_CONSECUTIVAS');
};

describe('solicitudes-reserva › Límite de cuatro horas consecutivas', () => {
  it('Reserva de exactamente cuatro horas', async () => {
    const { pedir } = await preparar();

    expect((await pedir('10:00', '14:00')).status).toBe(201);
  });

  it('Reserva individual de más de cuatro horas', async () => {
    const { pedir } = await preparar();

    esRechazoPorLimite(await pedir('10:00', '14:30'));
  });

  it('Encadenar después de una reserva propia', async () => {
    const { pedir } = await preparar();
    await pedir('09:00', '12:00');

    const respuesta = await pedir('12:00', '14:00');

    esRechazoPorLimite(respuesta);
    expect(respuesta.body.error.detalles).toEqual({
      inicioBloque: '2030-01-07T09:00:00.000Z',
      finBloque: '2030-01-07T14:00:00.000Z',
      horas: 5,
    });
  });

  it('Encadenar antes de una reserva propia', async () => {
    const { entorno, pedir } = await preparar();
    const aprobada = await pedir('12:00', '14:00');
    await entorno.admin.patch(`/reservas/${aprobada.body.id}/aprobar`);

    esRechazoPorLimite(await pedir('09:00', '12:00'));
  });

  it('Completar el hueco entre dos reservas propias', async () => {
    const { pedir } = await preparar();
    await pedir('09:00', '11:00');
    await pedir('12:00', '14:00');

    const respuesta = await pedir('11:00', '12:00');

    esRechazoPorLimite(respuesta);
    expect(respuesta.body.error.detalles).toMatchObject({ inicioBloque: '2030-01-07T09:00:00.000Z', finBloque: '2030-01-07T14:00:00.000Z' });
  });

  it('Cadena de exactamente cuatro horas', async () => {
    const { pedir } = await preparar();
    await pedir('09:00', '11:00');

    expect((await pedir('11:00', '13:00')).status).toBe(201);
  });

  it('Una pausa de 30 minutos corta la cadena', async () => {
    const { pedir } = await preparar();
    await pedir('09:00', '13:00');

    expect((await pedir('13:30', '15:00')).status).toBe(201);
  });

  it('Otro espacio no se encadena', async () => {
    const { entorno, pedir } = await preparar();
    const lab2 = await entorno.crearEspacio({ nombre: 'Lab 2' });
    await pedir('09:00', '13:00');

    expect((await pedir('13:00', '15:00', lab2.id)).status).toBe(201);
  });

  it('Las reservas canceladas o rechazadas no cuentan', async () => {
    const { entorno, estudiante, pedir } = await preparar();
    const cancelada = await pedir('09:00', '13:00');
    await entorno.como(estudiante.token).patch(`/reservas/${cancelada.body.id}/cancelar`);
    const rechazada = await pedir('09:00', '13:00');
    await entorno.admin.patch(`/reservas/${rechazada.body.id}/rechazar`, { motivo: 'Mantenimiento programado' });

    expect((await pedir('13:00', '15:00')).status).toBe(201);
  });

  it('Las reservas de otro usuario no se encadenan', async () => {
    const { entorno, lab, pedir } = await preparar();
    const otro = await entorno.registrar('ESTUDIANTE');
    await pedir('09:00', '13:00', lab.id, otro.token);

    expect((await pedir('13:00', '15:00')).status).toBe(201);
  });

  it('dos solicitudes concurrentes contiguas del mismo usuario no forman juntas más de cuatro horas', async () => {
    const { pedir } = await preparar({ repositorios: { reservas: conLatencia(new RepositorioReservasEnMemoria()) } });

    const respuestas = await Promise.all([pedir('09:00', '12:00'), pedir('12:00', '14:00')]);

    expect(respuestas.map((respuesta) => respuesta.status).sort()).toEqual([201, 422]);
  });
});
