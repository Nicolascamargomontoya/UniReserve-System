// Serializa las operaciones que comparten alguna clave (design.md D7).
// Las claves se adquieren en orden lexicográfico para evitar interbloqueos.
export interface Exclusion {
  ejecutarExclusivo<T>(claves: string[], operacion: () => Promise<T>): Promise<T>;
}

export class MutexPorClave implements Exclusion {
  private readonly colas = new Map<string, Promise<void>>();

  async ejecutarExclusivo<T>(claves: string[], operacion: () => Promise<T>): Promise<T> {
    const liberaciones: Array<() => void> = [];
    try {
      for (const clave of [...new Set(claves)].sort()) {
        liberaciones.push(await this.adquirir(clave));
      }
      return await operacion();
    } finally {
      for (const liberar of liberaciones.reverse()) liberar();
    }
  }

  private async adquirir(clave: string): Promise<() => void> {
    const anterior = this.colas.get(clave) ?? Promise.resolve();
    let liberar!: () => void;
    const propia = new Promise<void>((resolver) => (liberar = resolver));
    const cola = anterior.then(() => propia);
    this.colas.set(clave, cola);
    await anterior;
    return () => {
      liberar();
      if (this.colas.get(clave) === cola) this.colas.delete(clave);
    };
  }
}
