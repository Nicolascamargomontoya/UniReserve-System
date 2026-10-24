import { randomBytes } from 'node:crypto';

export interface DatosAdministrador {
  correo: string;
  contrasena: string;
  nombreCompleto: string;
}

export interface Configuracion {
  puerto: number;
  jwtSecreto: string;
  jwtDuracionSegundos: number;
  rondasBcrypt: number;
  administradorInicial: DatosAdministrador;
}

// Lee la configuración de las variables de entorno. En producción los secretos son obligatorios;
// en desarrollo se usan valores por defecto y se devuelven advertencias.
export function cargarConfiguracion(entorno: NodeJS.ProcessEnv = process.env): {
  configuracion: Configuracion;
  advertencias: string[];
} {
  const produccion = entorno.NODE_ENV === 'production';
  const advertencias: string[] = [];

  let jwtSecreto = entorno.JWT_SECRETO;
  if (!jwtSecreto) {
    if (produccion) throw new Error('JWT_SECRETO es obligatorio en producción.');
    jwtSecreto = randomBytes(32).toString('hex');
    advertencias.push('JWT_SECRETO no está definido: se generó uno aleatorio; los tokens no sobreviven a un reinicio.');
  }

  let contrasenaAdmin = entorno.ADMIN_CONTRASENA;
  if (!contrasenaAdmin) {
    if (produccion) throw new Error('ADMIN_CONTRASENA es obligatoria en producción.');
    contrasenaAdmin = 'Admin12345';
    advertencias.push('ADMIN_CONTRASENA no está definida: se usa la contraseña de desarrollo "Admin12345".');
  }

  return {
    configuracion: {
      puerto: Number(entorno.PUERTO ?? 3000),
      jwtSecreto,
      jwtDuracionSegundos: Number(entorno.JWT_DURACION_SEGUNDOS ?? 3600),
      rondasBcrypt: Number(entorno.BCRYPT_RONDAS ?? 10),
      administradorInicial: {
        correo: (entorno.ADMIN_CORREO ?? 'admin@uni.edu').trim().toLowerCase(),
        contrasena: contrasenaAdmin,
        nombreCompleto: entorno.ADMIN_NOMBRE ?? 'Administrador del sistema',
      },
    },
    advertencias,
  };
}
