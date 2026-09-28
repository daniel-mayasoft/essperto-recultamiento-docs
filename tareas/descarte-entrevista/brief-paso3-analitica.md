# Brief · Paso 3 — «Motivos de rechazo final» en la analítica

Para quien ejecuta este paso. Cambia lo que ve la dirección y el reclutador en el panel de analítica,
en backend y portal. No escribe a nadie ni mueve a ningún candidato, pero **cambia cifras que la gente
ya lee**: el total de descartados y los bloques del agente dejan de contar a quien rechazó el
reclutador. Tratamiento completo, con una sola ronda si no aparece nada grande.

Antes de empezar, lee `../../CLAUDE.md`, el arranque del ejecutor y **`bitacora.md`**: sobre todo las
**decisiones 12, 13, 14, 21 y 24**, y la 8 («sin causal»).

> Escrito el 2026-09-27 leyendo el servicio de métricas del backend —cómo elige a los descartados, los
> motivos, los descartados por etapa, el embudo y la tabla de ofertas— y la pantalla de analítica del
> portal.

## Rama y orden

`feat/hiring-rejection-reason` en los dos repositorios, **encima de los pasos 1d y 2**. Un commit por
repositorio. **Sin PR a `develop`.**

## Qué le pasa a quien mira el panel

Una oferta con Ana (descartada por el agente en las preguntas), Sofía (descartada por el agente en la
compatibilidad), Luis (rechazado por Marta a mitad del proceso), Pedro (rechazado por Marta al final),
Carla (contratada) y un rechazo antiguo solo con texto:

| Bloque | Hoy | Después |
| --- | --- | --- |
| Motivos de descarte | Ana, Sofía **y Luis** («otros») | Ana y Sofía |
| Descartados por etapa | Ana, Sofía **y Luis** (preguntas) | Ana y Sofía |
| Embudo, caídos por etapa | Luis cuenta como caído en las preguntas | Luis no cuenta como caído |
| Total de descartados y columna de la tabla | 3 | 2 |
| **Motivos de rechazo final** (nuevo) | — | No cumple el perfil técnico: 1 · Expectativa salarial: 1 · Sin causal: 1 |

## Qué se hace

### Backend — la separación (decisiones 21 y 24)

En el servicio de métricas, **toda cifra del agente** deja fuera a quien tiene el código de descarte
`recruiter_rejected`, aunque su estado sea «descartado»: los motivos de descarte, los descartados por
etapa, el total de descartados, la cuenta de descartados de la tabla de ofertas y del detalle de cada
oferta, y los caídos por etapa del embudo. **Un solo criterio, en un solo sitio**, que usen todas: si cada
cifra lo reimplementa, la próxima que se añada lo olvidará.

⚠️ **El embudo necesita que lo mires antes de tocarlo.** Hoy cada etapa cuenta a quien la pasó y a quien
cayó en ella. Luis llegó a las preguntas y no las pasó, pero tampoco lo descartó la etapa. Dime en la
opinión previa cómo queda la cuenta de esa etapa sin él entre los caídos, y si alguna cifra del embudo
deja de cuadrar.

### Backend — el bloque nuevo (decisiones 12, 13 y 14)

La respuesta del panel global suma **los rechazos finales por causal**: cada participación con desenlace
«rechazado», agrupada por su causal, con **«sin causal» como un grupo más** para los anteriores al cambio
(decisión 8), y su total. Ordenado de más a menos. **Solo cuenta**: el detalle no sale.

Usa **las mismas ofertas** que el resto del panel: mismo filtro de fechas por creación de la oferta,
mismo estado (canceladas fuera salvo que se pidan) y mismo filtro de ofertas (decisión 14). No se añade
al detalle de cada oferta (decisión 12).

### Portal — el bloque

En la pantalla de analítica, un bloque **«Motivos de rechazo final»** / **«Final rejection reasons»**
junto a «Motivos de descarte», con la misma forma que ese bloque, y «Sin causal» / «No reason» para el
grupo de los antiguos. **Las etiquetas de las causales ya existen** desde el paso 2 (`7d8e67f`): la
lista y su función de etiqueta en `app/lib/hiring-rejection-reasons.ts`, y los textos bajo
`candidates.hiringOutcome.reasons`. Se reutilizan; no se crea un segundo juego de textos. Si no hay ninguno, el mismo vacío que usan los
demás bloques.

## 🔴 Dónde se para — qué NO se hace

- **Nada de la contratación**, ni cifras nuevas sobre contratados.
- **No se añade el bloque al detalle de cada oferta** (decisión 12); sí se le aplica la exclusión.
- **No se cambia el filtro de fechas** para que mire la fecha de la decisión (decisión 14).
- **No se reorganiza el servicio de métricas** más allá del criterio único de exclusión.
- **Boy scout** (decisión 19), **sin comentarios** en el código, **sin formateador**, **sin PR**.

## Opinión previa del ejecutor (2026-09-28), verificada e incorporada

**Esta tabla manda sobre el cuerpo del brief donde difieran.**

| Punto | Decidido |
| --- | --- |
| 0 · Las ramas ya traen una fusión de `develop` | Revisada por el planificador: solo difieren los archivos del frente. **Línea base del backend: 157 suites y 1.613 pruebas (1.604 pasan, 9 omitidas)**, en `61770a8`. Portal en `b351b3f`, tipos sin errores |
| 1 · El embudo: quitar a Luis solo de los caídos lo deja «en curso» para siempre | **Aceptado**: en las cifras del agente, la entrada del historial con `recruiter_rejected` no existe. Luis pasó las etapas anteriores y desaparece de la etapa donde Marta lo sacó. La duración media también la ignora |
| 2 · La precisión de la compatibilidad y la tasa de respuesta también se ensucian | **Aceptado**: usan el mismo criterio por historial |
| 3 · Dónde vive el criterio | **Aceptado**: en el servicio de métricas, junto a `normalizeRejectionReason`, con sus dos piezas —por candidato y por historial— y las cifras que lista la bitácora, decisión 24 |
| 4 · En «Motivos de descarte», Luis ya no sale en «otros», sino como «Rechazado por el reclutador» | Correcto: el «Hoy» de la tabla de arriba está desfasado; el «Después» vale |
| 4 · El bloque nuevo sin recorte a 10 | **Aceptado**: son como mucho once grupos |
| 4 · La consulta no cambia; los tipos de la respuesta del portal viven en la pantalla de analítica | Correcto |
| 4 · «Plazas abiertas» sigue contando la plaza de Pedro | Fuera del alcance, anotado en la bitácora |
| 5 · Los rechazos anteriores al paso 1d pueden contar en los dos bloques | Fuera del alcance, anotado: haría falta una migración (decisión 8) |
| 6 · Los casos a mano | **Aceptados los nueve**: van a `pruebas-a-mano.md`, en una sección del paso 3, dentro de este diff |
| 7 · Lo que no se toca | Correcto. Textos nuevos: solo el título del bloque y «Sin causal» / «No reason», en los dos idiomas |

**Se puede empezar.**

## Pruebas

En la carpeta de pruebas de métricas (punto E), con la oferta de la tabla de arriba:

1. Los bloques del agente cuentan a Ana y a Sofía, y no a Luis: motivos, por etapa, total, tabla,
   detalle de la oferta y embudo.
2. El bloque nuevo cuenta a Luis y a Pedro por su causal, y el rechazo antiguo como «sin causal».
3. Ni Carla ni Ana ni Sofía aparecen en el bloque nuevo.
4. Una oferta cancelada no suma al bloque nuevo sin filtro de estado, y sí con el estado «cancelada».
5. El filtro de ofertas acota el bloque nuevo.

Control negativo en cada archivo.

## Verificación

Backend: `npx jest --clearCache`, `npm run build` y `npm test`, una vez; la línea base, tras la fusión de
`develop` (`61770a8`): **157 suites y 1.613 pruebas (1.604 pasan, 9 omitidas)**. Portal: `npm run typecheck`. Los casos a mano se añaden a **`pruebas-a-mano.md`**, en una sección
del paso 3, con la oferta de la tabla de arriba y lo que debe verse en cada bloque.

🔴 No correr `npm run lint`.

## Qué entregar

1. Qué cambió en cada repositorio y el resultado real de la verificación.
2. **Dónde vive el criterio único de exclusión**, y la lista de cifras que lo usan.
3. Cómo quedó el embudo y por qué.
4. **Qué decisiones tomaste que no estaban en el brief.**
5. Archivos nuevos en el índice, e índice y árbol coincidiendo, en los dos repositorios.
6. Un mensaje de commit por repositorio.
