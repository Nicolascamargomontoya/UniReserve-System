# Revisión de especificaciones — CR-01 (antes de implementar)

**Cambio:** `limitar-horas-consecutivas` · **Fecha:** 2026-10-24 · **Resultado:** aprobado para implementar.

| Verificación | Resultado |
| :--- | :--- |
| `openspec validate limitar-horas-consecutivas --strict` | Válido |
| El delta modifica solo la capacidad declarada en la propuesta (`solicitudes-reserva`) | Sí |
| Escenarios con valores concretos y resultado observable | 10/10 |
| Ambigüedad "consecutivas" resuelta y justificada | Sí (proposal.md, lectura 2) |
| Contradicciones con las especificaciones vigentes | Ninguna. Con `prevencion-conflictos › Exclusividad del solicitante`, las reservas propias nunca se solapan, así que la cadena solo se forma por contigüidad. Con `solicitudes-reserva › Bloques de 30 minutos`, la pausa mínima posible es de 30 minutos. |
| Límite exacto | "Más de cuatro" excluye el 4: escenarios "Reserva de exactamente cuatro horas" y "Cadena de exactamente cuatro horas". |
| Casos que no deben bloquear | Otro espacio, otro usuario, reservas canceladas o rechazadas y pausa de 30 minutos: un escenario cada uno. |
| Impacto en el plan | RN-13 y CR-01 agregadas a PLAN_INGENIERIA.md (v2.2); sin cambios de arquitectura. |

## Revisión de pruebas existentes (regresión prevista)

Se buscaron en `pruebas/` cadenas del mismo usuario y espacio de más de 4 horas que la nueva regla rechazaría:

- `cancelacion-historial.test.ts` › "El historial incluye todos los estados" crea cuatro reservas contiguas de una hora (10:00–14:00): el bloque mide **exactamente 4 horas**, que la regla permite.
- Ninguna otra prueba encadena reservas del mismo usuario en el mismo espacio por más de 4 horas.

Conclusión: no se espera ninguna prueba existente en rojo. Si alguna fallara, indicaría un efecto no previsto de la regla y se analizaría antes de modificar la prueba.
