// Verificación de trazabilidad (design.md D11): cada escenario de OpenSpec debe tener una prueba
// con exactamente el mismo nombre en pruebas/<capacidad>*.test.ts.
// Uso: npm run trazabilidad [-- --escribir]   (--escribir genera docs/TRAZABILIDAD.md)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface Escenario {
  capacidad: string;
  requisito: string;
  escenario: string;
  origen: string;
}

const raiz = process.cwd();
const directorioPruebas = join(raiz, 'pruebas');

function subdirectorios(ruta: string): string[] {
  if (!existsSync(ruta)) return [];
  return readdirSync(ruta, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
}

// Especificaciones vigentes (openspec/specs) y deltas de cambios activos (excluye el archivo histórico).
function archivosDeEspecificacion(): Array<{ capacidad: string; ruta: string; origen: string }> {
  const vigentes = subdirectorios(join(raiz, 'openspec/specs')).map((capacidad) => ({
    capacidad,
    ruta: join(raiz, 'openspec/specs', capacidad, 'spec.md'),
    origen: 'vigente',
  }));
  const cambios = subdirectorios(join(raiz, 'openspec/changes'))
    .filter((cambio) => cambio !== 'archive')
    .flatMap((cambio) =>
      subdirectorios(join(raiz, 'openspec/changes', cambio, 'specs')).map((capacidad) => ({
        capacidad,
        ruta: join(raiz, 'openspec/changes', cambio, 'specs', capacidad, 'spec.md'),
        origen: `cambio ${cambio}`,
      })),
    );
  return [...vigentes, ...cambios].filter((archivo) => existsSync(archivo.ruta));
}

function extraerEscenarios(capacidad: string, contenido: string, origen: string): Escenario[] {
  const escenarios: Escenario[] = [];
  let seccion = '';
  let requisito = '';
  for (const linea of contenido.split('\n')) {
    const encabezadoSeccion = /^## (.+)$/.exec(linea);
    if (encabezadoSeccion) seccion = encabezadoSeccion[1]!.trim();
    const encabezadoRequisito = /^### Requirement: (.+)$/.exec(linea);
    if (encabezadoRequisito) requisito = encabezadoRequisito[1]!.trim();
    const encabezadoEscenario = /^#### Scenario: (.+)$/.exec(linea);
    // Los requisitos eliminados o renombrados no exigen prueba.
    if (encabezadoEscenario && !/^(REMOVED|RENAMED)/.test(seccion)) {
      escenarios.push({ capacidad, requisito, escenario: encabezadoEscenario[1]!.trim(), origen });
    }
  }
  return escenarios;
}

function titulosDePrueba(capacidad: string): Map<string, string> {
  const titulos = new Map<string, string>();
  if (!existsSync(directorioPruebas)) return titulos;
  const archivos = readdirSync(directorioPruebas).filter(
    (archivo) => archivo === `${capacidad}.test.ts` || (archivo.startsWith(`${capacidad}.`) && archivo.endsWith('.test.ts')),
  );
  for (const archivo of archivos) {
    const contenido = readFileSync(join(directorioPruebas, archivo), 'utf8');
    for (const coincidencia of contenido.matchAll(/\b(?:it|test)\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
      titulos.set(coincidencia[2]!, `pruebas/${archivo}`);
    }
  }
  return titulos;
}

const unicos = new Map<string, Escenario>();
for (const { capacidad, ruta, origen } of archivosDeEspecificacion()) {
  for (const escenario of extraerEscenarios(capacidad, readFileSync(ruta, 'utf8'), origen)) {
    unicos.set(`${capacidad}|${escenario.escenario}`, escenario);
  }
}

const filas = [...unicos.values()].map((escenario) => {
  const prueba = titulosDePrueba(escenario.capacidad).get(escenario.escenario);
  const modulo = `src/modulos/${escenario.capacidad}/`;
  return { ...escenario, prueba, modulo: existsSync(join(raiz, modulo)) ? modulo : '—' };
});
const faltantes = filas.filter((fila) => !fila.prueba);

if (process.argv.includes('--escribir')) {
  const capacidades = [...new Set(filas.map((fila) => fila.capacidad))];
  const lineas = [
    '# Matriz de trazabilidad',
    '',
    'Generada por `npm run trazabilidad -- --escribir` a partir de las especificaciones de OpenSpec y de los títulos de las pruebas. No se edita a mano.',
    '',
    `**Escenarios:** ${filas.length} · **Con prueba:** ${filas.length - faltantes.length} · **Sin prueba:** ${faltantes.length}`,
    '',
    '| Capacidad | Escenarios | Con prueba | Módulo |',
    '| :--- | ---: | ---: | :--- |',
    ...capacidades.map((capacidad) => {
      const propias = filas.filter((fila) => fila.capacidad === capacidad);
      return `| ${capacidad} | ${propias.length} | ${propias.filter((fila) => fila.prueba).length} | \`${propias[0]!.modulo}\` |`;
    }),
    '',
    '| Capacidad | Requisito | Escenario | Prueba | Estado |',
    '| :--- | :--- | :--- | :--- | :---: |',
    ...filas.map(
      (fila) =>
        `| ${fila.capacidad} | ${fila.requisito} | ${fila.escenario} | ${fila.prueba ? `\`${fila.prueba}\`` : '—'} | ${fila.prueba ? '✅' : '❌'} |`,
    ),
    '',
  ];
  writeFileSync(join(raiz, 'docs/TRAZABILIDAD.md'), lineas.join('\n'));
  console.log('Matriz escrita en docs/TRAZABILIDAD.md');
}

console.log(`Trazabilidad: ${filas.length - faltantes.length}/${filas.length} escenarios con prueba.`);
if (faltantes.length > 0) {
  console.error('Escenarios sin prueba:');
  for (const fila of faltantes) console.error(`  - [${fila.capacidad}] ${fila.requisito} › ${fila.escenario} (${fila.origen})`);
  process.exit(1);
}
