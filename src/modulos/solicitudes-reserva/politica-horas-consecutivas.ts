// CR-01 — Límite de cuatro horas consecutivas (openspec: solicitudes-reserva; cambio limitar-horas-consecutivas).
import { ErrorAplicacion } from '../../compartido/errores.js';
import { MS_POR_HORA, type Intervalo } from '../../compartido/tiempo.js';

export const MAXIMO_HORAS_CONSECUTIVAS = 4;

// Extiende el intervalo con las reservas contiguas: las que terminan justo cuando empieza o empiezan justo cuando termina.
export function bloqueContinuo(intervalo: Intervalo, reservasPropias: readonly Intervalo[]): Intervalo {
  let inicio = intervalo.inicio.getTime();
  let fin = intervalo.fin.getTime();
  let extendido = true;
  while (extendido) {
    extendido = false;
    for (const reserva of reservasPropias) {
      if (reserva.fin.getTime() === inicio) {
        inicio = reserva.inicio.getTime();
        extendido = true;
      }
      if (reserva.inicio.getTime() === fin) {
        fin = reserva.fin.getTime();
        extendido = true;
      }
    }
  }
  return { inicio: new Date(inicio), fin: new Date(fin) };
}

// `reservasPropias`: reservas activas del mismo usuario en el mismo espacio. Sin ellas, evalúa solo la solicitud.
export function asegurarLimiteHorasConsecutivas(intervalo: Intervalo, reservasPropias: readonly Intervalo[] = []): void {
  const bloque = bloqueContinuo(intervalo, reservasPropias);
  const horas = (bloque.fin.getTime() - bloque.inicio.getTime()) / MS_POR_HORA;
  if (horas > MAXIMO_HORAS_CONSECUTIVAS) {
    throw new ErrorAplicacion(
      'LIMITE_HORAS_CONSECUTIVAS',
      `Ningún usuario puede reservar un mismo espacio más de ${MAXIMO_HORAS_CONSECUTIVAS} horas consecutivas.`,
      { inicioBloque: bloque.inicio, finBloque: bloque.fin, horas },
    );
  }
}
