// M6 — Prevención de reservas simultáneas (openspec: prevencion-conflictos; design.md D7).
import { ESTADOS_ACTIVOS, type Reserva } from '../../dominio/modelos.js';
import { ErrorAplicacion } from '../../compartido/errores.js';
import type { Exclusion } from '../../compartido/mutex-por-clave.js';
import { mismoIntervalo, type Intervalo } from '../../compartido/tiempo.js';
import type { RepositorioReservas } from '../../repositorios/contratos.js';

export const claveEspacio = (espacioId: string) => `espacio:${espacioId}`;
export const claveUsuario = (usuarioId: string) => `usuario:${usuarioId}`;

const resumen = ({ id, espacioId, inicio, fin, estado }: Reserva) => ({ reservaId: id, espacioId, inicio, fin, estado });

export class GuardiaConflictos {
  constructor(
    private readonly reservas: RepositorioReservas,
    private readonly exclusion: Exclusion,
  ) {}

  // Las verificaciones y la escritura que dependen de otras reservas se hacen dentro de esta sección crítica.
  ejecutarExclusivo<T>(claves: string[], operacion: () => Promise<T>): Promise<T> {
    return this.exclusion.ejecutarExclusivo(claves, operacion);
  }

  // Requisito: Detección de solicitudes duplicadas.
  async asegurarSinDuplicado(usuarioId: string, espacioId: string, intervalo: Intervalo): Promise<void> {
    const propias = await this.reservas.listar({ usuarioId, espacioId, estados: ESTADOS_ACTIVOS, desde: intervalo.inicio, hasta: intervalo.fin });
    const duplicada = propias.find((reserva) => mismoIntervalo(reserva, intervalo));
    if (duplicada) {
      throw new ErrorAplicacion('SOLICITUD_DUPLICADA', 'Ya tiene una solicitud activa idéntica para este espacio.', {
        reservaId: duplicada.id,
      });
    }
  }

  // Requisito: Exclusividad del solicitante (también entre espacios distintos).
  async asegurarAgendaLibre(usuarioId: string, intervalo: Intervalo): Promise<void> {
    const solapadas = await this.reservas.listar({ usuarioId, estados: ESTADOS_ACTIVOS, desde: intervalo.inicio, hasta: intervalo.fin });
    if (solapadas.length > 0) {
      throw new ErrorAplicacion('CONFLICTO_HORARIO_USUARIO', 'Ya tiene otra reserva activa que se solapa con esa franja.', {
        conflictos: solapadas.map(resumen),
      });
    }
  }

  // Requisito: Revalidación al aprobar. Protege frente a datos inconsistentes.
  async asegurarSinAprobadasSolapadas(reserva: Reserva): Promise<void> {
    const aprobadas = await this.reservas.listar({
      espacioId: reserva.espacioId,
      estados: ['APROBADA'],
      desde: reserva.inicio,
      hasta: reserva.fin,
    });
    const otras = aprobadas.filter((aprobada) => aprobada.id !== reserva.id);
    if (otras.length > 0) {
      throw new ErrorAplicacion('ESPACIO_NO_DISPONIBLE', 'Otra reserva aprobada ya ocupa esa franja.', { conflictos: otras.map(resumen) });
    }
  }
}
