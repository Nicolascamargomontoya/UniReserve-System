// Contratos de acceso a datos. Los servicios solo dependen de estas interfaces (plan §3.3).
import type { Rol, Usuario } from '../dominio/modelos.js';

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

export interface Repositorios {
  usuarios: RepositorioUsuarios;
}
