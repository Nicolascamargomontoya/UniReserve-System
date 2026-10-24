// Contrato de errores de la API (design.md D5).
// 400 = petición mal formada · 409 = choque con el estado de otro recurso · 422 = regla de negocio violada.
const ESTADO_HTTP = {
  DATOS_INVALIDOS: 400,
  NO_AUTENTICADO: 401,
  CREDENCIALES_INVALIDAS: 401,
  ACCESO_DENEGADO: 403,
  CUENTA_INACTIVA: 403,
  USUARIO_NO_ENCONTRADO: 404,
  ESPACIO_NO_ENCONTRADO: 404,
  RESERVA_NO_ENCONTRADA: 404,
  RUTA_NO_ENCONTRADA: 404,
  CORREO_YA_REGISTRADO: 409,
  NOMBRE_ESPACIO_DUPLICADO: 409,
  SOLICITUD_DUPLICADA: 409,
  ESPACIO_NO_DISPONIBLE: 409,
  CONFLICTO_HORARIO_USUARIO: 409,
  TRANSICION_ESTADO_INVALIDA: 409,
  AUTOMODIFICACION_NO_PERMITIDA: 409,
  RANGO_HORARIO_INVALIDO: 422,
  INICIO_EN_PASADO: 422,
  BLOQUE_HORARIO_INVALIDO: 422,
  ESPACIO_INACTIVO: 422,
  CAPACIDAD_EXCEDIDA: 422,
  SOLICITUD_VENCIDA: 422,
  RESERVA_YA_INICIADA: 422,
  LIMITE_HORAS_CONSECUTIVAS: 422,
  ERROR_INTERNO: 500,
} as const;

export type CodigoError = keyof typeof ESTADO_HTTP;

export class ErrorAplicacion extends Error {
  readonly estadoHttp: number;

  constructor(
    readonly codigo: CodigoError,
    mensaje: string,
    readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorAplicacion';
    this.estadoHttp = ESTADO_HTTP[codigo];
  }
}
