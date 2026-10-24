export const ROLES = ['ESTUDIANTE', 'PROFESOR', 'ADMINISTRADOR'] as const;
export type Rol = (typeof ROLES)[number];

export interface Usuario {
  id: string;
  correo: string;
  nombreCompleto: string;
  rol: Rol;
  activo: boolean;
  hashContrasena: string;
  creadoEn: Date;
}

export type UsuarioPublico = Omit<Usuario, 'hashContrasena'>;

// La contraseña y su hash nunca salen del sistema (gestion-usuarios: Almacenamiento seguro de contraseñas).
export function usuarioPublico({ hashContrasena: _omitido, ...publico }: Usuario): UsuarioPublico {
  return publico;
}

export interface Sesion {
  usuarioId: string;
  rol: Rol;
}
