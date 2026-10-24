// M7 — Aprobación y rechazo de solicitudes (openspec: aprobacion-reservas). Orden de validación: design.md D6.
import { transicionar, verificarTransicion } from '../../dominio/estados-reserva.js';
import type { Reserva } from '../../dominio/modelos.js';
import { ErrorAplicacion } from '../../compartido/errores.js';
import type { Reloj } from '../../compartido/reloj.js';
import { comoObjeto, texto } from '../../compartido/validacion.js';
import type { RepositorioReservas, RepositorioUsuarios } from '../../repositorios/contratos.js';
import type { ServicioEspacios } from '../gestion-espacios/servicio-espacios.js';
import { claveEspacio, type GuardiaConflictos } from '../prevencion-conflictos/guardia-conflictos.js';

export interface SolicitudPendiente extends Reserva {
  espacio: { id: string; nombre: string; tipo: string };
  solicitante: { id: string; nombreCompleto: string; correo: string } | null;
}

export class ServicioAprobacion {
  constructor(
    private readonly reservas: RepositorioReservas,
    private readonly usuarios: RepositorioUsuarios,
    private readonly espacios: ServicioEspacios,
    private readonly guardia: GuardiaConflictos,
    private readonly reloj: Reloj,
  ) {}

  // Requisito: Bandeja de solicitudes pendientes, en orden de llegada.
  async pendientes(): Promise<SolicitudPendiente[]> {
    const pendientes = (await this.reservas.listar({ estados: ['PENDIENTE'] })).sort(
      (a, b) => a.creadaEn.getTime() - b.creadaEn.getTime(),
    );
    return Promise.all(
      pendientes.map(async (reserva) => {
        const espacio = await this.espacios.buscar(reserva.espacioId);
        const usuario = await this.usuarios.buscarPorId(reserva.usuarioId);
        return {
          ...reserva,
          espacio: { id: espacio.id, nombre: espacio.nombre, tipo: espacio.tipo },
          solicitante: usuario && { id: usuario.id, nombreCompleto: usuario.nombreCompleto, correo: usuario.correo },
        };
      }),
    );
  }

  // Requisitos: Aprobación de solicitudes; prevencion-conflictos › Revalidación al aprobar.
  async aprobar(administradorId: string, reservaId: string): Promise<Reserva> {
    const { espacioId } = await this.buscar(reservaId);
    return this.guardia.ejecutarExclusivo([claveEspacio(espacioId)], async () => {
      const reserva = await this.buscar(reservaId);
      verificarTransicion(reserva.estado, 'APROBADA');
      const ahora = this.reloj();
      if (reserva.inicio.getTime() <= ahora.getTime()) {
        throw new ErrorAplicacion('SOLICITUD_VENCIDA', 'La hora de inicio de la solicitud ya pasó; no se puede aprobar.');
      }
      if (!(await this.espacios.buscar(espacioId)).activo) {
        throw new ErrorAplicacion('ESPACIO_INACTIVO', 'El espacio está desactivado; no se puede aprobar la solicitud.');
      }
      await this.guardia.asegurarSinAprobadasSolapadas(reserva);

      const aprobada = transicionar(reserva, 'APROBADA', administradorId, ahora);
      await this.reservas.actualizar(aprobada);
      return aprobada;
    });
  }

  // Requisitos: Rechazo con motivo; Transiciones de decisión válidas.
  async rechazar(administradorId: string, reservaId: string, entrada: unknown): Promise<Reserva> {
    const motivo = texto(comoObjeto(entrada), 'motivo', { min: 5, max: 500 });
    const { espacioId } = await this.buscar(reservaId);
    return this.guardia.ejecutarExclusivo([claveEspacio(espacioId)], async () => {
      const rechazada = transicionar(await this.buscar(reservaId), 'RECHAZADA', administradorId, this.reloj(), motivo);
      await this.reservas.actualizar(rechazada);
      return rechazada;
    });
  }

  private async buscar(reservaId: string): Promise<Reserva> {
    const reserva = await this.reservas.buscarPorId(reservaId);
    if (!reserva) throw new ErrorAplicacion('RESERVA_NO_ENCONTRADA', 'La reserva no existe.');
    return reserva;
  }
}
