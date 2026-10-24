// M2 — Registro y administración de usuarios (openspec: gestion-usuarios).
import { randomUUID } from 'node:crypto';
import { ROLES, usuarioPublico, type Rol, type Usuario, type UsuarioPublico } from '../../dominio/modelos.js';
import { ErrorAplicacion } from '../../compartido/errores.js';
import type { Reloj } from '../../compartido/reloj.js';
import { booleano, comoObjeto, contrasena, correo, opcion, texto } from '../../compartido/validacion.js';
import type { FiltroUsuarios, RepositorioUsuarios } from '../../repositorios/contratos.js';
import { impedirAutomodificacion } from '../roles-permisos/permisos.js';
import type { HashContrasenas } from './hash-contrasenas.js';

export interface DatosCuenta {
  correo: string;
  contrasena: string;
  nombreCompleto: string;
  rol: Rol;
}

export class ServicioUsuarios {
  constructor(
    private readonly usuarios: RepositorioUsuarios,
    private readonly hash: HashContrasenas,
    private readonly reloj: Reloj,
  ) {}

  // Requisitos: Registro de cuentas; Validación de los datos de registro.
  async registrar(entrada: unknown): Promise<UsuarioPublico> {
    const datos = comoObjeto(entrada);
    const cuenta: DatosCuenta = {
      correo: correo(datos, 'correo'),
      contrasena: contrasena(datos, 'contrasena'),
      nombreCompleto: texto(datos, 'nombreCompleto', { min: 3, max: 100 }),
      rol: opcion(datos, 'rol', ROLES),
    };
    if (cuenta.rol === 'ADMINISTRADOR') {
      throw new ErrorAplicacion('ACCESO_DENEGADO', 'El rol ADMINISTRADOR solo puede asignarlo otro administrador.');
    }
    return usuarioPublico(await this.crearCuenta(cuenta));
  }

  async crearCuenta({ correo: correoCuenta, contrasena: clave, nombreCompleto, rol }: DatosCuenta): Promise<Usuario> {
    if (await this.usuarios.buscarPorCorreo(correoCuenta)) {
      throw new ErrorAplicacion('CORREO_YA_REGISTRADO', 'Ya existe una cuenta con ese correo.');
    }
    const usuario: Usuario = {
      id: randomUUID(),
      correo: correoCuenta,
      nombreCompleto,
      rol,
      activo: true,
      hashContrasena: await this.hash.calcular(clave),
      creadoEn: this.reloj(),
    };
    await this.usuarios.insertar(usuario);
    return usuario;
  }

  // Requisito: Perfil propio. Solo el nombre es editable; correo y rol se ignoran.
  async perfil(usuarioId: string): Promise<UsuarioPublico> {
    return usuarioPublico(await this.buscar(usuarioId));
  }

  async actualizarPerfil(usuarioId: string, entrada: unknown): Promise<UsuarioPublico> {
    const nombreCompleto = texto(comoObjeto(entrada), 'nombreCompleto', { min: 3, max: 100 });
    const usuario = { ...(await this.buscar(usuarioId)), nombreCompleto };
    await this.usuarios.actualizar(usuario);
    return usuarioPublico(usuario);
  }

  // Requisito: Administración de cuentas.
  async listar(filtro: FiltroUsuarios): Promise<UsuarioPublico[]> {
    return (await this.usuarios.listar(filtro)).map(usuarioPublico);
  }

  async obtener(usuarioId: string): Promise<UsuarioPublico> {
    return usuarioPublico(await this.buscar(usuarioId));
  }

  async cambiarEstado(actorId: string, usuarioId: string, entrada: unknown): Promise<UsuarioPublico> {
    const activo = booleano(comoObjeto(entrada), 'activo');
    const usuario = await this.buscar(usuarioId);
    impedirAutomodificacion(actorId, usuarioId);
    const actualizado = { ...usuario, activo };
    await this.usuarios.actualizar(actualizado);
    return usuarioPublico(actualizado);
  }

  async buscar(usuarioId: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) throw new ErrorAplicacion('USUARIO_NO_ENCONTRADO', 'La cuenta no existe.');
    return usuario;
  }
}
