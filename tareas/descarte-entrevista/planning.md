# Planning · la causal de descarte tras la entrevista

Para **quien escribe el brief de este frente** y llega sin contexto. Dice **cómo funciona hoy**, **dónde
está cada pieza** y **qué hay que decidir antes de que alguien escriba código**. El qué se pide está en
`requisitos.md`.

## Antes de nada

1. `../CLAUDE.md` — el proyecto: los dos repositorios, el vocabulario, la verificación y la deuda
   conocida.
2. `../psicoalianza/arranque-del-ejecutor.md` — **cómo se trabaja aquí**: los dos papeles (quien planifica
   y quien ejecuta), la opinión previa antes de tocar código, el rigor según el riesgo, y las siete cosas
   que ya salieron mal. Se escribió para el frente de PsicoAlianza, pero las reglas son de la casa.
3. `../../esscoti-backend/CLAUDE.md` — credenciales y datos de producción.

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
contratación**, que es el que se usa al final del proceso, después de entrevistar. El nombre importa
porque en el código todo se llama así.

## Dónde está cada pieza

### Backend (`../../esscoti-backend`)

| Qué | Dónde | Para qué sirve aquí |
| --- | --- | --- |
| El desenlace de contratación | `src/offers/enums/hiring-outcome.enum.ts` | Los tres valores: pendiente, contratado, rechazado |
| Los campos guardados | `src/offers/schemas/offer.schema.ts` (participación del candidato: desenlace, observación, fecha y quién) | **Aquí nace el campo nuevo de la causal** |
| La regla | `src/offers/offers.service.ts` → `setCandidateHiringOutcome` | Valida la observación, comprueba que esté desbloqueado, impide cambiar una decisión ya tomada, escribe la auditoría y guarda |
| La entrada de la API | `src/offers/offers.controller.ts` → `POST /offers/:id/candidates/:candidateId/hiring-outcome` | Comprueba permisos de gestión de la oferta |
| Lo que acepta la API | `src/offers/dto/set-candidate-hiring-outcome.dto.ts` | **Aquí entra la causal**; hoy solo trae el desenlace y la observación (tope de 1000 caracteres) |
| Lo que devuelve el detalle del candidato | `src/offers/candidates.service.ts` | Expone el desenlace, la observación y la fecha al portal |
| La analítica | `src/metrics/metrics.service.ts` (motivos de rechazo y rechazo por etapa) y `src/metrics/metrics.controller.ts` | **Hoy agrupa por el error de etapa del embudo, no por esta decisión.** Que la causal llegue a la analítica es trabajo aparte dentro de este frente |

### Portal (`../../esscoti-frontend`)

| Qué | Dónde |
| --- | --- |
| Los dos botones, la ventana de rechazo y la llamada a la API | `app/routes/offers.$id.tsx` (ventana de rechazo, y la llamada a `hiring-outcome`) |
| Los tipos del candidato que llegan del backend | `app/lib/models.ts` |
| Los textos que ve Marta | `app/i18n/locales/es.ts`, bajo `candidates.hiringOutcome` |
| La pantalla de analítica | `app/routes/analytics.tsx` |
| Permisos para ver los botones | `app/lib/permissions.ts` (gestión de todas las ofertas o de las asignadas) |

## Lo que hay que decidir antes de escribir el brief

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

Una propuesta, para que el brief la confirme o la cambie:

1. **Backend**: la lista de causales, el campo nuevo en la participación, la validación (causal
   obligatoria, detalle obligatorio solo en «Otro») y lo que devuelve el detalle del candidato.
2. **Portal**: el selector en la ventana de rechazo, el detalle opcional, y la causal visible en la ficha.
3. **Analítica**: agrupar los descartes por causal y enseñarlo.

Cada paso preserva lo anterior y se entrega por separado: el paso 2 no se puede probar sin el 1.

## Verificación

- **Backend**: `npm run build` y `npm test`, una vez sobre el conjunto del cambio.
- **Portal**: `npm run typecheck`. 🔴 **No tiene pruebas automáticas**, así que el brief de cada paso que lo
  toque trae **la lista de casos que se prueban a mano en local** —qué empresa, qué oferta, qué se espera
  ver—, y el reporte dice el resultado de cada uno.
- 🔴 **No correr el lint del backend**: está definido con corrección automática y reformatea archivos que
  nadie tocó.
