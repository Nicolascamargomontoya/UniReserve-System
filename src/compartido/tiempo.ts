export const MINUTOS_POR_BLOQUE = 30;
export const MS_POR_MINUTO = 60_000;
export const MS_POR_HORA = 60 * MS_POR_MINUTO;
export const MS_POR_DIA = 24 * MS_POR_HORA;

export interface Intervalo {
  inicio: Date;
  fin: Date;
}

// Intervalos semiabiertos [inicio, fin): los contiguos no se solapan (disponibilidad: Definición de disponibilidad).
export function seSolapan(a: Intervalo, b: Intervalo): boolean {
  return a.inicio.getTime() < b.fin.getTime() && b.inicio.getTime() < a.fin.getTime();
}

export function alineadaABloque(fecha: Date): boolean {
  return fecha.getTime() % (MINUTOS_POR_BLOQUE * MS_POR_MINUTO) === 0;
}

export function mismoIntervalo(a: Intervalo, b: Intervalo): boolean {
  return a.inicio.getTime() === b.inicio.getTime() && a.fin.getTime() === b.fin.getTime();
}
