# Brief · Paso 1d — el rechazo frente al agente

Para quien ejecuta este paso. **Toca el embudo**: cambia qué pasa con un candidato real cuando el
reclutador lo rechaza, incluidos mensajes de WhatsApp y el cupo de la oferta. Según
`../psicoalianza/arranque-del-ejecutor.md`, lleva **el tratamiento completo**: opinión previa, respuesta
punto por punto, y las rondas que hagan falta. Solo backend.

Antes de empezar, lee `../../CLAUDE.md`, el arranque del ejecutor y **`bitacora.md`**: sobre todo las
**decisiones 21 a 24**, el punto **C** y *Fuera del alcance*. `planning.md` es el mapa del código.

> Escrito el 2026-09-27 sobre `f5f81dc` (la rama con `develop` fusionado), leyendo el servicio del
> desenlace, el controlador, el camino con el que el orquestador saca a alguien del proceso
> (`markFailed`), la cancelación de oferta (`discardQueuedCandidatesOnCancel`), el envío de avisos al
> candidato y el precedente del controlador que llama al orquestador tras guardar.

## Rama y orden

`feat/hiring-rejection-reason`, encima de `f5f81dc`. Árbol limpio y al día con el remoto. **Su propio
commit. Sin PR a `develop`** (bitácora, *Antes de desplegar*).

## 🔴 El alcance: solo el rechazo

Este frente trata de rechazos. **La contratación no se toca** en nada: ni sus reglas, ni lo que pasa
después, aunque comparta método y botones con el rechazo (bitácora, *Fuera del alcance*). Si al
trabajar ves un defecto de la contratación, se menciona en el reporte y no se arregla.

## Qué le pasa a una persona

| Candidato | Hoy | Después de este paso |
| --- | --- | --- |
| **Ana**, descartada por el agente | Marta puede rechazarla, y Ana cuenta dos veces en la analítica | El backend no deja rechazarla (decisión 22) |
| **Luis**, a mitad del proceso | Marta lo rechaza y el agente le sigue escribiendo | Se guarda su causal, el agente lo saca del proceso, recibe la despedida y su cupo pasa al siguiente (decisión 23) |
| **Pedro**, que terminó el proceso | Se guarda el rechazo | Igual que hoy: solo se guarda |

## Qué se hace

### 1 · No se rechaza a quien el agente ya descartó (decisión 22)

En el servicio del desenlace, un rechazo sobre una participación cuyo estado es **descartado**
(`REJECTED`) o **`DISCARDED`** responde 400 con el mensaje «No se puede rechazar a un candidato que el
proceso ya descartó.». Es el mismo criterio de «terminado es terminado» que ya usa el orquestador para
los candidatos atascados. Va **después** de las comprobaciones que ya existen sobre la oferta y la
participación, y **no aplica a la contratación**, que sigue como hoy.

### 2 · El código nuevo de descarte

En la lista de motivos del embudo (`rejection-reason.enum.ts`), un valor nuevo:
`RECRUITER_REJECTED = 'recruiter_rejected'`. Es un código guardado para siempre: no se renombra (punto
G). **Sin comentario**: su porqué está en la bitácora. Su texto en el portal y su exclusión de la
analítica del agente son de los pasos 2 y 3; aquí solo nace.

### 3 · El orquestador saca a Luis del proceso (decisión 23)

Un método público nuevo en el orquestador, `stopAfterRecruiterRejection(offerId, candidateId)`, que
**sigue el precedente de la cancelación de oferta**, que ya distingue entre quien está en conversación y
quien no:

| La participación | Qué hace |
| --- | --- |
| Ya terminó el proceso (etapa completada) | Nada |
| En proceso y **el agente ya le escribió en esta oferta**: su conversación está viva, o su historial tiene alguna etapa conversacional, o está «listo para agendar» | Le envía **la misma despedida** que la cancelación, con el mismo texto, la misma plantilla y la misma elección entre texto libre y plantilla según la ventana (`sendCandidateUpdate`); después la saca con `markFailed` y el código nuevo |
| En proceso y **el agente nunca le escribió** (por ejemplo, en la cola sin haber sido contactado) | La saca con `markFailed` y el código nuevo, **sin mensaje**: no se le escribe por primera vez para despedirlo |

El criterio no es el de «conversación viva» de la cancelación: ese deja sin aviso a quien espera turno
para una etapa posterior, a quien está «listo para agendar» y a quien se le dijo que retomaríamos su
proceso, y los tres quedarían esperando un mensaje que no llega (opinión previa, punto 2).

`markFailed` ya hace el resto: estado descartado, flujo detenido, enlace de agenda anulado, cierre si la
oferta se agotó y cupo liberado para el siguiente. **No se reescribe ni se duplica**: se llama.

Como en la cancelación, **si el mensaje falla, se descarta igual**, y el fallo queda en el log. Si no hay
teléfono, no hay mensaje y se descarta igual.

### 4 · Quién llama a qué

**El controlador**, como en el precedente de «subir el tope despierta la cola»: primero el servicio del
desenlace valida y guarda el rechazo; **después**, solo si el desenlace es rechazo, el controlador llama
a `stopAfterRecruiterRejection`. El orden importa por lo mismo que en la cancelación: `markFailed`
vuelve a leer la oferta, y así no pisa lo que guardó el desenlace.

La llamada va **en segundo plano**, como en el precedente: `markFailed` termina bombeando la cola, y eso
puede invitar al siguiente candidato a la prueba psicométrica —con PsicoAlianza, incluso renovar la
sesión con Chrome, que tarda minutos— dentro de la petición de Marta. Esperarla dejaría su ventana
colgada o cortada por tiempo sobre un rechazo que sí se guardó. **Si falla**, error en el log con la
oferta y el candidato **y un correo de alerta a soporte con `sendAlertEmail`**, el mecanismo que ya
existe: esa persona puede seguir recibiendo mensajes y no hay botón para reintentar. Se asume que la
ficha, recargada al instante, puede mostrar a Luis en proceso unos segundos.

El servicio del desenlace **no** recibe el orquestador: queda como está, sin dependencias nuevas.

### 5 · El resto de «revelado» en el DTO

La descripción del desenlace en el DTO todavía dice «revelado del pool». Se deja como la del
controlador tras la fusión: en el cobro por plaza, cualquiera; en el cobro por procesado, el procesado o
el añadido a mano.

## 🔴 Dónde se para — qué NO se hace

- **Nada de la contratación.** Ni bloquearla sobre descartados, ni detener al agente al contratar.
- **Nada del portal ni de la analítica.** El texto del código nuevo y su exclusión de las cifras del agente
  son de los pasos 2 y 3.
- **No se reescribe `markFailed`** ni el envío de avisos: se reutilizan tal cual.
- **No se toca la cancelación de oferta**, aunque sea el precedente. Si ves que conviene extraer algo
  común, dilo en la opinión previa; no se hace de paso.
- **Boy scout** (decisión 19): solo importaciones sin usar en los archivos tocados.
- **Sin comentarios** en el código, **sin lint ni formateador**, **sin PR a `develop`**.

## Opinión previa del ejecutor (2026-09-27), verificada e incorporada

El cuerpo del brief ya está corregido; esta tabla es el registro.

| Punto | Decidido |
| --- | --- |
| 1 · Dónde está Pedro | Tras reservar, su etapa queda completada y su estado VIABLE: `stopAfterRecruiterRejection` no le hace nada. Quien tiene enlace sin reservar recibe la despedida y pierde el enlace, y es lo correcto |
| 2 · El criterio de «conversación viva» no mide «ya le escribimos» | **Aceptado el criterio amplio**: se despide a todo el que el agente ya contactó en esta oferta (conversación viva, etapa conversacional en el historial o «listo para agendar») |
| 3 · Esperar la llamada puede colgar la ventana de Marta | **Aceptado**: en segundo plano, con error en el log y correo de alerta a soporte |
| 4 · Rechazar a Pedro no libera su plaza | **Fuera del paso 1d.** Se lleva al usuario; mientras tanto, nada cambia en este paso |
| 5 · A diferencia de la cancelación, `markFailed` en los dos casos | Correcto: aquí sí se quiere bombear la cola |
| 6 · La despedida con `sendCandidateUpdate`, no con la de solo texto libre | Correcto |
| 7 · La regla 22 va después de «ya tiene una decisión registrada» | Correcto |
| 8 · El código nuevo no obliga a tocar nada más; hasta el paso 3 cae en «otros» | Correcto: nada se despliega antes |
| 9 · Ningún defecto nuevo en la contratación | Anotado |
| 10 · El 1c fue la fusión | Correcto; no falta ningún commit |

**Se puede empezar.**

## Pruebas

En la carpeta de pruebas de cada sitio (punto E). Prosa del caso en los `it`.

**Servicio del desenlace** (prueba existente, identificadores en inglés):

1. Rechazar a un candidato con estado descartado: 400 con el mensaje exacto, sin guardar ni auditar.
2. Lo mismo con `DISCARDED`.
3. **Contratar a un candidato descartado por el agente sigue funcionando como hoy.** Es la prueba de
   que la contratación no se tocó.

**Orquestador** (`stopAfterRecruiterRejection`), montado como las pruebas vecinas de la cancelación o
del retiro:

4. En proceso con conversación viva: se envía la despedida y se llama a `markFailed` con
   `recruiter_rejected`.
5. En proceso sin conversación viva pero ya contactado —en cola para una etapa posterior, y «listo
   para agendar»—: también se envía la despedida.
5b. En proceso y nunca contactado: no se envía nada y se llama a `markFailed` con el código nuevo.
6. Ya terminó el proceso: no hace nada.
7. Falla el envío de la despedida: se descarta igual.
8. Sin teléfono: no hay mensaje y se descarta igual.

**Controlador:**

9. Un rechazo llama a `stopAfterRecruiterRejection` después de guardar; una contratación no lo llama.
10. Si el orquestador falla, la respuesta sigue siendo la del rechazo guardado, queda un error en el
    log y se envía el correo de alerta.

**Control negativo** en cada archivo de pruebas tocado.

## Verificación

`npx jest --clearCache`, `npm run build` y `npm test`, una vez sobre el conjunto. **Línea base** tras la
fusión (`f5f81dc`): **153 suites y 1.586 pruebas (1.577 pasan, 9 omitidas)**. Da el número final y de
dónde sale la diferencia. **Arranque del backend en local.**

🔴 No correr `npm run lint`.

## Lo que necesito que confirmes en la opinión previa, contra el código

- **Dónde está Pedro.** El caso central de la tarea es el rechazo después de la entrevista. Confirma en
  qué etapa y con qué estado queda alguien que ya agendó o tuvo su entrevista: si su etapa **no** está
  completada, `stopAfterRecruiterRejection` lo trataría como «en proceso», le enviaría la despedida y
  le anularía el enlace de agenda. Dime si eso pasa y si tiene sentido, antes de empezar.
- **El criterio de «conversación viva»**: que el de la cancelación sirve tal cual para un solo candidato.
- **El orden y el fallo del punto 4.**

## Qué entregar

1. Qué cambió y qué se verificó, con el resultado real y el número de pruebas.
2. **Confirmación de que la contratación no cambió**: ningún cambio en su camino, con la prueba 3 como
   evidencia.
3. Los mensajes nuevos, copiados del código.
4. La lista de identificadores nuevos de los archivos tocados, mirada abriendo cada archivo.
5. **Qué decisiones tomaste que no estaban en el brief.**
6. Archivos nuevos en el índice, e índice y árbol coincidiendo.
7. Un mensaje de commit para el backend.
