// Raíz de composición: crea repositorios y servicios y los conecta (design.md D1).
import type { Configuracion } from './configuracion.js';
import { MutexPorClave, type Exclusion } from './compartido/mutex-por-clave.js';
import { relojDelSistema, type Reloj } from './compartido/reloj.js';
import type { Repositorios } from './repositorios/contratos.js';
import { crearRepositoriosEnMemoria } from './repositorios/en-memoria.js';
import { ServicioEspacios } from './modulos/gestion-espacios/servicio-espacios.js';
import { HashContrasenas } from './modulos/gestion-usuarios/hash-contrasenas.js';
import { ServicioAutenticacion } from './modulos/gestion-usuarios/servicio-autenticacion.js';
import { ServicioUsuarios } from './modulos/gestion-usuarios/servicio-usuarios.js';
import { ServicioRoles } from './modulos/roles-permisos/servicio-roles.js';

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

  return { reloj, exclusion, repositorios, servicios: { usuarios, autenticacion, roles, espacios } };
}

export type Contenedor = ReturnType<typeof crearContenedor>;
export type Servicios = Contenedor['servicios'];
