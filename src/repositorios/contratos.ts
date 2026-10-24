// Contratos de acceso a datos. Los servicios solo dependen de estas interfaces (plan §3.3).
import type { Espacio, Rol, TipoEspacio, Usuario } from '../dominio/modelos.js';

export interface FiltroUsuarios {
  rol?: Rol;
  activo?: boolean;
}

export interface RepositorioUsuarios {
  insertar(usuario: Usuario): Promise<void>;
  actualizar(usuario: Usuario): Promise<void>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorCorreo(correo: string): Promise<Usuario | null>;
  listar(filtro?: FiltroUsuarios): Promise<Usuario[]>;
}

export interface FiltroEspacios {
  tipo?: TipoEspacio;
  capacidadMinima?: number;
  texto?: string;
  incluirInactivos?: boolean;
}

export interface RepositorioEspacios {
  insertar(espacio: Espacio): Promise<void>;
  actualizar(espacio: Espacio): Promise<void>;
  buscarPorId(id: string): Promise<Espacio | null>;
  buscarPorNombre(nombre: string): Promise<Espacio | null>;
  listar(filtro?: FiltroEspacios): Promise<Espacio[]>;
}

export interface Repositorios {
  usuarios: RepositorioUsuarios;
  espacios: RepositorioEspacios;
}
