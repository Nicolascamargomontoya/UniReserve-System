// M3 — Asignación de roles y administrador inicial (openspec: roles-permisos).
import { ROLES, usuarioPublico, type UsuarioPublico } from '../../dominio/modelos.js';
import { comoObjeto, opcion } from '../../compartido/validacion.js';
import type { DatosAdministrador } from '../../configuracion.js';
import type { RepositorioUsuarios } from '../../repositorios/contratos.js';
import type { ServicioUsuarios } from '../gestion-usuarios/servicio-usuarios.js';
import { impedirAutomodificacion } from './permisos.js';

export class ServicioRoles {
  constructor(
    private readonly usuarios: RepositorioUsuarios,
    private readonly servicioUsuarios: ServicioUsuarios,
  ) {}

  // Requisitos: Asignación de roles; Protección del acceso administrativo.
  async cambiarRol(actorId: string, usuarioId: string, entrada: unknown): Promise<UsuarioPublico> {
    const rol = opcion(comoObjeto(entrada), 'rol', ROLES);
    const usuario = await this.servicioUsuarios.buscar(usuarioId);
    impedirAutomodificacion(actorId, usuarioId);
    const actualizado = { ...usuario, rol };
    await this.usuarios.actualizar(actualizado);
    return usuarioPublico(actualizado);
  }

  // Requisito: Administrador inicial. Devuelve true si tuvo que crearlo.
  async asegurarAdministradorInicial(datos: DatosAdministrador): Promise<boolean> {
    if ((await this.usuarios.listar({ rol: 'ADMINISTRADOR' })).length > 0) return false;
    await this.servicioUsuarios.crearCuenta({ ...datos, rol: 'ADMINISTRADOR' });
    return true;
  }
}
