// Adaptadores en memoria. Guardan y devuelven copias para que nadie modifique el estado
// sin pasar por `actualizar`, como ocurriría con una base de datos (design.md D10).
import type { Usuario } from '../dominio/modelos.js';
import type { FiltroUsuarios, Repositorios, RepositorioUsuarios } from './contratos.js';

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

export function crearRepositoriosEnMemoria(): Repositorios {
  return { usuarios: new RepositorioUsuariosEnMemoria() };
}
