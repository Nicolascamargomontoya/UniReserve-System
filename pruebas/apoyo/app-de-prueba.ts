// Arnés de pruebas: aplicación real con repositorios en memoria y reloj fijo en 2030-01-07T08:00:00Z.
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { crearContenedor, type OpcionesContenedor } from '../../src/contenedor.js';
import { transicionar } from '../../src/dominio/estados-reserva.js';
import type { Espacio, EstadoReserva, Rol, UsuarioPublico } from '../../src/dominio/modelos.js';

export const AHORA = '2030-01-07T08:00:00Z';
export const ADMIN = { correo: 'admin@uni.edu', contrasena: 'Admin12345', nombreCompleto: 'Administración de espacios' };

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

// Instante en UTC a partir de "HH:MM" (por defecto, del 2030-01-07). Ejemplo: h('10:00').
export const h = (hora: string, dia = '2030-01-07'): string => `${dia}T${hora}:00Z`;

export interface Cuenta {
  token: string;
  usuario: UsuarioPublico;
}

interface OpcionesEntorno extends Partial<OpcionesContenedor> {
  sembrarAdministrador?: boolean;
}

// Los tokens de prueba duran 24 h para que los escenarios puedan adelantar el reloj durante el día;
// el escenario "Token expirado" usa explícitamente la duración por defecto de 1 h.
export const CONFIGURACION_DE_PRUEBA = { jwtSecreto: 'secreto-de-pruebas', jwtDuracionSegundos: 24 * 3600, rondasBcrypt: 4 };

export async function crearEntornoDePrueba({ sembrarAdministrador = true, ...opciones }: OpcionesEntorno = {}) {
  const reloj = new RelojFalso(AHORA);
  const contenedor = crearContenedor({
    configuracion: CONFIGURACION_DE_PRUEBA,
    reloj: reloj.ahora,
    ...opciones,
  });
  if (sembrarAdministrador) await contenedor.servicios.roles.asegurarAdministradorInicial(ADMIN);
  const app = crearApp(contenedor);
  const api = request(app);

  const como = (token: string) => ({
    get: (url: string) => api.get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string, cuerpo: object = {}) => api.post(url).set('Authorization', `Bearer ${token}`).send(cuerpo),
    patch: (url: string, cuerpo: object = {}) => api.patch(url).set('Authorization', `Bearer ${token}`).send(cuerpo),
  });

  async function iniciarSesion(correo: string, contrasena: string): Promise<Cuenta> {
    const respuesta = await api.post('/auth/inicio-sesion').send({ correo, contrasena });
    if (respuesta.status !== 200) throw new Error(`Inicio de sesión fallido: ${JSON.stringify(respuesta.body)}`);
    return respuesta.body as Cuenta;
  }

  let consecutivo = 0;
  async function registrar(rol: Rol = 'ESTUDIANTE', datos: Record<string, unknown> = {}): Promise<Cuenta> {
    consecutivo += 1;
    const cuenta = { correo: `usuario${consecutivo}@uni.edu`, contrasena: 'Segura123', nombreCompleto: `Usuario ${consecutivo}`, rol, ...datos };
    const respuesta = await api.post('/auth/registro').send(cuenta);
    if (respuesta.status !== 201) throw new Error(`Registro fallido: ${JSON.stringify(respuesta.body)}`);
    return iniciarSesion(cuenta.correo, cuenta.contrasena);
  }

  const administrador = sembrarAdministrador ? await iniciarSesion(ADMIN.correo, ADMIN.contrasena) : undefined;

  async function crearEspacio(datos: Record<string, unknown> = {}): Promise<Espacio> {
    consecutivo += 1;
    const espacio = { nombre: `Espacio ${consecutivo}`, tipo: 'LABORATORIO', capacidad: 30, ubicacion: 'Bloque A', ...datos };
    const respuesta = await como(administrador!.token).post('/espacios', espacio);
    if (respuesta.status !== 201) throw new Error(`Creación de espacio fallida: ${JSON.stringify(respuesta.body)}`);
    return respuesta.body as Espacio;
  }

  // Envía una solicitud; por defecto de 10:00 a 12:00 del 2030-01-07 para 10 asistentes.
  function solicitar(token: string, datos: Record<string, unknown>) {
    return como(token).post('/reservas', { inicio: h('10:00'), fin: h('12:00'), proposito: 'Práctica de laboratorio', asistentes: 10, ...datos });
  }

  // Lleva una reserva a otro estado directamente en el almacén (para preparar el "DADO" de un escenario).
  async function forzarEstado(reservaId: string, estado: EstadoReserva): Promise<void> {
    const reserva = await contenedor.repositorios.reservas.buscarPorId(reservaId);
    if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);
    await contenedor.repositorios.reservas.actualizar(transicionar(reserva, estado, administrador?.usuario.id ?? 'sistema', reloj.ahora()));
  }

  return {
    app,
    api,
    reloj,
    contenedor,
    como,
    iniciarSesion,
    registrar,
    crearEspacio,
    solicitar,
    forzarEstado,
    get admin() {
      if (!administrador) throw new Error('El entorno se creó sin administrador.');
      return { ...como(administrador.token), ...administrador };
    },
  };
}

export type EntornoDePrueba = Awaited<ReturnType<typeof crearEntornoDePrueba>>;
