// Escenarios de openspec: cancelacion-historial (M8 — Cancelación e historial de reservas).
import { describe, expect, it } from 'vitest';
import { crearEntornoDePrueba, h } from './apoyo/app-de-prueba.js';

async function preparar() {
  const entorno = await crearEntornoDePrueba();
  const estudiante = await entorno.registrar('ESTUDIANTE');
  const otro = await entorno.registrar('ESTUDIANTE');
  const lab = await entorno.crearEspacio({ nombre: 'Lab 1' });
  return { entorno, estudiante, otro, lab };
}

describe('cancelacion-historial › Cancelación por el solicitante', () => {
  it('Cancelar una reserva aprobada propia', async () => {
    const { entorno, estudiante, lab } = await preparar();
    const reserva = (await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') })).body;
    await entorno.admin.patch(`/reservas/${reserva.id}/aprobar`);
    entorno.reloj.fijar(h('09:00'));

    const respuesta = await entorno.como(estudiante.token).patch(`/reservas/${reserva.id}/cancelar`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('CANCELADA');
  });

  it('La cancelación libera la franja', async () => {
    const { entorno, estudiante, otro, lab } = await preparar();
    const reserva = (await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') })).body;
    await entorno.como(estudiante.token).patch(`/reservas/${reserva.id}/cancelar`);

    const respuesta = await entorno.solicitar(otro.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') });

    expect(respuesta.status).toBe(201);
  });

  it('Cancelar una reserva ajena', async () => {
    const { entorno, estudiante, otro, lab } = await preparar();
    const ajena = (await entorno.solicitar(otro.token, { espacioId: lab.id })).body;

    const respuesta = await entorno.como(estudiante.token).patch(`/reservas/${ajena.id}/cancelar`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error.codigo).toBe('ACCESO_DENEGADO');
    expect((await entorno.admin.get(`/reservas/${ajena.id}`)).body.estado).toBe('PENDIENTE');
  });

  it('Cancelar una reserva ya iniciada', async () => {
    const { entorno, estudiante, lab } = await preparar();
    const reserva = (await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') })).body;
    await entorno.admin.patch(`/reservas/${reserva.id}/aprobar`);
    entorno.reloj.fijar(h('10:30'));

    const respuesta = await entorno.como(estudiante.token).patch(`/reservas/${reserva.id}/cancelar`);

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('RESERVA_YA_INICIADA');
  });

  it('Cancelar una reserva ya cancelada', async () => {
    const { entorno, estudiante, lab } = await preparar();
    const reserva = (await entorno.solicitar(estudiante.token, { espacioId: lab.id })).body;
    await entorno.como(estudiante.token).patch(`/reservas/${reserva.id}/cancelar`);

    const respuesta = await entorno.como(estudiante.token).patch(`/reservas/${reserva.id}/cancelar`);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('TRANSICION_ESTADO_INVALIDA');
  });
});

describe('cancelacion-historial › Cancelación administrativa', () => {
  it('El administrador cancela con motivo', async () => {
    const { entorno, estudiante, lab } = await preparar();
    const reserva = (await entorno.solicitar(estudiante.token, { espacioId: lab.id })).body;
    await entorno.admin.patch(`/reservas/${reserva.id}/aprobar`);

    const respuesta = await entorno.admin.patch(`/reservas/${reserva.id}/cancelar`, { motivo: 'Evento institucional' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('CANCELADA');
    expect(respuesta.body.historial.at(-1)).toMatchObject({
      estadoAnterior: 'APROBADA',
      estadoNuevo: 'CANCELADA',
      autorId: entorno.admin.usuario.id,
      motivo: 'Evento institucional',
    });
  });

  it('El administrador cancela sin motivo', async () => {
    const { entorno, estudiante, lab } = await preparar();
    const reserva = (await entorno.solicitar(estudiante.token, { espacioId: lab.id })).body;
    await entorno.admin.patch(`/reservas/${reserva.id}/aprobar`);

    const respuesta = await entorno.admin.patch(`/reservas/${reserva.id}/cancelar`);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect((await entorno.admin.get(`/reservas/${reserva.id}`)).body.estado).toBe('APROBADA');
  });
});

describe('cancelacion-historial › Registro inmutable de cambios de estado', () => {
  it('Historial de una reserva aprobada y cancelada', async () => {
    const { entorno, estudiante, lab } = await preparar();
    const reserva = (await entorno.solicitar(estudiante.token, { espacioId: lab.id })).body;
    entorno.reloj.fijar(h('08:10'));
    await entorno.admin.patch(`/reservas/${reserva.id}/aprobar`);
    entorno.reloj.fijar(h('08:20'));
    await entorno.como(estudiante.token).patch(`/reservas/${reserva.id}/cancelar`, { motivo: 'Cambio de fecha' });

    const respuesta = await entorno.como(estudiante.token).get(`/reservas/${reserva.id}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.historial).toEqual([
      { estadoAnterior: null, estadoNuevo: 'PENDIENTE', autorId: estudiante.usuario.id, fecha: '2030-01-07T08:00:00.000Z' },
      { estadoAnterior: 'PENDIENTE', estadoNuevo: 'APROBADA', autorId: entorno.admin.usuario.id, fecha: '2030-01-07T08:10:00.000Z' },
      {
        estadoAnterior: 'APROBADA',
        estadoNuevo: 'CANCELADA',
        autorId: estudiante.usuario.id,
        fecha: '2030-01-07T08:20:00.000Z',
        motivo: 'Cambio de fecha',
      },
    ]);
  });

  it('el historial devuelto es una copia: modificarlo no altera lo almacenado', async () => {
    const { entorno, estudiante, lab } = await preparar();
    const reserva = (await entorno.solicitar(estudiante.token, { espacioId: lab.id })).body;
    const leida = await entorno.contenedor.repositorios.reservas.buscarPorId(reserva.id);

    leida!.historial.push({ estadoAnterior: 'PENDIENTE', estadoNuevo: 'APROBADA', autorId: 'intruso', fecha: new Date() });

    expect((await entorno.contenedor.repositorios.reservas.buscarPorId(reserva.id))!.historial).toHaveLength(1);
  });
});

describe('cancelacion-historial › Historial del solicitante', () => {
  async function conCuatroEstados() {
    const contexto = await preparar();
    const { entorno, estudiante, otro, lab } = contexto;
    const crear = async (inicio: string, fin: string) =>
      (await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h(inicio), fin: h(fin) })).body.id as string;
    const pendiente = await crear('10:00', '11:00');
    const aprobada = await crear('11:00', '12:00');
    const rechazada = await crear('12:00', '13:00');
    const cancelada = await crear('13:00', '14:00');
    await entorno.admin.patch(`/reservas/${aprobada}/aprobar`);
    await entorno.admin.patch(`/reservas/${rechazada}/rechazar`, { motivo: 'Mantenimiento programado' });
    await entorno.como(estudiante.token).patch(`/reservas/${cancelada}/cancelar`);
    const segundoLab = await entorno.crearEspacio({ nombre: 'Lab 2' });
    await entorno.solicitar(otro.token, { espacioId: segundoLab.id });
    return { ...contexto, ids: { pendiente, aprobada, rechazada, cancelada } };
  }

  it('El historial incluye todos los estados', async () => {
    const { entorno, estudiante, ids } = await conCuatroEstados();

    const respuesta = await entorno.como(estudiante.token).get('/reservas/mias');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.map((reserva: { id: string }) => reserva.id)).toEqual([ids.cancelada, ids.rechazada, ids.aprobada, ids.pendiente]);
    expect(respuesta.body.map((reserva: { estado: string }) => reserva.estado)).toEqual(['CANCELADA', 'RECHAZADA', 'APROBADA', 'PENDIENTE']);
  });

  it('Filtrar el historial por estado', async () => {
    const { entorno, estudiante, ids } = await conCuatroEstados();

    const respuesta = await entorno.como(estudiante.token).get('/reservas/mias?estado=CANCELADA');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.map((reserva: { id: string }) => reserva.id)).toEqual([ids.cancelada]);
  });

  it('Consultar el detalle de una reserva ajena', async () => {
    const { entorno, estudiante, otro, lab } = await preparar();
    const ajena = (await entorno.solicitar(otro.token, { espacioId: lab.id })).body;

    const respuesta = await entorno.como(estudiante.token).get(`/reservas/${ajena.id}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error.codigo).toBe('ACCESO_DENEGADO');
  });

  it('responde 404 al consultar una reserva inexistente', async () => {
    const { entorno, estudiante } = await preparar();

    const respuesta = await entorno.como(estudiante.token).get('/reservas/00000000-0000-0000-0000-000000000000');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('RESERVA_NO_ENCONTRADA');
  });
});

describe('cancelacion-historial › Consulta administrativa del historial', () => {
  it('Filtrar por espacio y estado', async () => {
    const { entorno, estudiante, otro, lab } = await preparar();
    const lab2 = await entorno.crearEspacio({ nombre: 'Lab 2' });
    const aprobada = (await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('11:00') })).body;
    const cancelada = (await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('11:00'), fin: h('12:00') })).body;
    const otroEspacio = (await entorno.solicitar(otro.token, { espacioId: lab2.id, inicio: h('10:00'), fin: h('11:00') })).body;
    await entorno.admin.patch(`/reservas/${aprobada.id}/aprobar`);
    await entorno.admin.patch(`/reservas/${otroEspacio.id}/aprobar`);
    await entorno.como(estudiante.token).patch(`/reservas/${cancelada.id}/cancelar`);

    const respuesta = await entorno.admin.get(`/reservas?espacioId=${lab.id}&estado=APROBADA`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.map((reserva: { id: string }) => reserva.id)).toEqual([aprobada.id]);
  });

  it('Filtrar por rango de fechas', async () => {
    const { entorno, estudiante, lab } = await preparar();
    await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('11:00') });
    const delNueve = (
      await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00', '2030-01-09'), fin: h('11:00', '2030-01-09') })
    ).body;

    const respuesta = await entorno.admin.get('/reservas').query({ desde: '2030-01-09T00:00:00Z', hasta: '2030-01-10T00:00:00Z' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.map((reserva: { id: string }) => reserva.id)).toEqual([delNueve.id]);
  });

  it('filtra por usuario y valida el rango', async () => {
    const { entorno, estudiante, otro, lab } = await preparar();
    const propia = (await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('11:00') })).body;
    await entorno.solicitar(otro.token, { espacioId: lab.id, inicio: h('11:00'), fin: h('12:00') });

    const porUsuario = await entorno.admin.get(`/reservas?usuarioId=${estudiante.usuario.id}`);
    const rangoInvertido = await entorno.admin.get('/reservas').query({ desde: '2030-01-10T00:00:00Z', hasta: '2030-01-09T00:00:00Z' });

    expect(porUsuario.body.map((reserva: { id: string }) => reserva.id)).toEqual([propia.id]);
    expect(rangoInvertido.body.error.codigo).toBe('RANGO_HORARIO_INVALIDO');
  });
});
