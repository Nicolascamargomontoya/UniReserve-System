// Escenarios de openspec: disponibilidad (M5 — Validación de disponibilidad).
import { describe, expect, it } from 'vitest';
import { crearEntornoDePrueba, h } from './apoyo/app-de-prueba.js';

async function preparar() {
  const entorno = await crearEntornoDePrueba();
  const ana = await entorno.registrar('ESTUDIANTE');
  const beto = await entorno.registrar('ESTUDIANTE');
  const lab = await entorno.crearEspacio({ nombre: 'Lab 1' });
  return { entorno, ana, beto, lab };
}

const DIA_COMPLETO = { desde: '2030-01-07T00:00:00Z', hasta: '2030-01-08T00:00:00Z' };

describe('disponibilidad › Definición de disponibilidad', () => {
  it('Reserva contigua permitida', async () => {
    const { entorno, ana, beto, lab } = await preparar();
    const previa = await entorno.solicitar(ana.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') });
    await entorno.forzarEstado(previa.body.id, 'APROBADA');

    const respuesta = await entorno.solicitar(beto.token, { espacioId: lab.id, inicio: h('12:00'), fin: h('14:00') });

    expect(respuesta.status).toBe(201);
  });

  it('Las reservas rechazadas o canceladas no ocupan la franja', async () => {
    const { entorno, ana, beto, lab } = await preparar();
    const carla = await entorno.registrar('ESTUDIANTE');
    const cancelada = await entorno.solicitar(ana.token, { espacioId: lab.id });
    await entorno.forzarEstado(cancelada.body.id, 'CANCELADA');
    const rechazada = await entorno.solicitar(beto.token, { espacioId: lab.id });
    await entorno.forzarEstado(rechazada.body.id, 'RECHAZADA');

    const respuesta = await entorno.solicitar(carla.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') });

    expect(respuesta.status).toBe(201);
  });
});

describe('disponibilidad › Validación de disponibilidad al solicitar', () => {
  it('Solapamiento con una reserva aprobada', async () => {
    const { entorno, ana, beto, lab } = await preparar();
    const previa = await entorno.solicitar(ana.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') });
    await entorno.forzarEstado(previa.body.id, 'APROBADA');

    const respuesta = await entorno.solicitar(beto.token, { espacioId: lab.id, inicio: h('11:00'), fin: h('13:00') });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('ESPACIO_NO_DISPONIBLE');
    expect(respuesta.body.error.detalles.conflictos).toEqual([
      { inicio: '2030-01-07T10:00:00.000Z', fin: '2030-01-07T12:00:00.000Z', estado: 'APROBADA' },
    ]);
  });

  it('Solapamiento con una solicitud pendiente', async () => {
    const { entorno, ana, beto, lab } = await preparar();
    await entorno.solicitar(ana.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') });

    const respuesta = await entorno.solicitar(beto.token, { espacioId: lab.id, inicio: h('09:00'), fin: h('10:30') });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('ESPACIO_NO_DISPONIBLE');
  });
});

describe('disponibilidad › Consulta de ocupación de un espacio', () => {
  it('Consultar la ocupación de un día', async () => {
    const { entorno, ana, beto, lab } = await preparar();
    const carla = await entorno.registrar('ESTUDIANTE');
    await entorno.solicitar(ana.token, { espacioId: lab.id, inicio: h('14:00'), fin: h('16:00') });
    await entorno.solicitar(beto.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') });
    const cancelada = await entorno.solicitar(carla.token, { espacioId: lab.id, inicio: h('12:00'), fin: h('13:00') });
    await entorno.forzarEstado(cancelada.body.id, 'CANCELADA');

    const respuesta = await entorno.como(ana.token).get(`/espacios/${lab.id}/ocupacion`).query(DIA_COMPLETO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual([
      { inicio: '2030-01-07T10:00:00.000Z', fin: '2030-01-07T12:00:00.000Z', estado: 'PENDIENTE' },
      { inicio: '2030-01-07T14:00:00.000Z', fin: '2030-01-07T16:00:00.000Z', estado: 'PENDIENTE' },
    ]);
  });

  it('Los solicitantes no ven quién reservó', async () => {
    const { entorno, ana, beto, lab } = await preparar();
    await entorno.solicitar(beto.token, { espacioId: lab.id });

    const comoSolicitante = await entorno.como(ana.token).get(`/espacios/${lab.id}/ocupacion`).query(DIA_COMPLETO);
    const comoAdministrador = await entorno.admin.get(`/espacios/${lab.id}/ocupacion`).query(DIA_COMPLETO);

    expect(comoSolicitante.body[0]).not.toHaveProperty('usuarioId');
    expect(comoSolicitante.body[0]).not.toHaveProperty('reservaId');
    expect(comoAdministrador.body[0].usuarioId).toBe(beto.usuario.id);
  });

  it('Rango de consulta invertido', async () => {
    const { entorno, ana, lab } = await preparar();

    const respuesta = await entorno
      .como(ana.token)
      .get(`/espacios/${lab.id}/ocupacion`)
      .query({ desde: '2030-01-08T00:00:00Z', hasta: '2030-01-07T00:00:00Z' });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('RANGO_HORARIO_INVALIDO');
  });

  it('Rango de consulta demasiado amplio', async () => {
    const { entorno, ana, lab } = await preparar();

    const respuesta = await entorno
      .como(ana.token)
      .get(`/espacios/${lab.id}/ocupacion`)
      .query({ desde: '2030-01-01T00:00:00Z', hasta: '2030-02-02T00:00:00Z' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  });

  it('responde 404 al consultar la ocupación de un espacio inexistente', async () => {
    const { entorno, ana } = await preparar();

    const respuesta = await entorno.como(ana.token).get('/espacios/00000000-0000-0000-0000-000000000000/ocupacion').query(DIA_COMPLETO);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('ESPACIO_NO_ENCONTRADO');
  });
});

describe('disponibilidad › Búsqueda de espacios disponibles', () => {
  it('Buscar espacios libres en una franja', async () => {
    const { entorno, ana, lab } = await preparar();
    const profesor = await entorno.registrar('PROFESOR');
    await entorno.crearEspacio({ nombre: 'Lab 2' });
    const previa = await entorno.solicitar(ana.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') });
    await entorno.forzarEstado(previa.body.id, 'APROBADA');

    const respuesta = await entorno.como(profesor.token).get('/espacios/disponibles').query({ inicio: h('11:00'), fin: h('12:00') });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.map((espacio: { nombre: string }) => espacio.nombre)).toEqual(['Lab 2']);
  });

  it('rechaza una búsqueda con el intervalo invertido', async () => {
    const { entorno, ana } = await preparar();

    const respuesta = await entorno.como(ana.token).get('/espacios/disponibles').query({ inicio: h('12:00'), fin: h('11:00') });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('RANGO_HORARIO_INVALIDO');
  });
});
