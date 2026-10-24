// Reloj inyectable (design.md D9): las pruebas fijan la fecha actual.
export type Reloj = () => Date;

export const relojDelSistema: Reloj = () => new Date();
