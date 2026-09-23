# Brief · Etapa 3, paso 2 — el cliente de PsicoAlianza, con la sesión ya abierta

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en los
otros `.md`**, sobre todo en las decisiones 41, 42 y 43 y en el contrato observado de la API. Toca
solo el backend.

> **Incorpora la opinión previa del ejecutor del 2026-09-13**, que corrigió tres afirmaciones que
> nadie había observado y encontró cinco huecos del diseño. Lo que cambió está marcado en su sitio.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../../CLAUDE.md` — el proyecto, y `../../../../esscoti-backend/CLAUDE.md` — las credenciales nunca en el
   código.
3. `integrate-psicoalianza.md` — la bitácora. Importan **41, 42 y 43**, *Confirmado de PsicoAlianza*
   y *Dónde va la etapa 3*.
4. `psicoalianza-api.md` — **el contrato observado, que es la fuente de todas las peticiones de este
   paso.** Lo de aquí no lo repite: si el brief y el contrato discrepan, gana el contrato y hay que
   decirlo.
5. En el backend, **la capa psicométrica como patrón a seguir**: la lectura única de conexiones, el
   adaptador de EvaluaTest, el cliente de EvaluaTest, un archivo por error propio, y el esquema de
   entorno.

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio. Si algo de aquí
no cuadra con el código o con el contrato, gana lo verificable y hay que decirlo.

## El caso

Dentro de unas semanas, el sistema tendrá que invitar a **Laura** a su prueba en PsicoAlianza y
después leer su resultado. Para eso hace falta alguien que sepa hablar con PsicoAlianza: pedirle la
lista de vacantes, preguntarle si ya conoce el documento de Laura, invitarla, encontrarla en el
tablero de la vacante y pedir su enlace personal. Eso es este paso, y nada más.

**La parte difícil —entrar— no se resuelve aquí.** PsicoAlianza no entrega un token: el login deja
una sesión en cookies, y conseguir esa sesión cuesta un Chrome saliendo por IP móvil (decisión 43),
que es el paso 2c. Este cliente **recibe la sesión ya abierta y la usa**. Mientras el 2c no exista,
la sesión la pega una persona a mano en el `.env` local (decisión 42).

**Hoy nadie lo llama.** Es un paso aditivo. Brief corto, una ronda.

🔴 **Pero "aditivo" no quiere decir "no toca nada existente", y aquí hay dos piezas compartidas con
EvaluaTest**, que es toda la etapa psicométrica que hoy corre en producción:

| Pieza compartida | Qué se le hace | Qué pasa si sale mal |
| --- | --- | --- |
| **La lectura única de conexiones** | Se le añaden dos entradas para PsicoAlianza (punto 3) | Tocar la entrada de EvaluaTest deja **a todas las empresas sin conexión**, y la etapa se salta en silencio (decisión 40) |
| **El esquema de la conexión en la empresa** | Un campo nuevo para la sesión (punto 2) | Nada, si solo se añade. **No se toca ninguno de los cuatro campos que ya existen** |

Todo lo demás es archivos nuevos que nadie importa. Esas dos piezas son las que piden cuidado, y
por eso hay una prueba dedicada a que EvaluaTest siga resolviéndose igual.

## Cómo tiene que quedar

| Pieza | Qué hace | Qué NO sabe |
| --- | --- | --- |
| **El almacén de sesión** | Guarda y entrega las cookies de PsicoAlianza de una empresa, cifradas, con sus fechas | Cómo se consiguieron |
| **El cliente** | Las peticiones del contrato, con esas cookies y el CSRF | De dónde salió la sesión, ni qué es un proveedor psicométrico |

El cliente **no hace login, no sabe qué es un captcha y no conoce ningún proxy.** El día que exista
el acuñador (2c), lo único que cambia es quién llena el almacén.

## Alcance exacto

1. **Una carpeta propia dentro de la capa psicométrica**, `psychometrics/psicoalianza/`, con el
   cliente, sus tipos y sus errores. El adaptador del paso 3 se pondrá al lado. **El identificador
   del proveedor es `psicoalianza`**, en minúsculas y sin tilde, junto al `evaluatest` que ya
   existe. 🔴 **Ese valor se va a guardar en la base** —en la conexión de la empresa y en cada
   candidato—, así que es **dato, no estilo**: se elige ahora y no se renombra después.

2. **El almacén de sesión**, un servicio propio de esa carpeta. Lee y escribe la sesión de
   PsicoAlianza de una empresa, **en su conexión**, en un campo hermano de `credentials` —no dentro
   de ella—: lo que el usuario configura y lo que el sistema acuña son cosas distintas y se leen en
   momentos distintos. Guarda las cookies **cifradas** con `encrypt`/`decrypt` y `SECRET_KEY`, como
   la contraseña, más cuándo se acuñaron y cuándo se vieron vivas por última vez.

   **Por qué no va en la lectura única de conexiones** (decisión 41): esa lectura es *la regla de
   lectura de credenciales*, y la sesión no es una credencial que alguien configure: es estado que
   el sistema escribe solo, varias veces al día. El almacén sí **usa** la lectura única para
   localizar la conexión de PsicoAlianza de la empresa. 🔴 **No pide la contraseña descifrada**: en
   este paso no hay login, así que nadie la usa hasta el 2c, y una lectura de credencial que no se
   usa es una lectura de más.

   🔴 **Cómo escribe, y esto no es un detalle** (levantado en la opinión previa del 2026-09-13 y
   verificado en el código): la ruta que guarda la conexión desde *Mi compañía* **lee la lista
   entera de conexiones, la reconstruye y la vuelve a guardar entera**. Si el almacén hiciera lo
   mismo, entre la lectura de uno y la escritura del otro se pierde lo que el primero escribió: una
   contraseña recién cambiada, o una sesión recién acuñada. **El almacén actualiza solo el campo de
   sesión de esa conexión, localizándola por su identificador**, sin tocar el resto de la lista.

   ✅ **Lo que sí está a salvo hoy, comprobado:** ese guardado solo reconstruye la conexión de
   EvaluaTest; las demás pasan intactas. Así que guardar credenciales de EvaluaTest **no** borra la
   conexión de PsicoAlianza ni su sesión. La carrera es por la escritura simultánea, no por el
   contenido.

   🔴 **El campo nuevo hay que declararlo en el esquema de la conexión.** Comprobado: ese esquema no
   está en modo permisivo, así que **un campo no declarado se descarta al guardar, sin ningún
   error** — la sesión parecería guardarse y no estaría.

   **Las cookies de la sesión pegada a mano no se escriben en la base.** Al `.env` no se puede
   escribir, y guardarlas en la conexión dejaría a esa empresa con una sesión que se usaría en
   cuanto alguien apague el interruptor, mezclando las dos fuentes. Se mantienen **en memoria
   mientras dure el proceso**, y solo para esa fuente. Al reiniciar se vuelven a leer del `.env`.

   **Cuándo se escribe *visto vivo por última vez*:** solo cuando la comprobación explícita de
   sesión responde *viva*, o cuando cambian las cookies. **Nunca en cada petición**: el cron hace
   varias por pasada cada cinco minutos, y serían escrituras continuas sobre el documento de la
   empresa. Esa comprobación es, de hecho, el único momento en que ese campo se escribe.

3. **La lectura única reconoce a PsicoAlianza.** Hay que añadir su entrada a las dos tablas que hoy
   solo tienen EvaluaTest: la de nombres para los mensajes y la de **campos obligatorios de la
   credencial**, que para PsicoAlianza son el correo y la contraseña cifrada. Ver la trampa 1: sin
   esto, toda conexión de PsicoAlianza se resuelve como inexistente.

   **Se añaden ahora aunque la contraseña no se use todavía**, y es deliberado: una conexión de
   PsicoAlianza sin contraseña no le sirve a nadie —el 2c la necesita para entrar y el paso 5 para
   validarla—, así que debe leerse como incompleta desde el principio y no el día que falle.

   **El identificador del proveedor se declara junto al de EvaluaTest, en la lectura única**, no en
   la carpeta nueva: así esa lectura no tiene que importar la carpeta que a su vez la usa. Es donde
   ya vive el de EvaluaTest.

4. **De dónde sale la sesión, en este orden**, y es la decisión 42 hecha código:

   1. **El interruptor está encendido Y hay cookies pegadas** en el `.env` → se usan esas. **Las dos
      condiciones**: una sola no basta.
   2. Si no → la sesión guardada en la conexión de la empresa.
   3. Si no hay ninguna → el error propio *sin sesión*.

   🔴 **El interruptor está apagado por defecto**, así que en los servidores no hay que acordarse de
   nada: una línea olvidada en un `.env` de producción no hace nada. Es el patrón de la casa —un
   booleano por comportamiento, apagado— y no un `MODE=DEV` general: un interruptor único se
   enciende por un motivo y habilita de paso todo lo demás.

   🔴 **Encendido, vale para todas las empresas a la vez**, así que todas hablarían con PsicoAlianza
   por la misma cuenta pegada: es la cuenta compartida que quitó la decisión 34, en pequeño. En
   local no importa —hay una empresa— y el valor por defecto lo protege en los servidores, pero por
   eso **el arranque lo anuncia como advertencia**, no como un aviso más. El arranque ya anuncia así
   los modos de depuración y demo.

5. **El cliente**, con las peticiones del contrato. Todas mandan las cookies y la cabecera que
   PsicoAlianza exige para sus endpoints de datos; los listados vienen envueltos en el sobre de su
   librería de tablas y el cliente lo desenvuelve:

   | Operación | Para qué servirá (paso 3) |
   | --- | --- |
   | Comprobar que la sesión sigue viva — **devuelve *viva* o *muerta*, y no lanza nunca** | Saber si hay que acuñar otra |
   | Pedir un CSRF fresco | Va antes de **cada** envío |
   | Listar vacantes activas | El selector del reclutador |
   | Consultar el correo de un documento | Obligatorio antes de invitar |
   | Invitar | Mandar a la persona a la vacante |
   | Traer los participantes de una vacante | Encontrar a la persona y leer su resultado |
   | Pedir el enlace personal | Lo que se le manda por WhatsApp |

   **Cada petición lleva su propio límite de tiempo**, armado con un temporizador que cancela: el
   límite nativo de Node no lo controlan los relojes simulados de Jest y su prueba no se podría
   escribir.

   **El token antifalsificación se busca por dos vías**, como hace el script de la evidencia, porque
   el contrato no dice cuál usa: primero como JSON con su campo, y si no, sacándolo del HTML de la
   página. **Un token que no aparece por ninguna de las dos es un error normal, no *sesión
   caducada***.

   ⚠️ **El cuerpo de la invitación queda marcado como sin verificar.** El contrato dice que va como
   formulario, pero **no** cómo se codifica dentro de él la lista de participantes, y uno de sus
   campos es un JSON metido como texto. Se escribe con la forma más probable, **aislada en un solo
   sitio** para poder corregirla de un toque, y se confirma invitando a una persona real en el paso
   3. Va en el reporte como supuesto.

6. **Un solo error propio: *sesión caducada*.** Es el único que quien llama trata distinto —manda
   acuñar una sesión nueva—, y por eso es un tipo, no un texto (decisión 39: un texto dura hasta que
   alguien lo reescribe). *Sin sesión* —no hay ninguna guardada ni pegada— es el mismo tipo con su
   motivo, porque quien llama hace lo mismo con los dos: conseguir una sesión. Lo demás es un error
   normal, como en EvaluaTest.

   🔴 **Se reconoce por cuatro formas, no por una** (corregido en la opinión previa del 2026-09-13:
   la versión anterior de este brief daba por hecho una sola, y **nadie ha observado cómo responde
   PsicoAlianza sin sesión**):

   | Forma | Estado |
   | --- | --- |
   | El formulario de login servido con 200 | **Observada**, en la evidencia del rechazo de captcha — pero sobre la **página de login**, no sobre un endpoint de datos |
   | Redirección a la página de login | **Supuesta** |
   | 401 | **Supuesta**: es lo que su framework responde por defecto a una petición marcada como de la propia página, que es justo la cabecera que manda el cliente |
   | 419 | **Supuesta**: es el código de su framework para *el token antifalsificación no vale*, que es lo típico de un envío con la sesión muerta |

   ⚠️ **Ojo con la redirección, porque lo observado es la inversa** (corregido en la segunda ronda de
   la opinión previa; la tabla la daba por observada y no lo está): lo que se ha visto es que **con
   la sesión viva**, pedir la página de login **lleva al inicio**, porque su framework echa del
   login a quien ya entró. Que una página protegida mande al login **sin** sesión no lo ha visto
   nadie: los scripts de la evidencia siempre piden el login directamente. La prueba se escribe
   igual; en el reporte va como supuesta.

   **Cada una con su prueba**, y en el reporte va cuál es observada y cuál supuesta. Para ver una
   redirección hay que pedir **sin seguir redirecciones**; si no, la petición acaba en 200 con el
   HTML del login y las dos primeras formas se vuelven la misma.

   ⚠️ **Cuidado con el 419, y es para el 2c**: también aparece con la sesión viva si el token
   antifalsificación se armó mal. Tratarlo como *sesión caducada* haría que el acuñador gastara un
   login —dinero y proxy— por un fallo que no es de sesión. Se acepta en este paso porque el tope
   diario de logins de la decisión 43 lo contiene, y queda anotado para el 2c.

   🔴 **La comprobación de sesión viva es la excepción: no lanza nunca.** Su trabajo es justamente
   contestar si la sesión sirve, así que devuelve *viva* o *muerta* —redirige al inicio, o sirve el
   formulario— y quien la use en el 2c no tiene que atrapar una excepción para leer una respuesta
   normal. **Solo las operaciones de datos lanzan** *sesión caducada*. Sigue el precedente del puerto
   psicométrico, donde comprobar si una vacante sirve y validar una conexión devuelven un estado y
   tampoco lanzan.

   🔴 **El cliente no reintenta ni intenta arreglarlo.** No hay login que rehacer aquí.

7. **Tres variables de entorno**, declaradas en el esquema con su validación, en su propio bloque
   como el de EvaluaTest. **Los nombres quedan fijados aquí** porque son contrato con el `.env` de
   todas las máquinas:
   - `PSICOALIANZA_BASE_URL`, con la forma de `OPENAI_BASE_URL`: admite vacío y trae la dirección
     oficial por defecto. ⚠️ Una línea vacía en el `.env` llega como texto vacío, no como el valor
     por defecto; por eso los lectores de `OPENAI_BASE_URL` repiten la dirección oficial como
     respaldo, y **este lector hace lo mismo**.
   - `PSICOALIANZA_MANUAL_SESSION_ENABLED`: booleano, **apagado por defecto**.
   - `PSICOALIANZA_MANUAL_SESSION_COOKIES`: texto, opcional y admite vacío. Es la cabecera `Cookie`
     tal cual la manda el navegador.

   🔴 **Ninguna es obligatoria.** Si lo fueran, el día que se mezcle la rama no arrancarían ni el
   servidor de pruebas ni el backend local de nadie.

8. **El registro, distinto al de EvaluaTest y a propósito.** El cliente de EvaluaTest vuelca
   peticiones y respuestas enteras —es deuda conocida del proyecto, con datos personales de
   candidatos dentro— y tapa la contraseña a mano. **Este nace al revés**: registra método, ruta,
   código de estado y tamaño de la respuesta. **Nunca** las cookies, la contraseña, el CSRF ni el
   cuerpo completo.

   🔴 **La ruta va sin la parte de parámetros** (levantado en la opinión previa): la consulta del
   correo lleva **el número de documento de la candidata dentro de la dirección**, así que registrar
   la ruta tal cual llenaría el registro de documentos de personas reales — exactamente la deuda que
   este cliente evita.

## 🔴 Dónde se para — qué NO se hace

- **Nada de conseguir la sesión**: ni Chrome, ni navegador, ni captcha, ni login. Es el 2c.
- **Nada de proxy.** Es el 2b.
- **Nada de adaptador contra el puerto psicométrico**, ni traducir estados, ni el centinela de *sin
  puntaje*, ni los cuatro pasos de la invitación. Es el paso 3.
- **No se registra nada en el puerto** ni se elige proveedor por conexión: el token del puerto sigue
  apuntando a EvaluaTest de principio a fin.
- **No se toca el embudo, ni el cron, ni EvaluaTest, ni el portal.**
- **No se decide quién aprueba, ni los dos plazos, ni qué pasa si el documento ya existe con otro
  correo.** Son del paso 3; este paso da el instrumento para averiguarlo.
- **No se guarda ninguna conexión de PsicoAlianza desde una ruta**: en local se inserta a mano en la
  base. Guardarla desde el portal es el paso 5.

## 🔴 Las trampas

**1. Sin añadir PsicoAlianza a la tabla de campos obligatorios, toda conexión suya se lee como
inexistente.** Comprobado leyendo la lectura única: si el proveedor no está en esa tabla, la lista de
campos presentes sale vacía y se lanza *sin conexión* — con una conexión perfectamente guardada
delante. No falla al compilar y el mensaje habla de otra cosa.

**2. La lectura única descifra un solo campo, el de la contraseña.** Todo lo demás de la bolsa de
credenciales sale tal cual. Por eso la sesión no vive ahí dentro: saldría cifrada y en bruto por una
puerta pensada para credenciales.

**3. `ats_session` se reemite en las respuestas.** Si el cliente no guarda la cookie actualizada,
puede quedarse con una vieja. ⚠️ **Sin verificar**: si la anterior sigue valiendo. El diseño no puede
depender de eso — se guarda siempre la última que llegue, en la base o en memoria según de dónde
venga la sesión (punto 2).

**4. El tamaño de página del listado tiene una trampa medida.** Omitirlo trae todas las vacantes en
una petición; el valor que en otras APIs significa "todas" **tumba su backend con un error 500**.
Está en el contrato: seguirlo al pie de la letra.

**5. Una petición sin sesión puede no fallar con un error de autenticación.** PsicoAlianza puede
servir el formulario de login, que es una respuesta correcta con una página dentro. Si el cliente no
lo reconoce, un fallo de sesión se confunde con una respuesta vacía y el sistema cree que la vacante
no tiene a nadie. Por eso las cuatro formas del punto 6, y por eso ninguna de ellas puede ser la
única.

**5b. Y esto se paga en el paso 5, así que queda anotado aquí** (encontrado al verificar la opinión
previa): el día que el portal guarde la conexión de PsicoAlianza, esa ruta va a reconstruir la
conexión con los campos que conoce, como hace hoy con la de EvaluaTest. Si no conserva el campo de
sesión, **cada vez que alguien renombre la conexión se tirará la sesión** y el acuñador gastará un
login de proxy móvil para nada. No es de este paso; es del 5, y allí hay que acordarse.

**6. El CSRF se pide antes de cada envío, no una vez.** Es lo que hace la propia página de
PsicoAlianza, y el orden importa: primero el CSRF fresco, después el envío.

**7. En el backend no hay precedente de simular `fetch` en una prueba.** Las pruebas de este paso lo
simulan, y ese es el motivo de la trampa de los límites de tiempo de arriba.

⚠️ **Cómo se comprobó, porque es una afirmación negativa** (2026-09-13): se buscaron en todos los
`.spec` las formas habituales —sustituir `fetch` global, espiarlo, simular el módulo, y las librerías
`nock`, `msw`, `jest-fetch-mock` y `undici`—, y no aparece ninguna; en las dependencias solo está
`supertest`, que prueba rutas de Nest, no salidas HTTP. Los cinco `.spec` que nombran `fetch` lo
hacen por otra cosa: uno construye un `TypeError('fetch failed')` a mano para probar una función que
describe errores, y los demás simulan `fetchCandidateResults`, que es **un método del puerto** y no
`fetch`. **Lo que esta búsqueda no cubre**: un doble escondido en un ayudante compartido o en la
configuración de Jest. Si aparece uno, se sigue ese precedente en vez de inventar otro.

**8. Ningún secreto en ningún archivo, tampoco en una prueba.** Las cookies y la contraseña de las
pruebas son textos inventados y evidentes, **elegidos para no disparar el chequeo de secretos** del
`CLAUDE.md` del backend, que marca `password`, `secret`, `api_key` o `token` seguidos de un texto de
seis caracteres o más entre comillas. Un falso positivo en cada commit acaba haciendo que se ignore.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **El backend arranca igual sin las variables nuevas** | Servidor de pruebas y máquinas locales del equipo |
| **EvaluaTest no cambia en nada** | Es toda la etapa psicométrica de hoy en producción |
| **El puerto y su cableado quedan como están** | Elegir proveedor es el paso 4 |
| **Compilación y pruebas en verde** | Nada existente se toca |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador.**
- **Comentarios: ninguno nuevo en archivos de código.**
- **Los identificadores van en inglés**, incluidos los de los `.spec` y los parámetros de callbacks.
  ⚠️ **Lo que no se traduce**: los nombres de campo de la API de PsicoAlianza y el identificador del
  proveedor. Son contrato con datos externos.
- **La solución más pequeña que resuelve el caso.**
- **No commitear.** Los archivos nuevos se añaden al índice, con `add`.
- **Documentación en el mismo diff** (el flujo de la etapa psicométrica **no cambia**, porque nada
  llama a esto todavía — decirlo en el reporte):
  - `../../entorno-local.md` — las tres variables nuevas, y **cómo insertar a mano en la base local la
    conexión de PsicoAlianza de una empresa**, con la contraseña cifrada. Ese documento ya promete
    que llega con este paso.
  - `before-deploy.md` — una fila: configurar las variables de PsicoAlianza en los servidores antes
    de que una empresa la use. No bloquea desplegar este paso solo.
  - `../../CLAUDE.md` — en *Dónde está lo importante*, **una frase**: existe un cliente de PsicoAlianza
    que trabaja con una sesión ya abierta.

## Pruebas

Montadas como la prueba de paridad de EvaluaTest —las clases a mano con dobles, sin módulo de
Nest—, simulando `fetch`:

- **La sesión pegada se usa solo con las dos condiciones**: con el interruptor apagado y cookies
  puestas, **no** se usan; con el interruptor encendido y sin cookies, tampoco.
- **Con las dos, gana la pegada** sobre la guardada en la conexión.
- **Sin ninguna** → *sin sesión*, **sin llamar a `fetch`**.
- **Las cuatro formas de sesión muerta** → *sesión caducada*, una prueba cada una: formulario con
  200, redirección al login, 401 y 419. Y **no se reintenta** en ninguna.
- **La comprobación de sesión no lanza**: con la sesión muerta devuelve *muerta*, y con la viva
  devuelve *viva* y **es lo único que escribe** *visto vivo por última vez*.
- **Las cookies reemitidas se guardan**, cifradas, cuando la sesión viene de la conexión; y **no se
  escriben en la base** cuando viene del `.env`.
- **La sesión se escribe sin reasignar la lista de conexiones**: una empresa con dos conexiones
  conserva la otra, y los campos que el almacén no toca quedan como estaban.
- **Un token antifalsificación que no aparece por ninguna de las dos vías** → error normal, **no**
  *sesión caducada*.
- **El registro no contiene el número de documento** de la consulta de correo.
- **El CSRF se pide antes de cada envío.**
- **El listado desenvuelve el sobre** y no manda el tamaño de página prohibido.
- **La consulta del correo de un documento** distingue *no lo conoce* de *lo conoce con este correo*.
- **Una petición que nunca responde se corta** por su límite.
- **El registro no contiene cookies, ni contraseña, ni CSRF**, en ningún caso, tampoco en los de
  error. Hay precedente de espiar el registro en la prueba de paridad de EvaluaTest.
- 🔴 **No regresión de EvaluaTest en la lectura única**, que es la única pieza compartida con
  riesgo: una empresa con conexión de EvaluaTest **se sigue resolviendo igual** —con su contraseña
  descifrada y su correo de pruebas— después de añadir PsicoAlianza a las dos tablas; y una empresa
  con las dos conexiones devuelve **la del proveedor que se pide**, no la primera de la lista. Es la
  prueba que avisa si este paso rompe la etapa que hoy corre en producción.

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo, y borrarlo después,
limpiando la caché.

## Verificación

Una vez sobre el conjunto del cambio: `npm run build` y `npm test` en el backend. El resultado va en
el reporte.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos.
5. **Confirmación de que EvaluaTest no cambió**, y de que el backend arranca sin las variables
   nuevas.
6. **Lo que el contrato dejaba sin verificar** y que se haya topado al escribir el cliente.
7. **Cómo se prueba a mano contra PsicoAlianza de verdad**, en tres líneas: qué hay que tener en el
   `.env` y en la base local. Es lo que va a usar el paso 3 para contestar las preguntas abiertas.
8. **Un mensaje de commit.**
