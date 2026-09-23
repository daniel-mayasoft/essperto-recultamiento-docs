# Brief · Etapa 3, paso 2c.2 — cuándo se consigue la sesión

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 43** (*Lo que le pasa a una candidata* y *Protecciones*), **en la 44** (por qué guardar la
conexión no espera al login), **en la 47** (qué guarda el almacén) **y en la 52** (cómo se reparte el
2c, la renovación anticipada, la cadencia) **y sobre todo en la 54**, que es lo decidido para este
paso y corrige a las anteriores donde dicen otra cosa. Toca solo el backend.

> Escrito el 2026-09-15 leyendo la pieza que consigue la sesión (2c.1) y su tipo de resultado, el
> almacén de sesión (2d), el cliente de PsicoAlianza, el adaptador de PsicoAlianza, la lectura única de
> conexiones, la ruta que guarda una conexión (5b), el cron de resultados y la guarda contra pasadas
> solapadas, la tarea de cada seis horas que recorre las conexiones de EvaluaTest, la alerta a soporte
> del servicio de correo, el esquema de la conexión de la empresa y el esquema de entorno.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md`.
2. `../CLAUDE.md` y `../../esscoti-backend/CLAUDE.md`.
3. `integrate-psicoalianza.md` — decisiones **42, 43, 44 (con su corrección), 47, 52 y 54**; en la
   tabla de pasos de *Dónde va la etapa 3*, las filas **2c.1, 2c.2 y 2c.3**.
4. `flujo-actual-etapa-psicometrica.md` — §*Las piezas*, §*Si el arranque falla* y §3, que son lo que
   este paso cambia.
5. `brief-etapa3-paso2c-1-acunador-de-sesion.md` — la pieza que este paso llama, y su *Revisión del
   diff*, que deja anotado lo que este paso hereda.
6. En el backend: la pieza que consigue la sesión (qué recibe, qué devuelve, qué lanza), el almacén de
   sesión (qué escribe y por dónde), el cliente (la comprobación barata de sesión), el adaptador de
   PsicoAlianza (dónde atrapa *sesión caducada* y dónde la deja subir), la ruta que guarda una conexión
   en el servicio de empresas, la alerta a soporte del servicio de correo de AWS, la tarea de
   sincronización de perfiles de EvaluaTest (como precedente de tarea que recorre conexiones), el
   esquema de la sesión en la conexión de la empresa y el esquema de entorno.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. **El 2c.1 está commiteado**
(es el último commit de la rama); compruébalo igual.

## El caso

**Marta**, reclutadora, guarda en *Mi compañía* el correo y la contraseña de PsicoAlianza de su
empresa a las 10:00. Se guarda al instante. Por detrás, el backend arrienda una IP móvil, lanza
Chromium, entra y guarda la sesión. Cuando Marta recarga, un par de minutos después, la fila dice
*Conectado* — la etiqueta es del 2c.3; **este paso deja escrito lo que la etiqueta va a leer**.

Cuatro días después, a la hora en punto, una tarea ve que esa sesión ya tiene cuatro días y consigue
una nueva **antes** de que muera. Marta no se entera. Si esa noche el captcha rechaza los tres
intentos, la tarea espera una hora y lo intenta otra vez; le quedan veinte horas de sesión viva.

**Ana**, candidata, termina las preguntas de WhatsApp una madrugada en que la sesión murió antes de
tiempo. La invitación falla, Ana recibe *«en breve recibirás un correo»*, y el fallo **dispara por
fuera** una ráfaga de intentos. El cron la reintenta cada cinco minutos; en el primer tick con la
sesión nueva, Ana recibe su enlace. Perdió media hora, no el proceso.

Si PsicoAlianza rechaza las credenciales, nadie insiste: la tarea deja esa conexión en paz hasta que
alguien guarde credenciales otra vez, y a los desarrolladores les llega un correo con la empresa y el
motivo. Si el captcha no pasa en todo el día, al llegar al tope de intentos sale otro correo.

**Toca el embudo** —el adaptador dispara la renovación desde la invitación y la consulta— y **una ruta
de producción** —guardar la conexión ahora dispara un intento por detrás—. Tratamiento completo.

## Lo decidido con el usuario (2026-09-15)

Está entero en la **decisión 54** de la bitácora: la tarea cada hora, la pasada que no espera, una
sola ráfaga de tres, el bloqueo ante credenciales rechazadas hasta el próximo guardado, el guardado
que dispara, la primera conexión que se consigue sola, el tope por ventana de 24 horas, el candado en
memoria, los números por variable, y **los textos de la etiqueta aprobados para el 2c.3** — que aquí
solo importan para saber qué tiene que poder leer la pantalla: este paso no los escribe en ninguna
parte. **Si algo de este brief contradice la 54, gana la 54 y se avisa.**

## Alcance exacto

Números por defecto, todos por variable (punto 6): **3** intentos por ráfaga, **60** minutos entre
ráfagas, **20** intentos por ventana de 24 horas, renovar a los **4** días.

### 1 · La sesión de la conexión gana su contabilidad

En el subdocumento de sesión de la conexión (el que hoy tiene las cookies cifradas, la fecha en que se
consiguió y la de visto vivo), cuatro campos nuevos, todos opcionales y nulos por defecto:

| Campo | Qué guarda |
| --- | --- |
| Inicio de la ventana de intentos | Fecha. Cuando pasan 24 horas desde ella, la ventana se reinicia |
| Intentos en la ventana | Número. Suma **todos** los intentos de cada ráfaga, cuenten o no contra el captcha |
| Último intento | Fecha del **final** de la última ráfaga. Es lo que mide la hora de espera |
| Desenlace del último intento | Texto: el desenlace de la pieza (*entró*, *agotó los intentos*, *bloqueada*, *credenciales rechazadas*, *sin cookie de recuerdo*, *sin configurar*) o **`error`** si la pieza lanzó |

Nombres en inglés, consistentes con los que ya hay en ese subdocumento (la fecha de acuñado se
llama `mintedAt`: el vocabulario persistido del código es *mint*, y no cambia). Son campos
persistidos nuevos: se nombran una vez y no se renombran.

**Bloqueada** significa, para todo este paso: el desenlace del último intento es *credenciales
rechazadas*. Solo ese. No es un campo: se deduce. (El desenlace *bloqueada* de la pieza —«demasiados
intentos», el límite temporal del sitio— **no** bloquea: se trata como *agotó los intentos*; decidido
por el usuario el 2026-09-15 en la opinión previa.)

### 2 · El almacén lee y escribe esa contabilidad

El almacén sigue siendo **el único que escribe** en el subdocumento de sesión. Gana:

- **Leer el estado de la sesión de una empresa** sin descifrar nada: identificador de la conexión, si
  hay cookies guardadas, la fecha en que se consiguió, y los cuatro campos nuevos. Lanza *sin
  conexión* —el error que ya usa la lectura única— si la empresa no tiene conexión de PsicoAlianza.
- **Anotar el final de una ráfaga**: suma los intentos (reiniciando la ventana si pasaron 24 horas o
  si nunca hubo), escribe la fecha del último intento y el desenlace. Escribe por el mismo camino que
  ya localiza la conexión por su identificador.
- **Liberar el bloqueo**: poner el desenlace en nulo. Lo llama el guardado de la conexión (punto 5).

Con **la sesión manual del `.env` encendida**, la lectura devuelve lo que haya en la base igual —la
renovación no llega a llamarla, punto 3—.

### 3 · La pieza nueva: la renovación de la sesión

Un servicio inyectable en la carpeta de PsicoAlianza de la capa psicométrica, con **una operación
pública: pedir una sesión para una empresa**, que **vuelve al instante** y hace el trabajo por fuera,
con su propio atrapa-errores (trampa 11). La tarea del punto 4 usa **la misma regla en su forma que
espera** —una ráfaga detrás de otra—; la pública es solo la envoltura que no espera. Recibe la
empresa, el motivo (para el registro: *vence*, *no hay*, *muerta*, *credenciales guardadas*) y si
debe saltarse la hora de espera. La regla, en orden, y **en cuanto una falla, no se hace nada y se
registra por qué**:

1. **Sesión manual encendida** → nada. Ni lee la base.
2. **Hay una ráfaga en curso** —de esta empresa o de cualquier otra— → nada. El candado es un solo
   valor en memoria: qué empresa está en ráfaga, o ninguna. Una sola ráfaga a la vez en todo el
   backend: dos Chromium a la vez doblan la memoria (43).
3. **Bloqueada** (punto 1) → nada.
4. **Ventana y tope**: si la ventana venció o nunca hubo, se considera vacía. Si los intentos de la
   ventana llegan al tope → nada.
5. **Hora de espera**: si el último intento fue hace menos de la espera y **no** se pidió saltarla →
   nada. Se salta solo desde el guardado de credenciales (punto 5) y, en el 2c.3, desde el botón.
6. **La ráfaga**: se toma el candado, se llama a la pieza con el máximo de intentos por ráfaga,
   **dentro de un bloque que suelta el candado pase lo que pase**. Si la pieza lanza —el proxy sin
   configurar lanza al arrendar, y *sin conexión* lanza al resolver—, el desenlace es `error`, sin
   intentos.
7. **Después**: se anota el final de la ráfaga en el almacén (punto 2) y, si toca, sale el correo.

**El correo a los desarrolladores** sale cuando la ráfaga **no** consiguió sesión **y** se cumple una
de dos: el desenlace es **distinto del anterior** guardado, o **con esta ráfaga se llegó al tope**.
Así *sin configurar* avisa una vez y no cada hora, *credenciales rechazadas* avisa la primera vez, y
*agotó los intentos* solo avisa al tocar el tope. Va por la alerta a soporte que ya existe. Asunto:
**«PsicoAlianza — no se pudo conseguir la sesión de {empresa}»**. Cuerpo, una línea cada uno: la
empresa (nombre e identificador), el motivo del disparo, el desenlace, los intentos de la ráfaga con
su clasificación y segundos, los intentos de la ventana frente al tope, si hay sesión guardada y de
cuándo, y qué hacer según el desenlace (*credenciales rechazadas*: revisar la contraseña en *Mi
compañía*; *sin configurar* y `error`: el mensaje de la pieza; tope: nada hasta la ventana
siguiente, o el botón del 2c.3). Si el último intento dejó captura, **se adjunta**; si el archivo no
se puede leer, va sin adjunto y no falla. Son textos para desarrolladores: no los aprueba el usuario,
pero van en el reporte.

**Lo que la pieza expone para el 2c.3**: nada más que lo persistido y **si hay una ráfaga en curso
para una empresa**, que es lo único que no está en la base. El 2c.3 añade lo que su pantalla necesite.

### 4 · La tarea de cada hora

En el mismo servicio, con el decorador de tareas de la casa, **a una hora fija cada hora, en un minuto
que no sea múltiplo de cinco** (el cron de resultados corre en los múltiplos de cinco; no se esperan
entre sí, pero mejor no coincidir). Con guarda contra solaparse, como la del cron de resultados. **No
corre al arrancar** el backend.

Por cada conexión de PsicoAlianza con credenciales completas —la lectura única ya sabe listarlas—, en
serie:

1. **Sesión manual encendida** → la tarea entera termina sin hacer nada.
2. **Bloqueada** → siguiente.
3. **Sin cookies, o sin fecha de conseguida, o conseguida hace cuatro días o más** → pedir sesión
   (motivo *no hay* o *vence*) y **esperar a que termine** antes de la siguiente empresa.
4. **Si no**, la comprobación barata del cliente: *viva* → nada; *muerta* o *no hay* → pedir sesión
   (motivo *muerta*) y esperar; **si la comprobación lanza** —red, PsicoAlianza caído— → registrar y
   siguiente, **sin pedir sesión**: gastar un intento por un parpadeo de red gasta reputación.

### 5 · Los tres disparos desde fuera

- **El adaptador de PsicoAlianza, al invitar**: hoy deja subir *sesión caducada* como fallo pasajero.
  Sigue subiendo igual, y **antes** pide sesión (motivo *muerta*). Sin esperar.
- **El adaptador, al consultar resultados**: hoy atrapa cualquier error y devuelve *no se pudo
  consultar*. Sigue igual, y **si el error es *sesión caducada***, pide sesión antes de devolver.
- **La actualización de la empresa** (5b, en el servicio de empresas): si la conexión de
  **PsicoAlianza** que **queda guardada** está completa —correo y contraseña cifrada, venga la
  contraseña en el cuerpo o se conserve la de antes (41)—, **después de que la base escriba y antes de
  responder**, libera el bloqueo (punto 2) y pide sesión (motivo *credenciales guardadas*, **saltando
  la hora de espera**; el tope no se salta). Si la escritura falla, no hay ráfaga. La respuesta al
  portal no cambia ni espera. Renombrar la conexión también dispara: es inofensivo y evita depender de
  qué mande cada portal. Con EvaluaTest, o al quitar la conexión, nada. **La creación de una empresa**
  —solo administración— arma la misma lista pero **no dispara**: su primera sesión la consigue la
  tarea de la hora (opinión previa).

**Ningún otro sitio dispara**: ni la comprobación de estado de la sesión (la ruta del 5b que lee la
etiqueta), ni el listado de vacantes, ni la comprobación de una vacante, ni la validación de la
conexión. Eso lo decide el 2c.3.

### 6 · Cuatro variables de entorno

Opcionales, con valor por defecto, y **vacío cuenta como el valor por defecto** (el patrón del 2b):
intentos por ráfaga (3), minutos entre ráfagas (60), tope de intentos por ventana (20), días para
renovar (4). Nombres con el prefijo de PsicoAlianza. Enteros positivos; el esquema rechaza lo demás.

### 7 · Registro

Cada decisión de la regla del punto 3 que termina en «nada», con la empresa y el motivo, en nivel
depuración salvo el tope y el bloqueo, que van en aviso. Cada ráfaga: empresa, motivo, desenlace,
intentos, segundos. **Nunca** contraseña, usuario del proxy ni valor de cookie — la pieza ya lo cumple;
este servicio tampoco los recibe, pero se comprueba en la prueba del registro.

## 🔴 Dónde se para — qué NO se hace

- **Ni etiqueta, ni botón, ni ruta nueva** para el portal (2c.3). Este paso no toca el portal.
- **No se toca el cron de resultados ni el arranque de la etapa** en el orquestador: el disparo va en
  el adaptador. El que espera sin plazo porque no tiene identificador es **otro paso** (A1/A5).
- **No se toca la pieza que consigue la sesión** (2c.1) ni el cliente, salvo que la opinión previa
  encuentre motivo, y entonces se dice antes.
- **No se toca la comprobación de estado** que lee la etiqueta de hoy.
- **La sesión manual no cambia**, y con ella encendida este paso es inerte.
- **No se mide la tasa.** Los números van por variable justo porque no está medida (corrección de la
  52).
- **No se toca el Dockerfile ni ningún compose.**

## 🔴 Las trampas

**1. Dos Chromium a la vez.** El candado es global, no por empresa. La tarea recorre las empresas en
serie y **espera** cada ráfaga; los disparos desde el adaptador y desde el guardado, si encuentran el
candado tomado, **no encolan**: el siguiente tick del cron, o la siguiente hora, vuelve a pedir.

**2. El candado se suelta pase lo que pase.** La pieza tiene tiempo límite duro por intento
(tres minutos), así que una ráfaga termina siempre; pero el bloque que suelta el candado va en un
`finally`, y la anotación en el almacén y el correo van **fuera** de él: si el correo falla, el candado
ya está libre.

**3. La sesión manual manda al leer, y también al conseguir.** Con el interruptor encendido, el
almacén devuelve la pegada para todas las empresas y una sesión conseguida se guardaría en la base
**sin que nadie la usara**. Por eso la regla 1 del punto 3 va antes de todo, y la tarea entera termina
ahí.

**4. En local, sin sesión manual y con las variables de la pieza, la tarea entra de verdad con la
cuenta del cliente cada hora que haga falta.** No es un fallo: es lo que hace. Pero quien levante el
backend en su máquina tiene que saberlo: o la sesión manual encendida, o sin la ruta del navegador.
Va a `../entorno-local.md`.

**5. La conexión puede desaparecer a mitad de ráfaga.** Si alguien quita la conexión mientras Chromium
está entrando, la escritura del almacén no encuentra la conexión y **no escribe nada**; la anotación
de la ráfaga tampoco. No es error: se registra y ya.

**6. Solo *credenciales rechazadas* bloquea.** Es el único desenlace que no se arregla reintentando.
El desenlace *bloqueada* de la pieza es el límite temporal del sitio («demasiados intentos») y se
levanta solo: cuenta intentos y respeta la hora de espera, como *agotó los intentos*, *sin cookie de
recuerdo* y *sin configurar*. Una ráfaga que lo encuentra termina ahí (la pieza para en seco), así que
cuesta un intento, no tres.

**7. La ventana se reinicia al leer, no con un reloj.** Nada corre a medianoche: al pedir sesión, si
el inicio de la ventana tiene 24 horas o más, se considera vacía. Por eso el campo guarda el *inicio*,
no un día de calendario, y no hay zona horaria que acordar.

**8. La comprobación barata también escribe.** *Viva* marca «visto vivo» en la base, como hoy desde
la etiqueta: una escritura por conexión y hora. Es lo esperado, no un efecto raro del que asustarse en
las pruebas.

**9. El proxy sin configurar lanza, no devuelve.** La pieza comprueba la ruta del navegador y la
carpeta **antes** de arrendar y devuelve *sin configurar*; pero el proxy sin variables **lanza** al
arrendar. Por eso el punto 3 atrapa lo que la pieza lance y lo anota como `error`.

**10. Una fecha de conseguida vacía con cookies presentes es una sesión insertada a mano** (servidor
de pruebas, o local sin manual). Se trata como *vence*: se consigue una nueva una vez, y desde ahí
tiene fecha.

**11. La regla de disparo del adaptador no debe esperar.** *Pedir sesión* vuelve al instante y hace el
trabajo por fuera **con su propio atrapa-errores**: una promesa suelta que rechace tumba el proceso.

## Opinión previa del ejecutor (2026-09-15), verificada e incorporada

Los puntos, uno por uno, con lo comprobado por el planificador en el código:

1. **Dos escritores de la lista de conexiones** — cierto: la crea la creación de empresa y la
   actualiza la actualización. **Aceptado**: dispara solo la actualización; la creación queda para la
   tarea de la hora. Está en el punto 5 del alcance.
2. **«Con correo y contraseña» era ambiguo** — cierto: el backend conserva la contraseña guardada si
   el cuerpo la trae vacía (41). **Aceptado**: la condición es que la conexión **resultante** quede
   completa. Punto 5 y pruebas actualizados.
3. **El disparo después de escribir y antes de responder** — aceptado, y si la escritura falla no hay
   ráfaga.
4. **El motivo desde el adaptador** sale de la causa del error de sesión: *no hay* sin cookies, *muerta*
   en los demás casos. Aceptado; es solo registro.
5. **«Bloqueada» es probablemente un límite temporal** — comprobado en el clasificador: se clasifica así
   cualquier texto con «demasiados» o «bloquead», y «demasiados intentos» es el mensaje del límite
   temporal del sitio, que se levanta solo en minutos. Parar la conexión hasta el próximo guardado, como
   dice la 54, castiga de más a un fallo que se arregla esperando. **Se le pregunta al usuario**; ver
   *Pendiente* abajo.
6. **La tarea puede tardar más de una hora** con varias empresas: hasta tres intentos de hasta tres
   minutos por empresa, en serie. Cierto. La guarda salta el tick y, mientras la tarea tiene el candado,
   los disparos del adaptador y del guardado no hacen nada y se registran. Es lo previsto; queda dicho.
7. **Minuto 17 de cada hora** — comprobado: ningún cron del backend cae ahí. Aceptado.
8. **El tope se compara con «mayor o igual»** al empezar: con 18 en la ventana sale una ráfaga más, se
   anotan 21 y esa ráfaga «toca el tope» y avisa. Es lo que piden las pruebas. Aceptado.
9. **La alerta lanza si el envío falla** — cierto; la envoltura lo atrapa (trampa 2).

**Decisiones de forma, aceptadas:** un servicio `PsicoalianzaSessionRenewal` con *pedir sesión*, *hay
ráfaga en curso para una empresa* y la tarea de la hora; depende de la pieza del 2c.1, del almacén,
del cliente, de la lectura única y del correo, y el adaptador depende de él, sin ciclo. Campos del
subdocumento de sesión: `attemptWindowStartedAt`, `attemptsInWindow`, `lastAttemptAt`,
`lastAttemptOutcome`. Variables: `PSICOALIANZA_LOGIN_ATTEMPTS_PER_BURST`,
`PSICOALIANZA_LOGIN_BURST_COOLDOWN_MINUTES`, `PSICOALIANZA_LOGIN_ATTEMPTS_PER_WINDOW`,
`PSICOALIANZA_SESSION_RENEWAL_DAYS`. El mensaje de un desenlace `error` va al registro y al correo,
no a la base.

**Resuelto por el usuario el mismo día:** el desenlace *bloqueada* de la pieza se trata como *agotó
los intentos* — cuenta intentos, respeta la hora de espera, la siguiente ráfaga sale sola, correo la
primera vez; en la etiqueta del 2c.3 cae en «Conexión fallida — vuelve a intentarlo» con el botón
encendido. **Bloqueada, para este paso, es solo *credenciales rechazadas*.** La 54 está corregida
en ese punto. Se puede empezar.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **El backend arranca igual sin las variables nuevas** y con la sesión manual encendida | Máquinas del equipo y servidor de pruebas |
| **La pieza que consigue la sesión, el cliente y el almacén** en lo que ya hacen | La operación nueva del almacén se añade al lado |
| **El adaptador, en lo que devuelve y lanza**: *sesión caducada* sigue subiendo al invitar; *no se pudo consultar* sigue volviendo al consultar | El orquestador no se toca y depende de eso |
| **La ruta que guarda una conexión, en lo que responde y guarda**: mismo cuerpo, misma respuesta, la sesión se conserva (46) | Es una ruta de producción |
| **Compilación y pruebas en verde** | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Sin lint ni formateador, **sin comentarios nuevos en código**,
identificadores en inglés —también los parámetros de las funciones flecha—, los nombres de los campos
nuevos se eligen una vez. Ningún secreto en ningún archivo. La solución más pequeña. Sin commitear y
todo al índice. Finales de línea de cada archivo.

**Documentación en el mismo diff:**
- `flujo-actual-etapa-psicometrica.md` — en §*Las piezas*, la renovación de la sesión en una frase; en
  §*Si el arranque falla*, que con PsicoAlianza la sesión muerta **dispara la renovación** y el cron la
  reintenta (la persona sigue esperando **sin plazo** hasta el paso A1/A5: eso no cambia aquí); en §3,
  que *no se pudo consultar* por sesión muerta dispara la renovación; en §1, que guardar la conexión de
  PsicoAlianza dispara un intento por detrás y que la etiqueta de hoy todavía no lo enseña (2c.3).
- `before-deploy.md` — en la fila 8, las cuatro variables con sus valores por defecto y que
  **`ALERT_SUPPORT_EMAILS` tiene que estar puesta** o los correos de este paso no salen; en la fila 6,
  que **el 2c.2 está** y falta solo el 2c.3; en el punto 7d, **una alternativa**: desde este paso la
  comprobación real se puede hacer **por el código de producción** —conexión guardada desde *Mi
  compañía* en el servidor de pruebas, o insertada en su base, y esperar la tarea de la hora—, que es
  mejor que el script con piezas falsas porque prueba el camino real. Las reglas de intentos del 7d se
  cumplen solas: una ráfaga de tres y una hora entre ráfagas, con el tope de veinte.
- `../entorno-local.md` — las cuatro variables en la tabla del `.env`; y en *PsicoAlianza, dos formas
  de tener sesión*, la trampa 4 tal cual.
- `../CLAUDE.md` — en *Dónde está lo importante*, cambiar «nadie la llama todavía» por quién la llama:
  la renovación de la sesión, cada hora y a demanda.

## Pruebas

**Automáticas**, sin navegador, sin red y sin base: la pieza que consigue la sesión, el almacén, el
cliente, la lectura única y el correo se reemplazan por dobles. Relojes simulados donde haya fechas.

**La regla de pedir sesión:**

- **Sesión manual encendida** → no lee el almacén, no llama a la pieza.
- **Candado tomado por otra empresa** → no llama a la pieza; al soltarse, una petición nueva sí.
- **Bloqueada** (*credenciales rechazadas* como último desenlace) → no llama; **tras liberar el
  bloqueo, sí**.
- **Tope alcanzado dentro de la ventana** → no llama. **Ventana de 24 horas cumplida** → se considera
  vacía, llama, y la anotación trae inicio nuevo y cuenta igual a los intentos de la ráfaga.
- **Último intento hace 30 minutos** → no llama. **Hace 61** → llama. **Hace 30 con «saltar la
  espera»** → llama. **Tope alcanzado con «saltar la espera»** → no llama.
- **La pieza devuelve *entró* con dos intentos** → la anotación suma dos, desenlace *entró*, sin correo.
- **La pieza devuelve *agotó los intentos* y la cuenta queda por debajo del tope** → sin correo. **Y con
  la ráfaga se llega al tope** → un correo, cuyo asunto nombra a la empresa y cuyo cuerpo trae el tope.
- **La pieza devuelve *credenciales rechazadas*** → correo. **Tras liberar el bloqueo y volver a
  pedir, otra vez *credenciales rechazadas*** → **correo otra vez**: liberar el bloqueo borra el
  desenlace anterior, y que la contraseña recién guardada siga mal es justo lo que hay que contar.
  **Dos ráfagas seguidas con *agotó los intentos*, sin tocar el tope** → ningún correo.
- **La pieza lanza** (el error del proxy sin configurar) → el candado queda libre, la anotación trae
  cero intentos y desenlace `error`, y sale correo; **la hora siguiente, mismo error** → sin correo.
- **El correo falla** → el candado ya estaba libre y la anotación ya estaba escrita; el fallo se registra
  y la promesa no rechaza.
- **La pieza devuelve captura en el último intento** → el correo lleva un adjunto; **si la captura no se
  puede leer** → sin adjunto y sin fallar.
- **El registro** de una ráfaga con éxito y de una fallida no contiene contraseña, usuario del proxy ni
  valor de cookie (precedente de espiar el registro en la prueba de paridad).

**La tarea de cada hora:**

- **Tres conexiones**: una con sesión de dos días y viva, una de cinco días, una sin cookies → llama a
  la pieza para la segunda y la tercera, **en ese orden y una después de otra**, y para la primera solo
  la comprobación barata.
- **Sesión de dos días y la comprobación dice *muerta*** → llama. **La comprobación lanza** → no llama y
  sigue con la siguiente.
- **Bloqueada** → ni comprueba ni llama.
- **Sesión manual encendida** → no toca ninguna conexión.
- **Un tick mientras el anterior sigue** → se omite.
- **Sin fecha de conseguida y con cookies** → llama (trampa 10).

**El adaptador:**

- **Invitar con la sesión caducada** → pide sesión (con la empresa y el motivo *muerta*) **y** sigue
  lanzando *sesión caducada*. **Invitar con otro error** → no pide sesión.
- **Consultar resultados con la sesión caducada** → pide sesión **y** devuelve *no se pudo consultar*
  para todos. **Con otro error** → no pide, y devuelve lo mismo que hoy.
- Las pruebas existentes del adaptador **no cambian ninguna afirmación**: solo ganan el doble de la
  renovación en el montaje.

**El guardado de la conexión (5b):**

- **Actualizar con PsicoAlianza completa** → después de que la base escriba, libera el bloqueo y pide
  sesión saltando la espera; la respuesta es la misma de hoy. **Renombrar sin mandar contraseña**, con
  la guardada conservada → también pide. **Si la escritura de la base falla** → no pide.
- **Actualizar con EvaluaTest** → no pide. **Quitar la conexión** (sin correo ni contraseña) → no pide.
  **Crear una empresa con conexión** → no pide.
- Las pruebas existentes de la ruta **no cambian ninguna afirmación**.

**El almacén:**

- **Anotar una ráfaga** con ventana vencida → inicio nuevo y cuenta igual a la ráfaga; **con ventana
  viva** → suma; escribe la fecha y el desenlace; **liberar el bloqueo** deja el desenlace en nulo y no
  toca lo demás. **Leer el estado** devuelve los campos sin descifrar y *sin conexión* si no la hay.

**El cableado**: el módulo de ofertas declara la renovación; la prueba de cableado existente se amplía.

**El esquema de entorno**: las cuatro variables aceptan vacío y toman el valor por defecto; rechazan
cero y negativos.

⚠️ Control negativo en la de *candado tomado por otra empresa*, en la de *ventana de 24 horas
cumplida* y en la del adaptador al invitar; borrarlos y limpiar la caché.

**Sin comprobación real en este paso**: no hay entorno local con base (2c.1), y el servidor de pruebas
todavía no tiene la imagen con Chromium. La comprobación real de este paso **es el punto 7d de
`before-deploy.md`**, por el camino que este paso deja escrito ahí.

## Verificación

Una vez sobre el conjunto: `npm run build` y `npm test` en el backend, con la caché de Jest limpia.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Los nombres de los cuatro campos nuevos** del subdocumento de sesión y **de las cuatro variables**,
   tal como quedaron.
5. **Confirmación** de que el orquestador no cambió, de que el adaptador sigue lanzando y devolviendo lo
   mismo, de que la ruta de guardado responde lo mismo, y de que con la sesión manual encendida nada
   de este paso llama a la pieza.
6. **El texto del correo** a los desarrolladores, tal como quedó.
7. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos, **y la lista de los
   identificadores nuevos**, parámetros de funciones flecha incluidos.
8. **Los documentos actualizados.**
9. **Un mensaje de commit** por repositorio.

## Revisión del diff (2026-09-15)

Verificado por el planificador sobre el conjunto, con la caché de Jest limpia: **compila, 123 suites y
1.279 pruebas (1.270 pasan, 9 omitidas)**, dos suites y 45 pruebas más que la base. Todo en el índice,
nada sin rastrear, ningún merge nuevo. **Ninguna afirmación existente se quitó**: las tres únicas líneas
borradas son una llamada que se movió fuera de un argumento, el título de la prueba de cableado que se
reescribe más amplio, y el retorno de un ayudante de prueba que se amplía. Identificadores en inglés,
parámetros de flecha incluidos; sin comentarios nuevos en código. Los cuatro documentos vienen en el
diff y dicen lo que hace el código.

**Aprobado con dos arreglos y una menudencia.**

### 1 · Lo que hay que arreglar antes de commitear

🔴 **El candado se toma después de la primera espera, y ahí caben dos ráfagas.** *Pedir sesión*
comprueba que no hay ráfaga en curso, **luego espera la lectura del estado en la base, y solo después**
marca la empresa en curso. Dos peticiones que lleguen en esa ventana —el cron reintentando a dos
personas sin identificador de la misma empresa, o la tarea de la hora y una demanda del adaptador a la
vez— pasan las dos la comprobación, esperan las dos, y **lanzan dos Chromium**: justo la trampa 1. El
arreglo: **tomar el candado en el mismo tramo síncrono en que se comprueba**, antes de cualquier
espera, y soltarlo en el `finally` que ya existe, también en los caminos que terminan en «nada»
(bloqueada, tope, espera). Con su prueba: **dos peticiones en el mismo tick, sin asentar entre ellas**
→ una sola llamada a la pieza. La prueba de hoy asienta entre las dos y por eso no lo ve.

🔴 **Guardar la conexión de EvaluaTest dispara la ráfaga de PsicoAlianza.** El disparo mira si la
conexión de PsicoAlianza **que queda en la lista** está completa, sin mirar **qué bloque se guardó**. En
una empresa con las dos conexiones, guardar EvaluaTest libera el bloqueo de PsicoAlianza y lanza una
ráfaga saltando la espera. El brief dice «con EvaluaTest, nada» y la prueba que lo afirma usa una
empresa que solo tiene EvaluaTest, así que pasa sin comprobarlo. El arreglo: disparar solo cuando **el
proveedor del bloque guardado** es PsicoAlianza (el mismo resolvedor de proveedor que ya usa esa ruta),
además de que la conexión resultante quede completa. Con su prueba: **empresa con las dos, se guarda
EvaluaTest** → no pide.

### 2 · La menudencia

El consejo del correo para *agotó los intentos* nombra «el botón de Mi compañía», que no existe hasta
el 2c.3. Añadir «cuando exista» o quitarlo; es texto para desarrolladores.

### 3 · Lo que queda anotado y no es de este paso

- La comprobación real es el punto 7d de `before-deploy.md`, ya con la alternativa por el código de
  producción que este paso deja escrita.
- La etiqueta y el botón (2c.3) tienen todo lo que necesitan: los cuatro campos persistidos y *hay
  ráfaga en curso* en el servicio.

### 4 · Segunda ronda (2026-09-15) — ✅ cerrado

Los dos arreglos y la menudencia están hechos, leídos por el planificador en el código: el candado se
toma en el tramo síncrono, antes de la primera espera, y la lectura del estado, las tres
comprobaciones y la ráfaga viven dentro del bloque cuyo `finally` lo suelta; el disparo del guardado
exige que el bloque guardado sea de PsicoAlianza además de que la conexión resultante quede completa.
Verificado por el planificador con la caché limpia: **compila, 123 suites y 1.281 pruebas (1.272
pasan, 9 omitidas)**, tres más que en la primera ronda. Árbol e índice coinciden; nada fuera del
índice. El ejecutor anotó que su primer control negativo del candado dio verde sin morder —había roto
el código de una forma que serializa— y lo repitió con el fallo original: es el aviso que
`arranque-del-ejecutor.md` pide, y consta aquí.
