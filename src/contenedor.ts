// Raíz de composición: crea repositorios y servicios y los conecta (design.md D1).
import type { Configuracion } from './configuracion.js';
import { MutexPorClave, type Exclusion } from './compartido/mutex-por-clave.js';
import { relojDelSistema, type Reloj } from './compartido/reloj.js';
import type { Repositorios } from './repositorios/contratos.js';
import { crearRepositoriosEnMemoria } from './repositorios/en-memoria.js';
import { ServicioAprobacion } from './modulos/aprobacion-reservas/servicio-aprobacion.js';
import { ServicioCancelacion } from './modulos/cancelacion-historial/servicio-cancelacion.js';
import { ServicioHistorial } from './modulos/cancelacion-historial/servicio-historial.js';
import { ServicioDisponibilidad } from './modulos/disponibilidad/servicio-disponibilidad.js';
import { ServicioEspacios } from './modulos/gestion-espacios/servicio-espacios.js';
import { HashContrasenas } from './modulos/gestion-usuarios/hash-contrasenas.js';
import { ServicioAutenticacion } from './modulos/gestion-usuarios/servicio-autenticacion.js';
import { ServicioUsuarios } from './modulos/gestion-usuarios/servicio-usuarios.js';
import { GuardiaConflictos } from './modulos/prevencion-conflictos/guardia-conflictos.js';
import { ServicioRoles } from './modulos/roles-permisos/servicio-roles.js';
import { ServicioSolicitudes } from './modulos/solicitudes-reserva/servicio-solicitudes.js';

export interface OpcionesContenedor {
  configuracion: Pick<Configuracion, 'jwtSecreto' | 'jwtDuracionSegundos' | 'rondasBcrypt'>;
  reloj?: Reloj;
  repositorios?: Partial<Repositorios>;
  exclusion?: Exclusion;
}

export function crearContenedor(opciones: OpcionesContenedor) {
  const reloj = opciones.reloj ?? relojDelSistema;
  const exclusion = opciones.exclusion ?? new MutexPorClave();
  const repositorios: Repositorios = { ...crearRepositoriosEnMemoria(), ...opciones.repositorios };
  const hash = new HashContrasenas(opciones.configuracion.rondasBcrypt);

  // M2 — Usuarios
  const usuarios = new ServicioUsuarios(repositorios.usuarios, hash, reloj);
  const autenticacion = new ServicioAutenticacion(
    repositorios.usuarios,
    hash,
    { secreto: opciones.configuracion.jwtSecreto, duracionSegundos: opciones.configuracion.jwtDuracionSegundos },
    reloj,
  );
  // M3 — Roles y permisos
  const roles = new ServicioRoles(repositorios.usuarios, usuarios);
  // M1 — Espacios
  const espacios = new ServicioEspacios(repositorios.espacios, reloj);
  // M5 — Disponibilidad y M6 — Prevención de reservas simultáneas
  const disponibilidad = new ServicioDisponibilidad(repositorios.reservas, espacios);
  const guardia = new GuardiaConflictos(repositorios.reservas, exclusion);
  // M4 — Solicitudes de reserva
  const solicitudes = new ServicioSolicitudes(repositorios.reservas, espacios, disponibilidad, guardia, reloj);
  // M7 — Aprobación y rechazo
  const aprobacion = new ServicioAprobacion(repositorios.reservas, repositorios.usuarios, espacios, guardia, reloj);
  // M8 — Cancelación e historial
  const cancelacion = new ServicioCancelacion(repositorios.reservas, guardia, reloj);
  const historial = new ServicioHistorial(repositorios.reservas);

  return {
    reloj,
    repositorios,
    servicios: { usuarios, autenticacion, roles, espacios, disponibilidad, guardia, solicitudes, aprobacion, cancelacion, historial },
  };
}

export type Contenedor = ReturnType<typeof crearContenedor>;
export type Servicios = Contenedor['servicios'];
