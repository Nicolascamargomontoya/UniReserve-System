// M8 — Cancelación de reservas (openspec: cancelacion-historial). Orden de validación: design.md D6.
import { transicionar, verificarTransicion } from '../../dominio/estados-reserva.js';
import type { Reserva, Sesion } from '../../dominio/modelos.js';
import { ErrorAplicacion } from '../../compartido/errores.js';
import type { Reloj } from '../../compartido/reloj.js';
import { comoObjeto, texto, textoOpcional } from '../../compartido/validacion.js';
import type { RepositorioReservas } from '../../repositorios/contratos.js';
import { claveEspacio, type GuardiaConflictos } from '../prevencion-conflictos/guardia-conflictos.js';
import { tienePermiso } from '../roles-permisos/permisos.js';

const LONGITUD_MOTIVO = { min: 5, max: 500 };

export class ServicioCancelacion {
  constructor(
    private readonly reservas: RepositorioReservas,
    private readonly guardia: GuardiaConflictos,
    private readonly reloj: Reloj,
  ) {}

  // Requisitos: Cancelación por el solicitante (motivo opcional); Cancelación administrativa (motivo obligatorio).
  async cancelar(sesion: Sesion, reservaId: string, entrada: unknown): Promise<Reserva> {
    const datos = comoObjeto(entrada ?? {});
    const { espacioId, usuarioId } = await this.buscar(reservaId);

    const propia = usuarioId === sesion.usuarioId && tienePermiso(sesion.rol, 'reservas:cancelar-propias');
    const administrativa = !propia && tienePermiso(sesion.rol, 'reservas:cancelar-cualquiera');
    if (!propia && !administrativa) throw new ErrorAplicacion('ACCESO_DENEGADO', 'Solo puede cancelar sus propias reservas.');
    const motivo = administrativa ? texto(datos, 'motivo', LONGITUD_MOTIVO) : textoOpcional(datos, 'motivo', LONGITUD_MOTIVO);

    return this.guardia.ejecutarExclusivo([claveEspacio(espacioId)], async () => {
      const reserva = await this.buscar(reservaId);
      verificarTransicion(reserva.estado, 'CANCELADA');
      const ahora = this.reloj();
      if (reserva.inicio.getTime() <= ahora.getTime()) {
        throw new ErrorAplicacion('RESERVA_YA_INICIADA', 'La reserva ya inició; no se puede cancelar.');
      }
      const cancelada = transicionar(reserva, 'CANCELADA', sesion.usuarioId, ahora, motivo);
      await this.reservas.actualizar(cancelada);
      return cancelada;
    });
  }

  private async buscar(reservaId: string): Promise<Reserva> {
    const reserva = await this.reservas.buscarPorId(reservaId);
    if (!reserva) throw new ErrorAplicacion('RESERVA_NO_ENCONTRADA', 'La reserva no existe.');
    return reserva;
  }
}
