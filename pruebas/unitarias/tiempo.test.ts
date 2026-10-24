import { describe, expect, it } from 'vitest';
import { alineadaABloque, mismoIntervalo, seSolapan } from '../../src/compartido/tiempo.js';

const intervalo = (inicio: string, fin: string) => ({ inicio: new Date(inicio), fin: new Date(fin) });

describe('tiempo: intervalos semiabiertos [inicio, fin)', () => {
  it('detecta solapamiento parcial y total', () => {
    expect(seSolapan(intervalo('2030-01-07T10:00Z', '2030-01-07T12:00Z'), intervalo('2030-01-07T11:00Z', '2030-01-07T13:00Z'))).toBe(true);
    expect(seSolapan(intervalo('2030-01-07T10:00Z', '2030-01-07T12:00Z'), intervalo('2030-01-07T10:30Z', '2030-01-07T11:00Z'))).toBe(true);
  });

  it('no considera solapados los intervalos contiguos ni los separados', () => {
    expect(seSolapan(intervalo('2030-01-07T10:00Z', '2030-01-07T12:00Z'), intervalo('2030-01-07T12:00Z', '2030-01-07T14:00Z'))).toBe(false);
    expect(seSolapan(intervalo('2030-01-07T12:00Z', '2030-01-07T14:00Z'), intervalo('2030-01-07T10:00Z', '2030-01-07T12:00Z'))).toBe(false);
    expect(seSolapan(intervalo('2030-01-07T10:00Z', '2030-01-07T11:00Z'), intervalo('2030-01-07T13:00Z', '2030-01-07T14:00Z'))).toBe(false);
  });

  it('valida la alineación a bloques de 30 minutos', () => {
    expect(alineadaABloque(new Date('2030-01-07T10:00:00Z'))).toBe(true);
    expect(alineadaABloque(new Date('2030-01-07T10:30:00-05:00'))).toBe(true);
    expect(alineadaABloque(new Date('2030-01-07T10:15:00Z'))).toBe(false);
    expect(alineadaABloque(new Date('2030-01-07T10:00:30Z'))).toBe(false);
  });

  it('compara intervalos idénticos', () => {
    expect(mismoIntervalo(intervalo('2030-01-07T10:00Z', '2030-01-07T12:00Z'), intervalo('2030-01-07T10:00:00.000Z', '2030-01-07T12:00Z'))).toBe(true);
    expect(mismoIntervalo(intervalo('2030-01-07T10:00Z', '2030-01-07T12:00Z'), intervalo('2030-01-07T10:00Z', '2030-01-07T12:30Z'))).toBe(false);
  });
});
