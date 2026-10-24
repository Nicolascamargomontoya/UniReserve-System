// M4 — Creación de solicitudes de reserva (openspec: solicitudes-reserva). Orden de validación: design.md D6.
import { randomUUID } from 'node:crypto';
import { registroDeCreacion } from '../../dominio/estados-reserva.js';
import { ESTADOS_ACTIVOS, type Reserva, type Sesion } from '../../dominio/modelos.js';
import { ErrorAplicacion } from '../../compartido/errores.js';
import type { Reloj } from '../../compartido/reloj.js';
import { alineadaABloque, MINUTOS_POR_BLOQUE, type Intervalo } from '../../compartido/tiempo.js';
import { comoObjeto, entero, fechaHora, texto } from '../../compartido/validacion.js';
import type { RepositorioReservas } from '../../repositorios/contratos.js';
import { asegurarRangoValido, type ServicioDisponibilidad } from '../disponibilidad/servicio-disponibilidad.js';
import type { ServicioEspacios } from '../gestion-espacios/servicio-espacios.js';
import { claveEspacio, claveUsuario, type GuardiaConflictos } from '../prevencion-conflictos/guardia-conflictos.js';
import { asegurarLimiteHorasConsecutivas } from './politica-horas-consecutivas.js';

export class ServicioSolicitudes {
  constructor(
    private readonly reservas: RepositorioReservas,
    private readonly espacios: ServicioEspacios,
    private readonly disponibilidad: ServicioDisponibilidad,
    private readonly guardia: GuardiaConflictos,
    private readonly reloj: Reloj,
  ) {}

  async crear({ usuarioId }: Sesion, entrada: unknown): Promise<Reserva> {
    // 1. Forma de la petición (Creación de solicitudes; Formato de fechas con zona horaria).
    const datos = comoObjeto(entrada);
    const espacioId = texto(datos, 'espacioId', { max: 100 });
    const intervalo: Intervalo = { inicio: fechaHora(datos, 'inicio'), fin: fechaHora(datos, 'fin') };
    const proposito = texto(datos, 'proposito', { min: 5, max: 200 });
    const asistentes = entero(datos, 'asistentes', { min: 1, max: 10_000 });

    // 2. Reglas de tiempo (Intervalo de tiempo válido; Bloques de 30 minutos; Límite de cuatro horas consecutivas).
    asegurarRangoValido(intervalo);
    if (intervalo.inicio.getTime() <= this.reloj().getTime()) {
      throw new ErrorAplicacion('INICIO_EN_PASADO', 'Solo se puede reservar a futuro.');
    }
    if (!alineadaABloque(intervalo.inicio) || !alineadaABloque(intervalo.fin)) {
      throw new ErrorAplicacion('BLOQUE_HORARIO_INVALIDO', `El inicio y el fin deben caer en bloques de ${MINUTOS_POR_BLOQUE} minutos (:00 o :30).`);
    }
    asegurarLimiteHorasConsecutivas(intervalo); // CR-01, sin estado: la solicitud por sí sola

    // 3. Espacio (Espacio válido y capacidad).
    const espacio = await this.espacios.buscar(espacioId);
    if (!espacio.activo) throw new ErrorAplicacion('ESPACIO_INACTIVO', 'El espacio está desactivado y no recibe solicitudes.');
    if (asistentes > espacio.capacidad) {
      throw new ErrorAplicacion('CAPACIDAD_EXCEDIDA', `El espacio admite como máximo ${espacio.capacidad} asistentes.`);
    }

    // 4. Sección crítica: duplicados, disponibilidad del espacio, agenda del solicitante (prevencion-conflictos)
    //    y cadena de reservas contiguas del mismo usuario en el mismo espacio (CR-01).
    return this.guardia.ejecutarExclusivo([claveEspacio(espacioId), claveUsuario(usuarioId)], async () => {
      await this.guardia.asegurarSinDuplicado(usuarioId, espacioId, intervalo);
      await this.disponibilidad.asegurarDisponible(espacioId, intervalo);
      await this.guardia.asegurarAgendaLibre(usuarioId, intervalo);
      asegurarLimiteHorasConsecutivas(intervalo, await this.reservas.listar({ usuarioId, espacioId, estados: ESTADOS_ACTIVOS }));

      const ahora = this.reloj();
      const reserva: Reserva = {
        id: randomUUID(),
        espacioId,
        usuarioId,
        ...intervalo,
        proposito,
        asistentes,
        estado: 'PENDIENTE',
        creadaEn: ahora,
        actualizadaEn: ahora,
        historial: [registroDeCreacion(usuarioId, ahora)],
      };
      await this.reservas.insertar(reserva);
      return reserva;
    });
  }
}
