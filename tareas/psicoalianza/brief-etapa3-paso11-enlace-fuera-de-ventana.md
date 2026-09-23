# Brief · Etapa 3, paso 11 — el enlace de la prueba cuando la ventana de WhatsApp está cerrada

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 59**, que es lo decidido para este paso, y en la **55 (revisión del 2026-09-17)** con el paso
10, que este paso completa. Toca solo el backend: el arranque de la etapa psicométrica, el reenvío del
botón «Continuar proceso», el vencimiento del cron y el estado de la conversación.

> Escrito el 2026-09-20 leyendo: en el orquestador, el arranque de la etapa (la composición del mensaje
> con el enlace, que depende del enlace, del proveedor resuelto, del correo de registro y del plazo), el
> enrutado del botón «Continuar proceso» (guarda la hora del mensaje entrante y llama al reenvío del paso
> pendiente), el reenvío de la etapa psicométrica (para quien ya tiene identificador solo vuelve a
> *esperando resultado externo*), el envío de la plantilla de recordatorio con botón y su «qué se espera»
> por etapa, el vencimiento del cron tal como lo dejó el paso 10, `whatsapp-window.ts`, el esquema de
> entorno (las plantillas y sus variables) y los dos compose (`WHATSAPP_REMINDER_TEMPLATE` está
> sobreescrita en producción y en pruebas).

## Rama

**`feat/psychometric-followups`**, la misma del paso 10, encima de su commit. Los dos se prueban a mano y
se despliegan juntos: el 10 sin el 11 deja como final esperado un mensaje que no llega (59). El portal no
se toca.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md`.
2. `../../CLAUDE.md` y `../../../../esscoti-backend/CLAUDE.md`.
3. `integrate-psicoalianza.md` — decisiones **49** (el mensaje por proveedor), **55 con su revisión** y
   **59**; en la tabla de *Dónde va la etapa 3*, las filas **10 y 11**.
4. `flujo-actual-etapa-psicometrica.md` — §2 entero y §4.
5. `brief-etapa3-paso10-plazo-sin-invitacion.md` — alcance 1 y 2 (los dos datos y el vencimiento), su
   *Ejecución y revisión* y la sección *Antes de commitear* (dónde quedó cada cosa).
6. En el backend: el arranque de la etapa (la rama que invita y manda el mensaje), el enrutado del botón
   y el reenvío de la etapa psicométrica, el envío de la plantilla de recordatorio y el «qué se espera»
   por etapa, `whatsapp-window.ts`, el vencimiento del cron, el esquema del estado de la conversación.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. **El paso 10 está commiteado**
en la rama; compruébalo.

## El caso

**Ana** contesta la última pregunta el lunes a las 10:00. La sesión de PsicoAlianza está muerta; el paso
10 la deja esperando, avisa a soporte y a Marta, y el cron reintenta. La sesión vuelve **el martes a las
11:00**, veinticinco horas después del último mensaje de Ana.

- **Hoy** el sistema la invita en PsicoAlianza y le manda el enlace como texto libre. Meta lo acepta y lo
  descarta en silencio: la ventana de 24 horas está cerrada. Ana no ve nada, su plazo corre, y el jueves
  se la descarta por vencimiento con otro texto que tampoco le llega. Marta la ve como «no completó la
  prueba».
- **Con este paso**, al invitar el sistema mira la ventana. Cerrada: no manda el texto; manda **la
  plantilla de recordatorio** («seguimos esperando que presentes tu prueba psicométrica», con el botón
  «Continuar proceso») y deja el enlace **pendiente de entregar**. Ana pulsa el botón el martes a las
  15:30 —eso es un mensaje suyo y abre la ventana— y **recibe el mensaje de siempre** con su enlace y
  «dispones de 2 días a partir de este momento». **Su plazo cuenta desde las 15:30.** Si no la hace, se la
  descarta el jueves a las 15:30. Si nunca pulsa, el jueves a las 11:00, como a quien recibe el enlace y
  lo ignora.

Si la sesión vuelve **dentro** de las 24 horas, nada cambia: el texto con el enlace sale como hoy.

Vale para **los dos proveedores**: una persona de EvaluaTest cuyo registro falló por red y salió al día
siguiente pasa por lo mismo. **Toca el embudo: tratamiento completo.**

## Alcance exacto

### 1 · Dos datos nuevos en el estado de la conversación

Nulos por defecto:

| Dato | Se escribe | Se borra |
| --- | --- | --- |
| **Enlace pendiente de entregar** (texto) | Al invitar con la ventana cerrada, con el enlace que devolvió la invitación (o el de respaldo de EvaluaTest, el mismo que hoy iría en el texto) | Cuando se entrega por el botón |
| **Pendiente desde** (fecha) | En el mismo momento | Igual |

Nombres en inglés, con el prefijo `psychometric` de los campos de al lado. Persistidos: se nombran una
vez.

### 2 · Al invitar: mirar la ventana antes de mandar el texto

🔴 **Antes, la hora del último mensaje entrante tiene que llegar hasta aquí** (levantado en la opinión
previa del 2026-09-20 y comprobado por el planificador): la etapa psicométrica **es conversacional**, así
que al pasar de etapa el embudo construye un estado de conversación nuevo con las respuestas vacías y
**sin la hora del último mensaje entrante**, y el bombeo hace lo mismo al activar al candidato. La
función de la ventana, sin ninguna de las dos cosas, devuelve **cerrada**: sin esto, **todo el mundo
recibiría la plantilla en vez del enlace, siempre y con los dos proveedores**.

**Decidido: la hora del último mensaje entrante se copia al estado nuevo solo cuando la etapa que empieza
es la psicométrica**, en los dos sitios que lo construyen (el paso de etapa y la activación del bombeo),
igual que ya se copia el teléfono de pruebas. Con eso la ventana se ve como está de verdad.

⚠️ **Se descartó copiarla siempre**, que es lo correcto en el modelo —la ventana es de la conversación, no
de la etapa— porque **cambiaría los recordatorios de las etapas posteriores** en producción: hoy el
primero de cada etapa sale siempre como plantilla por falta de dato, y pasaría a salir como texto libre
cuando la persona escribió hace menos de 24 horas. Es probablemente mejor, pero es un cambio visible que
no es de este paso: queda anotado en la bitácora como paso aparte.

Hecho eso, en la rama del arranque que ya invitó con éxito, **antes de mandar el mensaje con el enlace**,
comprobar la ventana con `isWhatsappWindowOpen(entry.flowState)`, igual que hacen los recordatorios:

- **Abierta** → todo como hoy: el texto con el enlace, y `psychometricInvitedAt` = ahora (paso 10).
- 🔴 **Sustituido el 2026-09-21: la plantilla es otra, nueva y propia.** Lo vigente está en la sección
  *Cambio del 2026-09-21: la plantilla de etapa pendiente*, al final del brief; lo que sigue en este
  punto sobre la plantilla de recordatorio y el «qué se espera» queda como registro. El resto del punto
  (no mandar el texto, los dos datos, `psychometricInvitedAt` nulo, el fallo de la plantilla) sigue
  vigente.
- **Cerrada** → **no** se manda el texto. Se guardan los dos datos del punto 1; **`psychometricInvitedAt`
  no se escribe** (queda nulo hasta que se entregue el enlace). Se manda la plantilla de recordatorio
  **por el mismo camino que la usan los recordatorios** —la que nombre `WHATSAPP_REMINDER_TEMPLATE`, con
  el nombre, el «qué se espera» y la empresa, con botón y con el reintento sin botón que ya existe— con
  un «qué se espera» propio de esta etapa: **«que presentes tu prueba psicométrica»** (⚠️ pendiente de
  aprobación del usuario cuando se vea el cuerpo de la plantilla, que está en Meta; ver *Pendiente*).
  🔴 **Esa frase NO se añade a la tabla de «qué se espera» por etapa**: esa tabla la usa también el
  recordatorio que se manda al aprobar a alguien a mano hacia esta etapa, y cambiarla cambiaría ese texto
  (levantado en la opinión previa y comprobado). Va como constante propia en el sitio que manda la
  plantilla.
  Si la plantilla no se puede enviar, se registra y no se hace nada más: el enlace sigue pendiente y el
  plazo de respaldo corre (59).

Todo lo demás del arranque no cambia: el identificador, el proveedor, el correo de registro y la fecha
de consulta se guardan igual; la novedad del paso 10 se quita igual; el estado pasa a *esperando
resultado externo* igual.

### 3 · Al pulsar «Continuar proceso»: entregar el enlace

En el reenvío de la etapa psicométrica, para quien **ya tiene identificador**:

- **Con enlace pendiente y la ventana abierta** → mandar **el mismo mensaje que manda el arranque** —el
  texto por proveedor de la 49, con el enlace guardado, el correo enmascarado y el plazo— y escribir
  `psychometricInvitedAt` = ahora, borrar los dos datos del punto 1, y volver a *esperando resultado
  externo* como hoy.
- 🔴 **Con enlace pendiente y la ventana cerrada** → **no se manda nada y el pendiente se conserva**
  (levantado en la opinión previa): este reenvío tiene **dos productores**, el botón —que abre la ventana
  antes de llegar aquí, trampa 3— y el retomar de un candidato aparcado, que no la abre. Sin esta
  comprobación, un retomar con la ventana cerrada mandaría el texto al vacío y borraría el pendiente:
  Ana se quedaría sin enlace y sin plantilla. Sigue corriendo el plazo de respaldo. El plazo se
  calcula como en el arranque (empresa > entorno > 2 días). El correo enmascarado sale de donde sale hoy:
  con PsicoAlianza, el correo de registro guardado en la bolsa del proveedor; con EvaluaTest, el del
  candidato. Para no duplicar el texto, **la composición del mensaje sale del arranque a un ayudante**
  que usan los dos sitios; el texto no cambia ni una letra (hay pruebas que lo comparan entero).
- **Sin enlace pendiente** → como hoy.

Para quien **no** tiene identificador, como hoy: se vuelve a intentar el arranque.

### 4 · El vencimiento: tres fechas, en este orden

La fecha de partida del vencimiento del cron pasa a ser: **`psychometricInvitedAt`** (el enlace se
entregó); si no la hay, **pendiente desde** (se invitó pero el enlace no se entregó: respaldo de la 59);
si no la hay, **la entrada a la etapa**, como hoy. Nada más cambia en el vencimiento.

### 5 · El retomar

El paso 10 reinicia `psychometricInvitedAt` al retomar a un aparcado. Aquí, **si tiene enlace pendiente,
se reinicia «pendiente desde» igual**, por la misma razón: que no venza en la pasada siguiente.

## Los casos, persona por persona

| # | Quién | Qué pasa | Qué recibe | Desde cuándo cuenta el plazo |
| --- | --- | --- | --- | --- |
| 1 | Ana, la invitación sale a las 3 horas de su último mensaje | Ventana abierta | El texto con el enlace, como hoy | La invitación |
| 2 | Ana, la invitación sale a las 25 horas | Ventana cerrada: plantilla; enlace pendiente | La plantilla con el botón | Respaldo: la invitación, hasta que pulse |
| 3 | Ana pulsa el botón a las 4 horas de la plantilla | Se entrega el enlace, se borra el pendiente | El mensaje de siempre, con el enlace y «2 días a partir de este momento» | **La pulsación** |
| 4 | Ana pulsa el botón otra vez al día siguiente | No hay enlace pendiente | Nada nuevo (como hoy: vuelve a esperar) | No cambia |
| 5 | Ana no pulsa nunca | El respaldo | Nada más | La invitación: se descarta al vencer, como quien ignora el enlace |
| 6 | Ana presenta la prueba sin haber pulsado (abrió el correo de PsicoAlianza) | El cron ve `finished` y da el veredicto | Lo de siempre | — |
| 7 | La plantilla no se puede enviar (Meta la rechaza) | Se registra; el pendiente queda | Nada | El respaldo |
| 8 | Persona de EvaluaTest, registro fallido por red, sale al día siguiente | Igual que Ana; el enlace pendiente es el de respaldo de EvaluaTest | La plantilla, y al pulsar el texto de EvaluaTest de siempre | Igual |
| 9 | Persona invitada dentro de la ventana que pulsa el botón días después | Sin pendiente | Como hoy | No cambia |
| 10 | Persona aparcada con enlace pendiente, retomada | «Pendiente desde» se reinicia | — | Desde el retomar |
| 11 | Ana con enlace pendiente y Marta desactiva la prueba de la oferta | Como hoy: el cron no la mira (hueco anotado en la 55, no de este paso) | — | — |
| 12 | Empresa en demo con la prueba simulada | Nunca pasa por aquí: el enlace demo se manda como hoy | Lo de hoy | — |
| 13 | Ana con enlace pendiente a quien **retoman** estando la ventana cerrada | No se manda nada, el pendiente se conserva | Nada | El respaldo, reiniciado por el retomar (alcance 5) |
| 14 | Persona aprobada a mano por la reclutadora hacia la psicométrica, con la ventana cerrada | Recibe el recordatorio de siempre de ese camino y, si la invitación sale sin ventana, **también** la plantilla de este paso: **dos plantillas seguidas**. Anotado en la opinión previa; no se toca | Dos plantillas | Lo del caso 2 |

## 🔴 Dónde se para — qué NO se hace

- **No se toca el texto del mensaje con el enlace**: se mueve a un ayudante, no se cambia. Las pruebas que
  lo comparan entero tienen que seguir pasando sin cambiar su afirmación.
- **No se toca la plantilla ni su nombre**: se usa la que ya usan los recordatorios, con el «qué se
  espera» nuevo. Ninguna plantilla nueva; si el compañero de la cuenta de Meta consigue una con botón de
  enlace variable, es otro paso.
- **No se reintenta la plantilla** que no se pudo enviar.
- **No se arreglan** los otros textos libres fuera de la ventana: el vencimiento, «gracias por completar»,
  «seguiremos analizando tu perfil». Son de antes y de otro frente (anotados en *Lo que hereda*).
- **No se toca** el reintento del paso 10, la novedad, el correo a soporte, el veredicto, la demo ni la
  renovación de la sesión.
- **No se manda la plantilla a quien ya esperaba con el enlace entregado**.

## 🔴 Las trampas

**1. La ventana se decide antes de enviar, nunca por el error del envío.** Meta acepta el texto libre con
200 y lo descarta después por el webhook; un `try/catch` no se entera. Por eso la comprobación es
`isWhatsappWindowOpen` con la hora del último mensaje entrante, con el margen que ya aplica.

**2. «⏳ Estamos preparando tu prueba…» es un mensaje nuestro y no abre la ventana.** La ventana la abre
solo lo que Ana manda. Al invitar tras un fallo de días, lo normal es que esté cerrada.

**3. Pulsar el botón sí la abre**, y el enrutado ya guarda la hora del mensaje entrante **antes** de llamar
al reenvío (comprobado el 2026-09-20). Por eso el texto que se manda al pulsar llega.

**4. El plazo de respaldo evita que Ana ocupe cupo para siempre.** Con «pendiente desde» nulo y sin
`psychometricInvitedAt`, el vencimiento caería a la entrada a la etapa, que con el paso 10 puede ser de
hace días: se la descartaría en la pasada siguiente a la invitación. Con la fecha de pendiente, se le da
el plazo entero desde la invitación.

**5. El enlace guardado en la participación es un dato personal más.** Va en el estado de la
conversación, que ya guarda el identificador del proveedor; no se registra en el log.

**6. Con EvaluaTest el enlace de hoy se arma en el arranque** con el código de evaluación de la vacante
(el enlace de respaldo de la 48). Lo que se guarda como pendiente es ese enlace armado, para que el
botón no tenga que volver a resolverlo.

**7. `WHATSAPP_REMINDER_TEMPLATE` no es la del código.** En producción y en pruebas está sobreescrita a
`recordatorio_cita`; el código solo trae `recordatorio_proceso` como valor por defecto. Usar el mismo
camino que los recordatorios garantiza que se usa la que esté configurada, sea cual sea. **Pero el texto
de esa plantilla no está en el repositorio**: ver *Pendiente*.

**8. Las pruebas del mensaje entero.** Hay pruebas que comparan el mensaje de EvaluaTest y el de
PsicoAlianza completos (paso 4b). Al mover la composición a un ayudante, esas pruebas tienen que seguir
pasando **sin tocar su afirmación**; si alguna cambia, decirlo.

## Pendiente antes de empezar (no bloquea escribir la opinión previa)

El usuario pregunta a quien tiene la cuenta de Meta el **cuerpo exacto** de `recordatorio_cita`,
`recordatorio_proceso` y `recordatorio_proceso_final`, sus variables y si tienen el botón. Con eso
aprueba el «qué se espera» de esta etapa o lo cambia. **Hasta entonces el texto es provisional.** Si
resulta que `recordatorio_cita` habla de citas, la solución es cambiar la variable en los compose a
`recordatorio_proceso`, no tocar código: se anota en `before-deploy.md` como fila nueva.

## Opinión previa del ejecutor (2026-09-20), verificada e incorporada

Los cinco puntos, con lo comprobado por el planificador en el código:

1. 🔴 **«Al entrar a la etapa la ventana siempre se ve cerrada»** — **cierto y comprobado**: la etapa
   psicométrica está marcada como conversacional, así que el paso de etapa construye un estado nuevo con
   las respuestas vacías y sin la hora del último mensaje entrante, y el bombeo hace lo mismo al activar;
   la función de la ventana sin ninguno de los dos devuelve cerrada. **Habría mandado la plantilla a todo
   el mundo, siempre.** Es exactamente el tipo de error que esta ronda existe para frenar. **Aceptado a
   medias**: se copia la hora al estado nuevo **solo cuando la etapa que empieza es la psicométrica**, no
   siempre. Copiarla siempre es lo correcto en el modelo, pero cambia los recordatorios de las etapas
   posteriores en producción, y eso no es de este paso: queda como paso aparte en la bitácora. Está en el
   alcance 2. **Y el montaje del spec del arranque gana una hora entrante reciente por defecto**, con los
   casos de ventana cerrada poniéndola hace 25 horas: es montaje, ninguna afirmación cambia.
2. **El reenvío lo comparten el botón y el retomar** — cierto, dos productores. **Aceptado**: la entrega
   comprueba la ventana antes de mandar; cerrada, el pendiente se conserva. Alcance 3 y caso 13.
3. **No tocar la tabla de «qué se espera» por etapa** — cierto: la usa también el recordatorio del
   rescate a mano. **Aceptado**: constante propia donde se manda la plantilla. El borde de las dos
   plantillas seguidas queda como caso 14, sin tocar nada.
4. **Lo confirmado sin novedad** — comprobado también por el planificador: el botón guarda la hora
   entrante antes de llamar al reenvío; el envío de la plantilla devuelve falso en vez de lanzar; la
   variable de la plantilla está sobreescrita en los dos compose. De acuerdo en no escribir código para
   la rama «ventana cerrada y sin enlace»: los dos adaptadores devuelven enlace o lanzan.
5. **Decisiones menores** — aceptadas todas: los nombres `psychometricPendingLink` y
   `psychometricPendingLinkSince`; el nombre de la empresa desde la consulta que el arranque ya hace, con
   «la empresa» de respaldo; limpiar el primer fallo también en la rama cerrada (la invitación salió); el
   correo enmascarado con la bolsa y el del candidato de respaldo; y las pruebas nuevas en el spec del
   arranque.

**Se puede empezar.** El texto del «qué se espera» sigue provisional (arriba).

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| El texto del mensaje con el enlace, por proveedor (49) | Aprobado por el usuario; pruebas que lo comparan entero |
| El paso 10 entero: reintento, novedad, correo, y `psychometricInvitedAt` cuando el enlace se entrega | Recién revisado |
| El envío de la plantilla de recordatorio y su reintento sin botón | Es el camino que funciona en producción |
| La demo | No pasa por aquí |
| Compilación y pruebas en verde | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Sin lint ni formateador, **sin comentarios nuevos en código**,
identificadores en inglés —también los parámetros de las funciones flecha y los de los `spec`—. La
solución más pequeña. Sin commitear y todo al índice. Finales de línea de cada archivo.

**Documentación en el mismo diff:**

- `flujo-actual-etapa-psicometrica.md` — §2 punto 6: el mensaje solo si la ventana está abierta; si no,
  la plantilla y el enlace pendiente que entrega el botón. *Las cinco puertas*: qué hace el botón con el
  enlace pendiente. §4 punto 2: las tres fechas del vencimiento, en orden. §6: los dos datos nuevos.
- `pruebas-a-mano.md` — una sección del paso 11 con la tabla de abajo.
- `before-deploy.md` — solo si hay que cambiar la variable de la plantilla: una fila nueva.

## Pruebas

**Backend, automáticas:**

- 🔴 **La hora del último mensaje entrante llega a la etapa**: al pasar a la psicométrica se conserva, y
  al activar desde el bombeo también; **al pasar a cualquier otra etapa no** (las pruebas existentes de
  esas etapas no cambian ninguna afirmación). Es la prueba del punto 1 de la opinión previa: sin ella,
  todo el mundo recibiría la plantilla.
- **Al invitar con la ventana abierta**: el texto con el enlace, `psychometricInvitedAt` escrito, ningún
  pendiente, ninguna plantilla.
- **Al invitar con la ventana cerrada** (último mensaje entrante hace 25 horas): ninguna llamada a
  `sendText` con el enlace; la plantilla con el «qué se espera» de esta etapa; enlace pendiente y
  «pendiente desde» escritos; `psychometricInvitedAt` **nulo**; el identificador y el proveedor guardados
  igual. **Con PsicoAlianza y con EvaluaTest** (en EvaluaTest el pendiente es el enlace de respaldo).
- **La plantilla falla** → se registra, el pendiente queda, no se lanza.
- **El botón con enlace pendiente**: `sendText` con **exactamente el mismo mensaje** que mandaría el
  arranque (comparar con el ayudante y con el texto entero de la 49), `psychometricInvitedAt` escrito
  ahora, pendiente borrado, estado *esperando resultado externo*. **Sin pendiente** → como hoy, ningún
  `sendText`.
- **Vencimiento**: `psychometricInvitedAt` hace 1 día, pendiente desde hace 3, entrada hace 5, plazo 2 →
  no vence; sin `psychometricInvitedAt` y pendiente desde hace 3 → vence; sin ninguna de las dos y
  entrada hace 3 → vence, como hoy.
- **Retomar** con pendiente → «pendiente desde» se reinicia. **Retomar con pendiente y la ventana
  cerrada** → ningún `sendText`, el pendiente sigue (caso 13).
- **Las pruebas del mensaje entero (4b) no cambian ninguna afirmación.**

⚠️ Control negativo en la de la ventana cerrada (que no salga el texto), en la del botón con pendiente y en
la del vencimiento con «pendiente desde»; invertir, ver que fallan, restaurar y limpiar la caché.

**Casos a mano**, los corre el usuario en el **servidor de pruebas** con la rama, junto con los del paso
10 y con la misma preparación (sesión manual encendida, dirección de PsicoAlianza que no responde para
los que fallan). Para los que **sí** invitan, hace falta que la dirección real responda y **una vacante
de PsicoAlianza de la cuenta de pruebas**, con una persona de prueba; se la saca de la vacante al
terminar (fila 5c de `before-deploy.md`). La ventana cerrada se prepara **en la base**, poniendo la hora
del último mensaje entrante (`flowState.lastInboundAt`) hace dos días.

| # | Cómo se prepara | Qué se hace | Qué se tiene que ver |
| --- | --- | --- | --- |
| 1 | Candidato de prueba que acaba de contestar (ventana abierta); la invitación sale | Esperar el arranque | En el simulador, el texto con el enlace, como siempre |
| 2 | Candidato esperando sin invitación (paso 10); en la base, `lastInboundAt` hace dos días; se devuelve la dirección real | Esperar la pasada | En el simulador, **la plantilla** (el simulador la enseña como plantilla con botón), **no** el texto; en la base, el enlace pendiente y `psychometricInvitedAt` nulo |
| 3 | El caso 2 | Pulsar «Continuar proceso» en el simulador | El texto con el enlace y el plazo; en la base, `psychometricInvitedAt` de ahora y el pendiente borrado |
| 4 | El caso 3 | Pulsar otra vez | Nada nuevo |
| 5 | Una participación con pendiente desde hace 3 días, sin `psychometricInvitedAt`, plazo 2 | Esperar la pasada | Se descarta por vencimiento |
| 6 | Una participación con `psychometricInvitedAt` hace 1 día y pendiente desde hace 3 (inconsistente a propósito), plazo 2 | Esperar la pasada | **No** se descarta: manda la entrega |

## Verificación

Backend: `npm run build` y `npm test`, una vez sobre el conjunto, con la caché de Jest limpia.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief** — en particular cómo se guardó el enlace y
   cómo quedó el ayudante del mensaje.
4. **Confirmación** de que el texto del mensaje no cambió (las pruebas del 4b intactas), de que con la
   ventana abierta nada cambia, y de que el paso 10 no se tocó.
5. **Los nombres de los dos campos nuevos**, tal como quedaron.
6. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos, **y la lista de los
   identificadores nuevos**, parámetros de funciones flecha y de `spec` incluidos.
7. **Los documentos actualizados.**
8. **Un mensaje de commit** para el backend.

## Cambio del 2026-09-21: la plantilla de etapa pendiente (decidido por el usuario con el equipo)

**Para el ejecutor, esté donde esté del trabajo.** Con la ventana cerrada ya **no** se manda la plantilla
de recordatorio con el «qué se espera»: se manda **una plantilla nueva y propia**, genérica para que sirva
también a otras etapas en el futuro. Lo demás del alcance no cambia. Si ya escribiste el envío con la de
recordatorio, se sustituye.

**La plantilla**, creada en Meta por el equipo:

| Qué | Valor |
| --- | --- |
| Texto | «Hola {{1}}👋 Para continuar con tu proceso de selección para {{2}} en {{3}}, necesitamos tu confirmación. ¿Deseas continuar con el proceso?» (**definitivo, creado por el equipo el 2026-09-21**; sustituye al borrador «tienes una etapa pendiente…») |
| Variables | {{1}} nombre de pila, {{2}} título de la oferta, {{3}} nombre de la empresa |
| Botones | Dos de respuesta rápida, **en este orden**: «Sí, Continuar» (índice 0) y «No» (índice 1) |
| Categoría e idioma | Utilidad, `es_CO`, como las demás. **Confirmado por el equipo el 2026-09-21**, junto con el orden de los botones («Sí, Continuar» es el primero). **En aprobación en Meta** ese día: el código se escribe ya; desplegar, no hasta que esté aprobada |
| Nombre | **`pending_process_reminder`** (confirmado por el equipo el 2026-09-21) |

**Cómo se manda**, siguiendo el precedente exacto de `continuar_proceso_essperto` (la plantilla de
reingreso tras el preflujo, en el orquestador):

- El nombre sale de **una variable de entorno nueva**, declarada en el esquema de entorno con valor por
  defecto **`pending_process_reminder`**. Nombre de la variable en inglés con el prefijo `WHATSAPP_`, junto
  a las demás plantillas; lo elige el ejecutor. Si algún día cambia el nombre en Meta, basta el compose.
- El cuerpo con los tres textos, y **los dos botones con su identificador**: el índice 0 con el de
  continuar (`resume_flow`) y el índice 1 con el de retirarse (`withdraw_process`), igual que el
  reingreso.
- Si Meta rechaza el envío, se reintenta **sin botones**, como hace la plantilla de recordatorio; si
  tampoco sale, se registra y el enlace sigue pendiente (caso 7).

**Lo que hace cada botón ya está escrito** y no se toca:

| Ana pulsa | Qué pasa |
| --- | --- |
| **Sí** | El enrutado reconoce `resume_flow`, guarda la hora del mensaje entrante y llama al reenvío de la etapa: le llega el enlace (alcance 3) |
| **No** | El enrutado reconoce `withdraw_process` **en cualquier etapa**: le responde «Entendido, gracias por avisarnos 🙏 Cerramos aquí tu participación…» y la descarta con el motivo de retiro de la etapa (comprobado el 2026-09-21) |

🔴 **No se añaden «sí» ni «no» al reconocimiento por el texto del botón.** El enrutado reconoce los
botones por su identificador y, como respaldo, por el título «continuar proceso» o «ya no me interesa».
Añadir «sí» y «no» sería peligroso: **la plantilla de primer contacto también tiene botones «Si»/«No»**,
que significan aceptar o no el tratamiento de datos. Como el código siempre manda el identificador, no
hace falta.

**Lo que desaparece del brief:** la constante del «qué se espera» y el uso de la plantilla de recordatorio
en este paso. La trampa 7 (la variable de recordatorio sobreescrita en los compose) deja de aplicar a este
paso. La pregunta al equipo sobre el cuerpo de `recordatorio_cita` sigue en pie, pero ya no bloquea nada
de aquí.

**Pruebas:** donde el brief pide «la plantilla con el "qué se espera"», afirmar en su lugar **el nombre de
la plantilla nueva, las tres variables en orden y los dos botones con sus identificadores y sus índices**.
Y una prueba más: con la plantilla fallando con botones, el reintento sin botones.

**Antes de desplegar**, y va a `before-deploy.md` como fila nueva: **la plantilla aprobada en Meta** con el
nombre que tenga la variable. Sin eso, con la ventana cerrada nadie recibe nada y todos esperan al plazo
de respaldo. *(Hecho: fila 10 de `before-deploy.md`.)*

## Segunda opinión previa (2026-09-21, ejecutor nuevo sobre el trabajo a medias), verificada e incorporada

El ejecutor nuevo encontró el trabajo del anterior en el índice, lo leyó contra el brief y no tocó nada.
⚠️ Su mensaje citaba «los puntos 10, 12 y 13», pero llegó sin numeración; se identifican por su contenido.
Lo comprobado por el planificador en el código, y lo decidido:

| Punto | Comprobado | Decidido |
| --- | --- | --- |
| **La plantilla de recordatorio y la frase del «qué se espera» siguen en el código** | Sí | Se sustituyen por la plantilla nueva (sección anterior) y **la constante de la frase se borra** |
| **El nombre de respaldo «Hola»** rompe la plantilla nueva: leería «Hola Hola👋» | Sí: el envío pone «Hola» si no hay nombre; la plantilla de reingreso pone «Candidato» | **«Candidato»**, como el reingreso |
| **El servicio de entrega del enlace**, que el brief no pedía (57 líneas, una dependencia: el cliente de WhatsApp) | Sí | **Aprobado.** Sigue la preferencia del usuario del paso 10: lo que es una pieza propia no va dentro del orquestador |
| 🔴 **Si Ana escribe en vez de pulsar, no recibe el enlace**: cualquier texto en la etapa psicométrica recibe una respuesta fija («Tu prueba se realiza por correo electrónico 📬…»), y la plantilla termina con una pregunta que invita a escribir «sí» | Sí | **Aprobado, entra en este paso.** En esa respuesta, **si hay enlace pendiente, se entrega el enlace** por el mismo servicio (su mensaje escribir abrió la ventana) en vez del texto fijo; sin pendiente, el texto fijo de siempre. Quien escriba «no» también recibe el enlace: inofensivo, y quien quiera retirarse tiene el botón «No». Con su prueba y su caso a mano |
| **El reintento sin botones deja botones muertos**: sin identificador, Meta devuelve el título del botón, y «Sí, Continuar» y «No» no se reconocen (y no se deben reconocer, ver la sección anterior) | Sí | **Se quita el reintento.** La plantilla se creó con sus dos botones; si el envío con botones falla, el fallo es real (sin aprobar, mal configurada): se registra y el enlace sigue pendiente (caso 7). Sustituye a «si Meta rechaza, se reintenta sin botones» de la sección anterior, y a su prueba |
| **La fila de antes de desplegar ya existe** | Sí, la fila 10 | No se añade otra |
| **Quien ya espera invitación el día del despliegue** entró sin la hora de su último mensaje: su ventana se verá cerrada | Correcto | Aceptado: recibe la plantilla y el botón le entrega el enlace. Nada que hacer |

**El plan de aplicación del ejecutor queda aprobado** con esos ajustes: variable de entorno con
`pending_process_reminder` por defecto; envío propio calcado del reingreso, con «la empresa» de respaldo y
los dos botones; el envío del recordatorio no se toca; las pruebas cambian sus afirmaciones a la plantilla
nueva, con control negativo en cada una; **y una prueba más**: texto libre con enlace pendiente → se
entrega el enlace, se arranca el plazo y se borra el pendiente; sin pendiente → el texto fijo de siempre.
**Caso a mano nuevo** en la sección del paso 11 de `pruebas-a-mano.md`: con enlace pendiente, escribir
«sí» en el simulador en vez de pulsar → llega el enlace.

**Se puede empezar.**

## Revisión del diff (2026-09-22)

Verificado por el planificador sobre el índice de `feat/psychometric-followups`, con la caché de Jest
limpia: **compila, 139 suites y 1.456 pruebas (1.447 pasan, 9 omitidas)**, 45 más que el paso 10. Índice y
árbol coinciden en los dos repositorios; nada sin rastrear; ningún merge. Las cuatro líneas quitadas en
pruebas existentes son de montaje (la empresa se lee también con su nombre, el doble de WhatsApp gana el
envío de plantillas, el estado inicial gana una hora entrante reciente); **ninguna afirmación se quitó**.
Sin comentarios nuevos en código. **Control negativo propio** sobre el error que frenó la primera
opinión previa —forzar la ventana a «cerrada» al invitar—: **16 pruebas del arranque caen**; restaurado y
caché limpia.

**Leído contra el brief y las dos opiniones previas, todo está:** la hora del último mensaje se copia solo
al entrar a la psicométrica, en el paso de etapa y en el bombeo; al invitar se mira la ventana; con ella
cerrada, el enlace queda pendiente, el plazo no arranca y sale `pending_process_reminder` con nombre
(«Candidato» de respaldo), vacante, empresa («la empresa» de respaldo) y los dos botones con sus
identificadores, sin reintento; el texto del mensaje se movió a un ayudante sin cambiar una letra; la
entrega por el botón comprueba la ventana; el texto libre con enlace pendiente lo entrega; el retomar
reinicia la fecha del pendiente; el vencimiento usa las tres fechas en orden; la variable de entorno con
su valor por defecto; la constante del «qué se espera» ya no existe; la demo no pasa por aquí.

**Aprobado con un arreglo y un caso a mano.**

### 1 · Lo que hay que arreglar antes de commitear

🔴 **La entrega del enlace guarda la oferta sin el guardado con reintento.** El servicio de entrega manda el
mensaje y después hace un guardado simple de la oferta. El mensaje de Ana está serializado por su
teléfono, pero otros candidatos de la misma oferta se guardan a la vez (el cron, los mensajes de otros), y
un conflicto de versión hace fallar ese guardado **después de haber mandado el enlace**: el pendiente no se
borra y la hora de invitación no se escribe. Ana recibe el enlace, y en su siguiente mensaje **lo vuelve a
recibir**; y su plazo cuenta desde la fecha del pendiente, **antes** de lo que le dijo el mensaje. Es
exactamente lo que el paso 10 cuidó con el guardado con reintento (su comentario sobre el `VersionError` en
el arranque). El reenvío de hoy hace un guardado simple igual, pero solo cambia el estado; aquí además se
manda un mensaje.

El arreglo: **el servicio manda el mensaje y cambia el estado de la participación, pero no guarda**; lo
guarda el orquestador con el guardado con reintento, que ante un conflicto recarga y copia la
participación, que es justo lo que cambió. **El orden se conserva**: primero el mensaje, luego el guardado
(si se invirtiera, un envío fallido perdería el enlace). Con su prueba: el guardado choca una vez → el
estado queda escrito en el segundo intento y el mensaje sale **una sola vez**. Y su control negativo.

### 2 · Caso a mano que se añade

Al final de la sección del paso 11 en `pruebas-a-mano.md`:

| # | Cómo se prepara | Qué se hace | Qué se tiene que ver |
| --- | --- | --- | --- |
| 8 | Otro candidato preparado como el caso 2, con la plantilla ya recibida | Pulsar **«No»** en el simulador | «Entendido, gracias por avisarnos 🙏 Cerramos aquí tu participación…»; **ningún enlace**; en el portal, descartado por retiro en la etapa psicométrica |

### 3 · Lo que queda anotado y no es de este paso

- La respuesta fija al texto libre sin enlace pendiente dice «Tu prueba se realiza por correo electrónico…
  Te enviamos el link a tu email», que con los dos proveedores ya no es del todo cierto: el enlace llega por
  WhatsApp. Es de antes; el texto lo aprobaría el usuario.
- El registro del arranque dice «invitación enviada» también cuando lo que salió fue la plantilla. Cosmético.

La fila 11 de la tabla de la etapa 3 la cierra el planificador cuando el arreglo esté.
