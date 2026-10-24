// Escenarios de openspec: aprobacion-reservas (M7 — Aprobación y rechazo de solicitudes).
import { describe, expect, it } from 'vitest';
import { crearEntornoDePrueba, h } from './apoyo/app-de-prueba.js';

async function preparar() {
  const entorno = await crearEntornoDePrueba();
  const estudiante = await entorno.registrar('ESTUDIANTE', { nombreCompleto: 'Ana Pérez', correo: 'ana@uni.edu' });
  const lab = await entorno.crearEspacio({ nombre: 'Lab 1' });
  const solicitud = (await entorno.solicitar(estudiante.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') })).body;
  return { entorno, estudiante, lab, solicitud };
}

describe('aprobacion-reservas › Bandeja de solicitudes pendientes', () => {
  it('Pendientes en orden de llegada', async () => {
    const { entorno, estudiante, lab, solicitud: primera } = await preparar();
    const beto = await entorno.registrar('ESTUDIANTE');
    const carla = await entorno.registrar('ESTUDIANTE');
    entorno.reloj.fijar(h('08:05'));
    const segunda = (await entorno.solicitar(beto.token, { espacioId: lab.id, inicio: h('13:00'), fin: h('14:00') })).body;
    const aprobada = (await entorno.solicitar(carla.token, { espacioId: lab.id, inicio: h('15:00'), fin: h('16:00') })).body;
    await entorno.admin.patch(`/reservas/${aprobada.id}/aprobar`);

    const respuesta = await entorno.admin.get('/reservas/pendientes');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.map((reserva: { id: string }) => reserva.id)).toEqual([primera.id, segunda.id]);
    expect(respuesta.body[0]).toMatchObject({
      espacio: { id: lab.id, nombre: 'Lab 1' },
      solicitante: { id: estudiante.usuario.id, nombreCompleto: 'Ana Pérez', correo: 'ana@uni.edu' },
    });
  });
});

describe('aprobacion-reservas › Aprobación de solicitudes', () => {
  it('Aprobar una solicitud pendiente', async () => {
    const { entorno, solicitud } = await preparar();
    entorno.reloj.fijar(h('08:30'));

    const respuesta = await entorno.admin.patch(`/reservas/${solicitud.id}/aprobar`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('APROBADA');
    expect(respuesta.body.historial.at(-1)).toEqual({
      estadoAnterior: 'PENDIENTE',
      estadoNuevo: 'APROBADA',
      autorId: entorno.admin.usuario.id,
      fecha: '2030-01-07T08:30:00.000Z',
    });
  });

  it('Aprobar una solicitud cuyo inicio ya pasó', async () => {
    const { entorno, solicitud } = await preparar();
    entorno.reloj.fijar(h('10:30'));

    const respuesta = await entorno.admin.patch(`/reservas/${solicitud.id}/aprobar`);

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('SOLICITUD_VENCIDA');
    expect((await entorno.admin.get(`/reservas/${solicitud.id}`)).body.estado).toBe('PENDIENTE');
  });

  it('Aprobar una solicitud de un espacio desactivado', async () => {
    const { entorno, lab, solicitud } = await preparar();
    await entorno.admin.patch(`/espacios/${lab.id}/estado`, { activo: false });

    const respuesta = await entorno.admin.patch(`/reservas/${solicitud.id}/aprobar`);

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('ESPACIO_INACTIVO');
    expect((await entorno.admin.get(`/reservas/${solicitud.id}`)).body.estado).toBe('PENDIENTE');
  });
});

describe('aprobacion-reservas › Rechazo con motivo', () => {
  it('Rechazar con motivo', async () => {
    const { entorno, estudiante, solicitud } = await preparar();

    const respuesta = await entorno.admin.patch(`/reservas/${solicitud.id}/rechazar`, { motivo: 'Mantenimiento programado' });
    const vistaDelSolicitante = await entorno.como(estudiante.token).get(`/reservas/${solicitud.id}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('RECHAZADA');
    expect(vistaDelSolicitante.body.historial.at(-1)).toMatchObject({
      estadoAnterior: 'PENDIENTE',
      estadoNuevo: 'RECHAZADA',
      motivo: 'Mantenimiento programado',
    });
  });

  it('Rechazar sin motivo', async () => {
    const { entorno, solicitud } = await preparar();

    const respuesta = await entorno.admin.patch(`/reservas/${solicitud.id}/rechazar`);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect((await entorno.admin.get(`/reservas/${solicitud.id}`)).body.estado).toBe('PENDIENTE');
  });

  it('El rechazo libera la franja', async () => {
    const { entorno, lab, solicitud } = await preparar();
    const otro = await entorno.registrar('ESTUDIANTE');
    await entorno.admin.patch(`/reservas/${solicitud.id}/rechazar`, { motivo: 'Mantenimiento programado' });

    const respuesta = await entorno.solicitar(otro.token, { espacioId: lab.id, inicio: h('10:00'), fin: h('12:00') });

    expect(respuesta.status).toBe(201);
  });
});

describe('aprobacion-reservas › Transiciones de decisión válidas', () => {
  it('Aprobar una solicitud ya rechazada', async () => {
    const { entorno, solicitud } = await preparar();
    await entorno.admin.patch(`/reservas/${solicitud.id}/rechazar`, { motivo: 'Mantenimiento programado' });

    const respuesta = await entorno.admin.patch(`/reservas/${solicitud.id}/aprobar`);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('TRANSICION_ESTADO_INVALIDA');
    expect((await entorno.admin.get(`/reservas/${solicitud.id}`)).body.estado).toBe('RECHAZADA');
  });

  it('Rechazar una reserva aprobada', async () => {
    const { entorno, solicitud } = await preparar();
    await entorno.admin.patch(`/reservas/${solicitud.id}/aprobar`);

    const respuesta = await entorno.admin.patch(`/reservas/${solicitud.id}/rechazar`, { motivo: 'Cambio de planes' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('TRANSICION_ESTADO_INVALIDA');
    expect((await entorno.admin.get(`/reservas/${solicitud.id}`)).body.estado).toBe('APROBADA');
  });

  it('Decidir sobre una reserva inexistente', async () => {
    const { entorno } = await preparar();

    const respuesta = await entorno.admin.patch('/reservas/00000000-0000-0000-0000-000000000000/aprobar');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('RESERVA_NO_ENCONTRADA');
  });
});
