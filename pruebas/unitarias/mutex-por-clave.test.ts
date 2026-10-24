import { describe, expect, it } from 'vitest';
import { MutexPorClave } from '../../src/compartido/mutex-por-clave.js';

const esperar = () => new Promise((resolver) => setTimeout(resolver, 5));

describe('MutexPorClave', () => {
  it('serializa las operaciones que comparten una clave', async () => {
    const mutex = new MutexPorClave();
    const eventos: string[] = [];
    const operacion = (nombre: string) =>
      mutex.ejecutarExclusivo(['espacio:1'], async () => {
        eventos.push(`${nombre}:inicio`);
        await esperar();
        eventos.push(`${nombre}:fin`);
      });

    await Promise.all([operacion('a'), operacion('b')]);

    expect(eventos).toEqual(['a:inicio', 'a:fin', 'b:inicio', 'b:fin']);
  });

  it('permite paralelismo entre claves distintas', async () => {
    const mutex = new MutexPorClave();
    const eventos: string[] = [];
    const operacion = (clave: string) =>
      mutex.ejecutarExclusivo([clave], async () => {
        eventos.push(`${clave}:inicio`);
        await esperar();
        eventos.push(`${clave}:fin`);
      });

    await Promise.all([operacion('espacio:1'), operacion('espacio:2')]);

    expect(eventos.slice(0, 2).sort()).toEqual(['espacio:1:inicio', 'espacio:2:inicio']);
  });

  it('no se interbloquea cuando dos operaciones piden las mismas claves en distinto orden', async () => {
    const mutex = new MutexPorClave();
    const resultados = await Promise.all([
      mutex.ejecutarExclusivo(['espacio:1', 'usuario:1'], async () => { await esperar(); return 'a'; }),
      mutex.ejecutarExclusivo(['usuario:1', 'espacio:1'], async () => { await esperar(); return 'b'; }),
    ]);

    expect(resultados).toEqual(['a', 'b']);
  });

  it('libera la clave aunque la operación falle', async () => {
    const mutex = new MutexPorClave();
    await expect(mutex.ejecutarExclusivo(['espacio:1'], async () => { throw new Error('falla'); })).rejects.toThrow('falla');

    await expect(mutex.ejecutarExclusivo(['espacio:1'], async () => 'ok')).resolves.toBe('ok');
  });
});
