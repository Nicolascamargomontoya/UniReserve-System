# Diseño: Límite de cuatro horas consecutivas (CR-01)

## Contexto

Ver `proposal.md` (Why y análisis de impacto). Las solicitudes se validan en `ServicioSolicitudes` siguiendo el orden D6 del cambio archivado `crear-sistema-reservas`: forma → reglas de tiempo → espacio → sección crítica (duplicado, disponibilidad, agenda del usuario).

## Objetivos / No objetivos

**Objetivos:** aplicar la regla sin tocar las demás capacidades, aislada en una política con pruebas unitarias propias.

**No objetivos:** aplicar la regla de forma retroactiva, volver a evaluarla al aprobar o hacer configurable el límite por espacio o por rol.

## Decisiones

### D1. Política aislada `politica-horas-consecutivas.ts`

Una función pura `bloqueContinuo(intervalo, reservasPropias)` extiende el intervalo solicitado hacia atrás y hacia adelante mientras encuentre reservas contiguas, y `asegurarLimiteHorasConsecutivas(...)` compara la duración del bloque con `MAXIMO_HORAS_CONSECUTIVAS = 4`.

- *Alternativa descartada:* incrustar la lógica en `ServicioSolicitudes`. Mezclaría la regla nueva con el flujo existente y dificultaría probarla de forma aislada (riesgo R6 del plan).

### D2. Dos puntos de verificación, siguiendo el principio de D6

1. **Sin estado**, en las reglas de tiempo (después de `BLOQUE_HORARIO_INVALIDO`): si la solicitud por sí sola supera 4 horas, se rechaza sin consultar el almacén.
2. **Con estado**, dentro de la sección crítica (después de `CONFLICTO_HORARIO_USUARIO`): se consultan las reservas activas del usuario en el espacio y se calcula la cadena. Ir dentro del bloqueo `[espacio, usuario]` garantiza que dos solicitudes concurrentes del mismo usuario no formen juntas un bloque de más de 4 horas.

- *Alternativa descartada:* solo el punto 2. Funciona igual, pero consulta el almacén para un caso que se resuelve con aritmética.

### D3. La aprobación no vuelve a evaluar la regla

Las solicitudes se validan al crearse. Las pendientes registradas antes de la regla (ninguna en la entrega, por la persistencia en memoria) se respetan, y el administrador puede rechazarlas.

- *Alternativa descartada:* revalidar al aprobar. Rechazaría solicitudes que eran válidas cuando se hicieron, sin que el solicitante pueda corregirlas a tiempo.

### D4. Contrato de errores

Se agrega `LIMITE_HORAS_CONSECUTIVAS` con HTTP **422** (regla de negocio violada por una petición bien formada, según el criterio de D5). `detalles` incluye `inicioBloque`, `finBloque` y `horas` para que el solicitante entienda qué cadena se formaría.

## Riesgos / Compromisos

- [Un usuario puede dejar una pausa de 30 minutos y volver a reservar] → Aceptado: la regla de la institución habla de horas *consecutivas*; una pausa real corta la continuidad. Si la institución quisiera un tope diario, sería otro cambio (CR) con otra regla.
- [Las pruebas existentes podrían construir cadenas de más de 4 horas] → Revisado en `revision.md`: ninguna lo hace; la suite completa se ejecuta como regresión.

## Plan de migración

No hay datos que migrar. Reversión: revertir los commits de implementación de este cambio; la especificación delta se archiva solo cuando la implementación pase la verificación.
