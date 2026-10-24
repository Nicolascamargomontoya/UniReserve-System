// M1 — Gestión de espacios académicos (openspec: gestion-espacios).
import { randomUUID } from 'node:crypto';
import { TIPOS_ESPACIO, type Espacio } from '../../dominio/modelos.js';
import { ErrorAplicacion } from '../../compartido/errores.js';
import type { Reloj } from '../../compartido/reloj.js';
import { booleano, comoObjeto, entero, listaDeTextos, opcion, texto, type Datos } from '../../compartido/validacion.js';
import type { FiltroEspacios, RepositorioEspacios } from '../../repositorios/contratos.js';

type DatosEditables = Pick<Espacio, 'nombre' | 'tipo' | 'capacidad' | 'ubicacion' | 'equipamiento'>;

// Mismas reglas para registrar y editar (requisitos: Registro de espacios; Edición de espacios).
const LECTORES: { [Campo in keyof DatosEditables]: (datos: Datos) => DatosEditables[Campo] } = {
  nombre: (datos) => texto(datos, 'nombre', { min: 3, max: 100 }),
  tipo: (datos) => opcion(datos, 'tipo', TIPOS_ESPACIO),
  capacidad: (datos) => entero(datos, 'capacidad', { min: 1, max: 10_000 }),
  ubicacion: (datos) => texto(datos, 'ubicacion', { max: 200 }),
  equipamiento: (datos) => listaDeTextos(datos, 'equipamiento'),
};

export class ServicioEspacios {
  constructor(
    private readonly espacios: RepositorioEspacios,
    private readonly reloj: Reloj,
  ) {}

  async crear(entrada: unknown): Promise<Espacio> {
    const datos = comoObjeto(entrada);
    const espacio: Espacio = {
      id: randomUUID(),
      nombre: LECTORES.nombre(datos),
      tipo: LECTORES.tipo(datos),
      capacidad: LECTORES.capacidad(datos),
      ubicacion: LECTORES.ubicacion(datos),
      equipamiento: datos.equipamiento === undefined ? [] : LECTORES.equipamiento(datos),
      activo: true,
      creadoEn: this.reloj(),
      actualizadoEn: this.reloj(),
    };
    await this.asegurarNombreLibre(espacio.nombre);
    await this.espacios.insertar(espacio);
    return espacio;
  }

  async actualizar(espacioId: string, entrada: unknown): Promise<Espacio> {
    const datos = comoObjeto(entrada);
    const campos = (Object.keys(LECTORES) as Array<keyof DatosEditables>).filter((campo) => datos[campo] !== undefined);
    if (campos.length === 0) {
      throw new ErrorAplicacion('DATOS_INVALIDOS', 'Indique al menos un campo: nombre, tipo, capacidad, ubicacion o equipamiento.');
    }
    const cambios = Object.fromEntries(campos.map((campo) => [campo, LECTORES[campo](datos)])) as Partial<DatosEditables>;

    const espacio = await this.buscar(espacioId);
    if (cambios.nombre !== undefined) await this.asegurarNombreLibre(cambios.nombre, espacioId);
    const actualizado: Espacio = { ...espacio, ...cambios, actualizadoEn: this.reloj() };
    await this.espacios.actualizar(actualizado);
    return actualizado;
  }

  // Requisito: Activación y desactivación de espacios. No hay borrado físico; las reservas no se tocan.
  async cambiarEstado(espacioId: string, entrada: unknown): Promise<Espacio> {
    const activo = booleano(comoObjeto(entrada), 'activo');
    const actualizado: Espacio = { ...(await this.buscar(espacioId)), activo, actualizadoEn: this.reloj() };
    await this.espacios.actualizar(actualizado);
    return actualizado;
  }

  // Requisito: Consulta del catálogo. Solo quien gestiona espacios puede ver los inactivos.
  async listar(filtro: FiltroEspacios, puedeVerInactivos: boolean): Promise<Espacio[]> {
    return this.espacios.listar({ ...filtro, incluirInactivos: puedeVerInactivos && filtro.incluirInactivos === true });
  }

  obtener(espacioId: string): Promise<Espacio> {
    return this.buscar(espacioId);
  }

  async buscar(espacioId: string): Promise<Espacio> {
    const espacio = await this.espacios.buscarPorId(espacioId);
    if (!espacio) throw new ErrorAplicacion('ESPACIO_NO_ENCONTRADO', 'El espacio no existe.');
    return espacio;
  }

  // Requisito: Nombre único de espacio (también frente a espacios inactivos).
  private async asegurarNombreLibre(nombre: string, espacioId?: string): Promise<void> {
    const existente = await this.espacios.buscarPorNombre(nombre);
    if (existente && existente.id !== espacioId) {
      throw new ErrorAplicacion('NOMBRE_ESPACIO_DUPLICADO', `Ya existe un espacio llamado "${existente.nombre}".`);
    }
  }
}
