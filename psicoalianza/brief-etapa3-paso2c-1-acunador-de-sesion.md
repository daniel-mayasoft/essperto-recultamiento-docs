# Brief · Etapa 3, paso 2c.1 — el acuñador de sesión, sin que nadie lo llame

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 43** (la tabla *La arquitectura*, fila *Acuñador de sesión*, y *Protecciones*) **y en la 52**
(cómo se reparte el 2c y lo decidido el 2026-09-15). Toca solo el backend.

> Escrito el 2026-09-15 leyendo la decisión 43 con sus correcciones, *Medición con proxy*,
> `proxy-login.md`, el script y el informe del login con Chromium en Docker
> (`../../psicoalianza-xvfb-login/`, que es la referencia de forma: resolvió las trampas que este
> brief lista), el almacén de sesión del 2d, el cliente de PsicoAlianza, la lectura única de
> conexiones, el esquema de la conexión de la empresa y el brief del 2b.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md`.
2. `../CLAUDE.md` y `../../esscoti-backend/CLAUDE.md`.
3. `integrate-psicoalianza.md` — decisiones **42, 43 (con sus correcciones), 47 y 52**; *Medición con
   proxy* y *Medición cruzada de IP* en *Dónde va la etapa 3*; y en la tabla de pasos las filas **2b,
   2c.1, 2c.2 y 2c.3**.
4. `proxy-login.md` entero, y **`../../psicoalianza-xvfb-login/README.md` y `login.mjs`**: es la
   prueba que entró desde un contenedor, y su script resuelve las trampas de abajo. Es evidencia, no
   código de producción: el acuñador se escribe desde cero, con identificadores en inglés y sin
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
dirá a este acuñador: *«consigue una sesión para la conexión de Laura, con hasta tres intentos»*. El
acuñador arrienda una IP al módulo de proxy, lanza Chromium por esa IP, entra con las credenciales de
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

### 2 · El almacén gana «guardar una sesión acuñada»

Una operación nueva en el almacén del 2d: dada la empresa, la conexión y la cabecera de cookies que
dejó el login, **cifra y guarda solo la cookie de 5 días** (decisión 47), escribe **la fecha de
acuñado y la de visto vivo**, y deja en la copia en memoria la cabecera completa, nacida de lo que
acaba de guardar. Es distinta de *guardar cookies reemitidas*, que existe y no cambia: aquella solo
escribe cuando la de 5 días cambia y no toca la fecha de acuñado. ⚠️ Con la sesión manual del `.env`
encendida, el almacén **igual escribe en la base** —la manual solo manda al leer—; así en local se
puede comprobar lo guardado apagando el interruptor después.

### 3 · El acuñador

Un servicio en la carpeta de PsicoAlianza de la capa psicométrica, con una operación: **acuñar una
sesión** para una empresa, con un número máximo de intentos que decide quien llama. Devuelve un
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

**Cada intento**, copiado de lo que entró (el script del otro chat), en este orden:

| Paso | Qué hace | Por qué así |
| --- | --- | --- |
| Perfil | Usa el **perfil persistente** de la carpeta de trabajo (variable de abajo), y antes de lanzar borra sus tres ficheros de candado (`SingletonLock`, `SingletonSocket`, `SingletonCookie`) | Un backend que murió a mitad de un login deja el perfil bloqueado; el perfil persistente abarata el login a la mitad (43) |
| Lanzar | Chromium por la ruta configurada, **sin ventana por defecto** (variable), con la marca de automatización quitada, **sin aislamiento** (decisión 52), por el proxy del arriendo (host y puerto en los argumentos; usuario y contraseña por la autenticación de página, nunca en la URL). **Sin volcar la salida del navegador** al registro | Es lo medido. La salida de Chromium en un contenedor son decenas de errores inofensivos por lanzamiento |
| Con ventana (solo si la variable lo pide) | Arranca antes una pantalla virtual `Xvfb` como proceso hijo, borrando su fichero de candado, y la apaga al terminar | Es el interruptor para medir en el servidor de pruebas (52). En local, sin ventana |
| Cookies | Borra las cookies **del sitio de PsicoAlianza** del perfil y **conserva las de Google** | Tras un éxito el perfil queda dentro y PsicoAlianza echa del login a quien ya está dentro; las de Google son la reputación |
| Ir al login | Carga `/login` y espera el botón de enviar. Si no llega el botón: *red* si sigue en `/login`, *ya dentro* si no | Ninguno de los dos cuenta como intento contra el captcha |
| Escribir | Correo y contraseña **con pausas entre teclas**, como el script | Es lo medido |
| Permanecer conectado | **Comprueba la casilla y la marca si no lo está** | El otro chat vio que no viene marcada, contra lo que decía la bitácora. Sin ella no hay cookie de 5 días |
| Enviar | Clic, y **aborta la navegación que sale del login**: las cookies llegan en la respuesta del envío | Ahorra la página de trabajo; es la forma de saber que entró |
| Solo PsicoAlianza | Cualquier **navegación de la ventana principal** a un dominio que no sea el de PsicoAlianza se aborta. **Los recursos de la página no se tocan**: el captcha carga de Google | Mitigación de la deuda del aislamiento (52). No se bloquean recursos porque no se midió así (43) |
| Clasificar | *Entró* **solo si** salió del login **y** hay cookie `remember_web_`; si no, por el texto de la página: *captcha rechazado* («no hemos podido verificar»), *bloqueada* («demasiados», «bloquead»), *credenciales rechazadas* («credenciales», «no coinciden»); si nada casa, *desconocido* | Una `ats_session` nueva no prueba nada: PsicoAlianza se la da a cualquiera |
| Captura | En los intentos que no entran, una captura de pantalla en la carpeta de trabajo, con la fecha en el nombre | Es lo único que permite saber qué pasó en un *desconocido* |
| Tiempo límite | **Duro, por intento**, del orden de tres minutos, que gana a cualquier espera interna; y **cierre garantizado** del navegador y de la pantalla virtual, pase lo que pase | Un Chromium huérfano se queda con su memoria |
| Al entrar | Toma las cookies del sitio, arma la cabecera y la guarda por la operación nueva del almacén | — |

**La política de reintentos, dentro de una llamada:**

| Clasificación | Qué hace el acuñador |
| --- | --- |
| *Entró* | Para y devuelve *entró* |
| *Captcha rechazado* o *desconocido* | Espera **25 segundos** y repite con **otro arriendo** (identificador nuevo), hasta el máximo de intentos. Al agotarlos, *agotó los intentos* |
| *Bloqueada* | **Para en seco**: es la cuenta de gerencia del cliente. Desenlace *bloqueada* |
| *Credenciales rechazadas* | **Para en seco.** Desenlace *credenciales rechazadas* |
| *Red* o *ya dentro* | No cuenta como intento; se repite una vez, y si vuelve a pasar, desenlace *agotó los intentos* con esa clasificación en la lista |

Cuántas llamadas, con qué espera entre ellas, el candado, el tope diario y el aviso a soporte son
del **2c.2**: aquí no hay nada de eso.

### 4 · Tres variables de entorno

Declaradas en el esquema, **todas opcionales y admitiendo vacío**, como las del 2b:

| Variable | Qué es | Sin ella |
| --- | --- | --- |
| `PSICOALIANZA_CHROMIUM_PATH` | La ruta del ejecutable del navegador. En el servidor, `/usr/bin/chromium`; en local, el Chrome instalado | *Sin configurar* al acuñar, no al arrancar |
| `PSICOALIANZA_LOGIN_DIR` | Carpeta de trabajo: dentro van el perfil persistente y las capturas | *Sin configurar* al acuñar |
| `PSICOALIANZA_LOGIN_HEADLESS` | `true` o `false`; **`true` por defecto**. Con `false`, pantalla virtual | Sin ventana |

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

**8. La sesión manual del `.env` manda al leer.** Con el interruptor encendido, aunque el acuñador
guarde en la base, el cliente sigue usando la pegada. Para comprobar la acuñada hay que apagar el
interruptor y reiniciar.

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

**Documentación en el mismo diff** (el flujo de la etapa no cambia: nadie llama al acuñador):
- `../entorno-local.md` — las tres variables en la tabla del `.env` del backend, con el valor local
  (la ruta de Chrome en Windows, una carpeta fuera de los repositorios, sin ventana); y en
  *PsicoAlianza, dos formas de tener sesión*, que la forma oficial ya existe en local y cómo se
  dispara a mano (abajo).
- `before-deploy.md` — en la fila 8 (variables del proxy), añadir las tres de aquí con sus valores
  del servidor; y en §4, tras el tiempo 2, **lo que el compose del backend necesita para el
  acuñador**: un volumen con nombre montado en `PSICOALIANZA_LOGIN_DIR`.
- `../CLAUDE.md` — en *Dónde está lo importante*, **una frase**: el acuñador existe y nadie lo llama.

## Pruebas

**Automáticas**, sin navegador y sin red. El acuñador se parte en dos: **un intento** (lo que lanza
Chromium y devuelve una clasificación con sus cookies) y **la orquestación** (comprobaciones previas,
arriendo, reintentos, guardado, resultado). La orquestación se prueba con un intento falso:

- **Entra al segundo intento** → dos arriendos con identificadores distintos, una espera de 25 s
  (relojes simulados), el almacén recibe la cabecera, desenlace *entró* con dos intentos en la lista.
- **Tres rechazos de captcha con máximo tres** → tres arriendos, dos esperas, *agotó los intentos*,
  nada guardado.
- **Bloqueada al primero** → un solo arriendo, sin espera, *bloqueada*, nada guardado.
- **Credenciales rechazadas** → igual, *credenciales rechazadas*.
- **Red en el primero, entra en el segundo** → el de red no cuenta; *entró* con los dos en la lista.
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

**Una comprobación real en local, con estas reglas** (las del informe del otro chat, aceptadas por
el usuario):

- Con **la cuenta principal** (la conexión guardada en la empresa local), **no** la alterna, que es
  de aspirante y no sirve para listar vacantes.
- **Un solo intento** por llamada (máximo uno). Si falla, **al menos una hora** antes del siguiente.
  **Tope de tres en el día.** Parar al primer éxito. *Bloqueada* o *credenciales*: parar el día.
- Se dispara con un script **fuera de los repositorios**, contra el backend compilado, que llame al
  acuñador y solo imprima el desenlace y la lista de intentos (sin cookies). El script se borra.
- Después: apagar la sesión manual del `.env`, reiniciar, y comprobar que el estado de sesión de *Mi
  compañía* dice *Conectado* con la acuñada. Volver a encender la manual al terminar.
- 🔴 **No pulsar «cerrar sesión» en PsicoAlianza** durante nada de esto: invalida las sesiones en el
  servidor, la acuñada y la pegada.

El reporte dice cuántos intentos se hicieron, a qué hora, con qué clasificación y cuántos segundos.

## Verificación

Una vez sobre el conjunto: `npm run build` y `npm test` en el backend, con la caché de Jest limpia.
La comprobación real, con su resultado, aparte.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real, y **la comprobación real** con su
   secuencia.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que nadie llama al acuñador**, de que el backend arranca sin las variables, y de
   que el cliente y el almacén (salvo la operación nueva) no cambiaron.
5. **La versión fijada de la librería** y contra qué versión de Chromium se casó.
6. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos, **y la lista de
   los identificadores nuevos**, parámetros de funciones flecha incluidos.
7. **Los documentos actualizados.**
8. **Un mensaje de commit** por repositorio.
