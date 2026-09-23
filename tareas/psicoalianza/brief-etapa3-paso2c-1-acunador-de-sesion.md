# Brief · Etapa 3, paso 2c.1 — la pieza que consigue la sesión, sin que nadie la llame

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 43** (la tabla *La arquitectura*, su fila de la pieza que consigue la sesión, y *Protecciones*) **y en la 52**
(cómo se reparte el 2c y lo decidido el 2026-09-15). Toca solo el backend.

> Escrito el 2026-09-15 leyendo la decisión 43 con sus correcciones, *Medición con proxy*,
> `proxy-login.md`, el script y el informe del login con Chromium en Docker
> (`../../psicoalianza-xvfb-login/`, que es la referencia de forma: resolvió las trampas que este
> brief lista), el almacén de sesión del 2d, el cliente de PsicoAlianza, la lectura única de
> conexiones, el esquema de la conexión de la empresa y el brief del 2b.
>
> **Incorpora la opinión previa del ejecutor del 2026-09-15**, verificada por el planificador: la
> comprobación real sin entorno local (era un error del brief), la clasificación *error* con la marca
> de si se envió el formulario, *sin cookie de recuerdo* como parada en seco, SOCKS5 como *sin
> configurar*, la dirección base compartida con el cliente, y las decisiones de forma. Marcado como
> «opinión previa» en su sitio.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md`.
2. `../CLAUDE.md` y `../../esscoti-backend/CLAUDE.md`.
3. `integrate-psicoalianza.md` — decisiones **42, 43 (con sus correcciones), 47 y 52**; *Medición con
   proxy* y *Medición cruzada de IP* en *Dónde va la etapa 3*; y en la tabla de pasos las filas **2b,
   2c.1, 2c.2 y 2c.3**.
4. `proxy-login.md` entero, y **`../../psicoalianza-xvfb-login/README.md` y `login.mjs`**: es la
   prueba que entró desde un contenedor, y su script resuelve las trampas de abajo. Es evidencia, no
   código de producción: la pieza se escribe desde cero, con identificadores en inglés y sin
   comentarios.
5. `brief-etapa3-paso2b-modulo-proxy.md` — el puerto que este paso consume.
6. En el backend: el almacén de sesión de PsicoAlianza (qué guarda y cómo cifra), el cliente (cómo
   comprueba una sesión), la lectura única de conexiones (cómo se obtienen correo y contraseña
   descifrados), el esquema de la sesión dentro de la conexión de la empresa, el módulo de proxy del
   2b, y el esquema de entorno.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. **El paso 2b tiene que
estar commiteado**: si no lo está, dilo y espera.

## El caso

La empresa de **Laura** tiene su conexión de PsicoAlianza guardada: correo y contraseña. Nadie ha
entrado con ella desde un servidor, porque el login tiene un captcha que rechaza a cualquier
navegador que no salga por una IP móvil colombiana. Dentro de unos pasos, una tarea diaria (2c.2) le
dirá a esta pieza: *«consigue una sesión para la conexión de Laura, con hasta tres intentos»*. La
pieza arrienda una IP al módulo de proxy, lanza Chromium por esa IP, entra con las credenciales de
Laura, y si entra guarda las cookies en la conexión de Laura, de donde el cliente ya sabe leerlas.
Si no entra, dice exactamente por qué en cada intento.

**Hoy nadie lo llama.** Aditivo en código. Pero **es lo que va a entrar con la cuenta de gerencia
del cliente**, y cada intento fallido cuenta contra su reputación en el captcha: brief completo, y
una comprobación real en local con reglas estrictas (abajo).

## Alcance exacto

### 1 · Una dependencia nueva

`puppeteer-core`, **con la versión fijada** (sin acento circunflejo) a la que el otro chat probó con
el Chromium de Debian el 2026-09-14: la del informe. No `puppeteer` a secas, que descarga su propio
navegador en cada instalación. Es la única dependencia nueva.

### 2 · El almacén gana «guardar una sesión conseguida»

Una operación nueva en el almacén del 2d: dada la empresa, la conexión y la cabecera de cookies que
dejó el login, **cifra y guarda solo la cookie de 5 días** (decisión 47), escribe **la fecha en que
se consiguió y la de visto vivo**, y deja en la copia en memoria la cabecera completa, nacida de lo
que acaba de guardar. Es distinta de *guardar cookies reemitidas*, que existe y no cambia: aquella
solo escribe cuando la de 5 días cambia y no toca la fecha en que se consiguió. ⚠️ Con la sesión manual del `.env`
encendida, el almacén **igual escribe en la base** —la manual solo manda al leer—; así en local se
puede comprobar lo guardado apagando el interruptor después.

### 3 · La pieza que consigue la sesión

Un servicio en la carpeta de PsicoAlianza de la capa psicométrica, con una operación: **conseguir una sesión** para una empresa, con un número máximo de intentos que decide quien llama. Devuelve un
resultado con **el desenlace** —*entró*, *agotó los intentos*, *bloqueada*, *credenciales
rechazadas*, *sin configurar*— y **la lista de intentos**, cada uno con su clasificación, sus
segundos y el nombre de su captura si la hubo. No lanza por un intento fallido: lanza solo por lo
que impide empezar (abajo).

**Antes de empezar**, en este orden, y cada cosa aborta sin lanzar Chromium:

| Comprobación | Si falla |
| --- | --- |
| La conexión de PsicoAlianza de la empresa, por la lectura única: correo y contraseña descifrados | Lanza *sin conexión*, el error que ya existe |
| La ruta del navegador (variable de abajo) | Desenlace *sin configurar*, nombrando la variable |
| El arriendo del proxy, por el puerto del 2b: **móvil, Colombia, pegajosa con un identificador nuevo por intento** | El error propio del proxy sube tal cual: *sin configurar* del proxy es del proxy |
| **El protocolo del arriendo es HTTP** (opinión previa) | Con `socks5`, desenlace *sin configurar* nombrando `PROXY_PROTOCOL`: Chromium no autentica un proxy SOCKS5 por la autenticación de página, y el intento fallaría como *red* sin decir por qué. Se anota en la tabla de variables de `../entorno-local.md` |
| **Un máximo de intentos menor que uno** | Es error del programa: lanza |

**La dirección base** (opinión previa): `/login` y el dominio contra el que se filtran las
navegaciones salen de `PSICOALIANZA_BASE_URL`, la misma que usa el cliente, con su respaldo a la
oficial cuando está vacía. Así una base distinta en pruebas no rompe la pieza.

**Cada intento**, copiado de lo que entró (el script del otro chat), en este orden:

| Paso | Qué hace | Por qué así |
| --- | --- | --- |
| Perfil | Usa el **perfil persistente** de la carpeta de trabajo (variable de abajo), y antes de lanzar borra sus tres ficheros de candado (`SingletonLock`, `SingletonSocket`, `SingletonCookie`) | Un backend que murió a mitad de un login deja el perfil bloqueado; el perfil persistente abarata el login a la mitad (43) |
| Lanzar | Chromium por la ruta configurada, **con ventana por defecto** (lo gobierna la variable), con la marca de automatización quitada, **sin aislamiento** (decisión 52), por el proxy del arriendo (host y puerto en los argumentos; usuario y contraseña por la autenticación de página, nunca en la URL). **Sin volcar la salida del navegador** al registro | Es lo medido. La salida de Chromium en un contenedor son decenas de errores inofensivos por lanzamiento |
| Con ventana (el modo por defecto) | **Solo en Linux** arranca antes una pantalla virtual `Xvfb` como proceso hijo, borrando su fichero de candado, y la apaga al terminar; en Windows abre una ventana de verdad | Es la forma que entró. El interruptor queda para medir sin ventana (*Revisión del diff*) |
| Cookies | Borra las cookies **del sitio de PsicoAlianza** del perfil y **conserva las de Google** | Tras un éxito el perfil queda dentro y PsicoAlianza echa del login a quien ya está dentro; las de Google son la reputación |
| Ir al login | Carga `/login` y espera el botón de enviar. Si no llega el botón: *red* si sigue en `/login`, *ya dentro* si no | Ninguno de los dos cuenta como intento contra el captcha |
| Escribir | Correo y contraseña **con pausas entre teclas**, como el script | Es lo medido |
| Permanecer conectado | **Comprueba la casilla y la marca si no lo está** | El otro chat vio que no viene marcada, contra lo que decía la bitácora. Sin ella no hay cookie de 5 días |
| Enviar | Clic, y **aborta la navegación que sale del login**: las cookies llegan en la respuesta del envío | Ahorra la página de trabajo; es la forma de saber que entró |
| Solo PsicoAlianza | Cualquier **navegación de la ventana principal** a un dominio que no sea el de PsicoAlianza se aborta. **Los recursos de la página no se tocan**: el captcha carga de Google. La intercepción se activa **después de cargar el login y teclear** (opinión previa) | Mitigación de la deuda del aislamiento (52). No se bloquean recursos porque no se midió así (43). Activar la intercepción desactiva la caché, y antes de teclear se perdería el ahorro del perfil persistente |
| Clasificar | *Entró* **solo si** salió del login **y** hay cookie `remember_web_`. **Salió del login sin esa cookie → *sin cookie de recuerdo*** (opinión previa, aceptado): el login sí ocurrió y lo que falló es la casilla o la página, así que repetir gastaría otro login del cliente contra un fallo que no es del captcha. Si no salió, por el texto de la página: *captcha rechazado* («no hemos podido verificar»), *bloqueada* («demasiados», «bloquead»), *credenciales rechazadas* («credenciales», «no coinciden»); si nada casa, *desconocido*. Y ***error*** (opinión previa): el navegador no arrancó, la ruta es mala, la pantalla virtual cayó o venció el tiempo límite; lleva **la marca de si se llegó a enviar el formulario** | Una `ats_session` nueva no prueba nada: PsicoAlianza se la da a cualquiera |
| Captura | En los intentos que no entran, una captura de pantalla en la carpeta de trabajo, con la fecha en el nombre | Es lo único que permite saber qué pasó en un *desconocido* |
| Tiempo límite | **Duro, por intento**, del orden de tres minutos, que gana a cualquier espera interna; y **cierre garantizado** del navegador y de la pantalla virtual, pase lo que pase | Un Chromium huérfano se queda con su memoria |
| Al entrar | Toma las cookies del sitio, arma la cabecera y la guarda por la operación nueva del almacén | — |

**La política de reintentos, dentro de una llamada:**

| Clasificación | Qué hace la pieza |
| --- | --- |
| *Entró* | Para y devuelve *entró* |
| *Captcha rechazado* o *desconocido* | Espera **25 segundos** y repite con **otro arriendo** (identificador nuevo), hasta el máximo de intentos. Al agotarlos, *agotó los intentos* |
| *Bloqueada* | **Para en seco**: es la cuenta de gerencia del cliente. Desenlace *bloqueada* |
| *Credenciales rechazadas* | **Para en seco.** Desenlace *credenciales rechazadas* |
| *Sin cookie de recuerdo* | **Para en seco**, con captura. Desenlace *sin cookie de recuerdo* |
| *Red* o *ya dentro* | No cuenta como intento; se repite una vez **con arriendo nuevo y sin los 25 segundos** (opinión previa: una caída por el proxy suele ser de esa IP, y no se gastó captcha), y si vuelve a pasar, desenlace *agotó los intentos* con esa clasificación en la lista |
| *Error* **antes** de enviar el formulario | No cuenta: se trata como *red* |
| *Error* **después** de enviar | Cuenta como *desconocido*: el captcha ya se gastó. Captura si el navegador sigue vivo |

Cuántas llamadas, con qué espera entre ellas, el candado, el tope diario y el aviso a soporte son
del **2c.2**: aquí no hay nada de eso.

### 4 · Tres variables de entorno

Declaradas en el esquema, **todas opcionales y admitiendo vacío**, como las del 2b:

| Variable | Qué es | Sin ella |
| --- | --- | --- |
| `PSICOALIANZA_CHROMIUM_PATH` | La ruta del ejecutable del navegador. En el servidor, `/usr/bin/chromium`; en local, el Chrome instalado | *Sin configurar* al conseguir la sesión, no al arrancar |
| `PSICOALIANZA_LOGIN_DIR` | Carpeta de trabajo: dentro van el perfil persistente y las capturas | *Sin configurar* al conseguir la sesión |
| `PSICOALIANZA_LOGIN_HEADLESS` | `true` o `false`; **`false` por defecto, o sea con ventana** (cambiado el 2026-09-15, ver *Revisión del diff*). En Linux la ventana se dibuja sobre una pantalla virtual Xvfb; en Windows es una ventana de verdad. Con `true`, sin ventana | Con ventana |

**`PSICOALIANZA_BASE_URL`** no es nueva: la pieza la comparte con el cliente. Y **`PROXY_PROTOCOL`
tiene que ser HTTP** para la pieza (arriba).

### 5 · Registro

Por intento: número, clasificación, segundos, versión del navegador y nombre de la captura.
🔴 **Nunca** la contraseña de PsicoAlianza, ni el usuario o la contraseña del proxy, ni el valor de
ninguna cookie, ni la IP de salida (no se consulta: se quita la comprobación de IP que hacía el
script de la medición).

## 🔴 Dónde se para — qué NO se hace

- **Nadie lo llama**: ni el cliente al encontrar la sesión muerta, ni una tarea, ni una ruta, ni un
  botón. Son el 2c.2 y el 2c.3.
- **Ni candado, ni tope diario, ni espera entre llamadas, ni aviso a soporte** (2c.2).
- **No se toca el cliente de PsicoAlianza** ni la fuente manual del `.env`.
- **No se toca el Dockerfile del backend ni ningún compose**: la imagen base es infraestructura y va
  por `before-deploy.md` §4.
- **No se bloquean imágenes, CSS ni fuentes** (corrección de la 43).
- **No se comprueba la IP de salida.**
- **No se mide la tasa**: ni con ventana ni sin ella. La comprobación en local es un intento.

## 🔴 Las trampas

**1. Chromium es un proceso hijo, y el backend es una sola instancia con memoria compartida.** Un
navegador que no se cierra se queda con 300 a 500 MB. El cierre va en un bloque que se ejecuta pase
lo que pase, y el tiempo límite duro corta el intento aunque una espera interna no vuelva nunca.

**2. El perfil persistente se sabotea solo.** Tras el primer éxito queda dentro; el siguiente
intento carga `/login`, PsicoAlianza lo redirige al inicio, y no hay botón. Por eso se borran las
cookies del sitio antes de cada intento, **conservando las de Google**. Y si el proceso murió a
mitad, los ficheros de candado impiden abrir el perfil: se borran antes de lanzar.

**3. «Permanecer conectado» no viene marcado.** Comprobado el 2026-09-14 contra lo que decía la
bitácora. Sin marcarlo no hay cookie de 5 días, y el almacén guarda solo esa: la sesión no
sobreviviría un reinicio (47).

**4. Salir del login no es haber entrado.** El éxito exige además la cookie `remember_web_`. Y una
navegación fuera del login **se aborta**, no se espera: la página de trabajo es lo que más pesa y
no hace falta.

**5. El usuario del proxy lleva la sesión pegajosa.** Un identificador nuevo por intento, generado
aquí, solo letras y dígitos (contrato del 2b). Repetir el identificador repite la IP rechazada.

**6. Los dominios del captcha.** Bloquear cualquier petición que no sea a PsicoAlianza rompe el
captcha, que carga de Google. Solo se abortan **navegaciones de la ventana principal** fuera del
sitio; los recursos no se tocan.

**7. En local el navegador es Google Chrome y en el servidor Chromium de Debian.** La ruta viene de
la variable; nada más cambia. La versión de la librería está casada con el Chromium del servidor,
no con el Chrome local: si en local algo falla por versión, se dice en el reporte y no se cambia la
versión fijada.

**8. La sesión manual del `.env` manda al leer.** Con el interruptor encendido, aunque la pieza
guarde en la base, el cliente sigue usando la pegada. Para comprobar la conseguida hay que apagar el
interruptor y reiniciar.

**9. Activar la intercepción de peticiones desactiva la caché** (opinión previa). Si se activa antes
de cargar el login, el perfil persistente no ahorra nada. Va después de teclear, antes del clic.

**10. Chromium no autentica un proxy SOCKS5** por la autenticación de página (opinión previa). Con
`PROXY_PROTOCOL=socks5` el intento fallaría como *red* sin decir por qué: por eso es *sin
configurar* antes de lanzar.

## Decisiones de forma (opinión previa, aceptadas)

- **El intento es una pieza propia inyectable**: recibe credenciales, arriendo, ruta y carpeta;
  devuelve clasificación, segundos, versión, captura y cookies. La pieza la recibe por
  constructor y las pruebas la reemplazan. **La clasificación por texto es una función pura
  exportada**, con los tres textos y el orden del script.
- **La operación nueva del almacén recibe identificadores** (empresa y conexión), no la sesión
  activa: con la manual encendida no hay sesión guardada que leer. Escribe por el mismo camino que
  ya localiza la conexión por su identificador, con la fecha en que se consiguió y la de visto vivo a la
  misma hora, y sustituye la copia en memoria.
- **`puppeteer-core` en 25.10.0 exacto**, casada con Chromium 152.0.7977.82 de Debian (informe del
  2026-09-14).

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **El backend arranca igual sin las variables nuevas** y sin navegador instalado | Servidor de pruebas y máquinas del equipo |
| **El almacén de sesión, tal como está**: leer, guardar cookies reemitidas, visto vivo, la fuente manual y la copia en memoria | Es lo que usa el cliente en producción local hoy |
| **El cliente de PsicoAlianza** | No se toca |
| **Compilación y pruebas en verde** | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Sin lint ni formateador, **sin comentarios nuevos en código**,
identificadores en inglés —también los parámetros de las funciones flecha—, y los selectores de la
página, los textos que se buscan para clasificar y los nombres de las cookies son contrato. Ningún
secreto en ningún archivo. La solución más pequeña. Sin commitear y todo al índice. Finales de línea
de cada archivo.

**Documentación en el mismo diff** (el flujo de la etapa no cambia: nadie llama a la pieza):
- `../entorno-local.md` — las tres variables en la tabla del `.env` del backend, con el valor local
  (la ruta de Chrome en Windows, una carpeta fuera de los repositorios, sin ventana); en la tabla del
  proxy, que **`PROXY_PROTOCOL` tiene que ser HTTP para la pieza**; y en *PsicoAlianza, dos formas
  de tener sesión*, que la forma oficial ya existe en el código y cómo se dispara a mano (abajo).
- `before-deploy.md` — en la fila 8 (variables del proxy), añadir las tres de aquí con sus valores
  del servidor; y en §4, tras el tiempo 2, **lo que el compose del backend necesita para el
  pieza que consigue la sesión**: un volumen con nombre montado en `PSICOALIANZA_LOGIN_DIR`.
- `../CLAUDE.md` — en *Dónde está lo importante*, **una frase**: la pieza existe y nadie la llama.

## Pruebas

**Automáticas**, sin navegador y sin red. La pieza se parte en dos: **un intento** (lo que lanza
Chromium y devuelve una clasificación con sus cookies) y **la orquestación** (comprobaciones previas,
arriendo, reintentos, guardado, resultado). La orquestación se prueba con un intento falso:

- **Entra al segundo intento** → dos arriendos con identificadores distintos, una espera de 25 s
  (relojes simulados), el almacén recibe la cabecera, desenlace *entró* con dos intentos en la lista.
- **Tres rechazos de captcha con máximo tres** → tres arriendos, dos esperas, *agotó los intentos*,
  nada guardado.
- **Bloqueada al primero** → un solo arriendo, sin espera, *bloqueada*, nada guardado.
- **Credenciales rechazadas** → igual, *credenciales rechazadas*.
- **Sin cookie de recuerdo** → igual, para en seco, nada guardado.
- **Red en el primero, entra en el segundo** → el de red no cuenta; **dos arriendos distintos y
  ninguna espera**; *entró* con los dos en la lista.
- **Error antes de enviar** → como *red*. **Error después de enviar** → como *desconocido*: cuenta y
  espera 25 s.
- **Máximo de intentos cero** → lanza, sin arrendar.
- **Protocolo `socks5` en el arriendo** → *sin configurar* nombrando `PROXY_PROTOCOL`, sin lanzar.
- **Sin ruta del navegador** → *sin configurar* nombrando la variable, **sin arrendar ni lanzar**.
- **Sin conexión de PsicoAlianza** → lanza *sin conexión*, sin arrendar.
- **El proxy sin configurar** → sube el error del proxy, sin lanzar.
- **El registro** de un intento con éxito y de uno fallido **no contiene** la contraseña, el usuario
  del proxy ni ningún valor de cookie (hay precedente de espiar el registro en la prueba de paridad).
- **La clasificación por texto**, como función pura: los cuatro textos y el *desconocido*.
- **El almacén, la operación nueva**: guarda cifrada solo la cookie de 5 días, escribe las dos fechas,
  y la copia en memoria devuelve la cabecera completa nacida de lo guardado; con la manual encendida,
  escribe igual.

⚠️ Control negativo en la de *entra al segundo intento* y en la del almacén; borrarlos y limpiar la
caché.

**Una comprobación real, sin entorno local** (corregido en la opinión previa: **no hay base local
ni `.env` completo** —`../entorno-local.md` lo dice y el ejecutor lo comprobó—, así que la primera
versión de este brief pedía algo imposible). Se hace **como la tanda del paso 3**: un script **fuera
de los repositorios** que monte la pieza compilada con **una lectura de conexiones falsa** —las
credenciales de la cuenta principal las toma el script del `.env` del backend, sin imprimirlas— y
**un almacén falso que solo imprima nombres de cookies**, nunca valores. Con eso se prueba que la
pieza entra. **Queda fuera hasta que exista la base local**: que el almacén real guarde y que *Mi
compañía* diga *Conectado* con la conseguida; se anota en el reporte y en la bitácora.

Reglas (las del informe del otro chat, aceptadas por el usuario):

- Con **la cuenta principal**, **no** la alterna, que es de aspirante.
- **Un solo intento** por llamada (máximo uno). Si falla, **al menos una hora** antes del siguiente.
  **Tope de tres en el día.** Parar al primer éxito. *Bloqueada*, *credenciales* o *sin cookie de
  recuerdo*: parar el día.
- **Cada intento es una acción contra la cuenta de gerencia del cliente**: el ejecutor prepara el
  script y **pide confirmación al usuario antes de cada intento**; si el usuario prefiere correrlo
  él, el script queda listo para eso. El script se borra al terminar.
- 🔴 **No pulsar «cerrar sesión» en PsicoAlianza** durante nada de esto: invalida las sesiones en el
  servidor, la conseguida y la pegada.

El reporte dice cuántos intentos se hicieron, a qué hora, con qué clasificación, cuántos segundos y
qué nombres de cookies dejó el que entró.

## Verificación

Una vez sobre el conjunto: `npm run build` y `npm test` en el backend, con la caché de Jest limpia.
La comprobación real, con su resultado, aparte.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real, y **la comprobación real** con su
   secuencia.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que nadie llama a la pieza**, de que el backend arranca sin las variables, y de
   que el cliente y el almacén (salvo la operación nueva) no cambiaron.
5. **La versión fijada de la librería** y contra qué versión de Chromium se casó.
6. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos, **y la lista de
   los identificadores nuevos**, parámetros de funciones flecha incluidos.
7. **Los documentos actualizados.**
8. **Un mensaje de commit** por repositorio.

## Revisión del diff (2026-09-15)

Verificado por el planificador sobre el conjunto, con la caché de Jest limpia: **compila, 119 suites y
1.224 pruebas (1.215 pasan, 9 omitidas)**. Todo en el índice, nada sin rastrear, ningún merge nuevo.
**Ninguna afirmación existente se quitó**: las dos únicas líneas eliminadas son el tipo de un parámetro
del almacén, que se amplía, y el título de la prueba de cableado, que se reescribe más amplio. En el
código commiteado no había ninguna prueba del interruptor, así que las dos que el reporte dice haber
ajustado eran de este mismo diff, no de la base.

**Aprobado con dos cosas.**

### 1 · Lo que hay que arreglar antes de commitear

🔴 **El cierre del navegador no está garantizado cuando vence el tiempo límite.** El límite duro corta
la *espera*, no el trabajo: si vence mientras el navegador o la pantalla virtual están arrancando, el
cierre se ejecuta con el estado todavía vacío y **el Chromium que termine de arrancar queda huérfano**
dentro del contenedor del backend, con sus 300 a 500 MB, hasta que alguien lo mate a mano. Es justo lo
que la trampa 1 quería evitar. El arreglo: que el cierre también se encadene a la promesa del intento
cuando esta se asiente después del vencimiento, de modo que el navegador y la pantalla virtual se
cierren aunque nazcan tarde. Con su prueba: vence el tiempo límite mientras el navegador arranca, y al
resolverse se cierra igual.

### 2 · El cambio de defecto, y lo que arrastra

**El interruptor pasa a venir con ventana por defecto**, aprobado por el usuario el 2026-09-15 sobre lo
medido ese día: sin ventana, 0 de 4 en Windows; con ventana, 2 de 2 en Docker, la segunda con la cuenta
principal y con el listado de vacantes respondiendo después desde fuera, solo con la cookie de cinco
días. **Contradice la decisión 52**, que decía sin ventana por defecto: la 52 la corrige el planificador
en la bitácora, y este brief ya está actualizado.

⚠️ **Y deja una afirmación en el aire**: el 30 % que sostiene la política de reintentos se midió, según
la bitácora, sin ventana, pero **con un script que no está en el repositorio de evidencia**; los dos que
sí están corren con ventana. Así que la tasa del modo que ahora es el oficial **no está medida**. No
bloquea este paso —la política de reintentos es del 2c.2—, pero el 2c.2 no puede apoyarse en ese 30 %.

### 3 · Lo que queda abierto y no es de este paso

- 🔴 **La mitad de las IPs del proxy no son móviles** (medido el 2026-09-15: cinco de diez salieron por
  operadores fijos, que puntúan como residenciales y en su día dieron cero). Fijar el operador no cuesta
  nada y no toca código: es un parámetro pegado al login de la cuenta del proxy. Hoy **la pieza
  arrienda sin fijarlo**, así que su tasa real será peor que la medida. Queda anotado en
  `../entorno-local.md`; meterlo en el módulo de proxy es un paso aparte, y **conviene antes del 2c.2**,
  porque la cadencia de reintentos depende de la tasa.
- **La comprobación real pasa al servidor de pruebas** (punto 7d de `before-deploy.md`), decidido por el
  usuario: el modo con ventana entró dos veces, pero siempre con el script de la prueba, **nunca por el
  código de la pieza**. Eso es lo que cierra el 2c.1 y ocurre después del tiempo 2 de la imagen base.
- **Dos entradas ajenas desaparecieron del archivo de dependencias** (`@emnapi/core` y `@emnapi/runtime`,
  que son opcionales de otra librería). Es ruido del gestor de paquetes al recalcular; compila y las
  pruebas pasan. Anotado, sin acción.
