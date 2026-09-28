# Bitácora · la causal del rechazo final

**La fuente única de la verdad de este frente.** Aquí están las decisiones numeradas, lo que el
código dice y los documentos no, lo que queda fuera, el avance y lo que hay que hacer antes de
desplegar. Los briefs apuntan aquí por número; no repiten las decisiones.

Qué se pide y el alcance acordado con la dirección: `requisitos.md`. Cómo funciona hoy y dónde
está cada pieza: `planning.md` (con las correcciones de la sección *Lo que dice el código*, más
abajo, que ganan sobre él).

## Vocabulario de este frente

- **Rechazo final** — lo que el reclutador hace con «Marcar como rechazado» sobre un candidato
  desbloqueado. En el código es el **desenlace de contratación** con valor rechazado. El requisito
  lo llama «descarte tras la entrevista», pero no hay garantía de entrevista (ver *Lo que dice el
  código*, punto C).
- **Descarte** — lo que hace el sistema en el embudo automático. No es de este frente.
- **Causal** — el motivo elegido de la lista fija al hacer un rechazo final.
- **Detalle** — el texto libre que acompaña a la causal. Es la observación que hoy existe.
- **Participación** — el registro de un candidato dentro de una oferta. La causal se guarda ahí.

## Decisiones

1. **La lista es fija, está en el código del backend y es igual para todas las empresas.** Ninguna
   empresa la configura ni la amplía.
2. **Los valores guardados son códigos en inglés, en minúsculas y con guion bajo**, con el mismo
   formato que los motivos del descarte automático. Son un contrato con los datos ya guardados:
   **no se renombran nunca**. Lo que ve el reclutador son etiquetas de los textos del portal, en
   español y en inglés, y esas sí se pueden cambiar.

   | Etiqueta | Código guardado |
   | --- | --- |
   | No se presentó a la entrevista | `no_show` |
   | Desistió del proceso | `withdrew` |
   | No cumple el perfil técnico | `technical_profile_mismatch` |
   | No cumple competencias blandas | `soft_skills_mismatch` |
   | Presentación personal inadecuada | `inappropriate_appearance` |
   | Conducta inapropiada | `inappropriate_conduct` |
   | Expectativa salarial fuera de rango | `salary_expectation_mismatch` |
   | Disponibilidad incompatible | `availability_mismatch` |
   | Se seleccionó a otro candidato | `other_candidate_selected` |
   | Otro | `other` |

   El selector del portal las muestra en este orden.
3. **Nombres en el código.** El campo nuevo de la participación es `hiringOutcomeReason`, en la
   familia de los que ya existen (`hiringOutcome`, `hiringOutcomeNote`, `hiringOutcomeAt`,
   `hiringOutcomeBy`). La lista es su propio enum, `HiringRejectionReason`. No se reusa
   `RejectionReason`, que es el del embudo automático y significa otra cosa.
4. **La causal es solo del rechazo.** Un «contratado» no la lleva, y si la trae, el backend lo
   rechaza.
5. **La causal es obligatoria al rechazar.** Sin causal, o con un valor que no está en la lista,
   el backend no guarda el rechazo.
6. **El detalle deja de ser obligatorio, salvo con «Otro».** Es un cambio visible sobre un flujo
   en producción, asumido a propósito. Un detalle que solo tiene espacios cuenta como vacío, igual
   que hoy.
7. **Toda esa validación va en el servicio, no en el DTO** (el objeto que declara qué acepta la
   API). Motivo: *Lo que dice el código*, punto A.
8. **Los rechazos anteriores al cambio no reciben causal.** El campo nace vacío y nadie lo
   rellena: no hay migración. En la analítica forman el grupo «sin causal». En las fichas se ven
   como hoy, solo con el texto, sin etiqueta de «sin causal».
9. **La auditoría guarda la causal** junto a la observación, en la entrada del rechazo.
10. **La decisión sigue siendo definitiva.** Una causal equivocada no se puede corregir, y se
    queda mal contada en la analítica. Asumido. Si algún día hace falta corregirla, es un frente
    aparte: botón, permiso y auditoría propios.
11. **La causal se ve en las dos pantallas que hoy muestran la razón del rechazo**: la ficha del
    candidato dentro de la oferta y la página Candidatos. Primero la causal y, debajo, el detalle
    si lo hay.
12. **La analítica suma un bloque, «Motivos de rechazo final»** (en inglés, *Final rejection
    reasons*), **solo en el panel global.** El detalle de cada oferta no lo lleva: para ver una
    oferta, se elige en el filtro de Ofertas.
13. **El bloque cuenta los rechazos finales por causal, más el grupo «sin causal».** Solo cuenta:
    el detalle no aparece en la analítica.
14. **El bloque sigue las reglas del resto del panel, sin excepciones**: el filtro de fechas mira
    cuándo se creó la oferta, no cuándo se tomó la decisión; sin estado elegido, las ofertas
    canceladas no suman; con el estado «Cancelada», sí.
15. **El error del backend cuando falta la causal le dice a la persona qué hacer**: «Selecciona
    una causal de rechazo. Si no ves el selector, recarga la página.» Es lo único que lee quien
    tenga abierta una pestaña del portal anterior al despliegue (*Antes de desplegar*).
16. **Las dos listas de motivos viven en una carpeta propia, `rejection`, dentro de los enums del
    módulo de ofertas**: la del embudo automático, que se mueve sin renombrarse, y la nueva de
    causales. Siguen siendo cosas distintas; la carpeta solo las agrupa.
17. **El desenlace de contratación sale del servicio de ofertas a un servicio propio,
    `HiringOutcomeService`**, con todas sus reglas —las de hoy y las nuevas—. El método conserva
    su nombre. **Lo llama el controlador directamente**; el servicio de ofertas no lo reenvía. El
    servicio nuevo lee los identificadores con su propia función, como ya hace el de candidatos.
    El resto del servicio de ofertas no se refactoriza en este frente.
18. **Mover y cambiar no van en el mismo diff.** La decisión 16 y la 17 son el paso 1a, mecánico y
    con el mismo comportamiento; la causal es el paso 1b, encima.
19. **Regla del boy scout, solo para lo mecánico.** En los archivos que un paso ya toca, se deja
    mejor lo que es importación y exportación: importaciones sin usar, rutas que el propio
    movimiento cambia. Nada de nombres, lógica, comentarios ni formato, y ningún archivo entra al
    diff solo por esto.
20. **El servicio también valida el desenlace**: solo acepta contratado o rechazado. Hoy un cuerpo
    con «pendiente» pasa, deja fecha y autor, y escribe en la auditoría un rechazo que no existió; y
    un valor inventado revienta al guardar con un 500. Es anterior a este frente, pero está en el
    bloque que el paso 1b reescribe (decisión 7). Encontrado por el ejecutor en la opinión previa del
    1b; confirmado por el usuario el 2026-09-24.
21. **Los descartes del agente y los rechazos del reclutador están separados** (punto de aceptación
    añadido el 2026-09-25). Cada uno vive en su campo —el error de la etapa, el del agente; la causal,
    la del reclutador— y cada bloque de la analítica lee solo el suyo: «Motivos de descarte» el
    primero, «Motivos de rechazo final» el segundo. El paso 3 lo prueba en las dos direcciones.
22. **No se puede rechazar a un candidato que el agente ya descartó.** Sin esta regla, la misma
    persona cuenta en los dos bloques: el agente descarta a Ana por una pregunta de WhatsApp y días
    después Marta la rechaza desde su ficha. El backend responde 400 (**paso 1d**) y la ficha del
    portal no muestra el botón de rechazar a ese candidato (**paso 2**). **Solo el rechazo**: la
    contratación queda como está (ver *Fuera del alcance*). Decidido el 2026-09-25; recortado a solo
    el rechazo el 2026-09-27.
23. **Si Marta rechaza a alguien que sigue en proceso, el agente se detiene** (paso 1d). Se reusa el
    camino con el que el agente saca a alguien del proceso: estado «descartado», flujo detenido,
    enlace de agenda anulado y cupo liberado para el siguiente de la cola (usuario, 2026-09-27):
    - Se guarda el código de descarte nuevo `recruiter_rejected` (se añade a la lista de motivos del
      embudo, con su texto en el portal en el paso 2).
    - El candidato recibe **la misma despedida** que en un descarte automático, **si el agente ya le
      había escrito en esta oferta** (conversación viva, etapa conversacional en el historial o
      «listo para agendar»). A quien nunca se contactó no se le escribe por primera vez para
      despedirlo.
    - La detención va **en segundo plano** tras guardar el rechazo; si falla, error en el log y
      correo de alerta a soporte, porque la persona puede seguir recibiendo mensajes.
    - **El cupo se libera**, como en cualquier descarte, aunque en el cobro por procesado el siguiente
      cueste un crédito.
    - Quien ya terminó el proceso no tiene nada que detener: solo se guarda el rechazo, como hoy.
24. **La analítica del agente separa por el código, no por el estado** (opción A, usuario,
    2026-09-27). Luis, rechazado por Marta a mitad del proceso, tiene el mismo estado «descartado» que
    Sofía, descartada por el agente, y así debe ser porque es lo que detiene al agente. Por eso, en
    las cifras del agente, un candidato cuenta como descartado solo si su estado es «descartado» **y**
    su código no es `recruiter_rejected`. **El total de descartados pasa a ser solo del agente**; el
    bloque de Marta muestra su propio total. Precisado en la opinión previa del paso 3
    (2026-09-28), con dos piezas del mismo criterio:
    - **Por candidato** (descartado y no `recruiter_rejected`): el total de descartados, los motivos
      de descarte, los descartados por etapa, la columna de la tabla de ofertas y los descartados del
      detalle de cada oferta.
    - **Por historial** (sin las entradas cuyo error es `recruiter_rejected`): el embudo —entraron,
      pasaron, cayeron y duración—, la precisión de la compatibilidad y la tasa de respuesta, en el
      panel, la tabla y el detalle. Luis cuenta como que pasó las etapas anteriores y **desaparece de
      la etapa donde Marta lo sacó**: ni entró, ni pasó, ni cayó. Así no se queda «en curso» para
      siempre y la tasa de esa etapa no lo juzga.


## Lo que dice el código y los documentos no

Comprobado leyendo el código de `develop` el 2026-09-23, y revisado el 2026-09-24 contra lo que
entró después (tope y cobro de candidatos procesados): no toca la zona de este frente salvo en C y
E.

- **A. La validación del DTO no se aplica.** La validación global del backend está comentada en
  el arranque, y el endpoint del desenlace no declara ninguna propia. Por eso hoy no rige ni el
  tope de 1000 caracteres de la observación ni la lista de desenlaces válidos: la única regla que
  funciona es la escrita a mano en el servicio. Una causal validada solo con decoradores compila,
  pasa las pruebas y no impide nada. Comprobado buscando en todo el backend dónde se registra la
  validación: solo aparece en ese bloque comentado. Una búsqueda así no cubre una validación
  armada de otra forma, pero el endpoint recibe el cuerpo sin ninguna.
- **B. El comentario del campo guardado miente.** Dice que el desenlace se puede sobrescribir y
  que la corrección queda en la auditoría. El servicio lo impide. El paso 1 lo corrige, igual que
  el que dice que la observación es obligatoria al rechazar.
- **C. Rechazar no implica haber entrevistado.** Se puede decidir sobre cualquier candidato
  desbloqueado. En las empresas que pagan por plaza, **desde el 2026-09-25 lo están todos**: Henry
  quitó el grupo oculto y el flujo de revelar. En las que pagan por candidato procesado, es el que ya
  costó algo —se indexó su hoja de vida o se le escribió— o el añadido a mano. En los dos modelos se
  puede rechazar a alguien a mitad del embudo, y en el de plaza también a alguien que el agente ya
  descartó (esto último lo cierra la decisión 22). De ahí el título del bloque (decisión 12).
  Corregido dos veces: el 2026-09-24 (cambio del modelo por procesados) y el 2026-09-25 (fin del
  revelado).
- **D. El mapa del portal de `planning.md` está incompleto.** La razón del rechazo se ve también
  en la página Candidatos, que se alimenta del servicio de candidatos del backend. Ese servicio no
  es «el detalle del candidato» de la oferta: la ficha de la oferta lee la participación
  directamente de la oferta. Los textos existen en español y en inglés. Comprobado el 2026-09-24:
  el detalle de la oferta entrega cada participación entera (solo oculta los datos personales de
  los bloqueados), así que el campo nuevo llega a esa ficha sin tocar el endpoint. La página
  Candidatos arma su respuesta campo por campo, y ahí sí hay que añadirlo.
- **E. Las pruebas del backend viven en una carpeta `test/` dentro de cada módulo** desde el
  2026-09-24. La del desenlace de contratación está en la del módulo de ofertas, y la de la
  analítica en la de métricas. Las pruebas nuevas van ahí.
- **F. El desenlace no toca la facturación ni el estado del candidato**, a propósito: lo que se
  cobra ya se cobró al ocupar la plaza, al revelarlo o al procesarlo, y sigue cobrado termine como
  termine. Solo **lee** el modelo de cobro de la empresa, para saber si el candidato está
  desbloqueado. Lo decía, con un error, el comentario de encabezado del método; el paso 1b lo borra y
  esto queda aquí.
- **G. Una lista cerrada en el esquema es una trampa si se retira un valor.** Mongoose valida al
  guardar lo que se modificó; cuando se marca modificada la lista de participaciones, las valida
  todas, y eso lo hacen 33 sitios del código, el desenlace incluido. Un código que deja de estar en la
  lista impide guardar cualquier cambio de esa oferta que toque sus participaciones, que en la
  práctica son casi todos. Por eso retirar o renombrar un código de la decisión 2 está prohibido, no
  solo desaconsejado. El nulo y la ausencia del campo sí pasan (Mongoose 9.5, comprobado el
  2026-09-24).

## Fuera del alcance, a sabiendas

- **Los rechazos anteriores al paso 1d pueden contar en los dos bloques** (visto por el ejecutor en la
  opinión previa del paso 3). Antes de la decisión 22, Marta podía rechazar a alguien que el agente
  seguía procesando y que después descartó: cuenta en los descartes del agente por su código y en los
  rechazos finales como «sin causal». Corregirlo exige una migración, y la decisión 8 dice que no hay.
- **«Plazas abiertas» del panel sigue contando la plaza de Pedro como ocupada** aunque esté rechazado. Es
  el mismo caso que la plaza que no se libera, más abajo, visto desde la analítica.

- **Rechazar a quien ya terminó el proceso no libera su plaza** (visto por el ejecutor en la opinión
  previa del 1d; el usuario decide dejarlo el 2026-09-27). Pedro termina, ocupa la plaza y la oferta
  se cierra por llena; Marta lo rechaza tras la entrevista y la oferta sigue cerrada, sin que el
  agente traiga a nadie. Para seguir buscando, Marta reabre la oferta o amplía las plazas a mano.
  **Probablemente intencional**: en el cobro por plaza, la plaza de Pedro ya se cobró, y rellenarla
  sola cobraría otra vez sin que nadie lo pidiera; el comentario original del método del desenlace
  decía que rechazar no devuelve lo cobrado y que volver a llenar la plaza sería «una decisión
  aparte». No se sabe si se acordó con negocio. Si algún día se quiere cambiar, es un frente propio:
  toca el conteo de plazas, el cierre y la reapertura de la oferta, y la facturación.

- **La contratación no se toca.** Este frente trata de rechazos. Con el cambio de Henry, «Marcar como
  contratado» aparece en todos los candidatos, también a mitad del proceso o ya descartados por el
  agente, y contratar a alguien en proceso no detiene al agente. Se sabe y no es de este frente
  (usuario, 2026-09-27).


- **Corregir una decisión ya tomada** (decisión 10).
- **La causal en el detalle de cada oferta de la analítica** (decisión 12).
- **Hacer que el DTO valide de verdad**, incluido el tope de 1000 caracteres. Encender la
  validación global afecta a toda la API.
- **Elegir una oferta cancelada en el filtro de Ofertas** con el estado en «Todos» no la suma a
  las cifras: hay que elegir también el estado «Cancelada». Es el comportamiento actual de todo el
  panel, y el bloque nuevo lo hereda.
- **El aviso de la ventana de rechazo dice que el candidato «ya ocupa una plaza facturada»**, y
  eso no es cierto para uno revelado del grupo o añadido a mano. No es de este frente.

## Preguntas abiertas

**Para el equipo** (anotada el 2026-09-27, se pregunta el 2026-09-28):

1. **Cuando se rechaza a un candidato que ya terminó el proceso y ocupó la plaza, ¿el sistema debería
   volver a buscar a otro, aunque el cliente que paga por plaza pague de nuevo?** Hoy no lo hace (ver
   *Fuera del alcance*). Si la respuesta es **no**, el comportamiento actual es el correcto y se cierra.
   Si es **sí**, entra la fase 4 de *Pasos*, que **no cabe en las 3 jornadas**: se avisa a la dirección
   antes de empezarla.

## Pasos

Rama `feat/hiring-rejection-reason`, desde `develop`, en los dos repositorios.

| Paso | Qué | Repositorio | Estado |
| --- | --- | --- | --- |
| 1a | Mover la lista de motivos a su carpeta y sacar el desenlace a su servicio, sin cambiar nada | backend | Hecho: `7b141b9`, en `develop` por el PR #89 |
| 1b | Guardar la causal: lista, campo, validación, auditoría y la página Candidatos | backend | Hecho: `74f04b0`. Sin PR |
| 1c | Fusionar `develop` (fin del flujo de revelar, de Henry) en la rama | backend | Hecho: `f5f81dc`, revisado |
| 1d | No se rechaza a un descartado por el agente (decisión 22); rechazar a alguien en proceso detiene al agente (decisión 23); resto del DTO con «revelado» | backend | Hecho: `6082e1a`. Sin PR |
| 2 | Selector en la ventana de rechazo, detalle opcional, la causal en las dos fichas y en la auditoría, sin botón de rechazar para los descartados por el agente, etiqueta de `recruiter_rejected` | portal | Hecho: `7d8e67f`. Sin PR |
| 3 | Bloque «Motivos de rechazo final» en el panel global, y la exclusión de `recruiter_rejected` de las cifras del agente | backend y portal | Revisado y aprobado; pendiente de commit. Sin PR |
| Cierre | Traer `develop`, fusionar en `develop` los dos repositorios, pruebas a mano en el servidor de pruebas y paso a `main` (`brief-cierre-fusion-y-pruebas.md`) | los dos | Brief escrito; empieza tras el paso 3 |
| 4 | **Condicional**: rechazar a quien terminó el proceso libera su plaza y reabre la búsqueda | backend | Solo si el equipo responde que sí a la pregunta 1; fuera de las 3 jornadas |

## Registro de avance

- **2026-09-23** — Cerradas las decisiones 1 a 14 con el usuario. Sin brief escrito todavía.
- **2026-09-24** — Revisada la bitácora. Corregido *Antes de desplegar*: el orden «portal primero»
  no era seguro. `planning.md` y `requisitos.md` actualizados para apuntar aquí. Listo para el brief
  del paso 1.
- **2026-09-24** — Revisado lo que entró en `develop` (tope y cobro de candidatos procesados):
  corregido el punto C, añadido el E y la decisión 15, y *Antes de desplegar* cuenta con las
  pestañas que quedan abiertas.
- **2026-09-24** — Decisiones 16 a 19: carpeta de motivos, servicio propio del desenlace, el paso 1
  partido en 1a (mecánico) y 1b (la causal), y la regla del boy scout para lo mecánico. Escrito el
  brief del paso 1a.
- **2026-09-24** — Opinión previa del paso 1a contestada. **Pendiente para el paso 1b**: quitar el
  comentario de encabezado del método del desenlace, que el 1a mueve tal cual y que es falso (dice que
  no llama al servicio de planes, y lo llama); y pasar al inglés los nombres de la prueba del desenlace.
- **2026-09-24** — Paso 1a revisado y aprobado: método idéntico, renombre al 100 %, 152 suites y
  1.575 pruebas como la línea base, y arranque en local sin errores de dependencias. El ejecutor vio
  tres métodos privados sin uso —`computeViableCount` y `ensureTenantExists` en el servicio de
  ofertas, `normalizeName` en el orquestador— y no los tocó, porque la regla del boy scout cubre solo
  importaciones. Quedan para un inventario aparte, fuera de este frente.
- **2026-09-24** — Paso 1a commiteado (`7b141b9`) y fusionado en `develop` (PR #89). Después se
  fusionó `develop` en la rama (`9cb754a`): tres arreglos del frente de candidatos procesados (cobro
  persistido, estado de entrada recortado para el portal, hora del último mensaje en todas las etapas),
  ninguno en la zona de este frente. Verificado con la caché limpia: compila, **152 suites y 1.574
  pruebas (1.565 pasan, 9 omitidas)**. La prueba de menos es de ese frente, no de este: «a las demás
  etapas no se lleva nada» dejó de aplicar al generalizarse la hora del último mensaje. **Nueva línea
  base.**
- **2026-09-24** — Nada más entra en `develop` hasta terminar el frente (*Antes de desplegar*).
  Añadidos los puntos F y G. Escrito el brief del paso 1b.
- **2026-09-24** — Opinión previa del 1b contestada: decisión 20, punto G precisado. **Pendiente
  para el paso 2**: la pestaña de auditoría del portal muestra los valores del registro tal cual, así
  que la causal saldrá como código (`no_show`) y no como etiqueta.
- **2026-09-25** — Paso 1b revisado y aprobado. Compila; **153 suites y 1.590 pruebas (1.581 pasan,
  9 omitidas)**, con la caché limpia: 16 más que la línea base, de la prueba nueva del esquema (5), la
  de la página Candidatos (1) y la del desenlace, que pasa de 11 a 21 casos. La prueba del esquema
  vive en `src/offers/schemas/test/`, siguiendo la convención de una carpeta de pruebas por
  subcarpeta.
- **2026-09-25** — Paso 1c: fusión de `develop` (`f5f81dc`), con los commits de Henry que quitan el
  flujo de revelar y los de Elvis sobre cupo y mensajes. Revisada: frente a `develop` solo difieren
  los 9 archivos del 1b, y nuestras pruebas siguen enteras. Compila; **153 suites y 1.586 pruebas
  (1.577 pasan, 9 omitidas)** con la caché limpia = las 1.570 de `develop` más nuestras 16. Queda un
  resto para el 1d: la descripción del desenlace en el DTO todavía dice «revelado del pool». Añadidas
  las decisiones 21 y 22 y el punto de aceptación de la separación de descartes.
- **2026-09-27** — Decisiones 23 y 24: rechazar o contratar a alguien en proceso detiene al agente,
  y la analítica del agente separa por el código `recruiter_rejected`. Retirada la nota de avisar a
  Henry: el frente se integra a su cambio. **Alcance**: el 1d suma unas horas de backend; con lo
  gastado en el 1a, las 3 jornadas quedan sin margen.
- **2026-09-27** — Las decisiones 22 y 23 se recortan a solo el rechazo: la contratación sale del
  frente (*Fuera del alcance*). Escrito el brief del paso 1d, que sigue el precedente de la
  cancelación de oferta para detener al agente.
- **2026-09-27** — Opinión previa del 1d contestada: la despedida llega a todo el que el agente ya
  contactó, y la detención va en segundo plano con alerta a soporte. La plaza de quien terminó y es
  rechazado queda como está, probablemente intencional: pregunta 1 para el equipo y fase 4 condicional.
  Escritos por adelantado los briefs de los pasos 2 y 3 y `pruebas-a-mano.md`. **Pendiente del usuario**:
  si veta mostrar la etiqueta de la causal en la pestaña de auditoría (punto 7 del brief del paso 2).
- **2026-09-27** — Paso 1d revisado y aprobado. Compila; **155 suites y 1.603 pruebas (1.594 pasan,
  9 omitidas)** con la caché limpia (commit `6082e1a`): 17 más que la base, en dos archivos de prueba nuevos (orquestador y
  controlador) y la del desenlace. Decisiones del ejecutor aceptadas: el correo de alerta lo envía el
  orquestador, porque su envío es privado, y el método atrapa sus propios fallos; una cuarta señal de
  «ya contactado», el flujo de la etapa ya arrancado; y el texto de la despedida copiado de la
  cancelación, no extraído: **si cambia uno, hay que cambiar los dos**.
- **2026-09-27** — Opinión previa del paso 2 contestada. La pestaña de auditoría, que solo existe en
  modo de desarrollo, muestra para la causal el código y la etiqueta juntos (usuario). Las pruebas a
  mano pasan al servidor de pruebas.
- **2026-09-28** — Paso 2 revisado y aprobado, leyendo los archivos y con el `git diff` y la
  comprobación de tipos que corrió el usuario, porque la consola del planificador y la del ejecutor no
  respondían (el revisor de permisos del modo automático estaba caído). Tipos sin errores; la
  contratación, sin cambios; un rechazo antiguo se ve igual en las dos fichas. Decisión del ejecutor
  aceptada: quitar del comentario de la ventana la parte que decía que la observación era obligatoria.
- **2026-09-28** — Paso 2 commiteado (`7d8e67f`). `develop` avanzó en los dos repositorios, sin tocar la
  zona del frente; se trae en el cierre. Brief del paso 3 al día (línea base 155/1.603 y reutilizar las
  etiquetas del paso 2) y escrito el brief del cierre.
- **2026-09-28** — El usuario fusionó `develop` en las dos ramas: backend `61770a8` (hasta `17a10ee`) y
  portal `b351b3f`. Revisadas: frente al `develop` fusionado solo difieren los archivos del frente, en
  los dos. Portal: tipos sin errores. Backend: compila; **157 suites y 1.613 pruebas (1.604 pasan, 9
  omitidas)** con la caché limpia, **nueva línea base**. La despedida sigue siendo idéntica a la de la
  cancelación. `develop` del backend ya va cuatro commits por delante (facturación): se traen en el
  cierre. Opinión previa del paso 3 contestada; decisión 24 precisada.
- **2026-09-28** — Paso 3 revisado y aprobado. El criterio único vive en el servicio de métricas en dos
  funciones, `isAgentRejection` (por candidato) y `agentStageHistory` (por historial), y todas las
  cifras de la decisión 24 las usan. Backend: compila; **158 suites y 1.627 pruebas (1.618 pasan, 9
  omitidas)** con la caché limpia, 14 más en una prueba nueva. Portal: tipos sin errores. Nueve casos a
  mano del paso 3 en `pruebas-a-mano.md`. Decisiones del ejecutor aceptadas: el total del bloque va en
  una etiqueta junto al título, y «sin causal» viaja como causal nula, no como un código inventado.
  **Con esto están cubiertos los seis puntos de aceptación**; falta el cierre.

## Antes de desplegar

- 🔴 **Las pruebas a mano se corren en el servidor de pruebas**, con el frente entero fusionado en
  `develop` y antes de pasar a `main` (usuario, 2026-09-27). Con candidatos de números del equipo:
  ahí WhatsApp está encendido. Detalle en `pruebas-a-mano.md`.
- 🔴 **Nada del frente entra en `develop` hasta terminarlo** (decidido por el usuario el
  2026-09-24). `develop` va al servidor de pruebas y `main` a producción. El paso 1a ya entró (PR #89)
  porque no cambia comportamiento; del 1b en adelante, todo se commitea en la rama y se fusiona **junto
  con el portal**. Un 1b solo en `develop` rompe los rechazos del servidor de pruebas, y en `main`, los
  de producción.

- 🔴 **Backend y portal se despliegan a la vez, en la misma ventana. No hay orden seguro**
  (corregido el 2026-09-24):
  - **Backend primero**: el portal viejo manda rechazos sin causal y **todos fallan** (decisión 5).
  - **Portal primero**: el backend viejo sigue exigiendo el detalle, así que **los rechazos sin
    detalle fallan**; y los que llevan detalle se guardan **sin la causal que eligió el
    reclutador**, porque el backend viejo ignora el campo que no conoce (punto A). Ese segundo
    efecto no falla a la vista: esos rechazos quedan para siempre en el grupo «sin causal».

  El despliegue es de noche, pero **una pestaña del portal que quedó abierta sigue con el código
  viejo hasta que se recarga**: el portal no se renderiza en el servidor ni se recarga solo. Quien
  rechace desde esa pestaña recibe el error del backend, que el portal muestra tal cual en la
  ventana de rechazo; por eso ese mensaje le dice que recargue (decisión 15). Se asume.
  **No se relaja la decisión 5** para
  cubrir la ventana: un backend que acepte rechazos sin causal, aunque sea unos días, deja entrar
  justo los datos que esta tarea existe para evitar.
- **No hay migración**: los rechazos anteriores se quedan sin causal a propósito (decisión 8).
