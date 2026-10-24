// Lectura y validación de cuerpos JSON y parámetros de consulta. Todo dato inválido → 400 DATOS_INVALIDOS.
import { ErrorAplicacion } from './errores.js';

export type Datos = Record<string, unknown>;

const FECHA_ISO_CON_ZONA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function datosInvalidos(campo: string, problema: string): ErrorAplicacion {
  return new ErrorAplicacion('DATOS_INVALIDOS', `El campo "${campo}" ${problema}.`, { campo });
}

export function comoObjeto(valor: unknown): Datos {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new ErrorAplicacion('DATOS_INVALIDOS', 'El cuerpo de la petición debe ser un objeto JSON.');
  }
  return valor as Datos;
}

interface Longitud {
  min?: number;
  max?: number;
}

export function texto(datos: Datos, campo: string, { min = 1, max = 500 }: Longitud = {}): string {
  const valor = datos[campo];
  if (typeof valor !== 'string') throw datosInvalidos(campo, 'es obligatorio y debe ser texto');
  const limpio = valor.trim();
  if (limpio.length < min || limpio.length > max) {
    throw datosInvalidos(campo, `debe tener entre ${min} y ${max} caracteres`);
  }
  return limpio;
}

export function textoOpcional(datos: Datos, campo: string, longitud?: Longitud): string | undefined {
  return datos[campo] === undefined ? undefined : texto(datos, campo, longitud);
}

export function entero(datos: Datos, campo: string, { min = 1, max = 1_000_000 }: { min?: number; max?: number } = {}): number {
  const valor = datos[campo];
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < min || valor > max) {
    throw datosInvalidos(campo, `debe ser un número entero entre ${min} y ${max}`);
  }
  return valor;
}

export function booleano(datos: Datos, campo: string): boolean {
  const valor = datos[campo];
  if (typeof valor !== 'boolean') throw datosInvalidos(campo, 'es obligatorio y debe ser verdadero o falso');
  return valor;
}

export function opcion<T extends string>(datos: Datos, campo: string, opciones: readonly T[]): T {
  const valor = datos[campo];
  if (typeof valor !== 'string' || !opciones.includes(valor as T)) {
    throw datosInvalidos(campo, `debe ser uno de: ${opciones.join(', ')}`);
  }
  return valor as T;
}

export function correo(datos: Datos, campo: string): string {
  const valor = texto(datos, campo, { max: 254 }).toLowerCase();
  if (!CORREO.test(valor)) throw datosInvalidos(campo, 'debe ser un correo electrónico válido');
  return valor;
}

// La contraseña no se recorta: los espacios forman parte de ella. bcrypt solo usa los primeros 72 bytes.
export function contrasena(datos: Datos, campo: string): string {
  const valor = datos[campo];
  if (typeof valor !== 'string' || valor.length < 8 || valor.length > 72) {
    throw datosInvalidos(campo, 'debe tener entre 8 y 72 caracteres');
  }
  return valor;
}

// Instante ISO-8601 con zona horaria explícita (solicitudes-reserva: Formato de fechas con zona horaria).
export function fechaHora(datos: Datos, campo: string): Date {
  const valor = datos[campo];
  if (typeof valor !== 'string' || !FECHA_ISO_CON_ZONA.test(valor) || Number.isNaN(Date.parse(valor))) {
    throw datosInvalidos(campo, 'debe ser una fecha ISO-8601 con zona horaria, por ejemplo 2030-01-07T10:00:00Z');
  }
  return new Date(valor);
}

export function listaDeTextos(datos: Datos, campo: string, { maxElementos = 50, max = 100 } = {}): string[] {
  const valor = datos[campo];
  if (!Array.isArray(valor) || valor.length > maxElementos) {
    throw datosInvalidos(campo, `debe ser una lista de hasta ${maxElementos} textos`);
  }
  return valor.map((elemento: unknown, indice) => {
    const limpio = typeof elemento === 'string' ? elemento.trim() : '';
    if (limpio.length < 1 || limpio.length > max) {
      throw datosInvalidos(`${campo}[${indice}]`, `debe ser un texto de 1 a ${max} caracteres`);
    }
    return limpio;
  });
}

// Parámetros de consulta: siempre opcionales y recibidos como texto.
function parametro(consulta: Datos, campo: string): string | undefined {
  const valor = consulta[campo];
  if (valor === undefined) return undefined;
  if (typeof valor !== 'string') throw datosInvalidos(campo, 'debe aparecer una sola vez');
  return valor;
}

export function parametroTexto(consulta: Datos, campo: string): string | undefined {
  const valor = parametro(consulta, campo)?.trim();
  return valor ? valor : undefined;
}

export function parametroEntero(consulta: Datos, campo: string): number | undefined {
  const valor = parametro(consulta, campo);
  if (valor === undefined) return undefined;
  if (!/^\d+$/.test(valor)) throw datosInvalidos(campo, 'debe ser un número entero positivo');
  return Number(valor);
}

export function parametroBooleano(consulta: Datos, campo: string): boolean | undefined {
  const valor = parametro(consulta, campo);
  if (valor === undefined) return undefined;
  if (valor !== 'true' && valor !== 'false') throw datosInvalidos(campo, 'debe ser true o false');
  return valor === 'true';
}

export function parametroOpcion<T extends string>(consulta: Datos, campo: string, opciones: readonly T[]): T | undefined {
  return consulta[campo] === undefined ? undefined : opcion(consulta, campo, opciones);
}

export function parametroFecha(consulta: Datos, campo: string): Date | undefined {
  return consulta[campo] === undefined ? undefined : fechaHora(consulta, campo);
}
