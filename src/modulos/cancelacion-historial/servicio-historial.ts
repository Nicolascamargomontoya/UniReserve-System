// M8 — Historial de reservas (openspec: cancelacion-historial).
import type { EstadoReserva, Reserva, Sesion } from '../../dominio/modelos.js';
import { ErrorAplicacion } from '../../compartido/errores.js';
import type { RepositorioReservas } from '../../repositorios/contratos.js';
import { asegurarRangoValido } from '../disponibilidad/servicio-disponibilidad.js';
import { tienePermiso } from '../roles-permisos/permisos.js';

export interface FiltroHistorial {
  estado?: EstadoReserva;
  espacioId?: string;
  usuarioId?: string;
  desde?: Date;
  hasta?: Date;
}

const masRecientesPrimero = (a: Reserva, b: Reserva) => b.inicio.getTime() - a.inicio.getTime();

export class ServicioHistorial {
  constructor(private readonly reservas: RepositorioReservas) {}

  // Requisito: Historial del solicitante.
  async mias(usuarioId: string, estado?: EstadoReserva): Promise<Reserva[]> {
    return (await this.reservas.listar({ usuarioId, ...(estado ? { estados: [estado] } : {}) })).sort(masRecientesPrimero);
  }

  async detalle(sesion: Sesion, reservaId: string): Promise<Reserva> {
    const reserva = await this.reservas.buscarPorId(reservaId);
    if (!reserva) throw new ErrorAplicacion('RESERVA_NO_ENCONTRADA', 'La reserva no existe.');
    if (reserva.usuarioId !== sesion.usuarioId && !tienePermiso(sesion.rol, 'reservas:consultar-todas')) {
      throw new ErrorAplicacion('ACCESO_DENEGADO', 'Solo puede consultar sus propias reservas.');
    }
    return reserva;
  }

  // Requisito: Consulta administrativa del historial.
  async todas({ estado, espacioId, usuarioId, desde, hasta }: FiltroHistorial): Promise<Reserva[]> {
    if (desde && hasta) asegurarRangoValido({ inicio: desde, fin: hasta });
    const reservas = await this.reservas.listar({ espacioId, usuarioId, desde, hasta, ...(estado ? { estados: [estado] } : {}) });
    return reservas.sort(masRecientesPrimero);
  }
}
