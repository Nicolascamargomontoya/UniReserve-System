// Arnés de pruebas: aplicación real con repositorios en memoria y reloj fijo en 2030-01-07T08:00:00Z.
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { crearContenedor, type OpcionesContenedor } from '../../src/contenedor.js';

export const AHORA = '2030-01-07T08:00:00Z';

export class RelojFalso {
  private actual: number;

  constructor(inicial: string) {
    this.actual = Date.parse(inicial);
  }

  readonly ahora = (): Date => new Date(this.actual);

  fijar(iso: string): void {
    this.actual = Date.parse(iso);
  }
}

// Instante del 2030-01-07 en UTC a partir de "HH:MM" (por ejemplo, h('10:00')).
export const h = (hora: string, dia = '2030-01-07'): string => `${dia}T${hora}:00Z`;

export function crearEntornoDePrueba(opciones: Partial<OpcionesContenedor> = {}) {
  const reloj = new RelojFalso(AHORA);
  const contenedor = crearContenedor({
    configuracion: { jwtSecreto: 'secreto-de-pruebas', jwtDuracionSegundos: 3600, rondasBcrypt: 4 },
    reloj: reloj.ahora,
    ...opciones,
  });
  const app = crearApp(contenedor);
  const api = request(app);

  return { app, api, reloj, contenedor };
}
