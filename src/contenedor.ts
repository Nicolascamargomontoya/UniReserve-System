// Raíz de composición: crea repositorios y servicios y los conecta (design.md D1).
import type { Configuracion } from './configuracion.js';
import { MutexPorClave, type Exclusion } from './compartido/mutex-por-clave.js';
import { relojDelSistema, type Reloj } from './compartido/reloj.js';

export interface OpcionesContenedor {
  configuracion: Pick<Configuracion, 'jwtSecreto' | 'jwtDuracionSegundos' | 'rondasBcrypt'>;
  reloj?: Reloj;
  exclusion?: Exclusion;
}

export function crearContenedor(opciones: OpcionesContenedor) {
  const reloj = opciones.reloj ?? relojDelSistema;
  const exclusion = opciones.exclusion ?? new MutexPorClave();

  return { reloj, exclusion, servicios: {} };
}

export type Contenedor = ReturnType<typeof crearContenedor>;
