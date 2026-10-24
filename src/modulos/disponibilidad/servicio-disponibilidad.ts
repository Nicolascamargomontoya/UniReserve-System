// M5 — Validación de disponibilidad (openspec: disponibilidad).
import { ESTADOS_ACTIVOS, type Espacio, type EstadoReserva, type Reserva, type TipoEspacio } from '../../dominio/modelos.js';
import { ErrorAplicacion } from '../../compartido/errores.js';
import { MS_POR_DIA, type Intervalo } from '../../compartido/tiempo.js';
import type { RepositorioReservas } from '../../repositorios/contratos.js';
import type { ServicioEspacios } from '../gestion-espacios/servicio-espacios.js';

const MAXIMO_DIAS_OCUPACION = 31;

export interface BloqueOcupado {
  inicio: Date;
  fin: Date;
  estado: EstadoReserva;
  reservaId?: string;
  usuarioId?: string;
}

export function asegurarRangoValido({ inicio, fin }: Intervalo): void {
  if (fin.getTime() <= inicio.getTime()) {
    throw new ErrorAplicacion('RANGO_HORARIO_INVALIDO', 'El fin debe ser posterior al inicio.');
  }
}

export class ServicioDisponibilidad {
  constructor(
    private readonly reservas: RepositorioReservas,
    private readonly espacios: ServicioEspacios,
  ) {}

  // Requisito: Definición de disponibilidad. Reservas activas del espacio que se solapan con [inicio, fin).
  conflictos(espacioId: string, intervalo: Intervalo, estados: readonly EstadoReserva[] = ESTADOS_ACTIVOS): Promise<Reserva[]> {
    return this.reservas.listar({ espacioId, estados, desde: intervalo.inicio, hasta: intervalo.fin });
  }

  // Requisito: Validación de disponibilidad al solicitar.
  async asegurarDisponible(espacioId: string, intervalo: Intervalo): Promise<void> {
    const conflictos = await this.conflictos(espacioId, intervalo);
    if (conflictos.length > 0) {
      throw new ErrorAplicacion('ESPACIO_NO_DISPONIBLE', 'El espacio ya está ocupado en esa franja.', {
        conflictos: conflictos.map(({ inicio, fin, estado }) => ({ inicio, fin, estado })),
      });
    }
  }

  // Requisito: Consulta de ocupación de un espacio. Solo el administrador ve quién reservó.
  async ocupacion(espacioId: string, intervalo: Intervalo, verSolicitante: boolean): Promise<BloqueOcupado[]> {
    asegurarRangoValido(intervalo);
    if (intervalo.fin.getTime() - intervalo.inicio.getTime() > MAXIMO_DIAS_OCUPACION * MS_POR_DIA) {
      throw new ErrorAplicacion('DATOS_INVALIDOS', `El rango de consulta no puede superar ${MAXIMO_DIAS_OCUPACION} días.`);
    }
    await this.espacios.buscar(espacioId);
    return (await this.conflictos(espacioId, intervalo)).map(({ id, usuarioId, inicio, fin, estado }) =>
      verSolicitante ? { inicio, fin, estado, reservaId: id, usuarioId } : { inicio, fin, estado },
    );
  }

  // Requisito: Búsqueda de espacios disponibles.
  async espaciosDisponibles(intervalo: Intervalo, filtro: { tipo?: TipoEspacio; capacidadMinima?: number }): Promise<Espacio[]> {
    asegurarRangoValido(intervalo);
    const candidatos = await this.espacios.listar(filtro, false);
    const libres = await Promise.all(
      candidatos.map(async (espacio) => ((await this.conflictos(espacio.id, intervalo)).length === 0 ? espacio : null)),
    );
    return libres.filter((espacio): espacio is Espacio => espacio !== null);
  }
}
