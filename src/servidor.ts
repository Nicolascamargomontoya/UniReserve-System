import { existsSync } from 'node:fs';
import { crearApp } from './app.js';
import { cargarConfiguracion } from './configuracion.js';
import { crearContenedor } from './contenedor.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const { configuracion, advertencias } = cargarConfiguracion();
for (const advertencia of advertencias) console.warn(`[advertencia] ${advertencia}`);

const contenedor = crearContenedor({ configuracion });

crearApp(contenedor).listen(configuracion.puerto, () => {
  console.log(`UniReserve escuchando en http://localhost:${configuracion.puerto}`);
});
