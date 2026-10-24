// Escenarios de openspec: roles-permisos (M3 — Roles y permisos).
import { describe, expect, it } from 'vitest';
import { crearEntornoDePrueba } from './apoyo/app-de-prueba.js';

describe('roles-permisos › Roles del sistema', () => {
  it('Cada cuenta tiene un único rol', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');

    const perfil = await entorno.como(estudiante.token).get('/usuarios/perfil');

    expect(perfil.body.rol).toBe('ESTUDIANTE');
    expect(Array.isArray(perfil.body.rol)).toBe(false);
  });
});

describe('roles-permisos › Permisos de los solicitantes', () => {
  it('Un estudiante intenta registrar un espacio', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');

    const respuesta = await entorno.como(estudiante.token).post('/espacios', {
      nombre: 'Sala propia',
      tipo: 'LABORATORIO',
      capacidad: 10,
      ubicacion: 'Bloque A',
    });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error.codigo).toBe('ACCESO_DENEGADO');
  });

  it('Un estudiante intenta listar las cuentas', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');

    const respuesta = await entorno.como(estudiante.token).get('/usuarios');

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error.codigo).toBe('ACCESO_DENEGADO');
  });
});

describe('roles-permisos › Permisos del administrador', () => {
  it('El administrador intenta crear una solicitud', async () => {
    const entorno = await crearEntornoDePrueba();
    const lab = await entorno.crearEspacio({ nombre: 'Lab 1' });

    const respuesta = await entorno.solicitar(entorno.admin.token, { espacioId: lab.id });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error.codigo).toBe('ACCESO_DENEGADO');
  });
});

describe('roles-permisos › Autenticación obligatoria', () => {
  it('Petición sin token', async () => {
    const { api } = await crearEntornoDePrueba();

    const respuesta = await api.get('/espacios');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  it('Token alterado', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');
    const [cabecera, carga, firma] = estudiante.token.split('.');
    const firmaAlterada = `${firma!.startsWith('A') ? 'B' : 'A'}${firma!.slice(1)}`;

    const respuesta = await entorno.como(`${cabecera}.${carga}.${firmaAlterada}`).get('/usuarios/perfil');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  it('Token expirado', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');

    entorno.reloj.fijar('2030-01-07T09:00:01Z');
    const respuesta = await entorno.como(estudiante.token).get('/usuarios/perfil');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('NO_AUTENTICADO');
  });
});

describe('roles-permisos › Asignación de roles', () => {
  it('Asignar un rol inexistente', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');

    const respuesta = await entorno.admin.patch(`/usuarios/${estudiante.usuario.id}/rol`, { rol: 'SUPERUSER' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  });

  it('cambia el rol de un estudiante a profesor', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');

    const respuesta = await entorno.admin.patch(`/usuarios/${estudiante.usuario.id}/rol`, { rol: 'PROFESOR' });

    expect(respuesta.status).toBe(200);
    expect((await entorno.como(estudiante.token).get('/usuarios/perfil')).body.rol).toBe('PROFESOR');
  });
});

describe('roles-permisos › Protección del acceso administrativo', () => {
  it('El administrador intenta quitarse el rol', async () => {
    const entorno = await crearEntornoDePrueba();

    const respuesta = await entorno.admin.patch(`/usuarios/${entorno.admin.usuario.id}/rol`, { rol: 'ESTUDIANTE' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('AUTOMODIFICACION_NO_PERMITIDA');
    expect((await entorno.admin.get('/usuarios/perfil')).body.rol).toBe('ADMINISTRADOR');
  });

  it('El administrador intenta desactivarse', async () => {
    const entorno = await crearEntornoDePrueba();

    const respuesta = await entorno.admin.patch(`/usuarios/${entorno.admin.usuario.id}/estado`, { activo: false });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('AUTOMODIFICACION_NO_PERMITIDA');
    expect((await entorno.admin.get('/usuarios/perfil')).body.activo).toBe(true);
  });
});

describe('roles-permisos › Administrador inicial', () => {
  const configuracion = { correo: 'admin@uni.edu', contrasena: 'Admin12345', nombreCompleto: 'Administración' };

  it('Arranque sin administradores', async () => {
    const entorno = await crearEntornoDePrueba({ sembrarAdministrador: false });

    const creado = await entorno.contenedor.servicios.roles.asegurarAdministradorInicial(configuracion);
    const sesion = await entorno.iniciarSesion('admin@uni.edu', 'Admin12345');

    expect(creado).toBe(true);
    expect(sesion.usuario).toMatchObject({ rol: 'ADMINISTRADOR', activo: true });
  });

  it('Arranque con un administrador existente', async () => {
    const entorno = await crearEntornoDePrueba({ sembrarAdministrador: false });
    await entorno.contenedor.servicios.roles.asegurarAdministradorInicial(configuracion);

    const creado = await entorno.contenedor.servicios.roles.asegurarAdministradorInicial(configuracion);

    expect(creado).toBe(false);
    expect(await entorno.contenedor.repositorios.usuarios.listar({ rol: 'ADMINISTRADOR' })).toHaveLength(1);
  });
});
