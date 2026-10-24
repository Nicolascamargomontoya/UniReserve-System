// Adaptadores en memoria. Guardan y devuelven copias para que nadie modifique el estado
// sin pasar por `actualizar`, como ocurriría con una base de datos (design.md D10).
import { normalizarNombre, type Espacio, type Reserva, type Usuario } from '../dominio/modelos.js';
import type {
  FiltroEspacios,
  FiltroReservas,
  FiltroUsuarios,
  RepositorioEspacios,
  RepositorioReservas,
  Repositorios,
  RepositorioUsuarios,
} from './contratos.js';

class AlmacenEnMemoria<T extends { id: string }> {
  private readonly registros = new Map<string, T>();

  async insertar(entidad: T): Promise<void> {
    if (this.registros.has(entidad.id)) throw new Error(`Ya existe el registro ${entidad.id}`);
    this.registros.set(entidad.id, structuredClone(entidad));
  }

  async actualizar(entidad: T): Promise<void> {
    if (!this.registros.has(entidad.id)) throw new Error(`No existe el registro ${entidad.id}`);
    this.registros.set(entidad.id, structuredClone(entidad));
  }

  async buscarPorId(id: string): Promise<T | null> {
    const entidad = this.registros.get(id);
    return entidad ? structuredClone(entidad) : null;
  }

  protected todos(): T[] {
    return [...this.registros.values()].map((entidad) => structuredClone(entidad));
  }
}

export class RepositorioUsuariosEnMemoria extends AlmacenEnMemoria<Usuario> implements RepositorioUsuarios {
  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return this.todos().find((usuario) => usuario.correo === correo) ?? null;
  }

  async listar({ rol, activo }: FiltroUsuarios = {}): Promise<Usuario[]> {
    return this.todos()
      .filter((usuario) => (rol === undefined || usuario.rol === rol) && (activo === undefined || usuario.activo === activo))
      .sort((a, b) => a.creadoEn.getTime() - b.creadoEn.getTime());
  }
}

export class RepositorioEspaciosEnMemoria extends AlmacenEnMemoria<Espacio> implements RepositorioEspacios {
  async buscarPorNombre(nombre: string): Promise<Espacio | null> {
    return this.todos().find((espacio) => normalizarNombre(espacio.nombre) === normalizarNombre(nombre)) ?? null;
  }

  async listar({ tipo, capacidadMinima, texto, incluirInactivos = false }: FiltroEspacios = {}): Promise<Espacio[]> {
    return this.todos()
      .filter(
        (espacio) =>
          (incluirInactivos || espacio.activo) &&
          (tipo === undefined || espacio.tipo === tipo) &&
          (capacidadMinima === undefined || espacio.capacidad >= capacidadMinima) &&
          (texto === undefined || normalizarNombre(espacio.nombre).includes(normalizarNombre(texto))),
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
}

export class RepositorioReservasEnMemoria extends AlmacenEnMemoria<Reserva> implements RepositorioReservas {
  async listar({ usuarioId, espacioId, estados, desde, hasta }: FiltroReservas = {}): Promise<Reserva[]> {
    return this.todos()
      .filter(
        (reserva) =>
          (usuarioId === undefined || reserva.usuarioId === usuarioId) &&
          (espacioId === undefined || reserva.espacioId === espacioId) &&
          (estados === undefined || estados.includes(reserva.estado)) &&
          (desde === undefined || reserva.fin.getTime() > desde.getTime()) &&
          (hasta === undefined || reserva.inicio.getTime() < hasta.getTime()),
      )
      .sort((a, b) => a.inicio.getTime() - b.inicio.getTime() || a.creadaEn.getTime() - b.creadaEn.getTime());
  }
}

export function crearRepositoriosEnMemoria(): Repositorios {
  return {
    usuarios: new RepositorioUsuariosEnMemoria(),
    espacios: new RepositorioEspaciosEnMemoria(),
    reservas: new RepositorioReservasEnMemoria(),
  };
}
