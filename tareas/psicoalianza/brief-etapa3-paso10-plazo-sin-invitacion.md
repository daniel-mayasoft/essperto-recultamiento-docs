# Brief · Etapa 3, paso 10 — quien no recibe la invitación se sigue reintentando, con aviso; y el plazo cuenta desde la invitación

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 55, en su revisión del 2026-09-17**, que es lo vigente: la primera versión de esa decisión
(pasar sin puntaje) quedó sustituida y **no se implementa**. Toca solo el backend: el arranque de la
etapa psicométrica, el cron de resultados y el estado de la conversación.

> Escrito el 2026-09-17 leyendo: en el orquestador, el arranque de la etapa y su rama de fallo
> pasajero (aviso único al candidato, *esperando resultado externo* sin identificador, guardado con
> reintento); el bucle por candidato del cron (el reintento de quien no tiene identificador, que va
> antes del vencimiento y termina la iteración; el cálculo del límite de plazo por oferta; el
> vencimiento, que mide desde la entrada a la etapa); el guardado con reintento, que ante un conflicto
> recarga la oferta y **copia solo la participación**; la novedad por candidato del fallo técnico de
> ReTHUS y el ayudante de novedades; el correo de alerta a soporte (`sendSupportAlert`, buzón
> `ALERT_SUPPORT_EMAILS`); `whatsapp-window.ts`; y el archivo de pruebas del cron por el puerto, cuyo
> constructor pone la entrada a la etapa hace un minuto.

## Rama

~~**`feat/integrate-psicoanalisis-provider`**, la de la integración, en el backend. Se revisa entera antes
de desplegar.~~ **Corregido el 2026-09-18: la integración ya está en producción** (desplegada el
2026-09-17; `before-deploy.md` §5). Este paso va en **una rama nueva del backend que sale de `develop`**,
`feat/psychometric-followups`, y se despliega aparte cuando esté revisado. El portal no se toca.

⚠️ **Ahora es un cambio sobre producción con gente dentro**: el 2026-09-17 había 71 personas esperando
resultado en la etapa, todas ya invitadas, así que a ninguna le cambia nada al desplegar (su plazo sigue
contando desde la entrada, trampa 5). Pero cualquier fallo pasajero de EvaluaTest después del despliegue
entra por este código.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md`.
2. `../CLAUDE.md` y `../../esscoti-backend/CLAUDE.md` si existe.
3. `integrate-psicoalianza.md` — decisiones **36** (el plazo no se detiene), **39** (el rescate de quien
   no tiene identificador), **40** (la empresa sin conexión), **45** (el plazo viaja en la invitación),
   **54** (la sesión muerta dispara la renovación) y **55 entera, con su revisión del 2026-09-17**.
4. `flujo-actual-etapa-psicometrica.md` — §2 (el arranque y *Si el arranque falla*), §4, §6 y §8.
5. En el backend: el arranque de la etapa psicométrica, el bucle del cron psicométrico, el guardado
   con reintento, el esquema del estado de la conversación, el ayudante de novedades y la novedad
   `compliance_technical_failure`, `sendSupportAlert` y sus usos en el orquestador.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio.

⚠️ **Este brief se escribió leyendo el código de la rama de la integración, y la rama nueva sale de
`develop`**, que además trae commits de otras personas posteriores: entre ellos, un arreglo del 2026-09-19
al despacho de antecedentes que toca **el guardado con reintento ante conflicto de versión** (PR #84),
justo la zona de la trampa 1. **La opinión previa tiene que confirmar que lo que este brief da por leído
sigue igual en `develop`**: el bucle del cron, el fallo pasajero del arranque, el guardado con reintento y
el ayudante de novedades. Si algo se movió, decirlo antes de empezar.

## El caso

**Ana** contesta la última pregunta a las 10:00. La invitación a la prueba falla porque la sesión de
PsicoAlianza de Medicall está muerta, y recibe «⏳ Estamos preparando tu prueba psicométrica…». Queda
esperando sin identificador, y el cron reintenta a las 10:05, 10:10, 10:15…

- **A las 10:20**, con la invitación todavía fallando, **soporte recibe un correo**: Medicall ·
  PsicoAlianza, no se puede enviar la invitación, con el error. Y **Marta**, la reclutadora, ve junto a
  Ana un icono de advertencia: «**Prueba psicométrica pendiente** — Problema técnico con el proveedor de
  la prueba. Seguimos intentándolo.»
- **A las 10:40, Pedro**, de otra oferta de Medicall, cumple sus 20 minutos sin invitación. Marta ve
  su novedad; **soporte no recibe otro correo**: el de Medicall · PsicoAlianza está en silencio hasta
  las 14:20.
- **A las 14:25**, si sigue fallando, soporte recibe un segundo correo con el número de personas de
  Medicall afectadas por PsicoAlianza.
- **Al día siguiente a las 9:00** soporte arregla la sesión. A las 9:05 la invitación de Ana sale: le
  llega su enlace con «dispones de 2 días a partir de este momento», **su novedad desaparece**, y **su
  plazo cuenta desde las 9:05**. Hoy contaría desde las 10:00 del día anterior, y el cron la descartaría
  por vencimiento antes de lo prometido.

**Ana no pasa de etapa en ningún momento** y no se le escribe nada nuevo. Le pasa igual a una persona
de **EvaluaTest** cuyo registro falla por algo pasajero: **cambio de comportamiento en producción para
EvaluaTest, aceptado** (55).

## Alcance exacto

### 1 · Guardar cuándo falló por primera vez y cuándo se invitó

En el estado de la conversación de la participación, dos datos nuevos, nulos por defecto:

| Dato | Se escribe | Se borra |
| --- | --- | --- |
| **Primer fallo de la invitación** | En el **fallo pasajero** del arranque, **solo si está vacío** | Cuando la invitación sale |
| **Hora de la invitación** | Cuando la invitación sale, en el mismo guardado que el identificador | — |

Solo el **fallo pasajero** cuenta: *sin conexión* (pasa la etapa, 40), *falta un dato* (descarta, 33 y
45) y el **fallo permanente** (39) siguen como hoy y no escriben el primer fallo. **La demo no escribe
ninguno de los dos**: su resolución sintética y «avanzar ya» siguen midiendo desde la entrada a la etapa.

### 2 · El plazo cuenta desde la invitación

En el vencimiento del cron, la fecha de partida es **la hora de la invitación**; **si no la hay**, la
entrada a la etapa, como hoy. El límite de plazo de la oferta se calcula igual que hoy. Nada más cambia
en el vencimiento: su mensaje, su motivo de descarte y cuándo se aplica.

**Al retomar a un candidato aparcado que ya tiene identificador, la hora de invitación se reinicia
igual que la entrada a la etapa** (añadido el 2026-09-20; era la pregunta 5b, respondida en el código:
el retomar reinicia la entrada a propósito para que un aparcado varios días no caduque al volver). Si
no, contaría desde la invitación vieja y vencería en la pasada siguiente.

### 3 · A los 20 minutos del primer fallo: aviso a soporte y novedad para el reclutador

En **cada fallo pasajero** del arranque, después de guardar, si han pasado **20 minutos o más** desde el
primer fallo de esa persona:

- **La novedad por candidato**, si no la tiene ya: con el ayudante de novedades, código propio por
  candidato (el patrón de `compliance_technical_failure:<candidato>`), tipo *advertencia*, con el
  identificador del candidato y **este texto, aprobado por el usuario**:

  | Campo | Texto |
  | --- | --- |
  | Título | Prueba psicométrica pendiente |
  | Mensaje | Problema técnico con el proveedor de la prueba. Seguimos intentándolo. |

- **El aviso a soporte**, por `sendSupportAlert`, **como mucho uno por empresa y proveedor cada 4
  horas**. Lleva la empresa (nombre e identificador), el proveedor —o *sin resolver* si lo que falló fue
  resolverlo—, la oferta y el candidato que lo dispararon, el mensaje del error y **el número de personas
  de esa empresa y ese proveedor que esperan sin invitación desde hace 20 minutos o más**. Sin
  credenciales, cookies ni correos de candidatos.

Se hace en el arranque y no en el cron para que valga **por cualquier puerta** por la que se reintente.

Dónde vive el silencio de 4 horas lo propone el ejecutor en la opinión previa. **Se acepta en memoria**
del backend, con su consecuencia: tras un reinicio puede salir un correo de más. Si el número de
personas afectadas es caro de calcular, el ejecutor lo dice y propone la alternativa.

### 4 · La novedad se quita sola

La novedad de *prueba psicométrica pendiente* **se quita en cuanto el arranque termina de cualquier forma
que no sea un fallo pasajero**: la invitación sale, la empresa resulta sin conexión y la etapa se
aprueba, falta un dato y se descarta, o el fallo es permanente y se descarta. Con cualquiera de esos
desenlaces el «Seguimos intentándolo» dejaría de ser cierto.

### 5 · Nada al candidato, y el reintento sigue

No se le escribe nada a la persona: han pasado minutos u horas desde su último mensaje y la ventana de
24 horas de WhatsApp puede estar cerrada; Meta acepta el texto libre y lo descarta en silencio
(`whatsapp-window.ts`). El aviso único del fallo pasajero de hoy no cambia. **El reintento no tiene fin**
mientras la oferta no se cancele, como hoy.

## Los casos, persona por persona

| # | Quién | Qué pasa | Soporte | Marta |
| --- | --- | --- | --- | --- |
| 1 | Ana, PsicoAlianza, la invitación falla a las 10:00 y sigue fallando | Espera y se reintenta | Correo a las ~10:20 | Novedad a las ~10:20 |
| 2 | Igual, pero la invitación sale a las 10:05 (sesión recuperada) | Invitada; plazo desde las 10:05 | Nada | Nada |
| 3 | Pedro, misma empresa y proveedor, cumple 20 minutos a las 10:40 | Espera | **Nada** (silencio hasta las 14:20) | Su novedad |
| 4 | Sigue fallando a las 14:25 | Espera | Segundo correo, con el número de afectados | Las novedades siguen |
| 5 | Otra empresa, o la misma con EvaluaTest, falla a la vez | Espera | **Su propio correo**: el silencio es por empresa y proveedor | Su novedad |
| 6 | La invitación de Ana sale al día siguiente | Invitada; su novedad desaparece; plazo desde ese momento | Nada | Ya no ve la novedad |
| 7 | Ana invitada al día siguiente, no presenta la prueba | Descarte por vencimiento **2 días después de la invitación** | Nada | El descarte de siempre |
| 8 | Persona invitada **antes** de este cambio | Plazo desde la entrada a la etapa, como hoy | Nada | Lo de hoy |
| 9 | Persona de EvaluaTest cuyo registro falla por red | Igual que Ana | Correo por empresa · EvaluaTest | Novedad |
| 10 | Falla resolver el proveedor (la base no responde) | Igual que Ana | Correo con proveedor *sin resolver* | Novedad |
| 11 | La empresa se queda sin conexión mientras Ana espera | El reintento aprueba la etapa (40) | Nada | La novedad desaparece |
| 12 | Tras reintentos, el fallo pasa a ser permanente | Descarte con *arranque fallido* (39) | La alerta de siempre del fallo permanente | La novedad desaparece; el descarte de siempre |
| 13 | Empresa en demo con la prueba simulada | Como hoy: nunca falla | — | — |
| 14 | El backend se reinicia a las 11:00 con Medicall en silencio | Espera | Puede salir **un** correo de más | Lo mismo |
| 15 | La oferta se cancela mientras Ana espera | El cron ya no la mira | Nada nuevo | — |
| 16 | Vacante de EvaluaTest **sin código de evaluación** (error de configuración; cuenta como pasajero a propósito, 39) | Se reintenta sin fin hasta que alguien arregle la vacante | Un correo cada 4 horas mientras dure: es lo deseado, insiste | Novedad «problema técnico con el proveedor» |
| 17 | Tres Anas atascadas en una oferta de **una plaza** | Esperan. Quien está en la etapa psicométrica **cuenta para el cupo de la etapa de preguntas** (tres por plaza, comprobado el 2026-09-18): **no entra nadie más a las preguntas** en esa oferta hasta que salga una invitación o Marta descarte a alguien a mano. La captación de hojas de vida y la compatibilidad siguen; lo que se para es la entrada a las preguntas por WhatsApp | Los correos de arriba | Tres novedades |
| 18 | **El correo de Ana pertenece en PsicoAlianza a otra cédula** (la consulta previa por su documento dio *desconocido*, se invitó con nuestro correo, y PsicoAlianza respondió 400 «ya fue tomado por otro usuario», `psicoalianza-api.md`). Comprobado el 2026-09-18: el cliente convierte cualquier respuesta que no sea 2xx en un error genérico, y el adaptador lo deja subir como **pasajero** | Se reintenta sin fin, aunque no se arregla solo: hace falta corregir el correo de Ana o el de la otra persona en PsicoAlianza | Un correo cada 4 horas, con el mensaje «PsicoAlianza respondió 400…», que es lo que permite reconocerlo | Novedad «problema técnico con el proveedor». **No es de este paso** distinguir ese 400 como permanente: queda anotado en la bitácora para un paso aparte |

**Medido en producción el 2026-09-17: cero personas esperando sin invitación.** Al desplegar no sale
ningún correo de golpe.

## 🔴 Dónde se para — qué NO se hace

- **No se pasa a nadie de etapa por no recibir la invitación.** La primera versión de la 55 no se
  implementa.
- **No se escribe a la persona.**
- **No se toca**: el reintento (salvo lo que escribe y dispara), los fallos permanentes, *sin conexión*,
  *falta un dato*, el veredicto, el mensaje ni el motivo del vencimiento, la demo, la renovación de la
  sesión de PsicoAlianza ni su correo a desarrolladores.
- **No se cambia el cupo** de la etapa: quien espera sigue ocupándolo, y con ello bloquea la entrada a
  las preguntas de esa oferta (caso 17). Aceptado en la decisión 55; Marta lo libera descartando a mano.
- **No se arreglan** los mensajes de texto libre fuera de la ventana que ya existen (vencimiento,
  «Gracias por completar», resultados): no son de este frente.
- **No se arregla** el mismo hueco de guardado en la novedad de ReTHUS (trampa 1).

## 🔴 Las trampas

**1. El guardado con reintento pierde lo que no es la participación.** Ante un conflicto de versión,
recarga la oferta y copia **solo la participación**. Las novedades viven en la oferta: si ese guardado
choca con otro —un webhook de WhatsApp de otro candidato de la misma oferta—, poner o quitar la novedad
se pierde en silencio. **La novedad tiene que quedar puesta o quitada aunque haya conflicto.** Cómo, lo
propone el ejecutor **en la opinión previa, con la propuesta concreta**: es lo difícil de este paso. La
que el planificador aceptaría de entrada: poner y quitar la novedad con una escritura atómica sobre la
oferta por su identificador, fuera del guardado versionado, para que un choque no la alcance.

**2. El primer fallo solo se escribe si está vacío.** Si se pisara en cada fallo, los 20 minutos no
llegarían nunca.

**3. El primer fallo se borra al invitar.** Si no, una persona invitada hoy que años después se reinicia
con la caja de pruebas de WhatsApp dispararía el aviso al primer fallo.

**4. El silencio es por empresa y proveedor, no por oferta ni por persona.** Una sesión muerta tumba
todas las ofertas de esa empresa con ese proveedor a la vez: por eso la clave no puede ser la oferta.

**5. Quien ya estaba invitado no tiene hora de invitación.** El vencimiento tiene que caer a la entrada a
la etapa, no a *sin fecha*: sin fecha, hoy no se descarta a nadie, y esas personas esperarían para
siempre.

**5b. El retomar y la hora de invitación.** Retomar a un candidato que ya tiene identificador no reinvita:
solo lo devuelve a *esperando resultado externo*. Su hora de invitación vieja se quedaría y el plazo
contaría desde ella, con lo que podría vencer en la pasada siguiente. ~~Pregunta para la opinión previa~~
**Resuelto el 2026-09-20 y llevado al alcance 2**: el retomar reinicia la entrada a la etapa a propósito,
y la hora de invitación se reinicia con ella. Con su prueba.

**6. Las pruebas existentes no deberían cambiar.** El constructor del archivo de pruebas del cron pone la
entrada a la etapa hace un minuto, así que nada llega a 20 minutos ni vence; y la prueba de vencimiento
existente no tiene hora de invitación, así que cae a la entrada. Si alguna afirmación existente cambia,
decirlo.

**7. `sendSupportAlert` sin destinatarios no falla**: registra que falta `ALERT_SUPPORT_EMAILS` y sigue.
Si en el servidor de pruebas no está configurado, los casos a mano de soporte no se ven: comprobarlo antes.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| El reintento, el veredicto y el mensaje y motivo del vencimiento | Es el embudo de producción |
| El aviso único del fallo pasajero al candidato | Aprobado el 2026-09-16 |
| El guardado con reintento y la cola | Recién revisados contra cobros dobles |
| La demo y «avanzar ya» | Miden desde la entrada a la etapa |
| Compilación y pruebas en verde | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Sin lint ni formateador, **sin comentarios nuevos en código**,
identificadores en inglés —también los parámetros de las funciones flecha y los de los `spec`—. La
solución más pequeña. Sin commitear y todo al índice. Finales de línea de cada archivo.

**Documentación en el mismo diff:**

- `flujo-actual-etapa-psicometrica.md` — §2 *Si el arranque falla*: quitar que la persona espera «sin
  plazo hasta el paso A1/A5» y contar el reintento con aviso a los 20 minutos, la novedad y cuándo se
  quita; §4 punto 2: el vencimiento desde la invitación; §6: los dos datos nuevos del estado de la
  conversación; §8: la novedad nueva en lo que ve el reclutador.
- `pruebas-a-mano.md` — una sección del paso 10 con la tabla de abajo.
- `before-deploy.md` — nada, salvo que el ejecutor encuentre que `ALERT_SUPPORT_EMAILS` no está en los
  compose: entonces **una fila nueva**, sin tocar las del despliegue.

## Pruebas

**Backend, automáticas:**

- **Primer fallo y hora de invitación**: el fallo pasajero escribe el primer fallo si está vacío y no lo
  pisa si ya está; *sin conexión*, *falta un dato* y el fallo permanente no lo escriben; la invitación
  que sale escribe su hora y borra el primer fallo; la demo no escribe ninguno.
- **Vencimiento**: con hora de invitación, cuenta desde ella (invitada hace 1 día con entrada hace 3 y
  plazo 2 → **no** vence); sin ella, desde la entrada, como hoy.
- **A los 20 minutos**: con el primer fallo hace 19 minutos → ni correo ni novedad; hace 20 → correo y
  novedad con su código, tipo, título, mensaje y candidato; la novedad no se duplica en el fallo
  siguiente.
- **Silencio**: dos personas de la misma empresa y proveedor → un solo correo; otra empresa, u otro
  proveedor → su propio correo; pasadas 4 horas → otro correo con el número de afectados.
- **La novedad se quita** al invitar, al aprobar por *sin conexión*, al descartar por *falta un dato* y al
  fallo permanente.
- **Trampa 1**: la novedad queda puesta, y quitada, aunque el guardado choque; si no se puede montar,
  decirlo.
- **Nada al candidato**: en ningún caso nuevo se manda un mensaje.

⚠️ Control negativo en la de los 20 minutos, la del silencio, la del vencimiento desde la invitación y la
de la trampa 1: invertir, ver que fallan, restaurar y limpiar la caché.

**Casos a mano**, los corre el usuario en el **servidor de pruebas** con la rama. 🔴 **Ninguno puede
llegar a PsicoAlianza ni conseguir una sesión.** Se preparan así, y se deshacen en el orden indicado:

1. En el `.env` del backend de pruebas: **la sesión manual encendida** (así la renovación no hace nada)
   y **`PSICOALIANZA_BASE_URL` apuntando a una dirección que no responde** (así cada invitación falla por
   red sin salir del servidor). Comprobar `ALERT_SUPPORT_EMAILS` (trampa 7). Reiniciar el backend.
2. Correr los casos.
3. 🔴 **Antes de devolver el `.env` a su estado**: cancelar las ofertas de prueba o quitar sus
   participaciones. Si no, la primera pasada con la dirección real **invitaría de verdad**.

**Y antes de desplegar en producción**, repetir la consulta de «esperando resultado externo sin
identificador» (el 2026-09-17 dio cero de 71). Quien salga ahí recibirá la novedad y el correo a soporte
20 minutos después de su primer fallo posterior al despliegue: no es un problema, pero conviene saberlo
para no confundirlo con un fallo nuevo.

| # | Cómo se prepara | Qué se hace | Qué se tiene que ver |
| --- | --- | --- | --- |
| 1 | Una oferta de PsicoAlianza en una empresa de pruebas; un candidato de prueba que contesta las preguntas en el simulador | Esperar 25 minutos | En el simulador, solo el aviso de siempre; en el log, fallos por red cada 5 minutos; **un** correo a soporte hacia los 20 minutos; en la tabla, el icono y la novedad «Prueba psicométrica pendiente» |
| 2 | Otro candidato en otra oferta de PsicoAlianza de **la misma empresa** | Esperar 25 minutos | Su novedad; **ningún correo nuevo** a soporte |
| 3 | La participación del caso 1 | En la base, poner su primer fallo hace más de 4 horas y esperar la pasada, o esperar 4 horas | Un segundo correo con el número de personas afectadas |
| 4 | El candidato del caso 1 | En la base, quitar la conexión de PsicoAlianza de la empresa (guardando antes una copia) y esperar la pasada | La etapa se aprueba; **la novedad desaparece** |
| 5 | Una participación ya invitada, en la base: hora de invitación hace 1 día, entrada a la etapa hace 3, plazo 2 | Esperar la pasada | **No** se descarta |

## Verificación

Backend: `npm run build` y `npm test`, una vez sobre el conjunto, con la caché de Jest limpia.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief** — dónde vive el silencio de 4 horas, cómo
   se cuenta el número de afectados y cómo se resolvió la trampa 1.
4. **Confirmación** de que nadie pasa de etapa por no recibir la invitación, de que no se escribe al
   candidato y de que el reintento, el veredicto y la demo no cambiaron.
5. **El texto del correo a soporte** tal como quedó.
6. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos, **y la lista de los
   identificadores nuevos**, parámetros de funciones flecha y de `spec` incluidos.
7. **Los documentos actualizados.**
8. **Un mensaje de commit** por repositorio.

## Ejecución y revisión (2026-09-20)

⚠️ **Escrito por el planificador a petición del usuario, sin opinión previa ni revisión de otra persona.**
Los casos a mano son la única comprobación aparte de las pruebas automáticas.

**Verificado con la caché de Jest limpia sobre `feat/psychometric-followups`: backend, compila, 136 suites y
1.411 pruebas (1.402 pasan, 9 omitidas).** Una suite nueva (la utilidad del aviso) y 27 pruebas nuevas
entre el arranque, el cron, la cola, el esquema y la utilidad. **Control negativo** invirtiendo a la vez
las cuatro reglas del brief —los 20 minutos, el silencio, el vencimiento desde la invitación y la
escritura atómica de la novedad—: **11 fallos**; restaurado sin diferencias fuera del índice. Ninguna
afirmación existente cambió; los dos montajes que alcanzan el arranque real ganan dobles nuevos
(`offerModel.updateOne`, `ses.sendSupportAlert`, `notifications`, `unmarkModified`, el silenciador).

**Lo comprobado en `develop` antes de empezar:** lo que `develop` trae respecto a la rama de la integración
en el orquestador es un solo cambio (PR #84, 42 líneas): el despacho de antecedentes guarda con reintento y
marca solo su participación. No toca el guardado con reintento, el cron psicométrico, el arranque ni las
novedades. `ALERT_SUPPORT_EMAILS` está en los dos compose: `before-deploy.md` no cambia.

**Decisiones tomadas fuera del brief:**

| Qué | Decidido | Por qué |
| --- | --- | --- |
| **Trampa 1** | La novedad se pone y se quita con dos `updateOne` atómicos sobre la oferta por su identificador (`$pull` del código y, si se pone, `$push`); la copia en memoria de la oferta se actualiza a mano y se **desmarca** como modificada, para que ningún `save` posterior la reescriba con una foto vieja | Es la propuesta que el brief aceptaba de entrada. Los `updateOne` no tocan la versión del documento, así que no chocan con el guardado versionado |
| **El número de afectados** | Se cuenta **por empresa**, no por empresa y proveedor: quien no fue invitado no tiene proveedor guardado. El correo lo dice así | Averiguar el proveedor de cada oferta exigiría leer la conexión congelada de cada una; no compensa para un número orientativo |
| **El silencio de 4 horas** | En memoria, en un objeto propio (`PsychometricInviteAlertSilencer`) con clave empresa + proveedor | Lo que el brief aceptaba; tras un reinicio puede salir un correo de más (caso 14) |
| **El fallo permanente** | La novedad se quita **antes** de dejar salir la excepción | Si se quitara después, no se quitaría nunca |
| **Caso a mano 3** | Cambiado: poner el primer fallo hace 4 horas en la base **no basta** para forzar el segundo correo, porque el silencio no está en la base. Se reinicia el backend | Consecuencia del silencio en memoria |
| **Caso a mano 6, nuevo** | Una persona invitada sin hora de invitación (las 71 de producción) sigue venciendo desde la entrada | Es la trampa 5, y merece verse |

**Identificadores nuevos**, todos en inglés: `psychometricInvitedAt`, `psychometricInviteFirstFailedAt`
(esquema); `PSYCHOMETRIC_INVITE_ALERT_AFTER_MS`, `PSYCHOMETRIC_INVITE_ALERT_SILENCE_MS`,
`PSYCHOMETRIC_INVITE_PENDING_NOTIFICATION_PREFIX`, `PSYCHOMETRIC_INVITE_PENDING_TITLE`,
`PSYCHOMETRIC_INVITE_PENDING_MESSAGE`, `psychometricInvitePendingCode`, `isInviteAlertDue`,
`PsychometricInviteAlertSilencer` con `shouldSend` y `lastSentAt` (utilidad); `psychometricInviteAlerts`,
`setPsychometricInvitePendingNotification`, `alertPsychometricInvitePending`,
`countPsychometricInvitesPending`, y dentro `current`, `hasNotification`, `notification`, `others`,
`existing`, `providerLabel`, `affected`, `alertErr`, `threshold`, `rows` (orquestador); en los `spec`:
`updateOffer`, `sendSupportAlert`, `flowState`, `notifications`, `twentyOneMinutesAgo`,
`nineteenMinutesAgo`, `flowStateOf`, `pendingCode`, `transientInvite`, `pendingNotification`,
`firstFailedAt`, `buildError`, `alert`, `body`, `build`, `invitedAt`, `oldInvitedAt`, `entry`, `silencer`,
`first`, `now`. Sin comentarios nuevos en código; los textos del correo y de la novedad, en el código, como
los de ReTHUS.

**El correo a soporte, tal como quedó.** Asunto: `[Essperto] Invitación psicométrica pendiente — <empresa>
· <proveedor>`. Cuerpo: «No se puede enviar la invitación a la prueba psicométrica.», empresa con su
identificador, proveedor, oferta con su identificador, candidato (solo el identificador), el error, el
número de personas de la empresa esperando desde hace 20 minutos o más, y la frase de que el sistema sigue
reintentando y de que el aviso no se repite en 4 horas para esa empresa y proveedor.

**Confirmaciones:** nadie pasa de etapa por no recibir la invitación (el reintento del cron no cambió); no
se escribe al candidato en ningún caso nuevo; el veredicto, el vencimiento (salvo la fecha de partida), la
demo y la escritura de la cola no cambiaron; la novedad de ReTHUS no se tocó.

**Pendiente:** los casos a mano en el servidor de pruebas, que corre el usuario; y, antes de desplegar en
producción, la consulta de «esperando sin invitación».

## Revisión del diff (2026-09-20, por el planificador del despliegue)

Como el código lo escribió un planificador sin opinión previa, esta es la única revisión independiente.
Verificado con la caché de Jest limpia sobre el índice de `feat/psychometric-followups`: **compila, 136
suites y 1.411 pruebas (1.402 pasan, 9 omitidas)**, lo mismo que consta arriba. Índice y árbol coinciden,
nada sin rastrear, ningún merge. La única línea quitada en un spec existente es del montaje (admite un
estado inicial), no una afirmación. Sin comentarios nuevos en código; los que hay son de `spec`.
**Control negativo propio** sobre la regla que toca a EvaluaTest en producción —el vencimiento desde la
invitación, invirtiendo la preferencia entre las dos fechas—: dos pruebas del cron fallan; restaurado y
caché limpia. Comprobado además que el cron y el guardado con reintento recargan la oferta entera, sin
proyección, así que la comprobación en memoria de «¿ya tiene la novedad?» ve lo que hay en la base.

**Aprobado.** Una menudencia y una anotación:

- **Menudencia, opcional:** el silenciador marca la hora **antes** de enviar el correo. Si el envío falla
  (SES caído), el fallo se registra pero el silencio de 4 horas corre igual y ese aviso se pierde hasta la
  siguiente ventana. Marcar después del envío lo evitaría; dentro de una pasada los fallos se procesan en
  serie, así que no habría doble envío. No bloquea: con `ALERT_SUPPORT_EMAILS` vacía la alerta no lanza.
- **Anotación:** que `unmarkModified('notifications')` deje la copia en memoria sin que un `save`
  posterior pise lo escrito por `updateOne` **solo lo comprueban los casos a mano** (los `spec` lo
  simulan con un doble). El caso 4 —la novedad desaparece al aprobar por *sin conexión*, que guarda la
  oferta después— es el que lo demuestra.

### Antes de commitear: el aviso sale del orquestador (decidido por el usuario el 2026-09-20)

**Para el ejecutor.** El diff está aprobado en lo que hace; lo que cambia es **dónde vive**. Las tres
funciones privadas que el diff añade al orquestador —poner o quitar la novedad, avisar a soporte y contar
a los afectados— son una sola pieza con sus propias dependencias, y el orquestador ya es el archivo más
grande del proyecto. Se mueven a un servicio propio. Es un paso **mecánico**: mismo comportamiento, mismas
pruebas, sin opinión previa; si al hacerlo aparece algo que no cuadra, se dice antes de seguir.

**Cómo queda:**

| Qué | Dónde |
| --- | --- |
| Un servicio inyectable `PsychometricInviteAlertService`, en `src/offers/pipeline/`, junto a los demás servicios del embudo | Absorbe la utilidad `psychometric-invite-alert.util.ts` entera —constantes, textos, la regla de los 20 minutos y el silenciador— y las tres funciones del orquestador. Sus dependencias: el modelo de ofertas, el modelo de empresas y el correo. El silenciador pasa a ser un campo suyo. Nombres de las operaciones públicas, en inglés, los elige el ejecutor; la semántica es la del alcance 3 y 4 |
| El orquestador | Se queda con **las escrituras de las dos fechas** en la participación (son estado del flujo que él guarda) y con **cinco llamadas de una línea** al servicio: quitar la novedad en las cuatro salidas que no son fallo pasajero, y en el fallo pasajero «si toca, pon la novedad y avisa». La regla de «si toca» (los 20 minutos) puede quedar dentro del servicio, recibiendo el primer fallo |
| El módulo de ofertas | Declara el proveedor nuevo |
| Los `spec` | Las pruebas de las tres funciones y del silenciador pasan al spec del servicio, con sus tres dobles. Los dos montajes que alcanzan el arranque real (`psychometric-start-through-port` y `demo-mode-evaluatest-mock`) cambian los dobles sueltos de `updateOne`, `sendSupportAlert` y `unmarkModified` por un doble del servicio, y afirman **que se le llama** en cada salida con el valor que toca. Ninguna afirmación de comportamiento se pierde: cambia de archivo |

**Lo que no cambia:** ningún texto, ninguna regla, ningún nombre de campo persistido, la utilidad se
puede borrar solo si el servicio la absorbe entera (nada más la importa hoy; comprobado el 2026-09-20).
**Y de paso, la menudencia de arriba**: el silenciador marca la hora **después** de que el correo salga,
no antes; con su prueba (el envío falla → la siguiente llamada vuelve a intentar enviar).

**Verificación:** `npm run build` y `npm test` con la caché limpia, una vez sobre el conjunto. Lo esperado:
las mismas 1.411 pruebas o más, ninguna menos salvo las que se fusionen al mover; si el número baja, decir
cuáles y por qué. Control negativo en la del silenciador tras el envío fallido.

**Qué entregar:** el mismo reporte corto de siempre, más la lista de lo que quedó en el orquestador
(tiene que ser las dos fechas y cinco llamadas), los nombres de las operaciones del servicio, y el
mensaje de commit del backend actualizado. Los documentos no cambian, salvo el flujo si nombra dónde
vive el aviso.

### Hecho: el aviso sale del orquestador (2026-09-20, por el planificador)

Mecánico, sin opinión previa; nada dejó de cuadrar. **Verificado con la caché limpia: compila, 136
suites y 1.418 pruebas (1.409 pasan, 9 omitidas)**, siete más que antes: las cinco de la utilidad y las
del contenido de la novedad, del correo y del silenciador se fusionan en el spec del servicio (15), y el
spec del arranque queda con 13, ninguna afirmación de comportamiento perdida —cambian de archivo—. Control
negativo del silenciador: marcando la hora antes de enviar, la prueba del envío fallido cae. Todo en el
índice; la utilidad borrada (nadie la importaba).

| Qué | Dónde quedó |
| --- | --- |
| **`PsychometricInviteAlertService`** (`src/offers/pipeline/psychometric-invite-alert.service.ts`) | Constantes y textos, `psychometricInvitePendingCode`, `isInviteAlertDue`, el silenciador (`PsychometricInviteAlertSilencer`, ahora con `isSilenced` y `markSent`, campo del servicio) y las tres funciones. Dependencias: modelo de ofertas, modelo de empresas y correo. Declarado en el módulo de ofertas |
| Operaciones públicas | `clearPending(offer, entry)`: quita la novedad si la tiene. `reportFailureIfDue(offer, entry, { provider, errorMessage })`: si el primer fallo de la participación lleva 20 minutos o más, pone la novedad y avisa a soporte; la regla de los 20 minutos vive dentro |
| **En el orquestador** | Las dos fechas: la hora de invitación y el primer fallo en el arranque, el reinicio de la hora al retomar, y el cron leyendo la hora de invitación para el vencimiento. Y cinco llamadas: `clearPending` en la invitación que sale, en *sin conexión*, en *falta un dato* y en el fallo permanente; `reportFailureIfDue` en el fallo pasajero, después del guardado |
| **El silenciador** | Marca la hora **después** de que el correo salga: si SES falla, la siguiente llamada vuelve a intentar |
| Los `spec` | Los dos montajes del arranque sustituyen los dobles sueltos por un doble del servicio y afirman que se le llama en cada salida con el valor que toca, más una prueba de orden (la novedad se quita después del guardado que escribe el identificador) |
