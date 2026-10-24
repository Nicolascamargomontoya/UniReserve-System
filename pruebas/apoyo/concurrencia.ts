// Utilidades para forzar el intercalado de peticiones concurrentes (design.md D7).
import type { Exclusion } from '../../src/compartido/mutex-por-clave.js';

// Cada método del repositorio espera un ciclo del temporizador antes de ejecutarse, como haría una base de datos real.
export function conLatencia<T extends object>(repositorio: T): T {
  return new Proxy(repositorio, {
    get(objetivo, propiedad, receptor) {
      const valor: unknown = Reflect.get(objetivo, propiedad, receptor);
      if (typeof valor !== 'function') return valor;
      return async (...argumentos: unknown[]) => {
        await new Promise((resolver) => setTimeout(resolver, 1));
        return Reflect.apply(valor, objetivo, argumentos);
      };
    },
  });
}

// Exclusión que no excluye nada: solo para demostrar que sin el mutex las pruebas de concurrencia fallan.
export const sinExclusion: Exclusion = { ejecutarExclusivo: (_claves, operacion) => operacion() };
