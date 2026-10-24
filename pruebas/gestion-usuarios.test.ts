// Escenarios de openspec: gestion-usuarios (M2 — Registro y administración de usuarios).
import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { crearEntornoDePrueba } from './apoyo/app-de-prueba.js';

const ANA = { correo: 'ana@uni.edu', contrasena: 'Segura123', nombreCompleto: 'Ana Pérez', rol: 'ESTUDIANTE' };

describe('gestion-usuarios › Registro de cuentas', () => {
  it('Registro exitoso de un estudiante', async () => {
    const { api } = await crearEntornoDePrueba();

    const respuesta = await api.post('/auth/registro').send(ANA);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({ correo: 'ana@uni.edu', nombreCompleto: 'Ana Pérez', rol: 'ESTUDIANTE', activo: true });
    expect(respuesta.body.id).toEqual(expect.any(String));
    expect(respuesta.body).not.toHaveProperty('contrasena');
    expect(respuesta.body).not.toHaveProperty('hashContrasena');
  });

  it('Registro de un profesor', async () => {
    const { api } = await crearEntornoDePrueba();

    const respuesta = await api.post('/auth/registro').send({ ...ANA, correo: 'prof@uni.edu', rol: 'PROFESOR' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.rol).toBe('PROFESOR');
  });

  it('Autorregistro como administrador', async () => {
    const { api, contenedor } = await crearEntornoDePrueba();

    const respuesta = await api.post('/auth/registro').send({ ...ANA, rol: 'ADMINISTRADOR' });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error.codigo).toBe('ACCESO_DENEGADO');
    expect(await contenedor.repositorios.usuarios.buscarPorCorreo('ana@uni.edu')).toBeNull();
  });
});

describe('gestion-usuarios › Validación de los datos de registro', () => {
  it('Correo ya registrado con distinta escritura', async () => {
    const { api } = await crearEntornoDePrueba();
    await api.post('/auth/registro').send(ANA);

    const respuesta = await api.post('/auth/registro').send({ ...ANA, correo: ' ANA@uni.edu ' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('CORREO_YA_REGISTRADO');
  });

  it('Correo con formato inválido', async () => {
    const { api } = await crearEntornoDePrueba();

    const respuesta = await api.post('/auth/registro').send({ ...ANA, correo: 'ana-uni.edu' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  });

  it('Contraseña demasiado corta', async () => {
    const { api } = await crearEntornoDePrueba();

    const respuesta = await api.post('/auth/registro').send({ ...ANA, contrasena: 'abc123' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  });

  it('rechaza un nombre de menos de 3 caracteres y un rol inexistente', async () => {
    const { api } = await crearEntornoDePrueba();

    const nombreCorto = await api.post('/auth/registro').send({ ...ANA, nombreCompleto: 'A' });
    const rolInexistente = await api.post('/auth/registro').send({ ...ANA, rol: 'INVITADO' });

    expect(nombreCorto.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(rolInexistente.body.error.codigo).toBe('DATOS_INVALIDOS');
  });
});

describe('gestion-usuarios › Almacenamiento seguro de contraseñas', () => {
  it('La contraseña no se guarda en texto plano', async () => {
    const { api, contenedor } = await crearEntornoDePrueba();
    await api.post('/auth/registro').send(ANA);

    const guardado = await contenedor.repositorios.usuarios.buscarPorCorreo('ana@uni.edu');

    expect(guardado?.hashContrasena).toBeDefined();
    expect(guardado?.hashContrasena).not.toBe('Segura123');
    expect(await bcrypt.compare('Segura123', guardado!.hashContrasena)).toBe(true);
  });
});

describe('gestion-usuarios › Autenticación', () => {
  it('Inicio de sesión exitoso', async () => {
    const { api } = await crearEntornoDePrueba();
    await api.post('/auth/registro').send(ANA);

    const respuesta = await api.post('/auth/inicio-sesion').send({ correo: 'ana@uni.edu', contrasena: 'Segura123' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.token).toEqual(expect.any(String));
    expect(respuesta.body.usuario).toMatchObject({ correo: 'ana@uni.edu', rol: 'ESTUDIANTE' });
    expect(respuesta.body.usuario).not.toHaveProperty('hashContrasena');
  });

  it('Contraseña incorrecta', async () => {
    const { api } = await crearEntornoDePrueba();
    await api.post('/auth/registro').send(ANA);

    const respuesta = await api.post('/auth/inicio-sesion').send({ correo: 'ana@uni.edu', contrasena: 'Incorrecta1' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
  });

  it('Correo no registrado', async () => {
    const { api } = await crearEntornoDePrueba();
    await api.post('/auth/registro').send(ANA);

    const inexistente = await api.post('/auth/inicio-sesion').send({ correo: 'nadie@uni.edu', contrasena: 'Segura123' });
    const claveErronea = await api.post('/auth/inicio-sesion').send({ correo: 'ana@uni.edu', contrasena: 'Incorrecta1' });

    expect(inexistente.status).toBe(401);
    expect(inexistente.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
    expect(inexistente.body.error.mensaje).toBe(claveErronea.body.error.mensaje);
  });

  it('Cuenta desactivada', async () => {
    const entorno = await crearEntornoDePrueba();
    const registro = await entorno.api.post('/auth/registro').send(ANA);
    await entorno.admin.patch(`/usuarios/${registro.body.id}/estado`, { activo: false });

    const respuesta = await entorno.api.post('/auth/inicio-sesion').send({ correo: 'ana@uni.edu', contrasena: 'Segura123' });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error.codigo).toBe('CUENTA_INACTIVA');
  });
});

describe('gestion-usuarios › Perfil propio', () => {
  it('Consultar el perfil propio', async () => {
    const entorno = await crearEntornoDePrueba();
    const ana = await entorno.registrar('ESTUDIANTE', { correo: 'ana@uni.edu' });

    const respuesta = await entorno.como(ana.token).get('/usuarios/perfil');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ correo: 'ana@uni.edu', rol: 'ESTUDIANTE', activo: true });
    expect(respuesta.body.nombreCompleto).toEqual(expect.any(String));
    expect(respuesta.body).not.toHaveProperty('hashContrasena');
  });

  it('Actualizar el nombre', async () => {
    const entorno = await crearEntornoDePrueba();
    const ana = await entorno.registrar('ESTUDIANTE');

    const respuesta = await entorno.como(ana.token).patch('/usuarios/perfil', { nombreCompleto: 'Ana María Pérez', rol: 'ADMINISTRADOR' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ nombreCompleto: 'Ana María Pérez', rol: 'ESTUDIANTE' });
  });
});

describe('gestion-usuarios › Administración de cuentas', () => {
  it('Listar cuentas por rol', async () => {
    const entorno = await crearEntornoDePrueba();
    await entorno.registrar('ESTUDIANTE');
    await entorno.registrar('ESTUDIANTE');
    const profesor = await entorno.registrar('PROFESOR');

    const respuesta = await entorno.admin.get('/usuarios?rol=PROFESOR');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.map((u: { id: string }) => u.id)).toEqual([profesor.usuario.id]);
  });

  it('filtra las cuentas por estado', async () => {
    const entorno = await crearEntornoDePrueba();
    const inactivo = await entorno.registrar('ESTUDIANTE');
    await entorno.registrar('ESTUDIANTE');
    await entorno.admin.patch(`/usuarios/${inactivo.usuario.id}/estado`, { activo: false });

    const respuesta = await entorno.admin.get('/usuarios?activo=false');

    expect(respuesta.body.map((u: { id: string }) => u.id)).toEqual([inactivo.usuario.id]);
  });

  it('Desactivar una cuenta invalida su acceso', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE');

    const desactivacion = await entorno.admin.patch(`/usuarios/${estudiante.usuario.id}/estado`, { activo: false });
    const respuesta = await entorno.como(estudiante.token).get('/usuarios/perfil');

    expect(desactivacion.status).toBe(200);
    expect(desactivacion.body.activo).toBe(false);
    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error.codigo).toBe('CUENTA_INACTIVA');
  });

  it('Reactivar una cuenta', async () => {
    const entorno = await crearEntornoDePrueba();
    const estudiante = await entorno.registrar('ESTUDIANTE', { correo: 'ana@uni.edu' });
    await entorno.admin.patch(`/usuarios/${estudiante.usuario.id}/estado`, { activo: false });

    await entorno.admin.patch(`/usuarios/${estudiante.usuario.id}/estado`, { activo: true });
    const respuesta = await entorno.api.post('/auth/inicio-sesion').send({ correo: 'ana@uni.edu', contrasena: 'Segura123' });

    expect(respuesta.status).toBe(200);
  });

  it('Consultar una cuenta inexistente', async () => {
    const entorno = await crearEntornoDePrueba();

    const respuesta = await entorno.admin.get('/usuarios/00000000-0000-0000-0000-000000000000');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('USUARIO_NO_ENCONTRADO');
  });
});
