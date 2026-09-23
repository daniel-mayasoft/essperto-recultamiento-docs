# Brief · Etapa 3, paso 9 — el resultado psicométrico en el detalle del candidato

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 58** (qué se guarda, dónde se ve, por qué el texto de PsicoAlianza va tal cual y qué se
descartó). Lo medido del tablero —cómo se calcula el índice, dónde está el peso de cada prueba, qué
dicen los veredictos— está en `psicoalianza-api.md`, sección del tablero de participantes. Toca el
adaptador de PsicoAlianza, el veredicto del cron psicométrico, el esquema de la oferta y el portal.

> Escrito el 2026-09-16 leyendo: la traducción del tablero en el adaptador de PsicoAlianza y sus
> tipos; el bloque del veredicto del cron psicométrico en el orquestador (puntaje contra mínimo,
> pruebas adicionales de EvaluaTest, aprobar y descartar); cómo aprobar reinicia o vacía el estado de
> la conversación; el guardado con reintento de la participación (copia la entrada entera al
> reintentar); la escritura dirigida de la cola, que solo toca cuatro rutas; el esquema de la
> participación y sus campos permanentes; la ficha de la oferta que se sirve al portal (solo sustituye
> los datos de la persona en los bloqueados); y en el portal, el botón del ojo de la tabla de
> candidatos, el modal de detalle, el bloque de ReTHUS y el modelo de la participación.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md`.
2. `../../CLAUDE.md`, `../../../../esscoti-backend/CLAUDE.md` y `../../../../esscoti-frontend/CLAUDE.md` si existe.
3. `integrate-psicoalianza.md` — decisiones **15** (la bolsa del proveedor y cómo se empalma), **37**
   (puntaje ausente leído como cero), **48** (el cron pregunta por el proveedor del candidato) y
   **58**; en *Lo que la lista de herencia no tenía*, el punto *Quién decide el aprobado*.
4. `flujo-actual-etapa-psicometrica.md` — §3, §4, §5, §6, §7 y §8.
5. `psicoalianza-api.md` — el tablero de participantes, con los catálogos y las mediciones del
   2026-09-16.
6. En el backend: el adaptador de PsicoAlianza (la traducción de una fila del tablero) y sus tipos;
   el adaptador de EvaluaTest (los resultados de pruebas adicionales); en el orquestador, el
   veredicto del cron psicométrico, aprobar, descartar, el guardado con reintento y la escritura de
   la cola; el esquema de la participación en la oferta. En el portal: la ficha de la oferta, la
   tabla de candidatos con el botón del ojo, el panel de detalle del candidato, el bloque de ReTHUS,
   el modelo de la participación y los archivos de textos.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio.

## El caso

**Laura** termina las cuatro pruebas de su vacante de PsicoAlianza. El cron ve su índice, 77,3,
contra el mínimo de la oferta, 70, y la aprueba; pasa a la siguiente etapa. **Marta**, la
reclutadora, abre la oferta, pulsa el ojo de Laura y ve:

> **Prueba psicométrica** · PsicoAlianza · 16 sep 2026, 16:25
> **Puntaje 77,3** · mínimo de la oferta 70 · **Aprobó**
>
> | Prueba | Peso | Nota | Resultado |
> | --- | --- | --- | --- |
> | Ethikos | 25 % | 90,29 | Recomendado |
> | IQ Factorial | 40 % | 84 | Alto |
> | Ten DISC Plus | 20 % | 71,57 | Recomendado con sugerencias |
> | V&P Test | 15 % | 45,55 | Recomendado con sugerencias |

Y lo sigue viendo cuando Laura está agendando la entrevista, y cuando ya ocupa la plaza. Hoy no vería
nada: el puntaje se borra al avanzar. **Daniel** sacó 69,5 con mínimo 70: ve lo mismo con «No aprobó»,
además del motivo del descarte de siempre.

**Nada decide distinto.** El veredicto es el de hoy; este paso solo lo guarda en un sitio que no se
borra y lo enseña.

## Alcance exacto

### 1 · Adaptador de PsicoAlianza: el peso de cada prueba

Al traducir una fila del tablero, cada prueba de la bolsa del proveedor gana **su peso en la vacante**:
el `porcentaje` de la entrada de `prueba.procesos_pruebas[]` **cuyo `proceso_id` es el de la propia
agenda**. Se acepta número o texto con un número (medido como número; ver la opinión previa, punto 3).
Si no hay tal entrada o no trae número, el peso va **nulo**. Nada más cambia en la
traducción: ni el estado, ni el puntaje, ni cuándo se da por terminada. Los tipos del tablero ganan lo
que haga falta para leerlo.

### 2 · Esquema: el resultado psicométrico, campo permanente de la participación

Un campo nuevo en la participación de la oferta, **al nivel de la fecha de la entrevista y de los
documentos enviados, no dentro del estado de la conversación**, nulo por defecto. Semántica, no
nombres —los nombres los elige el ejecutor, en inglés, reusando los del proyecto (`psychometric…`)—:

| Dato | Qué es |
| --- | --- |
| Proveedor | `psicoalianza` o `evaluatest`, el guardado en el candidato |
| Puntaje | El que decidió el veredicto |
| Mínimo | El mínimo de la oferta **aplicado en ese veredicto** (con su valor por defecto si la oferta no lo tenía) |
| Aprobó | El resultado del veredicto entero: puntaje y, con EvaluaTest, pruebas adicionales |
| Fecha | Cuándo se dio el veredicto |
| Pruebas | Lista, posiblemente vacía. Cada una: nombre y, según el proveedor, **peso, nota y texto del resultado** (PsicoAlianza) o **aprobada sí o no, tal como la leyó el veredicto** (pruebas adicionales de EvaluaTest: *sin dato* se guarda como no aprobada; ver la opinión previa, punto 1). Lo que un proveedor no da, nulo |

### 3 · El veredicto del cron escribe el resultado

En el bloque del veredicto, **solo cuando el estado es *terminado***, después de decidir si aprueba
(puntaje y pruebas adicionales) y **antes** de escribirle al candidato y de aprobar o descartar, se
escribe el resultado en la participación **sustituyendo el anterior si lo hubiera**:

- **PsicoAlianza**: las pruebas salen de la bolsa **de esta consulta** (la que acaba de devolver el
  adaptador), con peso, nota y el texto `estado_recomendacion` tal cual.
- **EvaluaTest**: las pruebas adicionales, **solo si se consultaron en esta pasada** (hoy solo se
  consultan si el puntaje pasó); si no, la lista va vacía.
- **Demo simulada**: el puntaje sintético, lista vacía.

Aprobar y descartar ya guardan la participación entera: no hace falta un guardado propio. No se
escribe resultado en ningún otro desenlace: vencimiento, descarte del proveedor, *en progreso*, *no
aparece*, *no se pudo consultar*, reintento de la invitación.

### 4 · La ficha de la oferta lo sirve

La ficha de la oferta que lee el portal ya copia cada participación entera y solo sustituye los datos
de la persona en los candidatos bloqueados. **Comprobar** que el campo nuevo llega sin tocar nada; si
alguna proyección o transformación lo quitara, añadirlo ahí y decirlo en el reporte.

### 5 · Portal: el bloque en el detalle del candidato

El modelo de la participación gana el campo. En el panel de detalle del candidato —el que abre el ojo
de la tabla—, un bloque **junto al de ReTHUS y con su misma forma** (borde, título en versalita), que
**solo aparece si hay resultado**:

- **Encabezado**: *Prueba psicométrica*, el nombre del proveedor, la fecha; debajo, *Puntaje*, *mínimo
  de la oferta* y *Aprobó* o *No aprobó*. Este es **el único** aprobado o no aprobado del bloque; puede
  llevar el color de éxito o error, como el chip de ReTHUS.
- **PsicoAlianza, con pruebas**: una tabla pequeña con *Prueba*, *Peso*, *Nota*, *Resultado*. Peso con
  «%»; nota con los decimales que traiga, en el formato numérico del idioma; resultado **como texto
  plano, tal cual llega, sin color ni icono**. Un dato nulo se muestra como «—».
- **EvaluaTest, con pruebas adicionales**: una lista con el nombre y *Aprobada* o *No aprobada*.
- **Sin pruebas**: solo el encabezado.

Sin condición de visibilidad propia: el bloque hereda la del modal.

### 6 · Textos

En el archivo de textos del portal, en el grupo del detalle del candidato, en español y en inglés.
**Propuestos, pendientes de aprobación del usuario** (los textos que ve un reclutador los aprueba él):

| Uso | Español | Inglés |
| --- | --- | --- |
| Título | Prueba psicométrica | Psychometric test |
| Puntaje | Puntaje | Score |
| Mínimo | mínimo de la oferta | offer minimum |
| Aprobó | Aprobó | Passed |
| No aprobó | No aprobó | Did not pass |
| Columnas | Prueba · Peso · Nota · Resultado | Test · Weight · Score · Result |
| Prueba adicional | Aprobada · No aprobada | Passed · Not passed |

Los nombres de proveedor no se traducen. El texto de resultado de PsicoAlianza **no pasa por el archivo
de textos**: es dato.

## Los casos, persona por persona

| # | Quién | Qué pasa | Qué ve Marta en el detalle |
| --- | --- | --- | --- |
| 1 | Laura, PsicoAlianza, aprueba | Resultado escrito; pasa de etapa y el estado de la conversación se reinicia | El bloque con «Aprobó» y la tabla de cuatro pruebas, **en cualquier etapa posterior** |
| 2 | Daniel, PsicoAlianza, 69,5 contra 70 | Resultado escrito; descartado | El bloque con «No aprobó» y su prueba; el motivo de siempre en la tabla |
| 3 | Una persona de EvaluaTest con dos pruebas adicionales, aprueba | Resultado con las dos adicionales aprobadas | Encabezado y la lista de adicionales |
| 4 | EvaluaTest, puntaje bajo | Las adicionales no se consultan | Encabezado con «No aprobó», sin lista |
| 5 | EvaluaTest, puntaje alto y una adicional no aprobada | Resultado con la lista | «No aprobó» y la adicional en *No aprobada* |
| 6 | Presentando todavía, o calificando (los ~25 minutos medidos) | Nada escrito | Sin bloque |
| 7 | Venció el plazo | Nada escrito | Sin bloque; el motivo de vencimiento de siempre |
| 8 | EvaluaTest la descartó por su cuenta | Nada escrito | Sin bloque |
| 9 | Etapa omitida (sin conexión o sin prueba) | Nada escrito | Sin bloque |
| 10 | Evaluada antes de este paso | Nada escrito | Sin bloque |
| 11 | Empresa demo con la prueba simulada | Puntaje sintético, sin pruebas | Encabezado con EvaluaTest y el puntaje |
| 12 | Se le reinicia el proceso con la caja de pruebas de WhatsApp | El resultado anterior se queda | El anterior, hasta que un veredicto nuevo lo sustituya |
| 13 | Una prueba de PsicoAlianza sin peso en el tablero | Peso nulo | «—» en su celda |
| 14 | Candidato sin desbloquear | — | El ojo no aparece para él (hoy ya es así); nada que ver |
| 15 | Aprobó y la oferta se canceló después | Resultado escrito; la cancelación lo descarta | «Aprobó» en el bloque y el descarte por cancelación en la tabla: los dos son ciertos |
| 16 | EvaluaTest, falla la consulta de pruebas adicionales | Nada escrito; sigue esperando | Sin bloque hasta la pasada siguiente que las consiga |

## 🔴 Dónde se para — qué NO se hace

- **No cambia el veredicto**: ni la regla, ni el mínimo por defecto, ni los mensajes al candidato, ni
  los motivos de descarte, ni cuándo se da por terminada una persona.
- **No se interpreta el resultado de PsicoAlianza**: ni por número, ni con colores, ni traducido.
- **No se rellenan** candidatos evaluados antes de este paso, ni desde el motivo del descarte.
- **No se toca la escritura dirigida de la cola** para incluir el campo: la cola no lo mueve.
- **No se añade columna** a la tabla de candidatos ni se cambia qué candidatos muestran el ojo.
- **No se toca** la bolsa del proveedor salvo el peso, ni la lógica de pruebas adicionales de EvaluaTest.
- **No se añade filtrado** de la ficha de la oferta para candidatos bloqueados (ver trampa 6).

## 🔴 Las trampas

**1. El estado de la conversación no sirve de almacén.** Aprobar hacia una etapa conversacional lo
reemplaza por uno nuevo; aprobar hacia *completado* o *listo para agendar* lo pone en nulo. Por eso el
resultado va en la participación. Si se escribiera dentro, las pruebas del caso 1 pasarían mirando el
objeto en memoria antes de aprobar, y fallaría en la base.

**2. Un campo que el esquema no declara se pierde en silencio.** Mongoose descarta al guardar lo que el
esquema de la participación no tiene. Las pruebas del orquestador usan dobles sin esquema, así que
**pasarían igual**. Hace falta una prueba que atraviese el esquema real —crear un documento de oferta
con el modelo y comprobar que el campo sobrevive a convertirlo en objeto— o, si no se puede montar, decirlo.

**3. Se escribe antes de aprobar o descartar, en el mismo objeto de la participación que ellos
guardan.** El guardado con reintento copia la entrada entera cuando hay conflicto, así que el campo
viaja. Escribirlo después de aprobar obligaría a un guardado propio y abriría una carrera con la cola.

**4. El peso es de la vacante de la agenda, no de la prueba.** La misma prueba tiene pesos distintos en
vacantes distintas, y `procesos_pruebas[]` es una lista: se elige por `proceso_id`, nunca la primera. No
se normaliza ni se recalcula el índice.

**5. Las pruebas de PsicoAlianza salen de la consulta de esta pasada**, no de la bolsa ya empalmada en
el candidato: esa bolsa acumula, y un reintento o un cambio de vacante dejaría pruebas viejas.

**6. El dato ya viaja hoy para todos.** La ficha de la oferta sirve cada participación entera,
bloqueados incluidos, y hoy ya lleva el puntaje y la bolsa dentro del estado de la conversación. El
campo nuevo no añade exposición nueva; filtrarlo es otro cambio y no va aquí.

**7. El nulo del puntaje.** Hoy un puntaje ausente se lee como cero (decisión 37) y con PsicoAlianza el
adaptador no da *terminado* sin índice. El resultado guarda **el mismo número que usó el veredicto**:
no se corrige aquí la 37.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| El veredicto, los mensajes y los motivos | Es el embudo; este paso solo observa |
| La bolsa del proveedor y su empalme (15), salvo el peso | La lee el cron |
| La escritura dirigida de la cola | Recién arreglada contra cobros dobles |
| El modal de detalle, salvo el bloque nuevo | Lo usan todos los reclutadores |
| Compilación y pruebas en verde; tipos limpios en el portal | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Sin lint ni formateador, **sin comentarios nuevos en código**,
identificadores en inglés —también los parámetros de las funciones flecha y los de los `spec`—,
textos del usuario en los archivos de textos. La solución más pequeña. Sin commitear y todo al índice.
Finales de línea de cada archivo.

**Documentación en el mismo diff:**

- `flujo-actual-etapa-psicometrica.md` — §5: el veredicto escribe el resultado; §6: el campo permanente
  y quién lo lee (el portal); §8: lo que ve el reclutador, y quitar de *Lo que no ve* lo que deja de
  ser cierto; §3 si se describe la bolsa: el peso.
- `pruebas-a-mano.md` — una sección nueva del paso 9 con la tabla de abajo.
- `before-deploy.md` — nada, salvo que aparezca algo: el campo es aditivo y nace nulo.

## Pruebas

**Backend, automáticas:**

- **Adaptador**: el peso se lee de la entrada de `procesos_pruebas` con el `proceso_id` de la agenda,
  aunque haya otra entrada antes con otro proceso; sin entrada o sin número, nulo. ⚠️ La prueba
  existente que compara la bolsa entera **se amplía con el peso, no se relaja**.
- **Veredicto** (en el spec del cron por el puerto):
  - PsicoAlianza aprueba → resultado con proveedor, puntaje, mínimo, *aprobó*, fecha y las pruebas con
    peso, nota y texto; **y sigue en la participación después de aprobar**, con el estado de la
    conversación ya reiniciado o nulo. 🔴 **Esta prueba usa el aprobar real** y simula solo lo que lo
    rodea (la cola, el plan de la empresa, el cierre de la oferta): con el aprobar simulado del archivo
    de pruebas del cron no mordería (opinión previa, punto 2).
  - PsicoAlianza descarta por puntaje → *no aprobó*.
  - EvaluaTest con adicionales consultadas → la lista con aprobada o no; EvaluaTest con puntaje bajo →
    lista vacía.
  - *En progreso*, *no aparece*, *no se pudo consultar* y vencimiento → **no** se escribe resultado.
  - Un segundo veredicto sustituye al primero.
  - Demo simulada → puntaje sintético, lista vacía.
- **Esquema**: la trampa 2.

⚠️ Control negativo en la de «sigue después de aprobar» y en la del esquema; borrarlos y limpiar la
caché.

**Portal: casos a mano.** Los corre el usuario en el servidor de pruebas con la rama entera. Los
estados se preparan **escribiendo el campo en la base** en la participación de un candidato
desbloqueado; solo el último usa un veredicto real. El reporte los deja escritos en
`pruebas-a-mano.md` con esta numeración.

| # | Cómo se prepara | Qué se hace | Qué se tiene que ver |
| --- | --- | --- | --- |
| 1 | Resultado de PsicoAlianza con cuatro pruebas (pesos 25, 40, 20, 15), *aprobó* | Abrir el ojo | Encabezado con «Aprobó» y la tabla con los cuatro textos tal cual, sin colores en la columna *Resultado* |
| 2 | Igual, *no aprobó* | Abrir el ojo | «No aprobó» con su color |
| 3 | Una prueba con peso nulo | Abrir el ojo | «—» en esa celda |
| 4 | Resultado de EvaluaTest con dos adicionales, una no aprobada | Abrir el ojo | Encabezado y la lista con *Aprobada* y *No aprobada*; sin tabla de pesos |
| 5 | Resultado sin pruebas | Abrir el ojo | Solo el encabezado |
| 6 | Candidato sin el campo | Abrir el ojo | Sin bloque; el resto del modal como siempre |
| 7 | Portal en inglés, con el caso 1 | Abrir el ojo | Textos en inglés; los resultados de PsicoAlianza siguen en español (son dato) |
| 8 | Veredicto real: un candidato de una oferta de PsicoAlianza que termina su prueba | Esperar el veredicto del cron y abrir el ojo | El bloque con el índice del tablero, el mínimo y cada prueba; **si aprueba, seguir viéndolo** con el candidato en la etapa siguiente |

## Verificación

Backend: `npm run build` y `npm test`, una vez sobre el conjunto, con la caché de Jest limpia. Portal:
`npm run typecheck`.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief** — en particular los nombres del campo y
   de sus datos, y cómo se probó la trampa 2.
4. **Confirmación** de que el veredicto, los mensajes y los motivos no cambiaron, y de que la escritura
   de la cola no se tocó.
5. **Los textos tal como quedaron**, en los dos idiomas.
6. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos, **y la lista de
   los identificadores nuevos**, parámetros de funciones flecha y de `spec` incluidos.
7. **Los documentos actualizados.**
8. **Un mensaje de commit** por repositorio.

## Opinión previa del ejecutor (2026-09-16), verificada e incorporada

Verificado por el planificador en el código antes de contestar.

0. **El repositorio de documentación tenía sin commitear la decisión 58, las mediciones del tablero y
   este brief.** Cierto. Se commitea antes de empezar, para no mezclar los dos cambios.
1. **Las pruebas adicionales de EvaluaTest tienen tres valores**: aprobada, no aprobada y sin dato (no
   encontrada, o con un texto que no se puede interpretar); el veredicto trata *sin dato* como no
   aprobada. Cierto. **Decidido: se guarda como lo leyó el veredicto**, así que *sin dato* se ve como
   *No aprobada*. Motivo: con «No aprobó» en el encabezado siempre hay una fila que lo explica. Alcance
   2 corregido.
2. **La prueba de «sigue después de aprobar» no mordería** con el aprobar simulado del archivo de
   pruebas del cron. Cierto. **Aceptado**: esa prueba usa el aprobar real y simula lo de alrededor,
   como ya hacen otras pruebas del proyecto. Anotado en *Pruebas*.
3. **El formato del peso no estaba medido.** En el tablero del 2026-09-16 **el peso llega como número**
   (`25`, `40`, `20`, `15`) y la nota también (`90.29`); solo el índice llega como texto. **Aceptado
   igualmente**: se admite número o texto con un número y lo demás queda nulo, la misma tolerancia que
   el adaptador ya aplica al índice. La nota se convierte al armar el resultado, sin tocar lo que el
   cron ya guarda. Alcance 1 corregido.

**Decisiones menores, aceptadas:**

- **Fecha y números en el idioma del portal**, no en el del navegador (cierto que el detalle usa hoy el
  del navegador). Solo para el bloque nuevo; el resto del modal no se toca.
- **Tabla o lista según el proveedor guardado en el resultado**, no según los datos de cada prueba.
- **Oferta cancelada después de aprobar** y **fallo al consultar las pruebas adicionales**: añadidos
  como casos 15 y 16.

Se puede empezar en cuanto la documentación esté commiteada. ⚠️ **Los textos del alcance 6 siguen
pendientes de aprobación del usuario**: el backend puede empezar; el portal, con los textos que el
brief propone, y si el usuario los cambia se sustituyen.

## Revisión del diff (2026-09-16) — ✅ aprobado sin arreglos

Verificado por el planificador sobre el conjunto, con la caché de Jest limpia: **backend, compila, 133
suites y 1.372 pruebas (1.363 pasan, 9 omitidas)**, 24 pruebas y una suite más que antes del paso;
**portal, tipos limpios**. Todo en el índice en los tres repositorios, sin nada fuera.

**Control negativo del planificador**: quitando la escritura del resultado en el veredicto y la
declaración del campo en el esquema, **fallan 12 pruebas** del cron y del esquema; restaurado después,
sin diferencias fuera del índice.

**Lo comprobado en el código:**

- El veredicto escribe el resultado después de decidir y antes del mensaje y de aprobar o descartar; no
  se toca ninguna rama del veredicto, ni los mensajes, ni los motivos, ni la escritura de la cola.
- Las pruebas de PsicoAlianza salen de la consulta de la pasada; las adicionales de EvaluaTest, solo si
  se consultaron, con *sin dato* como no aprobada; el proveedor, el del candidato (la demo queda en
  EvaluaTest).
- El peso se elige por el proceso de la agenda, admite número o texto con número, y nulo en lo demás.
- La prueba de «sigue después de aprobar» usa el aprobar real hacia una etapa conversacional y hacia el
  final; la del esquema crea documentos con el esquema real (trampa 2).
- **Ninguna afirmación existente se quitó ni se relajó**: la comparación entera de la bolsa del
  adaptador se amplió con el peso.
- Sin comentarios nuevos en código, identificadores en inglés, textos del portal en los dos idiomas con
  los del brief; el nombre del proveedor reutiliza el texto que ya existe en *Mi compañía*.
- Documentación en el mismo diff: flujo actual §5, §6 y §8, y la sección del paso 9 en
  `pruebas-a-mano.md`.

**Anotado, sin acción:** el adaptador y el armado del resultado tienen cada uno su conversión «número o
texto con número» casi idéntica. Son seis líneas en dos capas distintas; no compensa una pieza compartida.

**Pendiente:** los casos a mano del paso 9, que corre el usuario en el servidor de pruebas con la rama
entera, y la aprobación de los textos del alcance 6 (ya escritos como los propuso el brief).
