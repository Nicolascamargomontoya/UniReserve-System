// M3 — Matriz de permisos (openspec: roles-permisos; design.md D3).
import type { Rol } from '../../dominio/modelos.js';
import { ErrorAplicacion } from '../../compartido/errores.js';

export type Permiso =
  | 'espacios:consultar'
  | 'espacios:gestionar'
  | 'reservas:crear'
  | 'reservas:consultar-propias'
  | 'reservas:cancelar-propias'
  | 'reservas:consultar-todas'
  | 'reservas:decidir'
  | 'reservas:cancelar-cualquiera'
  | 'usuarios:gestionar';

// Requisito: Permisos de los solicitantes. ESTUDIANTE y PROFESOR tienen los mismos permisos.
const PERMISOS_SOLICITANTE: readonly Permiso[] = [
  'espacios:consultar',
  'reservas:crear',
  'reservas:consultar-propias',
  'reservas:cancelar-propias',
];

// Requisito: Permisos del administrador. No es solicitante, así que no crea reservas.
const PERMISOS_ADMINISTRADOR: readonly Permiso[] = [
  'espacios:consultar',
  'espacios:gestionar',
  'reservas:consultar-todas',
  'reservas:decidir',
  'reservas:cancelar-cualquiera',
  'usuarios:gestionar',
];

export const PERMISOS_POR_ROL: Readonly<Record<Rol, readonly Permiso[]>> = {
  ESTUDIANTE: PERMISOS_SOLICITANTE,
  PROFESOR: PERMISOS_SOLICITANTE,
  ADMINISTRADOR: PERMISOS_ADMINISTRADOR,
};

export function tienePermiso(rol: Rol, permiso: Permiso): boolean {
  return PERMISOS_POR_ROL[rol].includes(permiso);
}

// Requisito: Protección del acceso administrativo.
export function impedirAutomodificacion(actorId: string, objetivoId: string): void {
  if (actorId === objetivoId) {
    throw new ErrorAplicacion(
      'AUTOMODIFICACION_NO_PERMITIDA',
      'Un administrador no puede cambiar su propio rol ni desactivar su propia cuenta.',
    );
  }
}
