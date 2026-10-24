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

export const TIPOS_ESPACIO = ['LABORATORIO', 'AUDITORIO', 'SALA_COMPUTO'] as const;
export type TipoEspacio = (typeof TIPOS_ESPACIO)[number];

export interface Espacio {
  id: string;
  nombre: string;
  tipo: TipoEspacio;
  capacidad: number;
  ubicacion: string;
  equipamiento: string[];
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

// Los nombres se comparan sin distinguir mayúsculas ni espacios en los extremos (RN-01).
export function normalizarNombre(nombre: string): string {
  return nombre.trim().toLocaleLowerCase('es');
}

export const ESTADOS_RESERVA = ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA'] as const;
export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];

// Reservas que ocupan la franja: primero en llegar, primero en ser atendido (RN-07).
export const ESTADOS_ACTIVOS: readonly EstadoReserva[] = ['PENDIENTE', 'APROBADA'];

export interface CambioEstado {
  estadoAnterior: EstadoReserva | null;
  estadoNuevo: EstadoReserva;
  autorId: string;
  fecha: Date;
  motivo?: string;
}

export interface Reserva {
  id: string;
  espacioId: string;
  usuarioId: string;
  inicio: Date;
  fin: Date;
  proposito: string;
  asistentes: number;
  estado: EstadoReserva;
  creadaEn: Date;
  actualizadaEn: Date;
  historial: CambioEstado[];
}
