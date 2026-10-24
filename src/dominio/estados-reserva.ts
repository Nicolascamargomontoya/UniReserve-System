// Máquina de estados de la reserva (design.md D8). Ningún servicio cambia `estado` sin pasar por aquí,
// así cada transición queda en el historial (cancelacion-historial: Registro inmutable de cambios de estado).
import { ErrorAplicacion } from '../compartido/errores.js';
import type { CambioEstado, EstadoReserva, Reserva } from './modelos.js';

const TRANSICIONES: Readonly<Record<EstadoReserva, readonly EstadoReserva[]>> = {
  PENDIENTE: ['APROBADA', 'RECHAZADA', 'CANCELADA'],
  APROBADA: ['CANCELADA'],
  RECHAZADA: [],
  CANCELADA: [],
};

export function verificarTransicion(actual: EstadoReserva, nuevo: EstadoReserva): void {
  if (!TRANSICIONES[actual].includes(nuevo)) {
    throw new ErrorAplicacion('TRANSICION_ESTADO_INVALIDA', `Una reserva ${actual} no puede pasar a ${nuevo}.`, {
      estadoActual: actual,
      estadoSolicitado: nuevo,
    });
  }
}

export function registroDeCreacion(autorId: string, fecha: Date): CambioEstado {
  return { estadoAnterior: null, estadoNuevo: 'PENDIENTE', autorId, fecha };
}

export function transicionar(reserva: Reserva, nuevo: EstadoReserva, autorId: string, fecha: Date, motivo?: string): Reserva {
  verificarTransicion(reserva.estado, nuevo);
  const cambio: CambioEstado = { estadoAnterior: reserva.estado, estadoNuevo: nuevo, autorId, fecha, ...(motivo ? { motivo } : {}) };
  return { ...reserva, estado: nuevo, actualizadaEn: fecha, historial: [...reserva.historial, cambio] };
}
