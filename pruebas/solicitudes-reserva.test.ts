// Escenarios de openspec: solicitudes-reserva (M4 — Creación de solicitudes de reserva).
import { describe, expect, it } from 'vitest';
import { crearEntornoDePrueba, h } from './apoyo/app-de-prueba.js';

async function preparar() {
  const entorno = await crearEntornoDePrueba();
  const estudiante = await entorno.registrar('ESTUDIANTE');
  const lab = await entorno.crearEspacio({ nombre: 'Lab 1', capacidad: 30 });
  return { entorno, estudiante, lab };
}

describe('solicitudes-reserva › Creación de solicitudes', () => {
  it('Solicitud válida', async () => {
    const { entorno, estudiante, lab } = await preparar();

    const respuesta = await entorno.solicitar(estudiante.token, {
      espacioId: lab.id,
      inicio: h('10:00'),
      fin: h('12:00'),
      proposito: 'Práctica de redes',
      asistentes: 25,
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({
      espacioId: lab.id,
      usuarioId: estudiante.usuario.id,
      inicio: '2030-01-07T10:00:00.000Z',
      fin: '2030-01-07T12:00:00.000Z',
      proposito: 'Práctica de redes',
      asistentes: 25,
      estado: 'PENDIENTE',
      creadaEn: '2030-01-07T08:00:00.000Z',
    });
  });

  it('Faltan datos obligatorios', async () => {
    const { entorno, estudiante, lab } = await preparar();

    const respuesta = await entorno.como(estudiante.token).post('/reservas', {
      espacioId: lab.id,
      inicio: h('10:00'),
      fin: h('12:00'),
      asistentes: 10,
    });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  });

  it('un profesor también puede solicitar', async () => {
    const { entorno, lab } = await preparar();
    const profesor = await entorno.registrar('PROFESOR');

    const respuesta = await entorno.solicitar(profesor.token, { espacioId: lab.id });

    expect(respuesta.status).toBe(201);
  });
});

describe('solicitudes-reserva › Formato de fechas con zona horaria', () => {
  it('Fecha sin zona horaria', async () => {
    const { entorno, estudiante, lab } = await preparar();

    const respuesta = await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: '2030-01-07T10:00:00' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  });

  it('Fecha con desplazamiento horario', async () => {
    const { entorno, estudiante, lab } = await preparar();

    const respuesta = await entorno.solicitar(estudiante.token, {
      espacioId: lab.id,
      inicio: '2030-01-07T10:00:00-05:00',
      fin: '2030-01-07T11:00:00-05:00',
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.inicio).toBe('2030-01-07T15:00:00.000Z');
  });
});

describe('solicitudes-reserva › Intervalo de tiempo válido', () => {
  it('Fin anterior o igual al inicio', async () => {
    const { entorno, estudiante, lab } = await preparar();

    const anterior = await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('12:00'), fin: h('10:00') });
    const igual = await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('10:00') });

    expect(anterior.status).toBe(422);
    expect(anterior.body.error.codigo).toBe('RANGO_HORARIO_INVALIDO');
    expect(igual.body.error.codigo).toBe('RANGO_HORARIO_INVALIDO');
  });

  it('Inicio en el pasado', async () => {
    const { entorno, estudiante, lab } = await preparar();

    const respuesta = await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('07:00'), fin: h('09:00') });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('INICIO_EN_PASADO');
  });
});

describe('solicitudes-reserva › Bloques de 30 minutos', () => {
  it('Hora fuera de bloque', async () => {
    const { entorno, estudiante, lab } = await preparar();

    const respuesta = await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:15'), fin: h('11:00') });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('BLOQUE_HORARIO_INVALIDO');
  });

  it('Bloque mínimo de 30 minutos', async () => {
    const { entorno, estudiante, lab } = await preparar();

    const respuesta = await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:30'), fin: h('11:00') });

    expect(respuesta.status).toBe(201);
  });
});

describe('solicitudes-reserva › Espacio válido y capacidad', () => {
  it('Espacio inexistente', async () => {
    const { entorno, estudiante } = await preparar();

    const respuesta = await entorno.solicitar(estudiante.token, { espacioId: '00000000-0000-0000-0000-000000000000' });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('ESPACIO_NO_ENCONTRADO');
  });

  it('Espacio inactivo', async () => {
    const { entorno, estudiante } = await preparar();
    const antigua = await entorno.crearEspacio({ nombre: 'Sala Antigua' });
    await entorno.admin.patch(`/espacios/${antigua.id}/estado`, { activo: false });

    const respuesta = await entorno.solicitar(estudiante.token, { espacioId: antigua.id });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('ESPACIO_INACTIVO');
  });

  it('Asistentes por encima de la capacidad', async () => {
    const { entorno, estudiante, lab } = await preparar();

    const respuesta = await entorno.solicitar(estudiante.token, { espacioId: lab.id, asistentes: 31 });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('CAPACIDAD_EXCEDIDA');
  });
});
