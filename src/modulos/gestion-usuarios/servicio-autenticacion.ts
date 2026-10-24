// M2 — Autenticación (openspec: gestion-usuarios › Autenticación; roles-permisos › Autenticación obligatoria).
import jwt from 'jsonwebtoken';
import { usuarioPublico, type Sesion, type UsuarioPublico } from '../../dominio/modelos.js';
import { ErrorAplicacion } from '../../compartido/errores.js';
import type { Reloj } from '../../compartido/reloj.js';
import { comoObjeto, texto } from '../../compartido/validacion.js';
import type { RepositorioUsuarios } from '../../repositorios/contratos.js';
import type { HashContrasenas } from './hash-contrasenas.js';

export interface OpcionesToken {
  secreto: string;
  duracionSegundos: number;
}

const segundos = (fecha: Date) => Math.floor(fecha.getTime() / 1000);

export class ServicioAutenticacion {
  private hashFicticio?: Promise<string>;

  constructor(
    private readonly usuarios: RepositorioUsuarios,
    private readonly hash: HashContrasenas,
    private readonly opciones: OpcionesToken,
    private readonly reloj: Reloj,
  ) {}

  async iniciarSesion(entrada: unknown): Promise<{ token: string; usuario: UsuarioPublico }> {
    const datos = comoObjeto(entrada);
    const correo = texto(datos, 'correo', { max: 254 }).toLowerCase();
    const contrasena = typeof datos.contrasena === 'string' ? datos.contrasena : '';

    const usuario = await this.usuarios.buscarPorCorreo(correo);
    // Se compara siempre contra un hash para no revelar, por el tiempo de respuesta, si el correo existe.
    this.hashFicticio ??= this.hash.calcular('contrasena-ficticia');
    const hashAComparar = usuario?.hashContrasena ?? (await this.hashFicticio);
    const contrasenaValida = await this.hash.verificar(contrasena, hashAComparar);
    if (!usuario || !contrasenaValida) {
      throw new ErrorAplicacion('CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos.');
    }
    if (!usuario.activo) throw new ErrorAplicacion('CUENTA_INACTIVA', 'La cuenta está desactivada.');

    return { token: this.emitirToken(usuario.id), usuario: usuarioPublico(usuario) };
  }

  emitirToken(usuarioId: string): string {
    return jwt.sign({ iat: segundos(this.reloj()) }, this.opciones.secreto, {
      subject: usuarioId,
      expiresIn: this.opciones.duracionSegundos,
      algorithm: 'HS256',
    });
  }

  // El rol y el estado se leen del almacén en cada petición (design.md D4).
  async verificarToken(token: string): Promise<Sesion> {
    let carga: string | jwt.JwtPayload;
    try {
      carga = jwt.verify(token, this.opciones.secreto, { algorithms: ['HS256'], clockTimestamp: segundos(this.reloj()) });
    } catch {
      throw new ErrorAplicacion('NO_AUTENTICADO', 'El token de acceso es inválido o expiró.');
    }
    const usuario = typeof carga === 'object' && carga.sub ? await this.usuarios.buscarPorId(carga.sub) : null;
    if (!usuario) throw new ErrorAplicacion('NO_AUTENTICADO', 'El token de acceso no corresponde a ninguna cuenta.');
    if (!usuario.activo) throw new ErrorAplicacion('CUENTA_INACTIVA', 'La cuenta está desactivada.');
    return { usuarioId: usuario.id, rol: usuario.rol };
  }
}
