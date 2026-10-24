import { describe, expect, it } from 'vitest';
import { registroDeCreacion, transicionar, verificarTransicion } from '../../src/dominio/estados-reserva.js';
import type { EstadoReserva, Reserva } from '../../src/dominio/modelos.js';

const fecha = new Date('2030-01-07T08:00:00Z');
const reserva = (estado: EstadoReserva): Reserva => ({
  id: 'r1',
  espacioId: 'e1',
  usuarioId: 'u1',
  inicio: new Date('2030-01-07T10:00:00Z'),
  fin: new Date('2030-01-07T12:00:00Z'),
  proposito: 'Clase',
  asistentes: 10,
  estado,
  creadaEn: fecha,
  actualizadaEn: fecha,
  historial: [registroDeCreacion('u1', fecha)],
});

describe('máquina de estados de la reserva', () => {
  it.each([
    ['PENDIENTE', 'APROBADA'],
    ['PENDIENTE', 'RECHAZADA'],
    ['PENDIENTE', 'CANCELADA'],
    ['APROBADA', 'CANCELADA'],
  ] as const)('permite %s → %s', (desde, hacia) => {
    expect(() => verificarTransicion(desde, hacia)).not.toThrow();
  });

  it.each([
    ['APROBADA', 'RECHAZADA'],
    ['APROBADA', 'APROBADA'],
    ['RECHAZADA', 'APROBADA'],
    ['RECHAZADA', 'CANCELADA'],
    ['CANCELADA', 'APROBADA'],
    ['CANCELADA', 'CANCELADA'],
  ] as const)('rechaza %s → %s con TRANSICION_ESTADO_INVALIDA', (desde, hacia) => {
    expect(() => verificarTransicion(desde, hacia)).toThrow(expect.objectContaining({ codigo: 'TRANSICION_ESTADO_INVALIDA' }));
  });

  it('agrega una entrada al historial sin modificar las anteriores', () => {
    const original = reserva('PENDIENTE');
    const aprobada = transicionar(original, 'APROBADA', 'admin', new Date('2030-01-07T08:30:00Z'));
    const cancelada = transicionar(aprobada, 'CANCELADA', 'u1', new Date('2030-01-07T09:00:00Z'), 'Cambio de fecha');

    expect(original.historial).toHaveLength(1);
    expect(cancelada.estado).toBe('CANCELADA');
    expect(cancelada.historial).toEqual([
      { estadoAnterior: null, estadoNuevo: 'PENDIENTE', autorId: 'u1', fecha },
      { estadoAnterior: 'PENDIENTE', estadoNuevo: 'APROBADA', autorId: 'admin', fecha: new Date('2030-01-07T08:30:00Z') },
      { estadoAnterior: 'APROBADA', estadoNuevo: 'CANCELADA', autorId: 'u1', fecha: new Date('2030-01-07T09:00:00Z'), motivo: 'Cambio de fecha' },
    ]);
  });
});
