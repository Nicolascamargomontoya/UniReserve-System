import { describe, expect, it } from 'vitest';
import { asegurarLimiteHorasConsecutivas, bloqueContinuo } from '../../src/modulos/solicitudes-reserva/politica-horas-consecutivas.js';

const tramo = (inicio: string, fin: string) => ({ inicio: new Date(`2030-01-07T${inicio}:00Z`), fin: new Date(`2030-01-07T${fin}:00Z`) });
const horas = ({ inicio, fin }: { inicio: Date; fin: Date }) => (fin.getTime() - inicio.getTime()) / 3_600_000;

describe('política de horas consecutivas (CR-01)', () => {
  it('sin reservas propias, el bloque es la solicitud', () => {
    expect(bloqueContinuo(tramo('10:00', '12:00'), [])).toEqual(tramo('10:00', '12:00'));
  });

  it('encadena hacia atrás y hacia adelante, aunque las reservas lleguen desordenadas', () => {
    const propias = [tramo('14:00', '15:00'), tramo('08:00', '09:00'), tramo('12:00', '14:00'), tramo('09:00', '10:00')];

    expect(bloqueContinuo(tramo('10:00', '12:00'), propias)).toEqual(tramo('08:00', '15:00'));
  });

  it('no encadena reservas separadas por una pausa', () => {
    const propias = [tramo('07:00', '09:30'), tramo('12:30', '13:00')];

    expect(horas(bloqueContinuo(tramo('10:00', '12:00'), propias))).toBe(2);
  });

  it('acepta exactamente cuatro horas y rechaza cuatro horas y media', () => {
    expect(() => asegurarLimiteHorasConsecutivas(tramo('10:00', '14:00'))).not.toThrow();
    expect(() => asegurarLimiteHorasConsecutivas(tramo('10:00', '14:30'))).toThrow(
      expect.objectContaining({ codigo: 'LIMITE_HORAS_CONSECUTIVAS', estadoHttp: 422 }),
    );
  });
});
