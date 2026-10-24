// Escenarios de openspec: prevencion-conflictos (M6 — Prevención de reservas simultáneas).
import { describe, expect, it } from 'vitest';
import { RepositorioReservasEnMemoria } from '../src/repositorios/en-memoria.js';
import { crearEntornoDePrueba, h } from './apoyo/app-de-prueba.js';
import { conLatencia, sinExclusion } from './apoyo/concurrencia.js';

// El repositorio con latencia obliga a que las peticiones concurrentes se intercalen entre la verificación y la escritura.
const entornoConcurrente = (opciones: Parameters<typeof crearEntornoDePrueba>[0] = {}) =>
  crearEntornoDePrueba({ repositorios: { reservas: conLatencia(new RepositorioReservasEnMemoria()) }, ...opciones });

const codigos = (respuestas: Array<{ status: number; body: { error?: { codigo: string } } }>) =>
  respuestas.map((respuesta) => (respuesta.status === 201 ? 201 : respuesta.body.error?.codigo)).sort();

describe('prevencion-conflictos › Exclusividad del espacio ante solicitudes concurrentes', () => {
  it('Cinco solicitudes simultáneas por la misma franja', async () => {
    const entorno = await entornoConcurrente();
    const lab = await entorno.crearEspacio({ nombre: 'Lab 1' });
    const estudiantes = await Promise.all(Array.from({ length: 5 }, () => entorno.registrar('ESTUDIANTE')));

    const respuestas = await Promise.all(
      estudiantes.map((estudiante) => entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') })),
    );

    expect(codigos(respuestas)).toEqual([201, 'ESPACIO_NO_DISPONIBLE', 'ESPACIO_NO_DISPONIBLE', 'ESPACIO_NO_DISPONIBLE', 'ESPACIO_NO_DISPONIBLE']);
    expect(await entorno.contenedor.repositorios.reservas.listar({ espacioId: lab.id })).toHaveLength(1);
  });

  // Prueba de control (tarea 4.6): sin el mutex, la misma franja se asigna varias veces. Demuestra que la
  // prueba anterior detecta la ausencia del mecanismo de exclusión.
  it('control: sin mutex por clave la misma franja se asigna más de una vez', async () => {
    const entorno = await entornoConcurrente({ exclusion: sinExclusion });
    const lab = await entorno.crearEspacio({ nombre: 'Lab 1' });
    const estudiantes = await Promise.all(Array.from({ length: 5 }, () => entorno.registrar('ESTUDIANTE')));

    const respuestas = await Promise.all(
      estudiantes.map((estudiante) => entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') })),
    );

    expect(respuestas.filter((respuesta) => respuesta.status === 201).length).toBeGreaterThan(1);
  });
});

describe('prevencion-conflictos › Exclusividad del solicitante', () => {
  it('Mismo horario en otro espacio', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');
    const lab1 = await entorno.crearEspacio({ nombre: 'Lab 1' });
    const lab2 = await entorno.crearEspacio({ nombre: 'Lab 2' });
    await entorno.solicitar(estudiante.token, { espacioId: lab1.id, inicio: h('10:00'), fin: h('12:00') });

    const respuesta = await entorno.solicitar(estudiante.token, { espacioId: lab2.id, inicio: h('11:00'), fin: h('13:00') });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('CONFLICTO_HORARIO_USUARIO');
  });

  it('Solicitudes simultáneas del mismo usuario en espacios distintos', async () => {
    const entorno = await entornoConcurrente();
    const estudiante = await entorno.registrar('ESTUDIANTE');
    const lab1 = await entorno.crearEspacio({ nombre: 'Lab 1' });
    const lab2 = await entorno.crearEspacio({ nombre: 'Lab 2' });

    const respuestas = await Promise.all([
      entorno.solicitar(estudiante.token, { espacioId: lab1.id, inicio: h('10:00'), fin: h('12:00') }),
      entorno.solicitar(estudiante.token, { espacioId: lab2.id, inicio: h('10:00'), fin: h('12:00') }),
    ]);

    expect(codigos(respuestas)).toEqual([201, 'CONFLICTO_HORARIO_USUARIO']);
  });

  it('otro usuario sí puede reservar la misma franja en otro espacio', async () => {
    const entorno = await crearEntornoDePrueba();
    const ana = await entorno.registrar('ESTUDIANTE');
    const beto = await entorno.registrar('ESTUDIANTE');
    const lab1 = await entorno.crearEspacio({ nombre: 'Lab 1' });
    const lab2 = await entorno.crearEspacio({ nombre: 'Lab 2' });
    await entorno.solicitar(ana.token, { espacioId: lab1.id });

    const respuesta = await entorno.solicitar(beto.token, { espacioId: lab2.id });

    expect(respuesta.status).toBe(201);
  });
});

describe('prevencion-conflictos › Detección de solicitudes duplicadas', () => {
  it('El mismo estudiante repite la solicitud', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');
    const lab = await entorno.crearEspacio({ nombre: 'Lab 1' });
    const original = await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') });

    const respuesta = await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('SOLICITUD_DUPLICADA');
    expect(respuesta.body.error.detalles.reservaId).toBe(original.body.id);
  });
});
