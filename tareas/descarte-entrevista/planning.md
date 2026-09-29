# Planning · la causal de descarte tras la entrevista

Para **quien escribe el brief de este frente** y llega sin contexto. Dice **cómo funciona hoy** y **dónde
está cada pieza**. El qué se pide está en `requisitos.md`.

> 🔴 **Actualizado el 2026-09-24. Las decisiones ya están cerradas en `bitacora.md`**, que es la fuente
> única de la verdad de este frente: decisiones numeradas, vocabulario, pasos y despliegue. Si este
> documento y la bitácora no coinciden, **gana la bitácora**. Este documento queda como mapa del código.

## Antes de nada

1. `../../CLAUDE.md` — el proyecto: los dos repositorios, el vocabulario, la verificación y la deuda
   conocida.
2. `../psicoalianza/arranque-del-ejecutor.md` — **cómo se trabaja aquí**: los dos papeles (quien planifica
   y quien ejecuta), la opinión previa antes de tocar código, el rigor según el riesgo, y las siete cosas
   que ya salieron mal. Se escribió para el frente de PsicoAlianza, pero las reglas son de la casa.
3. `../../../../esscoti-backend/CLAUDE.md` — credenciales y datos de producción.

**Esto toca el embudo**: cambia lo que hace una persona real al cerrar un proceso, y lo que queda
guardado para siempre en la participación. Tratamiento completo, no brief corto.

## Cómo funciona hoy, con una persona

Marta terminó de entrevistar a Ana. En el detalle de la oferta, en la ficha de Ana, tiene dos botones:
**«Marcar como contratado»** y **«Marcar como rechazado»**. Los ve solo si Ana está **desbloqueada**: ocupa
una plaza, fue revelada del grupo o la añadieron a mano.

Al pulsar «Marcar como rechazado» se abre una ventana con **un solo campo: una observación en texto
libre**, hoy **obligatoria**. Marta escribe lo que quiera, confirma, y eso queda guardado en la
participación de Ana junto con la fecha y quién decidió. **La decisión es definitiva**: no se puede
corregir ni cambiar por la otra.

Ese texto se vuelve a mostrar en la ficha de Ana, bajo el título «Razón de rechazo». **La analítica no lo
mira**: los motivos que enseña hoy salen del embudo automático (por qué el sistema descartó a alguien en
una etapa), no de esta decisión.

⚠️ **No existe un «descarte tras la entrevista» como tal.** Lo que existe es el **desenlace de
contratación**, que es el que se usa al final del proceso. El nombre importa porque en el código todo se
llama así. Y **no garantiza que haya habido entrevista**: se puede decidir sobre cualquier candidato
desbloqueado. Por eso la bitácora lo llama **rechazo final** (punto C de la bitácora).

⚠️ **La validación del DTO no se aplica** en este backend: la validación global está desactivada y este
endpoint no declara una propia. Cualquier regla nueva va escrita en el servicio (punto A y decisión 7 de
la bitácora).

## Dónde está cada pieza

### Backend (`../../../../esscoti-backend`)

| Qué | Dónde | Para qué sirve aquí |
| --- | --- | --- |
| El desenlace de contratación | `src/offers/enums/hiring-outcome.enum.ts` | Los tres valores: pendiente, contratado, rechazado |
| Los campos guardados | `src/offers/schemas/offer.schema.ts` (participación del candidato: desenlace, causal, observación, fecha y quién) | `hiringOutcomeReason`, restringido a la lista y nulo por defecto (decisión 3). ⚠️ Un código de la lista **no se retira nunca** (punto G) |
| La lista de causales | `HiringRejectionReason`, en `src/offers/enums/rejection/`, junto a `rejection-reason.enum.ts` (decisión 16) | **No se reusa `RejectionReason`**, que es el del embudo automático (decisión 3). Ese otro enum suma `RECRUITER_REJECTED` (decisión 23) |
| La regla | `src/offers/hiring-outcome.service.ts` → `HiringOutcomeService.setCandidateHiringOutcome` (decisión 17) | Toda la validación: desenlace, causal, «Otro» con detalle, no rechazar a quien el agente descartó (decisiones 5 a 7, 20 y 22). Comprueba el desbloqueo, impide cambiar una decisión, audita y guarda |
| La entrada de la API | `src/offers/offers.controller.ts` → `POST /offers/:id/candidates/:candidateId/hiring-outcome` | Comprueba permisos, llama al servicio del desenlace y, si es un rechazo, lanza en segundo plano la detención del agente |
| Detener al agente | `src/offers/pipeline/pipeline-orchestrator.service.ts` → `stopAfterRecruiterRejection` | Saca del proceso con `markFailed` y `recruiter_rejected`; despedida solo a quien el agente ya contactó; si falla, log y correo de alerta (decisión 23). ⚠️ El texto de la despedida está **copiado** del de la cancelación: si cambia uno, se cambia el otro |
| Lo que acepta la API | `src/offers/dto/set-candidate-hiring-outcome.dto.ts` | La causal se declara aquí para la documentación de la API, pero **sus decoradores no validan nada** (punto A) |
| Lo que ve la página Candidatos | `src/offers/candidates.service.ts` | Alimenta la **página Candidatos** del portal, no la ficha de la oferta (punto D). Devuelve también la causal |
| La analítica | `src/metrics/metrics.service.ts` | `isAgentRejection` (por candidato) y `agentStageHistory` (por historial), junto a `normalizeRejectionReason`: las dos piezas del criterio que separan al agente del reclutador (decisión 24). `finalRejections` arma el bloque del reclutador para el panel y para el detalle de cada oferta (decisiones 12, 13 y 25) |

### Portal (`../../../../esscoti-frontend`)

| Qué | Dónde |
| --- | --- |
| Los dos botones, la ventana de rechazo con el selector de causal, la llamada a la API y **la ficha del candidato en la oferta** | `app/routes/offers.$id.tsx`. La ficha lee la participación directamente de la oferta. El botón de rechazar no sale a quien el agente descartó |
| **La lista de causales en el portal**, con su etiqueta | `app/lib/hiring-rejection-reasons.ts`. Única fuente de la lista en el portal |
| **La página Candidatos**, que también muestra la causal | `app/routes/candidates.tsx` (punto D de la bitácora) |
| Los tipos del candidato que llegan del backend | `app/lib/models.ts` |
| Los textos que ve Marta | `app/i18n/locales/es.ts` **y `app/i18n/locales/en.ts`**, bajo `candidates.hiringOutcome` (las causales en `reasons`) y `rejection.recruiter_rejected` |
| La etiqueta de `recruiter_rejected` | `app/lib/status-labels.ts` |
| La pestaña de auditoría (solo en modo de desarrollo) | `app/components/offer-audit-log.tsx`: la causal sale como «código — etiqueta» |
| La pantalla de analítica | `app/routes/analytics.tsx`: «Motivos de rechazo final» en el panel y en la vista de cada oferta; sus tipos viven en la propia pantalla |
| Permisos para ver los botones | `app/lib/permissions.ts` (gestión de todas las ofertas o de las asignadas) |

## Lo que había que decidir — cerrado en la bitácora

> Las siete preguntas de abajo **ya están resueltas**. Se conservan como registro de qué se preguntó;
> **la respuesta vigente es la de la bitácora**: 1 → decisión 6; 2 → decisión 8; 3 → decisiones 1 y 2;
> 4 → decisión 4; 5 → decisión 10; 6 → decisiones 12 a 14 (la analítica entra, solo en el panel global);
> 7 → decisión 9.

1. 🔴 **La observación pasa de obligatoria a opcional.** Hoy el backend rechaza el descarte sin
   observación, y el portal tiene el botón apagado hasta que se escribe algo. El requisito la vuelve
   opcional salvo en «Otro». **Es un cambio de comportamiento que ya funciona**, y hay que decidirlo a
   propósito, no de paso.
2. 🔴 **Los descartes ya guardados no tienen causal.** Hay que decidir qué se hace con ellos: se quedan sin
   causal y la analítica los muestra aparte, o se les asigna «Otro». Lo segundo inventa un dato que nadie
   dijo. **Recomendación: sin causal, y que la analítica lo enseñe como «sin causal (antes del cambio)»**.
3. **Dónde vive la lista.** Es igual para todas las empresas, así que va en el código del backend, no en
   la configuración de la empresa. Los valores guardados son un contrato: se nombran una vez, en inglés, y
   **renombrarlos después rompe los datos en silencio**. Las etiquetas en español van en los textos del
   portal.
4. **Si la causal aplica también al «contratado».** No: solo al rechazo. Conviene dejarlo escrito para que
   no se cuele.
5. **Qué pasa con la decisión definitiva.** Hoy no se puede corregir un desenlace ya registrado. Si se
   descarta con la causal equivocada, no hay arreglo. Decidir si este frente lo toca o lo deja como está
   (recomendado: dejarlo, y anotarlo).
6. **Hasta dónde llega el frente.** Guardar la causal no es lo que pide la historia: la historia pide que
   **la analítica muestre por qué se pierden los candidatos al final**. Hay que decidir si la pantalla de
   analítica entra en este frente o va en un paso siguiente, y decirlo en el brief.
7. **La auditoría.** El registro del descarte guarda hoy la observación. Decidir si guarda también la
   causal (recomendado: sí).

## Cómo se parte el trabajo

**Los pasos vigentes y la rama están en la bitácora**, sección *Pasos*: backend (paso 1), portal (paso 2)
y el bloque de analítica (paso 3), en `feat/hiring-rejection-reason` desde `develop`, en los dos
repositorios.

🔴 **Backend y portal se despliegan a la vez**: no hay orden seguro. Detalle en la bitácora, *Antes de
desplegar*.

## Verificación

- **Backend**: `npm run build` y `npm test`, una vez sobre el conjunto del cambio.
- **Portal**: `npm run typecheck`. 🔴 **No tiene pruebas automáticas**, así que el brief de cada paso que lo
  toque trae **la lista de casos que se prueban a mano en local** —qué empresa, qué oferta, qué se espera
  ver—, y el reporte dice el resultado de cada uno.
- 🔴 **No correr el lint del backend**: está definido con corrección automática y reformatea archivos que
  nadie tocó.
