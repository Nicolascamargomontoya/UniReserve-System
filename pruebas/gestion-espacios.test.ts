// Escenarios de openspec: gestion-espacios (M1 — Gestión de espacios académicos).
import { describe, expect, it } from 'vitest';
import { crearEntornoDePrueba } from './apoyo/app-de-prueba.js';

const LAB_REDES = {
  nombre: 'Laboratorio de Redes',
  tipo: 'LABORATORIO',
  capacidad: 30,
  ubicacion: 'Bloque B, piso 2',
  equipamiento: ['Proyector', '30 PC'],
};
const INEXISTENTE = '00000000-0000-0000-0000-000000000000';
const nombres = (lista: Array<{ nombre: string }>) => lista.map((espacio) => espacio.nombre);

describe('gestion-espacios › Registro de espacios', () => {
  it('Registro exitoso de un laboratorio', async () => {
    const entorno = await crearEntornoDePrueba();

    const respuesta = await entorno.admin.post('/espacios', LAB_REDES);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({ ...LAB_REDES, activo: true });
    expect(respuesta.body.id).toEqual(expect.any(String));
  });

  it('Tipo de espacio no permitido', async () => {
    const entorno = await crearEntornoDePrueba();

    const respuesta = await entorno.admin.post('/espacios', { ...LAB_REDES, tipo: 'GYM' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect((await entorno.admin.get('/espacios')).body).toHaveLength(0);
  });

  it('Capacidad no válida', async () => {
    const entorno = await crearEntornoDePrueba();

    for (const capacidad of [0, -5, 10.5]) {
      const respuesta = await entorno.admin.post('/espacios', { ...LAB_REDES, capacidad });
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
    }
  });

  it('registra un espacio sin equipamiento con una lista vacía', async () => {
    const entorno = await crearEntornoDePrueba();
    const { equipamiento: _omitido, ...sinEquipamiento } = LAB_REDES;

    const respuesta = await entorno.admin.post('/espacios', sinEquipamiento);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.equipamiento).toEqual([]);
  });
});

describe('gestion-espacios › Nombre único de espacio', () => {
  it('Nombre repetido con distinta escritura', async () => {
    const entorno = await crearEntornoDePrueba();
    await entorno.crearEspacio({ nombre: 'Auditorio Central', tipo: 'AUDITORIO' });

    const respuesta = await entorno.admin.post('/espacios', { ...LAB_REDES, nombre: '  auditorio central ' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('NOMBRE_ESPACIO_DUPLICADO');
  });
});

describe('gestion-espacios › Edición de espacios', () => {
  it('Actualizar la capacidad', async () => {
    const entorno = await crearEntornoDePrueba();
    const sala = await entorno.crearEspacio({ nombre: 'Sala de Cómputo 1', tipo: 'SALA_COMPUTO', capacidad: 25 });

    const respuesta = await entorno.admin.patch(`/espacios/${sala.id}`, { capacidad: 35 });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ nombre: 'Sala de Cómputo 1', tipo: 'SALA_COMPUTO', capacidad: 35, ubicacion: sala.ubicacion });
  });

  it('Renombrar con el nombre de otro espacio', async () => {
    const entorno = await crearEntornoDePrueba();
    await entorno.crearEspacio({ nombre: 'Sala A' });
    const salaB = await entorno.crearEspacio({ nombre: 'Sala B' });

    const respuesta = await entorno.admin.patch(`/espacios/${salaB.id}`, { nombre: 'sala a' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('NOMBRE_ESPACIO_DUPLICADO');
  });

  it('Editar un espacio inexistente', async () => {
    const entorno = await crearEntornoDePrueba();

    const respuesta = await entorno.admin.patch(`/espacios/${INEXISTENTE}`, { capacidad: 10 });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('ESPACIO_NO_ENCONTRADO');
  });

  it('rechaza una edición sin campos o con datos inválidos', async () => {
    const entorno = await crearEntornoDePrueba();
    const sala = await entorno.crearEspacio();

    const sinCampos = await entorno.admin.patch(`/espacios/${sala.id}`, {});
    const capacidadInvalida = await entorno.admin.patch(`/espacios/${sala.id}`, { capacidad: -1 });

    expect(sinCampos.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(capacidadInvalida.body.error.codigo).toBe('DATOS_INVALIDOS');
  });

  it('permite conservar el propio nombre con otra escritura', async () => {
    const entorno = await crearEntornoDePrueba();
    const sala = await entorno.crearEspacio({ nombre: 'Sala A' });

    const respuesta = await entorno.admin.patch(`/espacios/${sala.id}`, { nombre: 'SALA A' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.nombre).toBe('SALA A');
  });
});

describe('gestion-espacios › Activación y desactivación de espacios', () => {
  it('Desactivar un espacio', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');
    const auditorio = await entorno.crearEspacio({ nombre: 'Auditorio Central', tipo: 'AUDITORIO', capacidad: 200 });

    const respuesta = await entorno.admin.patch(`/espacios/${auditorio.id}/estado`, { activo: false });
    const catalogo = await entorno.como(estudiante.token).get('/espacios');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.activo).toBe(false);
    expect(nombres(catalogo.body)).not.toContain('Auditorio Central');
  });

  it('Las reservas existentes se conservan', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');
    const auditorio = await entorno.crearEspacio({ nombre: 'Auditorio Central', tipo: 'AUDITORIO', capacidad: 200 });
    const reserva = (await entorno.solicitar(estudiante.token, { espacioId: auditorio.id })).body;
    await entorno.admin.patch(`/reservas/${reserva.id}/aprobar`);

    await entorno.admin.patch(`/espacios/${auditorio.id}/estado`, { activo: false });

    expect((await entorno.admin.get(`/reservas/${reserva.id}`)).body.estado).toBe('APROBADA');
  });

  it('Reactivar un espacio', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');
    const auditorio = await entorno.crearEspacio({ nombre: 'Auditorio Central', tipo: 'AUDITORIO', capacidad: 200 });
    await entorno.admin.patch(`/espacios/${auditorio.id}/estado`, { activo: false });

    await entorno.admin.patch(`/espacios/${auditorio.id}/estado`, { activo: true });
    const catalogo = await entorno.como(estudiante.token).get('/espacios');

    expect(nombres(catalogo.body)).toContain('Auditorio Central');
  });
});

describe('gestion-espacios › Consulta del catálogo', () => {
  it('Filtrar por tipo y capacidad mínima', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');
    await entorno.crearEspacio({ nombre: 'Lab 1', tipo: 'LABORATORIO', capacidad: 20 });
    await entorno.crearEspacio({ nombre: 'Lab 2', tipo: 'LABORATORIO', capacidad: 40 });
    await entorno.crearEspacio({ nombre: 'Auditorio', tipo: 'AUDITORIO', capacidad: 200 });

    const respuesta = await entorno.como(estudiante.token).get('/espacios?tipo=LABORATORIO&capacidadMinima=30');

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta.body)).toEqual(['Lab 2']);
  });

  it('Búsqueda por texto en el nombre', async () => {
    const entorno = await crearEntornoDePrueba();
    const profesor = await entorno.registrar('PROFESOR');
    await entorno.crearEspacio({ nombre: 'Laboratorio de Redes' });
    await entorno.crearEspacio({ nombre: 'Sala de Cómputo 1', tipo: 'SALA_COMPUTO' });

    const respuesta = await entorno.como(profesor.token).get('/espacios?texto=redes');

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta.body)).toEqual(['Laboratorio de Redes']);
  });

  it('Un solicitante no ve espacios inactivos', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');
    const antigua = await entorno.crearEspacio({ nombre: 'Sala Antigua' });
    await entorno.admin.patch(`/espacios/${antigua.id}/estado`, { activo: false });

    const respuesta = await entorno.como(estudiante.token).get('/espacios?incluirInactivos=true');

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta.body)).not.toContain('Sala Antigua');
  });

  it('El administrador incluye espacios inactivos', async () => {
    const entorno = await crearEntornoDePrueba();
    const antigua = await entorno.crearEspacio({ nombre: 'Sala Antigua' });
    await entorno.admin.patch(`/espacios/${antigua.id}/estado`, { activo: false });

    const respuesta = await entorno.admin.get('/espacios?incluirInactivos=true');

    expect(respuesta.body).toEqual(expect.arrayContaining([expect.objectContaining({ nombre: 'Sala Antigua', activo: false })]));
  });

  it('Consultar un espacio inexistente', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');

    const respuesta = await entorno.como(estudiante.token).get(`/espacios/${INEXISTENTE}`);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('ESPACIO_NO_ENCONTRADO');
  });

  it('consulta el detalle de un espacio y ordena el catálogo por nombre', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');
    const sala = await entorno.crearEspacio({ nombre: 'Sala B' });
    await entorno.crearEspacio({ nombre: 'Auditorio', tipo: 'AUDITORIO' });

    const detalle = await entorno.como(estudiante.token).get(`/espacios/${sala.id}`);
    const catalogo = await entorno.como(estudiante.token).get('/espacios');

    expect(detalle.body).toMatchObject({ id: sala.id, nombre: 'Sala B' });
    expect(nombres(catalogo.body)).toEqual(['Auditorio', 'Sala B']);
  });
});
