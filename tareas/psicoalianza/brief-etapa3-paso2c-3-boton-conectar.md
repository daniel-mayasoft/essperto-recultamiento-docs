# Brief · Etapa 3, paso 2c.3 — la etiqueta por estado y el botón *Conectar*

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 44** (por qué la etiqueta dice *conectado* y no *credenciales válidas*, y por qué conseguir la
sesión es una acción pedida a propósito), **en la 50** (la fila por proveedor y el texto provisional que
este paso sustituye) **y en la 54** (qué guarda el 2c.2, los cinco textos aprobados y qué apaga el
botón). Toca el backend —una lectura y una ruta— y el portal.

> Escrito el 2026-09-16 leyendo la fila de PsicoAlianza en *Mi compañía* del portal (cómo pide y pinta
> la etiqueta, y su descarte de respuestas viejas), la ruta de estado de sesión del 5b y el método del
> adaptador que la sirve, el servicio de renovación del 2c.2 (qué expone y qué guarda), el almacén de
> sesión, los textos del portal en los dos idiomas, y `pruebas-a-mano.md`.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md`.
2. `../../CLAUDE.md`, `../../../../esscoti-backend/CLAUDE.md` y `../../../../esscoti-frontend/CLAUDE.md` si existe.
3. `integrate-psicoalianza.md` — decisiones **44 (con su corrección), 50 y 54**; en la tabla de pasos
   de *Dónde va la etapa 3*, las filas **2c.2 y 2c.3**.
4. `flujo-actual-etapa-psicometrica.md` — §1, *La etiqueta de la sesión* y *El estado de la sesión*.
5. `brief-etapa3-paso6-1-mi-compania.md` — alcance 4 (la etiqueta de hoy y su regla de «solo cuenta la
   última respuesta») y sus casos a mano, que este paso sustituye en parte.
6. `brief-etapa3-paso2c-2-cuando-se-consigue-la-sesion.md` — alcance 1 a 3: qué campos hay, qué
   significa *bloqueada*, qué expone el servicio.
7. En el backend: la ruta de estado de sesión en el controlador de empresas, el método del adaptador
   que la sirve, el servicio de renovación (la operación pública, *hay ráfaga en curso*, cómo calcula
   el tope y la ventana), el almacén (la lectura del estado) y las constantes de permisos. En el
   portal: la pantalla de *Mi compañía*, la fila del proveedor y cómo carga la etiqueta.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. **El 2c.2 tiene que estar
commiteado** en el backend; si no lo está, dilo y espera.

## El caso

**Marta** guarda correo y contraseña de PsicoAlianza. La fila dice **«Conectando…»** y, sin que ella
haga nada, a los dos minutos cambia a **«Conectado»**. Si PsicoAlianza rechazó la contraseña, la fila
dice que la revise y guarde de nuevo, y no hay botón que pulsar porque no serviría. Si falló por el
captcha, la fila dice **«Conexión fallida — vuelve a intentarlo.»** y el botón **Conectar** está
encendido: lo pulsa, vuelve a **«Conectando…»**, y la pantalla se entera sola de cómo termina. Si ya se
gastaron los intentos del día, la fila dice que contacte a soporte y el botón está apagado: soporte ya
recibió el correo del 2c.2 y sabe de qué le habla.

Nada de esto consigue sesiones por su cuenta: **el botón solo le pide al 2c.2 lo mismo que le pide la
tarea de la hora**, saltando la espera entre ráfagas y sin saltar el tope ni el bloqueo. Y la
etiqueta **no decide nada**: pinta lo que el backend le dice.

**Visible, con una ruta nueva pequeña.** Casos a mano en el portal.

## Alcance exacto

### 1 · Backend: la ruta de estado dice también cómo va el intento

La ruta de estado de sesión de *Mi compañía* (5b) **conserva `status` tal cual** y gana, al lado, lo que
la etiqueta necesita para elegir texto. Semántica, no nombres —los nombres los elige el ejecutor, en
inglés—:

| Dato | Qué dice | De dónde sale |
| --- | --- | --- |
| Hay ráfaga en curso | El 2c.2 está intentando ahora mismo para esta empresa | *Hay ráfaga en curso* del servicio de renovación |
| Bloqueada por credenciales | El último desenlace fue *credenciales rechazadas* | La lectura del estado del almacén |
| Tope alcanzado | Los intentos de la ventana viva llegan al tope | El mismo cálculo que usa el 2c.2 para decidir si arranca una ráfaga: **se expone desde el servicio de renovación**, no se recalcula en la ruta |
| Ha habido algún intento | Existe un desenlace guardado | La lectura del estado |

Con `status` = *sin conexión configurada*, los cuatro van vacíos o en falso y no se lee nada más.
Dónde se compone —en la ruta, o en un método nuevo del servicio de renovación que devuelva los cuatro
juntos— lo decide el ejecutor; el adaptador **no** gana dependencias nuevas.

### 2 · Backend: la ruta *Conectar*

Una ruta nueva bajo *Mi compañía*, **de escritura**, con el mismo permiso que guardar la conexión.
Pide una sesión al servicio de renovación **para la empresa del usuario autenticado**, con motivo
propio (*botón*), **saltando la espera entre ráfagas** y **sin liberar el bloqueo** (eso lo hace solo
guardar credenciales, 54). Vuelve al instante y **responde lo mismo que la ruta de estado**, leído
justo después de pedir: como el candado se toma en el tramo síncrono (2c.2), si la petición arrancó,
*hay ráfaga en curso* ya viene en verdadero. Si no arrancó —bloqueada, tope, candado de otra empresa,
sesión manual— la respuesta lo refleja igual y el portal no tiene que adivinar.

El motivo *botón* es un valor nuevo del tipo de motivos del 2c.2; nada más cambia allí.

### 3 · Portal: la etiqueta elige entre seis textos

En la fila de PsicoAlianza, **solo con la conexión configurada**, como hoy. La regla, en orden —la
primera que aplica gana—:

| # | Condición | Texto | Botón *Conectar* |
| --- | --- | --- | --- |
| 1 | Mientras llega la respuesta | El indicador de carga de hoy | Apagado |
| 2 | `status` es *conectado* | **«Conectado»** (la chip verde de hoy) | No se muestra |
| 3 | Hay ráfaga en curso | **«Conectando…»** | Apagado |
| 4 | Bloqueada por credenciales | **«Conexión fallida — PsicoAlianza rechazó el correo o la contraseña. Revísalos y guarda de nuevo.»** | Apagado |
| 5 | Tope alcanzado | **«Error de conexión — contacta a soporte.»** | Apagado |
| 6 | Ha habido algún intento | **«Conexión fallida — vuelve a intentarlo.»** | Encendido |
| 7 | No ha habido ninguno | **«Pendiente de conexión — pulsa Conectar para conectar ahora.»** (aprobado por el usuario el 2026-09-16) | Encendido |
| 8 | La petición falla | «No se pudo comprobar la sesión», como hoy | Apagado |

Los textos 2 a 6 los aprobó el usuario (54). Los avisos de fallo van en el aviso amarillo de hoy; el
de tope, en rojo. El botón va **junto a la etiqueta**, no en el lugar de *Editar conexión*, que sigue
igual. El texto provisional de la 50 («…Avisa a soporte») **desaparece**.

### 4 · Portal: pulsar *Conectar* y esperar a que termine

Pulsar llama a la ruta del punto 2, pinta la respuesta con la misma regla, y **si hay ráfaga en curso,
vuelve a pedir el estado cada pocos segundos** hasta que deje de haberla; entonces pinta el estado final
y para. Lo mismo al cargar la página o al guardar el modal si la respuesta ya viene con ráfaga en curso
(guardar dispara una, 54). Tope de espera: **doce minutos** (una ráfaga puede tardar hasta diez), y al
llegar se pide el estado una última vez y se para. Se para también al salir de la pantalla. La regla de
hoy de «solo cuenta la última respuesta pedida» se conserva y cubre también a estas peticiones.

### 5 · Textos

Los siete en español, en el archivo de textos del portal, en el mismo grupo que los de hoy; el de
*Sin conexión* de la 50 se reemplaza, no se deja huérfano. En inglés, una traducción fiel de cada uno.

## Los casos, persona por persona

| Quién | Qué pasa | Qué ve |
| --- | --- | --- |
| Marta guarda la conexión por primera vez | El guardado dispara una ráfaga (54) | «Conectando…», y al terminar «Conectado» sin recargar |
| Marta guarda y otra empresa tiene el candado | La ráfaga no arranca; la tarea de la hora la recogerá | El texto 7, con el botón encendido |
| Marta tecleó mal la contraseña | *Credenciales rechazadas*, conexión parada | El texto 4, botón apagado; edita la conexión, guarda, y vuelve a «Conectando…» |
| El captcha rechazó la ráfaga | *Agotó los intentos* | El texto 6; pulsa Conectar → «Conectando…» → el resultado |
| Marta pulsa Conectar cinco veces seguidas | La primera arranca; las otras cuatro encuentran el candado tomado | Botón apagado mientras dura; no hay cinco ráfagas |
| Veinte intentos en el día sin entrar | Tope | El texto 5, botón apagado; a soporte ya le llegó el correo |
| La sesión está viva | — | «Conectado», sin botón, aunque el último desenlace guardado sea un fallo viejo |
| Quien desarrolla, con la sesión manual encendida | El 2c.2 no hace nada | «Conectado» si la pegada sirve; el botón, si aparece, no arranca nada y la respuesta lo dice |

## 🔴 Dónde se para — qué NO se hace

- **No se toca el servicio de renovación** salvo el motivo nuevo y, si el ejecutor lo elige, el método
  que devuelve los cuatro datos juntos. Ni la regla, ni los números, ni el correo.
- **No se libera el bloqueo desde el botón.** Solo guardar credenciales (54).
- **No se salta el tope desde el botón.**
- **No cambia `status`** ni lo que hoy devuelve: la ruta es aditiva y quien la lea como hasta ahora sigue
  funcionando.
- **No se toca el modal** de conexión, ni la fila de EvaluaTest, ni el plazo.
- **No se toca el adaptador.**
- **No se pide el estado en bucle sin ráfaga en curso**: el sondeo existe solo mientras el backend dice
  que está intentando.

## 🔴 Las trampas

**1. «Conectado» manda sobre cualquier fallo guardado, y también sobre la ráfaga en curso.** El último
desenlace puede ser un fallo de hace días con una sesión que hoy está viva (la consiguió la tarea
después, o la sesión manual). Y con la renovación anticipada (54) la tarea lanza una ráfaga **con la
sesión todavía viva**: las invitaciones están saliendo, y eso es lo que la etiqueta tiene que decir.
Por eso *conectado* va antes que todo (corregido en la opinión previa: la primera versión ponía
«Conectando…» delante). Como el botón no se muestra con «Conectado», pulsar y ver «Conectando…»
sigue siendo coherente: solo se pulsa sin sesión. Al revés, una sesión muerta con desenlace *entró* de
hace cinco días cae en el texto 6: es «falló por otra causa».

**2. El botón no debe adivinar si arrancó.** La respuesta de la ruta *Conectar* lo dice; el portal la
pinta y, solo si hay ráfaga en curso, sondea. Si el portal asumiera «Conectando…» al pulsar, con el
candado tomado por otra empresa mostraría un progreso que no existe.

**3. La respuesta de *Conectar* puede decir «en curso» y la siguiente «nada».** La ráfaga se descarta
después de tomar el candado si la empresa está bloqueada o llegó al tope (2c.2): el candado se toma en
el tramo síncrono y se suelta unos milisegundos después. El sondeo lo resuelve solo; no es un error.

**4. Dos pestañas o dos personas.** Cada una sondea por su cuenta; el backend responde lo que hay. No
hay nada que coordinar en el portal.

**5. Salir de la pantalla con el sondeo vivo.** Se cancela al desmontar; una respuesta que llegue
después se descarta por la regla de «última pedida».

**6. Con la sesión manual encendida, el estado es siempre lo que diga la pegada** y el 2c.2 no hace
nada: en local no se puede ver «Conectando…» ni un fallo real sin apagar la manual. Los casos a mano
lo tienen en cuenta, y varios estados **se preparan escribiendo el desenlace en la base**, no
consiguiendo sesiones de verdad contra la cuenta del cliente.

**7. El tope se calcula con la ventana viva.** Veinte intentos de ayer con la ventana vencida **no**
son tope. Por eso el cálculo es el del 2c.2 y no una comparación en la ruta.

**8. El permiso de la ruta *Conectar* es el de escribir la empresa, y el portal ya lo aplica.**
Comprobado en la opinión previa y por el planificador: todas las tarjetas de etapas del flujo —la fila
de PsicoAlianza con su etiqueta incluida— están dentro de un bloque que exige ese permiso. Quien solo
puede leer **no ve la fila**, así que el botón hereda la puerta sin regla nueva.

## Opinión previa del ejecutor (2026-09-16), verificada e incorporada

1. **El caso 11 y la trampa 8 no se alcanzaban** — cierto, comprobado en el portal: la sección entera
   de etapas del flujo está detrás del permiso de editar la empresa. **Aceptado**: el caso 11 pasa a
   «no ve la sección», la ruta *Conectar* lleva el permiso de escritura, sin regla nueva.
2. **El texto 7** — resuelto por el usuario; ver abajo. La traducción propuesta por el ejecutor ya no
   vale: el texto cambió.
3. **«Conectando…» ganaba a «Conectado»** con la renovación anticipada — cierto, y **se corrige al
   revés**: *conectado* va primero (trampa 1). Con la sesión viva las invitaciones salen, y eso es lo
   que la etiqueta tiene que decir; el botón no se muestra con «Conectado», así que la coherencia del
   pulsar no se pierde.
4. **Los casos a mano los corre el usuario** con la rama entera — aceptado; queda dicho en *Pruebas*.

**Decisiones de forma, aceptadas:** un método del servicio de renovación que describe el estado de la
sesión —lee el almacén una vez y devuelve los cuatro datos con la misma regla interna que decide si
arranca una ráfaga—, llamado desde el controlador solo cuando `status` no es *sin conexión*; el
adaptador no cambia. Nombres: `bursting`, `blockedByCredentials`, `capReached`, `attempted`, junto a
`status`. La ruta *Conectar* con el motivo `button`, saltando la espera, respondiendo el estado leído
justo después. En el portal, la etiqueta pasa a un objeto con `status` y los cuatro datos; la regla en
una función pura; sondeo cada 5 segundos mientras `bursting`, tope de doce minutos, cancelación al
desmontar, reutilizando el contador de «última respuesta pedida»; **mientras se sondea no vuelve a
salir el indicador de carga**. Claves de texto nuevas en el grupo de hoy, la provisional reemplazada,
y el botón con clave propia distinta del «Conectar» del modal. El spec del controlador gana la
dependencia solo en el montaje.

**Resuelto por el usuario el 2026-09-16: el texto 7 es «Pendiente de conexión — pulsa Conectar para
conectar ahora.»** Se eligió entre tres porque no promete un intento automático en un momento dado —la
tarea de la hora puede estar ocupada con otra empresa— ni suena a fallo. En inglés, una traducción
fiel: «Connection pending — press Connect to connect now.» Se puede empezar; **si ya se escribió el
texto anterior en algún archivo, se sustituye**.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **`status` y su significado** en la ruta de estado | El portal de hoy lo lee; el 6.1 lo probó a mano |
| **La regla de «solo cuenta la última respuesta»** del 6.1 | Sigue siendo la que evita que una respuesta vieja pise a la nueva |
| **El modal, la fila de EvaluaTest, el plazo** | No se tocan |
| **El servicio de renovación**, salvo el motivo y la lectura | Es el 2c.2 recién revisado |
| **Compilación y pruebas en verde** en el backend; **tipos limpios** en el portal | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Sin lint ni formateador, **sin comentarios nuevos en código**,
identificadores en inglés —también los parámetros de las funciones flecha—, textos del usuario en los
archivos de textos y no en el componente. La solución más pequeña. Sin commitear y todo al índice.
Finales de línea de cada archivo.

**Documentación en el mismo diff:**
- `flujo-actual-etapa-psicometrica.md` — en §1, *La etiqueta de la sesión*: los siete estados, el botón
  y qué lo apaga; *El estado de la sesión*: lo que la ruta devuelve además de `status`, y la ruta
  *Conectar* con su permiso.
- `before-deploy.md` — en la fila 6, **el bloqueo queda levantado en lo que depende del código**: el
  2c.1, el 2c.2 y el 2c.3 están; lo que sigue faltando es la infraestructura (7, 7b, 7d) y las variables
  (8). En la fila 8b, que los casos del 2c.3 están en `pruebas-a-mano.md`.
- `pruebas-a-mano.md` — **una sección nueva del 2c.3** con la tabla de abajo; y en la del 6.1, los casos
  que esperaban el texto provisional de *Sin conexión* (órdenes 11 y 12) pasan a esperar el texto que
  toque según la regla, con la nota de qué desenlace hay guardado en cada uno.
- `../../CLAUDE.md` — solo si la frase de *Dónde está lo importante* deja de ser cierta; hoy dice que el
  botón no existe.

## Pruebas

**Backend, automáticas:**

- **La ruta de estado**: con conexión y sesión viva → `status` *conectado* y los cuatro datos coherentes;
  con ráfaga en curso → lo dice; con *credenciales rechazadas* guardado → bloqueada; con veinte
  intentos en una ventana viva → tope; con veinte en una ventana **vencida** → **no** tope (trampa 7);
  sin conexión configurada → `status` de hoy y los cuatro vacíos, **sin leer el estado**.
- **La ruta *Conectar***: pide sesión con el motivo *botón* y saltando la espera; **no** libera el
  bloqueo; responde el estado. Sin el permiso de escritura → prohibido (si el marco de pruebas de los
  controladores lo permite; si no, se dice).
- **El servicio de renovación**: si se añade el método que devuelve los cuatro datos, sus casos; el
  motivo *botón* pasa por la misma regla (una prueba: bloqueada → no llama aunque el motivo sea *botón*).

⚠️ Control negativo en la del tope con ventana vencida y en la de *Conectar* que no libera el bloqueo;
borrarlos y limpiar la caché.

**Portal: casos a mano en local** (`../../entorno-local.md`: base, backend y portal; una empresa con
PsicoAlianza conectada). Varios estados se preparan **escribiendo en la base** el desenlace del último
intento o los contadores de la ventana en la sesión de la conexión, y **reiniciando el backend no hace
falta**: la ruta lee la base en cada petición. **Ninguno consigue una sesión real** salvo que se diga.
El reporte dice el resultado de cada uno.

| # | Cómo se prepara | Qué se hace | Qué se tiene que ver |
| --- | --- | --- | --- |
| 1 | Sesión manual **encendida** y válida | Recargar *Mi compañía* | «Conectado», sin botón |
| 2 | Manual **apagada**; en la base, sin cookies y sin desenlace | Recargar | El texto 7 y el botón encendido |
| 3 | Igual, con el desenlace *credenciales rechazadas* escrito en la base | Recargar | El texto 4, botón apagado |
| 4 | Igual, con el desenlace *agotó los intentos* | Recargar | El texto 6, botón encendido |
| 5 | Igual, con veinte intentos y el inicio de ventana **de hace una hora** | Recargar | El texto 5, botón apagado |
| 6 | Igual, con veinte intentos y el inicio de ventana **de hace dos días** | Recargar | El texto 6 (la ventana venció), botón encendido |
| 7 | El caso 4, **sin la ruta del navegador** en el `.env` | Pulsar *Conectar* | «Conectando…» un instante y luego el texto 6 (la pieza termina en *sin configurar*, que no bloquea); nada se lanzó. En el registro del backend, la ráfaga con ese desenlace |
| 8 | El caso 3 | Pulsar *Conectar* si el botón se ve (no debería) o llamar la ruta a mano | La respuesta dice que no hay ráfaga y sigue bloqueada; **el bloqueo no se liberó** (comprobar en la base) |
| 9 | El caso 4; en las herramientas del navegador, **bloquear solo la petición del estado** | Recargar | «No se pudo comprobar la sesión», botón apagado |
| 10 | El caso 4 | *Editar conexión*, reteclear la contraseña y guardar | La etiqueta se vuelve a pedir; con la manual apagada y sin ruta del navegador, «Conectando…» brevísimo y luego el texto 6 |
| 11 | Un usuario con un rol que **no puede editar la empresa** | Abrir *Mi compañía* | **No ve la sección** de etapas del flujo, ni la fila, ni la etiqueta, ni el botón (trampa 8) |

**Quién los corre:** el usuario, con la rama entera, como los del 6.1 y el 6.2b — no hay entorno local
y quien ejecuta no maneja un navegador (opinión previa). El ejecutor los deja escritos en
`pruebas-a-mano.md` con esta numeración y el reporte lo dice así.

**Lo que no se prueba en local, a sabiendas:** «Conectando…» durante minutos y el paso a «Conectado»
por una ráfaga real. Es la comprobación real del punto 7d de `before-deploy.md`, en el servidor de
pruebas, y desde este paso se puede hacer **desde la pantalla**: guardar la conexión o pulsar Conectar.

## Verificación

Backend: `npm run build` y `npm test`, una vez sobre el conjunto, con la caché de Jest limpia. Portal:
`npm run typecheck`. Los casos a mano, con su resultado, en el reporte.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real, y **la tabla de casos a mano con el
   resultado de cada uno**.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief** — en particular dónde se compuso la
   lectura de los cuatro datos y cómo se llaman.
4. **Confirmación** de que `status` no cambió, de que el botón no libera el bloqueo ni salta el tope, y
   de que el sondeo solo corre con ráfaga en curso y se cancela al salir.
5. **Los textos tal como quedaron**, en los dos idiomas.
6. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos, **y la lista de los
   identificadores nuevos**, parámetros de funciones flecha incluidos.
7. **Los documentos actualizados.**
8. **Un mensaje de commit** por repositorio.

## Revisión del diff (2026-09-16)

Verificado por el planificador sobre el conjunto, con la caché de Jest limpia: **backend, compila, 123
suites y 1.290 pruebas (1.281 pasan, 9 omitidas)**, nueve más que el 2c.2; **portal, tipos limpios**.
Todo en el índice en los tres repositorios. La regla de la etiqueta sigue el orden corregido
(*conectado* primero); la ruta *Conectar* pide la sesión antes de describirla y lleva el permiso de
escritura; el adaptador no cambió. **El texto 7 lo sustituyó el planificador** en los textos del
portal, el flujo y las pruebas a mano, a petición del usuario: no es decisión del ejecutor.

**Una afirmación existente cambió**: la prueba del estado de sesión pasa de igualdad exacta a «contiene
el estado». Justificado —la respuesta crece a propósito— y la forma entera la afirma la prueba nueva.

**Aprobado con tres arreglos.**

### 1 · Lo que hay que arreglar antes de commitear

🔴 **El sondeo sigue vivo después de salir de la pantalla.** Al desmontar se cancela el temporizador,
pero si en ese momento hay una petición de estado en vuelo, su respuesta llega después, **sigue siendo
«la última pedida»** —nada subió el contador— y, si dice *ráfaga en curso*, programa un temporizador
nuevo: Marta sale de *Mi compañía* durante una ráfaga y el navegador sigue preguntando cada cinco
segundos hasta doce minutos. Es la trampa 5. El arreglo: la limpieza al desmontar **también sube el
contador**, para que cualquier respuesta tardía se descarte. Sin pruebas automáticas en el portal: se
añade un caso a mano (abajo).

🔴 **Al llegar a los doce minutos el sondeo para sin preguntar una última vez.** La etiqueta se queda en
«Conectando…» con el botón apagado hasta recargar. Se alcanza: una ráfaga admite tres intentos que
cuentan más uno de red que no cuenta, cada uno con tope duro de tres minutos, más dos esperas de 25
segundos — casi trece minutos. El alcance 4 pedía pedir el estado una última vez y parar. El arreglo:
al llegar al tope, **una petición más que no programe otra**.

⚠️ **La prueba «no libera el bloqueo» no muerde.** Afirma que el doble del servicio no tiene la
operación de liberar, y no la tiene porque el doble no la define: pasaría aunque el controlador la
llamara. El arreglo: definirla en el doble como función espía y afirmar que **no se llamó**, con su
control negativo.

### 2 · Lo que queda anotado y no es de este paso

- **Guardar la conexión puede no enseñar «Conectando…».** El guardado responde antes de que la
  renovación libere el bloqueo y tome el candado (el 2c.2 escribe en la base primero), y el portal
  pide el estado justo después. En la práctica la ruta de estado consulta antes a PsicoAlianza, que
  tarda más que esa escritura, así que casi siempre llega con la ráfaga ya en curso; si no, la etiqueta
  enseña el estado anterior hasta recargar. No se ve en local —sin navegador la ráfaga termina al
  instante—: **mirarlo en la comprobación real del 7d**, guardando la conexión desde la pantalla.
- Con la petición de estado fallida el botón **no se muestra**, en vez de salir apagado como decía el
  alcance 3. Equivalente para quien mira; el flujo ya lo documenta así. Sin acción.

### 3 · Casos a mano que se añaden

Al final de la sección del 2c.3 en `pruebas-a-mano.md`:

| # | Cómo se prepara | Qué se hace | Qué se tiene que ver |
| --- | --- | --- | --- |
| 12 | Manual apagada; en la base, sin cookies y sin desenlace; **`PSICOALIANZA_CHROMIUM_PATH` apuntando a un ejecutable que tarde** o, si no se puede preparar, se omite y se dice | Pulsar *Conectar* y, mientras dice «Conectando…», ir a otra pantalla del portal | En la pestaña de red del navegador, **ninguna petición más** al estado de sesión tras salir |

### 4 · Segunda ronda (2026-09-16) — ✅ cerrado

Los tres arreglos están hechos, leídos por el planificador en el código: la limpieza al salir de la
pantalla sube el contador de «última respuesta pedida» además de cancelar el temporizador; al tope de
doce minutos se para y se pide el estado una última vez sin programar otra; la prueba de «no libera el
bloqueo» define la operación como espía y afirma que no se llamó, con control negativo hecho por el
ejecutor sobre el código. Caso a mano 12 añadido. Verificado por el planificador con la caché limpia:
**backend, compila, 123 suites y 1.290 pruebas (1.281 pasan, 9 omitidas)**, mismo número porque solo
se reescribió una afirmación; **portal, tipos limpios**. Todo en el índice en los tres repositorios.
Los dos arreglos del portal **no tienen prueba automática**: se comprueban con los casos a mano, que
corre el usuario con la rama entera.
