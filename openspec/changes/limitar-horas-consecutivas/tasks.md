# Tareas

## 1. Implementación de la regla

- [ ] 1.1 Agregar `LIMITE_HORAS_CONSECUTIVAS` (422) al contrato de errores (design.md D4); verificar con `npm run tipos`.
- [ ] 1.2 Implementar `politica-horas-consecutivas.ts` con el cálculo del bloque continuo (D1); verificar con `pruebas/unitarias/politica-horas-consecutivas.test.ts`.
- [ ] 1.3 Integrar la política en `ServicioSolicitudes` en los dos puntos de D2 (solicitudes-reserva: Límite de cuatro horas consecutivas); verificar con los 10 escenarios en `pruebas/solicitudes-reserva.horas-consecutivas.test.ts`.

## 2. Regresión y documentación

- [ ] 2.1 Ejecutar la suite completa; verificar que las 137 pruebas existentes siguen en verde (ninguna funcionalidad previa afectada).
- [ ] 2.2 Ejecutar `npm run verificar`; verificar tipos, especificaciones, cobertura ≥ 85 % y trazabilidad sin escenarios faltantes, y regenerar `docs/TRAZABILIDAD.md`.
- [ ] 2.3 Documentar la regla en `README.md`; verificar que el ejemplo de error coincide con la respuesta real del servidor.

## Workflow follow-up

- Archivar el cambio con `openspec archive limitar-horas-consecutivas` cuando las tareas estén completas.
- Verificar que `openspec/specs/solicitudes-reserva/spec.md` contiene el nuevo requisito.
