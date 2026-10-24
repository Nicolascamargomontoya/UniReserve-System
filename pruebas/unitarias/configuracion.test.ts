import { describe, expect, it } from 'vitest';
import { cargarConfiguracion } from '../../src/configuracion.js';

describe('configuración por variables de entorno', () => {
  it('en producción exige JWT_SECRETO y ADMIN_CONTRASENA', () => {
    expect(() => cargarConfiguracion({ NODE_ENV: 'production', ADMIN_CONTRASENA: 'Admin12345' })).toThrow('JWT_SECRETO');
    expect(() => cargarConfiguracion({ NODE_ENV: 'production', JWT_SECRETO: 'secreto' })).toThrow('ADMIN_CONTRASENA');
  });

  it('en desarrollo usa valores por defecto y lo advierte', () => {
    const { configuracion, advertencias } = cargarConfiguracion({});

    expect(configuracion).toMatchObject({
      puerto: 3000,
      jwtDuracionSegundos: 3600,
      rondasBcrypt: 10,
      administradorInicial: { correo: 'admin@uni.edu', contrasena: 'Admin12345' },
    });
    expect(configuracion.jwtSecreto).toHaveLength(64);
    expect(advertencias).toHaveLength(2);
  });

  it('respeta los valores definidos y normaliza el correo del administrador', () => {
    const { configuracion, advertencias } = cargarConfiguracion({
      PUERTO: '8080',
      JWT_SECRETO: 'secreto',
      JWT_DURACION_SEGUNDOS: '600',
      BCRYPT_RONDAS: '12',
      ADMIN_CORREO: ' Jefe@Uni.edu ',
      ADMIN_CONTRASENA: 'OtraClave123',
      ADMIN_NOMBRE: 'Jefatura de espacios',
    });

    expect(configuracion).toEqual({
      puerto: 8080,
      jwtSecreto: 'secreto',
      jwtDuracionSegundos: 600,
      rondasBcrypt: 12,
      administradorInicial: { correo: 'jefe@uni.edu', contrasena: 'OtraClave123', nombreCompleto: 'Jefatura de espacios' },
    });
    expect(advertencias).toEqual([]);
  });
});
