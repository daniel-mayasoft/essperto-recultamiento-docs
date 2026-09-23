# La etapa psicométrica hoy, de punta a punta

Cómo funciona la etapa **tal como está en el código** de la rama de trabajo, leído el
2026-09-11 tras el paso 7 y el rescate, y actualizado el 2026-09-12 con el cambio de la cuenta
compartida (decisiones 34 y 40) y el del correo inventado (decisión 33), y el 2026-09-13 con
las conexiones de la empresa y la conexión de la oferta (paso 8a, decisión 41) y con el portal
leyendo la lista y "Puntaje mínimo" (paso 8b, decisiones 8 y 41), y el 2026-09-14 con el documento,
el tipo y el plazo en la invitación y el descarte por documento (paso 5a, decisión 45) y con la
conexión de PsicoAlianza guardada, validada y consultada por el backend (paso 5b, decisiones 44 y
46) y con el resolvedor que elige proveedor al guardar la oferta, al invitar y al consultar (paso
4a, decisión 48), y con *Mi compañía* por proveedor, la etiqueta de la sesión y el plazo en días
enteros en la pantalla (paso 6.1, decisión 50), y con la oferta que conserva su conexión al guardar
(paso 6.2a, decisión 51), y el 2026-09-16 con la demo que pide la prueba real (decisión 57), y el 2026-09-20 con el aviso de la invitación que no sale y el plazo desde la invitación (paso 10, decisión 55). No es historia ni
justificación: **los porqués están en la bitácora**, y aquí solo se apunta el número de
decisión. Cuenta qué le pasa a una persona en cada caso.

🔴 **Regla de mantenimiento:** todo brief que cambie el flujo actualiza este documento **en la
misma revisión del diff**, antes de dar el paso por cerrado. Si no, en dos pasos será una
tercera copia desincronizada, que es justo lo que existe para evitar.

## Las piezas, en una frase cada una

- **El embudo** (el orquestador): decide cuándo arranca la etapa, le escribe al candidato,
  guarda su estado, aprueba y descarta. Es el único que conoce el modo demo.
- **El puerto**: una capa que no conoce a ningún proveedor. Ofrece listar vacantes, comprobar
  que una vacante sirve, validar una conexión, **invitar** a un candidato y **consultar
  resultados en lote**. Tiene dos implementaciones, los adaptadores de EvaluaTest y de
  PsicoAlianza, y **ya no hay un token que apunte a uno fijo**: quien necesita un adaptador se
  lo pide al resolvedor.
- **El resolvedor**: un servicio de la capa psicométrica que decide con qué proveedor se habla,
  con una sola regla (decisión 48): por la conexión congelada en la oferta; sin ella, por la
  empresa —una conexión, esa; ninguna, *sin conexión*; dos o más, **EvaluaTest**—; y al
  consultar resultados, por el proveedor guardado en el candidato, con vacío como EvaluaTest.
  No llama a ningún proveedor: lee la lista de conexiones de la empresa una vez, por la lectura
  única, y devuelve el adaptador, el proveedor y la conexión con la que resolvió.
- **La lectura única de conexiones**: un servicio de la capa psicométrica que, dada una empresa
  y un proveedor, devuelve **su conexión** —identificador, nombre, credenciales descifradas y el
  correo de pruebas de la empresa— o falla como **sin conexión** si no existe o está
  incompleta, y también **la lista de conexiones de una empresa** sin descifrar, que es lo que
  usa el resolvedor. Es **la única regla de lectura de credenciales del backend**: por ahí pasan
  los adaptadores, el resolvedor, la creación con IA, la sincronización del índice y el servicio
  de empresas (decisión 41). Lee la lista `psychometricConnections`; el bloque viejo
  `evaluatestCredentials` sigue en la base y **nadie lo lee ni lo escribe**.
- **El adaptador de EvaluaTest**: pide a la lectura única la conexión de EvaluaTest de la
  empresa, hace contra el cliente los pasos que EvaluaTest exige y traduce sus estados a los
  neutros del puerto. El embudo no lee ninguna credencial (decisiones 34 y 40).
- **El cliente de EvaluaTest**: las peticiones HTTP. Exige credenciales en cada llamada; **ya
  no existe la cuenta compartida del entorno** (decisión 34).
- **El cron**: cada 5 minutos consulta resultados por el adaptador de cada proveedor y decide el
  veredicto.
- **La renovación de la sesión de PsicoAlianza** (paso 2c.2, decisión 54): un servicio de la
  subcarpeta de PsicoAlianza que decide *cuándo* se consigue una sesión —una tarea cada hora que
  renueva a los cuatro días o cuando la comprobación barata la ve muerta, y a demanda cuando el
  adaptador encuentra la sesión caducada o alguien guarda la conexión— con una sola ráfaga a la vez
  en todo el backend, tope por ventana de 24 horas y correo a los desarrolladores; la pieza que
  entra con Chromium por el proxy móvil es la del 2c.1. Con la sesión manual del `.env` encendida no
  hace nada.
- **La entrega del enlace pendiente** (paso 11, decisión 59): un servicio propio al lado del embudo
  que, cuando el candidato pulsa «Sí, Continuar» o escribe cualquier cosa con un enlace guardado, le
  manda **el mensaje de siempre** con ese enlace, anota que ya lo recibió y borra el pendiente. **No
  decide nada**: ni si la ventana está abierta ni cuál es el plazo; las dos cosas se las da el
  embudo, que es quien las sabe. **Tampoco guarda**: guarda el embudo, después del mensaje y con el
  guardado con reintento, porque otros candidatos de la misma oferta guardan a la vez y un choque
  después de mandar el enlace dejaría el pendiente vivo —se lo volvería a mandar en su siguiente
  mensaje, y su plazo contaría desde antes de lo que le dijo—. El texto del mensaje con el enlace vive en un archivo aparte, sin
  lógica, y lo usan el arranque y la entrega.

## 1 · La empresa se conecta y configura la oferta

1. En *Mi compañía*, la sección de la prueba se titula *Conexión de pruebas psicométricas* y
   debajo enseña **dos filas siempre, EvaluaTest y PsicoAlianza**, en ese orden (decisión 50).
   Cada fila sigue el patrón del resto de la pestaña del flujo (2026-09-16): si la conexión de ese
   proveedor está configurada, «**EvaluaTest** — Configurado — correo»; si está incompleta o no
   existe, «**EvaluaTest** — Sin configurar». El botón dice siempre *Editar*: *Conectar* es solo el
   de la sesión de PsicoAlianza (2c.3). El nombre de la conexión ya no se enseña. El correo sale **de la lista de conexiones**, que el backend sirve con el correo de
   cada una; *Mi compañía* ya no lee el bloque derivado de EvaluaTest. Solo se puede tener una
   conexión por proveedor, y **no hay "desconectar"**.

   Cada botón abre el modal **fijado al proveedor de su fila**, sin selector, con el proveedor en
   el título y **nombre, correo y contraseña**: el nombre viene con el de la conexión de ese
   proveedor, aunque esté incompleta, o con el del proveedor si no hay ninguna, y **no se puede
   editar**; el correo, el de esa conexión o vacío; **la contraseña viene siempre vacía** —nunca
   sale del backend— y **solo es obligatoria si la conexión no está configurada**. Con la conexión
   configurada, el campo enseña puntos y el aviso *«Déjala vacía para conservar la contraseña
   guardada.»*; si se deja vacía, la validación usa la guardada y el guardado la conserva (decisión
   56). Al guardar, el portal manda **el proveedor en las dos peticiones**, la validación y el
   guardado:

   - **Con EvaluaTest**, valida contra EvaluaTest, exige el identificador de empresa que devuelve
     —si no llega, *no se pudo identificar tu empresa*— y guarda con él. El correo no es
     obligatorio en el formulario.
   - **Con PsicoAlianza**, el correo **es obligatorio** en el formulario; la validación no entra en
     PsicoAlianza (decisión 44) y no trae identificador, y se guarda sin él. Guardar PsicoAlianza no
     toca la fila de EvaluaTest.

   **El backend lo guarda como una conexión con nombre** en la lista de la empresa —`id`, `name`,
   `provider` y una bolsa `credentials` con correo, contraseña cifrada y, con EvaluaTest, el
   identificador— (decisiones 1, 41 y 46). Un nombre ausente o en blanco conserva el guardado, y si
   no hay, el del proveedor. **Ningún otro guardado de la página manda la conexión**: solo el modal.
   El backend conserva su regla de tres casos para ese bloque —correo y contraseña vacíos → se
   quita la conexión; correo con contraseña vacía → se conserva la guardada; lo demás → se crea o
   se actualiza—, pero desde el portal no se llega a quitar ni a mandar vacía. Sirve de vuelta el
   bloque **derivado de la lista, sin contraseña**, que siguen leyendo las ofertas, y la lista con
   `id`, `name`, `provider`, `email` y `configured`. La contraseña no sale del backend.

   **La etiqueta de la sesión, solo en la fila de PsicoAlianza y solo con su conexión configurada**
   (paso 2c.3, decisión 54). La fila pregunta el estado al cargar la página, después de guardar el
   modal y después de pulsar *Conectar*, y solo cuenta la última respuesta pedida. La etiqueta **no
   decide nada**: elige el texto con lo que la ruta de estado dice además de `status`, en este orden,
   la primera que aplica gana:

   | # | Condición | Texto | Botón *Conectar* |
   | --- | --- | --- | --- |
   | 1 | Mientras llega la respuesta | Indicador de carga | Apagado |
   | 2 | `status` es `connected` | «Conectado» (chip verde) | No se muestra |
   | 3 | Hay ráfaga en curso | «Conectando…», con indicador | Apagado |
   | 4 | Bloqueada por credenciales | «Conexión fallida — PsicoAlianza rechazó el correo o la contraseña. Revísalos y guarda de nuevo.» (aviso amarillo) | Apagado |
   | 5 | Tope de intentos alcanzado | «Error de conexión — contacta a soporte.» (aviso rojo) | Apagado |
   | 6 | Ha habido algún intento | «Conexión fallida — vuelve a intentarlo.» (aviso amarillo) | Encendido |
   | 7 | No ha habido ninguno | «Pendiente de conexión — pulsa Conectar para conectar ahora.» (aviso amarillo) | Encendido |
   | 8 | La petición falla | «No se pudo comprobar la sesión» | No se muestra |

   «Conectado» gana sobre cualquier fallo guardado: un desenlace viejo con la sesión de hoy viva es
   *Conectado*, y con la renovación anticipada en curso también, porque las invitaciones salen.
   `no_connection` → nada, porque la fila ya dice *Sin configurar*. **Pulsar *Conectar*** llama a la
   ruta de escritura de abajo y pinta su respuesta; **mientras la respuesta diga que hay ráfaga en
   curso, la fila vuelve a pedir el estado cada cinco segundos** hasta que deje de haberla —también
   al cargar la página o al guardar el modal si la respuesta ya viene así—, con tope de doce minutos,
   y se para al salir de la pantalla. El botón no adivina si arrancó: si el candado lo tiene otra
   empresa, la respuesta lo dice y la fila queda en el texto 6 o 7. Toda la sección de etapas está
   detrás del permiso de editar la empresa, así que quien solo puede leer no ve la fila ni el botón.

   **El plazo de la prueba** se configura en la pestaña de desarrollo de *Mi compañía*, que **solo
   aparece añadiendo `mode=dev` a la dirección**: un reclutador normal no lo ve. Su texto ya no
   nombra a EvaluaTest. Si la empresa tiene conexión de PsicoAlianza en la lista, completa o no, el
   campo va de uno en uno y guardar la pestaña con decimales **no manda nada** y avisa de que con
   PsicoAlianza el plazo va en días enteros; sin PsicoAlianza admite medios días, como siempre. Tres
   guardados mandan la empresa entera, plazo incluido —esa pestaña, los interruptores de etapa del
   flujo y el modal de credenciales de un portal de empleo—, y **cuando el backend los rechaza con
   un 400 se enseña su mensaje** en vez de *error al actualizar*. Así, una empresa con 1,5 días
   guardados que conecta PsicoAlianza ve por qué no puede pulsar un interruptor. ⚠️ Un plazo tecleado
   y no guardado se queda en el formulario compartido y viaja con el siguiente interruptor, que el
   backend rechaza con su mensaje (aceptado).

   **La conexión de PsicoAlianza se guarda desde el portal, y el backend la valida y consulta así**
   (paso 5b, decisión 46; pantalla del paso 6.1, decisión 50):

   - **Guardar por proveedor.** El mismo bloque del modal —que conserva su nombre de EvaluaTest,
     contrato con el portal de hoy— acepta `provider`: vacío o ausente es EvaluaTest, y un valor
     que no sea `evaluatest` ni `psicoalianza` se rechaza con mensaje propio. La regla de tres
     casos se aplica **solo a la conexión de ese proveedor**: guardar PsicoAlianza en una empresa
     con EvaluaTest deja las dos, y quitar una no toca la otra; cada oferta sigue usando la
     conexión con la que se activó. Al reconstruir se parte de la conexión guardada y se pisan
     solo correo y contraseña —el identificador de empresa, solo con EvaluaTest—: **renombrar la
     conexión de PsicoAlianza conserva su sesión acuñada** y cualquier otro campo de la bolsa. Sin
     nombre nace como «PsicoAlianza». **Y si la conexión de PsicoAlianza que queda guardada está
     completa, después de que la base escriba se dispara por detrás un intento de conseguir la
     sesión** (paso 2c.2, decisión 54): se libera el bloqueo por credenciales rechazadas y sale una
     ráfaga saltando la hora de espera, sin saltar el tope. La respuesta al portal no cambia ni
     espera; renombrar también dispara; crear la empresa con la conexión no dispara (su primera
     sesión la consigue la tarea de la hora). **La etiqueta de hoy todavía no lo enseña**: sigue
     leyendo la comprobación barata, y «Conectando…» y los textos por desenlace llegan con el 2c.3.
   - **Validar sin login.** La misma ruta de validación acepta `provider`; con PsicoAlianza responde
     por su adaptador **sin llamar a nadie** —válida si trae correo y contraseña, sin identificador
     de empresa— porque validar sería acuñar una sesión y un captcha rechazado acusaría a la
     contraseña (decisión 44). Con EvaluaTest sigue haciendo login por el puerto. **Si la contraseña
     llega vacía**, las dos validaciones usan la que la empresa del usuario autenticado tiene
     guardada para ese proveedor; sin conexión guardada, validan con la vacía y fallan como antes
     (decisión 56).
   - **El estado de la sesión.** Una ruta de solo lectura bajo *Mi compañía* responde `connected`,
     `no_session`, `expired` o `no_connection`, comprobando de verdad con la petición barata del
     cliente y **sin acuñar nada**; primero resuelve la conexión, así que con la sesión manual
     encendida una empresa sin PsicoAlianza sale `no_connection` y no «conectada». **Desde el
     2c.3 responde además cuatro datos** al lado de `status`, leídos del servicio de renovación:
     `bursting` (hay ráfaga en curso para esa empresa), `blockedByCredentials` (el último desenlace
     fue *credenciales rechazadas*), `capReached` (los intentos de la ventana viva llegan al tope,
     con el mismo cálculo que decide si arranca una ráfaga) y `attempted` (hay algún desenlace
     guardado). Con `no_connection` los cuatro van en falso y no se lee nada más.
   - **Conectar.** Una ruta de escritura bajo *Mi compañía*, con el permiso de editar la empresa,
     pide una sesión al servicio de renovación con el motivo *botón*, **saltando la espera entre
     ráfagas y sin liberar el bloqueo ni saltar el tope**, y responde lo mismo que la ruta de estado
     leído justo después: como el candado se toma antes de la primera espera, `bursting` ya viene
     en verdadero si la ráfaga arrancó. Con la sesión manual encendida no arranca nada y la
     respuesta lo refleja.
   - **Plazo en días enteros.** Al crear o editar la empresa, un plazo de la prueba con decimales
     se rechaza si la empresa tiene —o va a tener en esa misma petición— conexión de PsicoAlianza,
     mirando la lista resultante. Con EvaluaTest se sigue aceptando. Es la mitad de producto de la
     guarda del adaptador (§2); la variable de entorno no se valida.
2. Al crear o editar una oferta, el reclutador ve los controles de la prueba psicométrica **si la
   empresa tiene alguna conexión configurada**, del proveedor que sea (decisión 51). Si no tiene
   ninguna, en su lugar ve un aviso neutro —*tu empresa no tiene un proveedor de pruebas
   psicométricas conectado; esta etapa se omitirá*— con un enlace a *Mi compañía* si tiene permiso
   para editar la empresa, y si no, la indicación de pedírselo a un administrador (decisión 40).

   **La conexión de la oferta.** Con una sola conexión configurada no hay selector y se usa esa; con
   dos, un selector de proveedor encima de la vacante, con el nombre y el proveedor de cada una
   (decisión 3). Qué viene elegido al abrir (decisión 51):

   - **Crear desde cero**: ninguna. Con dos conexiones no se ven vacante, puntaje ni pruebas hasta
     elegir, y no se deja pasar de paso sin elegir proveedor.
   - **Crear desde un borrador de la IA**: EvaluaTest, con la vacante sugerida.
   - **Copiar una oferta, o abrir la ficha de una que tenga conexión o vacante guardada**, con la
     prueba activa o desactivada: su conexión congelada si sigue configurada, o EvaluaTest si no tiene
     congelada, **con su vacante**. En cualquier otro caso —la congelada ya no está, o no hay congelada
     ni EvaluaTest— ninguna elegida (con una sola conexión, esa) y **sin vacante**, porque el número
     sería de otro proveedor; el puntaje sí se conserva. En la copia lo decide el listado antes de abrir el diálogo; en la ficha, la propia ficha al cargar la oferta.
   - **La ficha de una oferta que nunca tuvo prueba**: ninguna.

   Cambiar de proveedor borra la vacante, sus pruebas adicionales y su aviso, y vuelve a pedir la
   lista de vacantes. El reclutador elige una vacante de la lista **del proveedor elegido** —que se
   pide con esa conexión—, fija el **puntaje mínimo** (decisión 8; el campo guardado sigue siendo
   `minIGIScore`) y, **solo con EvaluaTest**, pruebas adicionales, que no pasan por el puerto
   (decisión 4). El aviso de la vacante se consulta con la conexión elegida, vuelve a consultarse si
   cambia, y habla de su proveedor: con PsicoAlianza, sus textos para completada, suspendida,
   archivada, sin pruebas, no encontrada y no verificada.
3. Al guardar con la prueba activa y una vacante, el backend elige la conexión en este orden
   (decisiones 48 y 51): **la que mande el portal** en el cuerpo —si no es de la empresa, rechazo
   con mensaje propio—; si no manda ninguna (el portal de hoy y el agente de WhatsApp), **la ya
   congelada en la oferta**, de modo que cambiar el puntaje no la mueve de proveedor; y solo si la
   oferta no tiene ninguna congelada —de antes de la migración o creada desde administración—, **la
   que diga el resolvedor por la empresa**: una conexión, esa; dos, la de EvaluaTest. **Si la
   congelada ya no está en la empresa**, no se re-congela por la regla, porque no se sabe de qué
   proveedor era la vacante: se rechaza antes de tocar al proveedor, con *la conexión de esta
   oferta ya no está en tu empresa; elige una conexión y vuelve a guardar* si la empresa tiene
   alguna, y con el mensaje de *conéctalo en Mi compañía* si no tiene ninguna. Una conexión vacía
   en el cuerpo cuenta como ninguna. Con la conexión elegida comprueba
   **por su adaptador** que la vacante sigue sirviendo. **Si la empresa no tiene conexión, la
   comprobación falla antes de tocar al proveedor y la ruta rechaza con un mensaje propio**
   —conéctalo en Mi compañía antes de activar la prueba—, distinto del «no se pudo verificar,
   reintenta» de un fallo pasajero (decisión 40); con un proveedor que no es EvaluaTest, los
   mensajes de vacante no usable y de no verificada no nombran a EvaluaTest. Apagar la prueba no
   exige conexión. Con conexión, guarda la configuración en el bloque de siempre de la oferta
   —vacante, nombre, dos códigos propios, puntaje mínimo y pruebas adicionales— **más
   `connectionId`, la conexión con la que se activó, y `providerData`, una bolsa para otro
   proveedor** (decisiones 5 y 41). Los dos se arrastran en cada guardado: cambiar el puntaje o
   apagar la prueba no los borra. Cada vez que se abre la oferta, el portal vuelve a comprobar la
   vacante y avisa si dejó de servir; el selector de vacantes y esa comprobación aceptan una
   conexión opcional en la consulta y, sin ella, resuelven por la empresa. Las pruebas de la
   vacante siguen siendo de EvaluaTest (decisión 4).

   **El portal manda siempre la conexión** al guardar con la prueba activa, también con una sola
   conexión configurada, y con PsicoAlianza manda el código de perfil como texto vacío y la lista de
   pruebas adicionales vacía, para que no se conserven los de EvaluaTest (paso 6.2b, decisión 51).

   **Migración única, antes de desplegar este backend** (decisión 41): un script de consola
   crea la conexión de EvaluaTest de cada empresa a partir de su bloque viejo y rellena
   `connectionId` en las ofertas con la prueba activa. Sin él, ninguna empresa tiene conexión y
   la etapa se salta en silencio para todas.
4. **Una oferta con la prueba activa que se quedó sin su conexión** (decisiones 40 y 51):
   - Si la empresa **no tiene ninguna** conexión configurada —se borraron las credenciales después,
     o la oferta se creó desde administración, que copia la configuración sin comprobar nada—, el
     detalle muestra **en lugar de los controles** el aviso de advertencia *la prueba está activada,
     pero tu empresa ya no tiene proveedor; la etapa se está omitiendo*. Sin interruptor, sin botón
     de configurar y sin la alerta de estado de la vacante.
   - Si la oferta tiene una conexión congelada que **ya no está entre las configuradas** y la
     empresa **tiene alguna**, el detalle muestra un aviso propio **junto a los controles** —*la
     conexión que usaba ya no está en tu empresa; la etapa se está omitiendo: configura otra conexión
     o desactiva la prueba*—, sin la alerta de estado de la vacante, y *Configurar* abre sin conexión
     elegida si hay dos, con esa si hay una, y siempre sin vacante. Así la oferta se repara eligiendo
     otra vacante o se desactiva.

   El detalle solo pide las pruebas adicionales de la vacante al cargar si la conexión de la oferta es
   de EvaluaTest, o si no tiene congelada y la empresa tiene EvaluaTest configurada.

## 2 · El candidato entra a la etapa

El candidato viene de las preguntas por WhatsApp. El bombeo del embudo lo pone en la etapa
y llama al arranque.

La etapa lee la configuración de la oferta por **un solo ayudante**, que devuelve la forma
neutra —activa, conexión, vacante, nombre, puntaje mínimo y una bolsa con lo propio de
EvaluaTest— desde el bloque de siempre; los demás lectores del backend siguen leyendo los
campos a mano (decisión 41).

**Si la oferta no tiene la prueba encendida**, la etapa se aprueba sola y sigue a la
siguiente. Es lo primero que ocurre, antes de mirar nada más.

**Si la tiene**, el arranque mira si la empresa está en modo demo (ver §7) y, si no, deja un
aviso en el registro cuando la oferta **no trae conexión guardada** —la creó administración,
que copia la configuración tal cual, o es de antes de la migración— y sigue. Después:

1. **Pide el adaptador al resolvedor** con la conexión congelada en la oferta y, si no la
   tiene, con la empresa (decisión 48): una conexión, esa; dos, EvaluaTest; ninguna, *sin
   conexión* (abajo). Si la conexión congelada ya no está en la lista de la empresa, también
   *sin conexión*. La rama demo no pasa por aquí (§7).
2. **Calcula el plazo**, una sola vez y antes de invitar, con el mismo resolutor que usa el
   descarte (empresa > entorno > 2 días). Ese único valor va a la invitación y al mensaje de
   WhatsApp, también en la rama demo (decisión 45). Si esa lectura falla, no se invita: cae como
   fallo pasajero (abajo).
3. Llama a **la invitación del adaptador resuelto** con la vacante y su nombre, la empresa, nuestra
   referencia del candidato, su nombre, su correo, **su documento y el tipo de documento, todos
   tal cual están guardados, con su nulo si no tiene**, y el plazo. Ya no se inventa ningún
   correo (decisión 33). Qué hacer con el documento, el tipo y el plazo lo sabe cada adaptador:
   **EvaluaTest los ignora**; PsicoAlianza exige documento y plazo, traduce el tipo a su catálogo
   (vacío → CC; desconocido → OTRO) y manda el documento sin espacios, puntos, comas ni guiones,
   sin tocar lo guardado (decisión 45).
4. El adaptador comprueba, **en este orden y antes de tocar al proveedor**, y cada
   comprobación aborta con un error de tipo propio que el embudo trata distinto:
   - **La credencial de la empresa.** Si le falta cualquiera de las tres cosas, o no llegó
     empresa, aborta con *sin conexión*, y el embudo **aprueba la etapa y sigue**, por el
     mismo camino que la oferta sin prueba: el candidato no recibe ningún mensaje, no se le
     escribe nada y no se guarda nada. Queda un aviso en el registro con la empresa y la
     oferta (decisiones 34 y 40). Va primero porque sin prueba que perder da igual lo demás.
   - **El nombre de la vacante.** Si no está guardado, aborta con **el error de tipo
     permanente** (decisiones 35 y 39). Va antes que el correo porque es un error de
     configuración y merece la alerta a soporte.
   - **El correo del candidato**, nulo o en blanco. Aborta con *falta un dato del candidato*
     nombrando el correo, y el embudo lo **descarta** con `psychometric_missing_email`, sin
     mensaje y sin escribirle nada más: Julián contestó la última pregunta y se quedó en
     silencio (decisiones 31 y 33).
   - **El documento del candidato**, solo con PsicoAlianza (EvaluaTest no lo mira): nulo, en
     blanco o **sin ningún dígito** después de limpiarlo —«Bogotá» en el campo del documento—.
     Aborta con *falta un dato del candidato* nombrando el documento, y el embudo lo
     **descarta** con `psychometric_missing_document`, con el mismo trato que el correo: sin
     mensaje (decisión 45). El embudo elige el motivo por el campo que nombra el error. Con
     PsicoAlianza, el adaptador comprueba antes que estos dos el plazo: ausente o con
     decimales es **el error permanente** (decisión 39 ampliada).

   Son las dos puertas por las que hoy sale gente del proceso al entrar a la etapa; la del
   documento solo se alcanza con una oferta que congeló una conexión de PsicoAlianza, que hasta
   el paso 6 se escribe a mano (`../../entorno-local.md`).

   Con todo en orden, con EvaluaTest pasan **cuatro** cosas (32-a): se resuelve el código de
   evaluación de la vacante, se registra al candidato con nuestra referencia, se le invita, y
   **si la invitación falla se le manda el correo directo**. Con PsicoAlianza, los cuatro pasos
   de la decisión 27: consultar el correo del documento, invitar, buscar a la persona en el
   tablero y pedir su enlace personal.
5. El embudo guarda en el candidato: **el proveedor que resolvió** (`evaluatest` o
   `psicoalianza`), el identificador que ese proveedor le dio, la fecha de consulta, y en la
   bolsa del proveedor **el correo de registro solo si difiere del real** — vacío significa
   *empareja por el correo verdadero* (32-d). El estado del candidato pasa a *esperando
   resultado externo*. El guardado es con reintento (varios candidatos de la misma oferta
   terminan a la vez). El correo que se le enseña en el mensaje de PsicoAlianza **no sale de lo
   guardado**: sale de lo que devolvió la invitación en ese momento (punto siguiente).
6. Le escribe por WhatsApp: el enlace que devolvió la invitación, su correo enmascarado, las
   instrucciones y **el plazo**, el mismo valor que se calculó antes de invitar y que viajó en
   la invitación. Si la invitación no trajo enlace, el mensaje solo dice que llegará por
   correo — ⚠️ y no anuncia el plazo, aunque corre igual (riesgo abierto; con EvaluaTest hoy
   es inalcanzable). **El texto depende del proveedor resuelto** (decisión 49): con EvaluaTest,
   **desde el 2026-09-22 el correo del candidato va completo y antes del enlace**, con el aviso de
   que si se registra con otro su prueba no quedará asociada a su postulación, y los pasos «Aplicar
   ahora», «regístrate con el correo indicado arriba (o inicia sesión si ya tienes cuenta)» y
   «tienes N días para completarla»; sin correo del candidato, sin aviso y con el paso genérico
   (arreglo de otra rama, llevado al archivo del mensaje al fusionar); **con PsicoAlianza**, el paso 1 dice que el enlace entra directo a las pruebas
   pendientes, el paso 2 pide presentar todas las pruebas de la lista, el paso 4 pide
   «completarlas todas», y el correo enmascarado es **el de registro que devolvió la
   invitación** —el que PsicoAlianza ya tenía para ese documento, o el nuestro— porque es donde
   llega su aviso. La condición es «el proveedor resuelto es PsicoAlianza»: la demo y cualquier
   caso sin proveedor resuelto se quedan con el texto de EvaluaTest, y con EvaluaTest nunca se
   enseña el correo de la bolsa, que con el desvío de pruebas es la dirección de QA. El aviso sin
   enlace es el mismo para los dos.

   🔴 **Y desde el paso 11 (decisión 59), ese mensaje solo sale si la ventana de 24 horas de
   WhatsApp está abierta**, mirada **antes de enviar** con la hora del último mensaje entrante
   (Meta acepta el texto libre fuera de la ventana y lo descarta en silencio). Con la ventana
   **abierta**, todo como arriba, y se guarda la hora de la invitación (§4). Con la ventana
   **cerrada** —lo normal cuando la invitación sale tras un fallo de días—, **no se le manda el
   texto**: se le manda la **plantilla de etapa pendiente**, `pending_process_reminder` (el nombre sale
   de `WHATSAPP_PENDING_PROCESS_TEMPLATE`, que la trae por defecto): «Hola {{1}}👋 Para continuar con
   tu proceso de selección para {{2}} en {{3}}, necesitamos tu confirmación. ¿Deseas continuar con el
   proceso?», con su nombre de pila —«Candidato» si no lo hay—, el título de la oferta y el nombre de
   la empresa —«la empresa» si no lo hay—, y dos botones: **«Sí, Continuar»**, que manda el mismo
   identificador que el «Continuar proceso» de los recordatorios, y **«No»**, que manda el del retiro
   voluntario. **El enlace queda guardado como pendiente de entregar**, con la fecha en que quedó
   pendiente (§6). La hora de la invitación **no se escribe**: el plazo no puede contar desde un
   enlace que la persona no ha visto. Si la plantilla no se puede entregar, se registra y ya: el
   enlace sigue pendiente y corre el plazo de respaldo (§4). **No se reintenta sin botones**, a
   diferencia de la de recordatorio: sin su identificador, Meta devuelve el título del botón, y ni
   «Sí, Continuar» ni «No» se reconocen —no deben reconocerse: la plantilla de primer contacto tiene
   botones «Si»/«No» con otro significado—, así que serían botones que no hacen nada. La demo no
   pasa por esta comprobación: manda su texto como siempre.

   Lo que hace cada respuesta: **«Sí, Continuar»** va al reenvío de la etapa y le entrega el enlace
   (§2, más abajo). **«No»** la retira en el acto, como en cualquier etapa: «Entendido, gracias por
   avisarnos 🙏…» y el descarte con el motivo de retiro de la etapa. **Si escribe en vez de pulsar**
   —lo natural ante una pregunta—, cualquier texto en esta etapa con un enlace pendiente **le entrega
   el enlace** en vez de la respuesta fija de siempre («Tu prueba se realiza por correo electrónico
   📬…»); su mensaje abrió la ventana, así que llega. También un «no» escrito: es inofensivo, y para
   retirarse está el botón. Sin enlace pendiente, la respuesta fija de siempre.

   ⚠️ **Para que eso funcione, la hora del último mensaje entrante viaja con la persona al entrar a
   la etapa** —al pasar de etapa y al activarla el bombeo—, porque el embudo le estrena el estado
   de la conversación y sin esa hora la ventana se vería cerrada **siempre**. Se copia **solo hacia
   esta etapa**: en las demás la decisión se toma con el respaldo a plantilla, donde equivocarse
   hacia «cerrada» no pierde ningún mensaje, y copiarla allí cambiaría sus recordatorios en
   producción (paso aparte, anotado en la bitácora).

### Si el arranque falla

- **Fallo pasajero** (red, proveedor caído, sin código de evaluación, **la lectura del
  plazo o la resolución del proveedor**, que van antes de invitar): se le avisa al
  candidato **una sola vez** —con un enlace de respaldo si se puede armar, o si no con
  «⏳ Estamos preparando tu prueba psicométrica. En cuanto esté lista, te enviaremos el enlace
  por aquí y también a tu correo. Por ahora no tienes que hacer nada. ¡Mucho éxito! 🌟»,
  aprobado por el usuario el 2026-09-16: el aviso de antes le mandaba buscar en spam un correo
  que no se había enviado, y no promete tiempo porque la sesión puede tardar horas—, se le deja
  *esperando resultado externo* **sin identificador** y se guarda. El aviso del correo de
  siempre queda solo para la invitación que salió bien sin enlace (§2.6).
  El enlace de respaldo **solo existe con EvaluaTest resuelto** y lo arma **su adaptador**:
  con el código de evaluación guardado en la oferta si lo hay, y si no resolviéndolo por el
  cliente con la credencial de la empresa; el embudo ya no llama al cliente ni lee
  credenciales aquí. Con PsicoAlianza, o si la resolución misma falló y no hay proveedor
  resuelto, no hay respaldo y el mensaje dice que llegará por correo (decisión 48). **El cron
  lo reintenta** cada 5 minutos (§4). ⚠️ *Sin código de evaluación*
  cuenta como pasajero a propósito: EvaluaTest responde igual cuando el código no existe y
  cuando el endpoint falla (decisión 39). 🔴 **Con PsicoAlianza, una sesión muerta o ausente cae
  aquí**, y la etapa no se omite: el aviso dice que la prueba se está preparando, y como el
  vencimiento (§4) solo se mira a quien ya tiene identificador, la persona espera **sin plazo** hasta
  que vuelva la sesión (corrección de la decisión 44; **a propósito desde la revisión de la 55**: no
  pasa de etapa). **Desde el 2c.2, esa sesión muerta dispara la renovación** (decisión 54): el
  adaptador pide una sesión por fuera —sin esperar— y deja subir el fallo pasajero igual; la
  renovación arrienda una IP móvil, entra con Chromium y guarda la sesión, y en el primer tick del
  cron con sesión nueva la persona recibe su enlace.

  **Y desde el paso 10 (decisión 55, revisión del 2026-09-17), la espera no es silenciosa.** El primer
  fallo pasajero de cada persona guarda su hora en el estado de la conversación (solo si estaba
  vacía). En cada fallo pasajero posterior, si han pasado **20 minutos o más** desde ese primer fallo:
  se pone en la oferta una **novedad para el reclutador** asociada a la persona —«Prueba psicométrica
  pendiente — Problema técnico con el proveedor de la prueba. Seguimos intentándolo.»—, escrita con
  una operación atómica sobre la oferta para que un choque del guardado de la participación no la
  pierda; y sale un **correo a soporte**, como mucho **uno por empresa y proveedor cada 4 horas**
  (silencio en memoria: tras un reinicio puede salir uno de más), con la empresa, el proveedor —o
  *sin resolver* si falló resolverlo—, la oferta y el candidato que lo dispararon, el error y el
  número de personas de esa empresa que esperan la invitación desde hace 20 minutos o más (se cuenta
  por empresa: quien no fue invitado no tiene proveedor guardado). A la persona no se le escribe nada:
  la ventana de 24 horas de WhatsApp puede estar cerrada. **La novedad se quita sola** en cuanto el
  arranque termina de cualquier otra forma: la invitación sale, la empresa resulta sin conexión y la
  etapa se aprueba, falta un dato y se descarta, o el fallo es permanente. **Cuando la invitación sale
  se guarda su hora** y se borra la del primer fallo; desde esa hora cuenta el plazo (§4). La demo no
  escribe ninguna de las dos. Quien espera sigue ocupando cupo: cuenta para el cupo de la etapa de
  preguntas de su oferta (§7 de la bitácora, decisión 55).
- **Fallo permanente** (vacante sin nombre guardado): el arranque **deja salir la excepción**
  y actúa el mecanismo de la casa para cualquier etapa que falla al arrancar: correo de
  alerta a soporte, vuelta a la cola, hasta tres intentos y descarte con el motivo de
  *arranque fallido*, que el portal ya traduce. **Ese candidato no recibe ningún mensaje**
  (decisión 39). Medido el 2026-09-11: hoy no hay ninguna oferta viva en ese caso.

### Las cinco puertas del arranque

Por dónde se puede llegar a arrancar la etapa, y qué hace cada una con el fallo permanente
(decisión 39). **Ni *sin conexión* ni *falta un dato* llegan a ninguna**: el arranque los
convierte en aprobar y en descartar antes de que salgan, así que por las cinco puertas la
empresa sin conexión se salta la etapa (decisión 40) y el candidato sin correo o sin documento
se descarta (decisiones 33 y 45). Las cinco cargan el candidato entero, así que el documento y
su tipo llegan por todas. Dos consecuencias que constan: el reintento manual del administrador responde
"reintentado" en los dos casos, y el botón "Continuar proceso" aprueba o descarta sin decir
nada.

| Puerta | Qué pasa con el fallo permanente |
| --- | --- |
| El bombeo, al entrar a la etapa | Lo lleva al mecanismo de arranque fallido (arriba) |
| El bombeo, al retomar a un candidato aparcado sin identificador | Igual |
| El reintento manual del administrador | La petición responde con error y el candidato queda como estaba |
| El cron, al reintentar a quien no tiene identificador | Lo **descarta** con *arranque fallido* (§4) |
| El botón "Continuar proceso" de un recordatorio | ⚠️ **Se lo traga**: el webhook atrapa cualquier fallo. El candidato gastó la reapertura de WhatsApp en un botón que no hizo nada (sin paso todavía) |

Retomar a un candidato que **ya tiene** identificador no reinvita: solo lo devuelve a
*esperando resultado externo*. **Desde el paso 11, antes de eso mira si tiene un enlace pendiente
de entregar** (§2.6): si lo tiene y la ventana está abierta —que es el caso del botón «Sí, Continuar»
de la plantilla de etapa pendiente, porque
pulsarlo es un mensaje suyo y el enrutado guarda su hora **antes** de llegar aquí—, le manda **el
mismo mensaje de siempre** con ese enlace y el plazo, guarda la hora de la invitación y borra el
pendiente; desde ese momento cuenta su plazo. Si la ventana está **cerrada** —el otro camino que
llega aquí es el retomar de un aparcado, que no la abre—, **no se le manda nada y el pendiente se
conserva**: mandar el texto ahí sería tirarlo y dejarla sin enlace y sin plantilla.

## 3 · El cron consulta resultados

Cada 5 minutos, con un candado para que no corran dos pasadas a la vez. Recorre **todas las
ofertas menos las canceladas** que tengan candidatos esperando resultado en esta etapa, y por
cada oferta:

1. Salta la oferta si no tiene la prueba encendida.
2. Resuelve si la empresa está en demo desde un mapa cargado una vez por ciclo.
3. Separa a los pendientes en dos: **los que tienen identificador del proveedor** entran a la
   consulta; los que no, van al reintento del arranque (§4).
4. Carga en un solo golpe los correos reales de los que va a consultar.
5. **Agrupa a los que va a consultar por el proveedor guardado en el candidato** —vacío es
   EvaluaTest, que es lo que tiene todo el que estaba en vuelo— y hace **una llamada por grupo**
   al adaptador que da el resolvedor (decisiones 6 y 48): a cada persona se le pregunta donde
   fue invitada, aunque la empresa haya cambiado la oferta a otro proveedor después. Una oferta
   con todos de EvaluaTest sigue siendo una sola llamada (decisión 22). Cada llamada lleva, por
   candidato, nuestra referencia, su identificador, el correo de registro y el correo real. El
   adaptador de EvaluaTest trae el tablero de la vacante y empareja **por dos llaves**: primero
   por correo —el de registro si existe, si no el real— y como respaldo por identificador; el de
   PsicoAlianza empareja solo por identificador. Si una de las llamadas lanza, la oferta entera
   se cuenta como error y se salta esa pasada, como hoy.
6. Recibe un estado neutro por candidato:

| Estado | Qué significa | Qué hace el cron |
| --- | --- | --- |
| `finished` | Terminó; trae puntaje | Veredicto (§5) |
| `rejected_by_provider` | EvaluaTest lo descartó por su cuenta | Descarta con `psychometric_discarded` |
| `in_progress` | Está en el tablero y sigue en ello | Guarda estado y sigue esperando |
| `not_listed` | Se consultó bien y no aparece todavía | Guarda la fecha de consulta y sigue esperando |
| `query_failed` | **No se pudo preguntar** (excepción, tablero vacío, o **empresa sin conexión**) | Igual que `not_listed`, pero se cuenta aparte en el registro y en el resumen del ciclo |

⚠️ Ante `query_failed` **el plazo sigue corriendo** (decisión 36): una caída más larga que el
plazo descarta gente por vencimiento sin que nadie haya conseguido preguntar. Y el adaptador
no distingue *tablero vacío* de *petición fallida* — el arreglo es del cliente y no tiene paso.
La empresa sin conexión con gente ya esperando cae aquí, con el error *sin conexión* en el
registro, hasta que el plazo la descarte (decisión 40; medido el 2026-09-12: hoy nadie). **Con
PsicoAlianza, `query_failed` por sesión caducada dispara la renovación** (paso 2c.2, decisión 54):
el adaptador pide una sesión por fuera antes de devolverlo, la pasada no espera, y el tick siguiente
encuentra la sesión nueva si la ráfaga entró.

## 4 · Dentro del bucle, por candidato, en este orden

Cada iteración recarga la oferta fresca (aprobar a uno sube la versión del documento).

1. **Sin identificador del proveedor → reintenta el arranque entero** (§2). Si el reintento
   falla de forma **permanente**, lo **descarta** con *arranque fallido* — es el rescate del
   2026-09-11; antes se quedaba dentro para siempre, ocupando plaza y teléfono de pruebas
   (decisión 39). Si la empresa **no tiene conexión**, el reintento **aprueba la etapa** y el
   candidato sigue su proceso, igual que en el arranque (decisión 40). Si falla de forma
   pasajera, se registra, se cuenta como error y sigue esperando. ⚠️ Si el documento de la persona no se puede cargar, no se intenta nada y no
   se descarta nada. Medido el 2026-09-11: hoy no hay nadie sin identificador.
2. **Vencimiento**: la fecha de partida son **tres, en este orden** (decisiones 55 y 59): la **hora
   de la invitación** si la hay —el enlace se entregó, y es la ventana que se le anunció «a partir de
   este momento»—; si no, la **fecha en que el enlace quedó pendiente** —se le invitó pero nunca lo
   recibió: es el plazo de respaldo, para que no ocupe cupo para siempre—; y si no hay ninguna de
   las dos, **la entrada a la etapa**, que es lo de siempre y lo que se aplica a quien se invitó
   antes del paso 10. Pasado el plazo, le escribe que no se recibió su resultado a tiempo y lo
   descarta con `psychometric_external_timeout`; no se detiene por nada (decisión 36). Al retomar a
   un aparcado, la hora de la invitación **y** la fecha del pendiente se reinician junto con la
   entrada a la etapa, para que no venza en la pasada siguiente.
3. **El resultado** de §3, según el estado.

## 5 · El veredicto

Solo con `finished`. Se guarda el puntaje (⚠️ un puntaje ausente llega como **cero** y
reprueba — decisión 37, sin arreglar, no visto con EvaluaTest) y el estado; en la bolsa del
proveedor se guarda su código numérico. La bolsa **se empalma** a partir de la anterior desde
un único ayudante: el cron nunca pisa el correo de registro que escribió la invitación
(decisión 15).

- **Puntaje ≥ mínimo de la oferta** y, si hay pruebas adicionales, todas aprobadas → le
  escribe un agradecimiento y **aprueba** la etapa. Las pruebas adicionales se piden **al
  adaptador de EvaluaTest directamente** —es un método propio, fuera del puerto, como el de
  las pruebas de la vacante (decisión 4)— con el identificador que volvió del tablero (puede
  discrepar del guardado) y la credencial de la empresa resuelta con la regla del adaptador,
  **y solo si el proveedor guardado en el candidato es EvaluaTest** (decisión 48): a quien
  fue invitado en PsicoAlianza no se le piden, aunque la oferta las tenga configuradas.
  Si el adaptador falla ahí —también por *sin conexión*—, cuenta como error del ciclo y el
  candidato sigue esperando, como con cualquier excepción. Una oferta demo se las salta por
  su bandera, antes de llamar (§7).
- **Puntaje bajo** → le escribe que se recibieron sus resultados y se seguirá analizando su
  perfil, y descarta con `psychometric_score_<puntaje>`.
- **Prueba adicional no aprobada** (o no encontrada: se tratan igual) → mismo mensaje, y
  descarta con `psychometric_exam_<nombre>`.

El descarte archiva la etapa donde cayó; el portal la lee de ahí y solo deduce por el motivo
en registros viejos (decisión 17).

**El veredicto deja escrito el resultado para el reclutador** (decisión 58, paso 9). Con
`finished`, después de decidir —puntaje y, si se pidieron, pruebas adicionales— y **antes** del
mensaje y de aprobar o descartar, se escribe en la participación el resultado psicométrico
**sustituyendo el anterior**: proveedor, puntaje, mínimo aplicado (con el valor por defecto si la
oferta no lo tenía), si aprobó y la fecha. Las pruebas dependen del proveedor:

- **PsicoAlianza**: cada prueba **de la consulta de esta pasada** —no de la bolsa acumulada— con su
  nombre, su **peso en la vacante**, su nota y el texto de PsicoAlianza tal cual. El peso lo lee el
  adaptador de la entrada de la prueba cuyo proceso es el de la agenda, nunca la primera; sin entrada o
  sin número, nulo. Peso y nota se aceptan como número o texto con un número.
- **EvaluaTest**: las pruebas adicionales **solo si se consultaron en esta pasada**, aprobada o no
  **como las leyó el veredicto** (*sin dato* queda como no aprobada). Con puntaje bajo no se consultan
  y la lista va vacía.
- **Demo simulada**: el puntaje sintético con EvaluaTest y sin pruebas.

No se escribe en ningún otro desenlace: vencimiento, descarte del proveedor, en progreso, no aparece,
no se pudo consultar, reintento del arranque, ni cuando falla la consulta de las pruebas adicionales
(la persona sigue esperando y lo escribe la pasada que las consiga). No lleva guardado propio: viaja
con el de aprobar o descartar, que copia la participación entera también en el reintento por
conflicto. Nada del veredicto cambia por esto.

## 6 · Lo que queda escrito en el candidato

Seis campos con nombre neutro más una bolsa (decisión 15, paso 6b). **Al escribir, siempre
los nuevos; al leer, el nuevo y si está vacío el viejo.** Solo dos se leen:

| Campo | Quién lo lee |
| --- | --- |
| `psychometricProvider` | El cron, para agrupar a quién se le pregunta dónde, y para no pedir pruebas adicionales a quien no es de EvaluaTest (decisiones 6 y 48). Vacío se lee como `evaluatest` |
| `psychometricCandidateId` | El cron (a quién consultar, y a quién reintentar), el retomar, el reenvío del botón |
| `psychometricScore` | Nadie |
| `psychometricState` | Nadie |
| `psychometricLastPolledAt` | Nadie |
| `psychometricProviderData` | El cron, para el correo de registro. Guarda además el código de estado y el resultado por prueba adicional |
| `psychometricInvitedAt` (paso 10) | El cron, para el vencimiento: desde aquí cuenta el plazo. Lo escribe la invitación que sale; el retomar lo reinicia; nace nulo |
| `psychometricInviteFirstFailedAt` (paso 10) | El arranque, para avisar a los 20 minutos. Lo escribe el primer fallo pasajero; lo borra la invitación que sale; nace nulo |
| `psychometricPendingLink` (paso 11) | El reenvío del botón y la respuesta al texto libre de la etapa: es el enlace que se le entrega al pulsar «Sí, Continuar» o al escribir. Lo escribe la invitación que sale con la ventana cerrada; lo borra la entrega; nace nulo. Es un dato personal: no se registra en el log |
| `psychometricPendingLinkSince` (paso 11) | El cron, para el vencimiento cuando el enlace nunca se entregó (§4). Se escribe y se borra con el anterior; el retomar la reinicia; nace nula |

Los seis campos viejos con prefijo `evaluatest` siguen en el esquema, solo se leen. La
compatibilidad caduca sola: nadie está a mitad de prueba más que el plazo.

**Y uno permanente en la participación, fuera del estado de la conversación** (decisión 58, paso 9):
`psychometricResult`, al nivel de la fecha de la entrevista y de los documentos enviados. Lo escribe el
veredicto (§5) y **lo lee el portal** en el detalle del candidato (§8). Vive fuera porque aprobar
reinicia el estado de la conversación o lo deja en nulo, y ahí el resultado se borraría al avanzar.
Nace nulo: quien se evaluó antes del paso 9 no lo tiene y no se rellena. Ningún dato suyo es obligatorio
en el esquema, para que un resultado incompleto no pueda impedir el guardado del veredicto. Reiniciar
a alguien con la caja de pruebas de WhatsApp no lo toca: queda el anterior hasta un veredicto nuevo.

| Dato | Qué es |
| --- | --- |
| `provider` | El proveedor guardado en el candidato |
| `score` | El puntaje que decidió el veredicto (el mismo número, también con la decisión 37 sin arreglar) |
| `minScore` | El mínimo aplicado en ese veredicto |
| `passed` | El veredicto entero: puntaje y pruebas adicionales |
| `decidedAt` | Cuándo se dio |
| `tests[]` | `name`; con PsicoAlianza `weight`, `score` y `recommendationText`; con EvaluaTest `approved`. Lo que un proveedor no da, nulo |

🔴 **Sin vuelta atrás**: la versión anterior del backend no lee los campos nuevos y
reinvitaría a quien se invitó después del despliegue (registro del paso 6b).

## 7 · El modo demo: cinco puntos, todos en el embudo

Una empresa marcada como demo en la base (sin pantalla) enseña el producto a un cliente
potencial con una candidata configurada. La etapa psicométrica **no llama nunca a EvaluaTest**,
**el puerto no sabe que existe la demo** y **la demo no pasa por el resolvedor** (decisiones
38 y 48). **Salvo que la empresa tenga `demoMode.realPsychometrics` encendido** (decisión 57):
entonces los cinco puntos de abajo no aplican, la etapa va por §2 a §5 como en cualquier empresa
—el proveedor lo elige la conexión de la oferta— y «avanzar ya» responde que no aplica en esta
etapa; el resto de la demo (inyección del candidato, sin robots, cédula, documentos y antecedentes
simulados) sigue igual. Los cinco puntos:

1. **La invitación** (§2): en vez de resolver e invitar, fabrica un identificador
   determinístico y **positivo**, un enlace de apariencia normal que no lleva a ninguna prueba,
   y escribe los campos nuevos como cualquiera, con `evaluatest` como proveedor. El mensaje al
   candidato es el mismo.
2. **El temporizador**: tras el mensaje, agenda una pasada del cron a los segundos de retraso
   configurados (45 por defecto) para que la demo se resuelva sin esperar 5 minutos.
3. **La sustitución de la consulta** (§3): en vez de agrupar por proveedor y preguntar a los
   adaptadores, un constructor sintético
   devuelve `not_listed` a quien sigue dentro del retraso y `finished` con puntaje mínimo + 5
   a quien lo pasó. Sin credenciales, sin tablero.
4. **La acción de administración "avanzar ya"**: atrasa a mano la fecha de arranque para
   meter a la candidata en la ventana y dispara el cron.
5. 🔴 **El salto de las pruebas adicionales** (§5): condición aparte, dentro del veredicto,
   **delante** de la llamada al adaptador. Es el único sitio donde olvidar la bandera provoca
   una llamada real a EvaluaTest con un identificador inventado; hoy fallaría como *sin
   conexión* si la empresa demo no tiene credenciales, y saldría con las suyas si las tiene.

Fuera de la etapa, el portal de una empresa demo **sin credenciales muestra el aviso de "sin
proveedor" en vez de los controles de la prueba**, así que sus ofertas no la tienen; una demo
con credenciales usa las suyas para elegir vacante. La demo **se queda como está** (decisión
40).

## 8 · Lo que ve el reclutador

- **Motivos de rechazo** (decisiones 13, 16, 33 y 45; paso 7, cambio del correo y paso 5a): el
  backend escribe solo los seis con prefijo `psychometric_`; el portal traduce viejos y nuevos
  **para siempre**, las métricas unifican viejo y nuevo antes de contar, y el visor del embudo
  los agrupa en *Psicométrica — no completó* (vencimiento), *Psicométrica — reprobada* (puntaje,
  prueba adicional y descarte del proveedor), *Psicométrica — sin correo* (`missing_email`) y
  *Psicométrica — sin documento* (`missing_document`), los dos últimos con grupo propio porque
  nunca se le mandó nada. 🔴 Despliegue: el orden vigente es el de `before-deploy.md`.
- **Ficha de la oferta**: la vacante elegida, el interruptor de la etapa, el **puntaje mínimo**
  —en ningún texto del portal ni del agente de WhatsApp aparece ya "IGI" (decisión 8)— y la
  alerta si la vacante dejó de servir, consultada con la conexión de la oferta y con los textos de
  su proveedor. En el modal de configurar, el selector de proveedor cuando la empresa tiene dos
  conexiones, y las pruebas adicionales solo con EvaluaTest (decisión 51). **Sin ninguna conexión
  configurada**, en su lugar el aviso de §1 —el informativo si la oferta no tiene prueba, el de
  advertencia si la tiene activa y se está omitiendo—, con enlace a *Mi compañía* solo para quien
  puede editar la empresa (decisión 40). **Con la conexión de la oferta ya no configurada y otra en
  la empresa**, el aviso de §1 punto 4 junto a los controles, para repararla o desactivarla.
- **Detalle del candidato** (el ojo de la tabla de candidatos; decisión 58, paso 9): si la
  participación tiene resultado, un bloque *Prueba psicométrica* junto al de ReTHUS y con su forma.
  Encabezado con el proveedor y la fecha, *Puntaje*, *mínimo de la oferta* y el único «Aprobó» o «No
  aprobó» del bloque, en verde o rojo. Con PsicoAlianza, una tabla *Prueba · Peso · Nota · Resultado*
  con el texto de PsicoAlianza tal cual, sin colores; con EvaluaTest, la lista de pruebas adicionales
  con *Aprobada* o *No aprobada*; sin pruebas, solo el encabezado. Números y fecha en el idioma elegido
  en el portal; un dato nulo, «—». No tiene condición de visibilidad propia: el ojo solo aparece para
  candidatos desbloqueados o añadidos a mano.
- **La invitación que no sale** (paso 10, decisión 55): a los 20 minutos del primer fallo, junto a la
  persona en la tabla de candidatos el icono de advertencia, y en su detalle la novedad «Prueba
  psicométrica pendiente — Problema técnico con el proveedor de la prueba. Seguimos intentándolo.».
  Es la misma novedad por candidato que usa el fallo técnico de ReTHUS, así que también viaja en los
  correos «Entrevista agendada» y «Falta agendar la entrevista» si sigue puesta. Desaparece sola
  cuando la invitación sale o el arranque termina de otra forma.
- **Lo que no ve**: nada de los campos del candidato dentro del estado de la conversación de §6 (el
  portal no los lee), ni el resultado de quien se evaluó antes del paso 9.

## 9 · Lo que este flujo todavía arrastra, con su paso

| Qué | Dónde cae |
| --- | --- |
| Creación desde administración: copia la configuración de la prueba sin comprobar la conexión ni la vacante | Anotado, del equipo interno (decisión 40) |
| El bloque viejo `evaluatestCredentials` sigue en la base sin lectores ni escritores | Limpieza aparte (decisión 41) |
| Puntaje ausente leído como cero | Etapa 3 (decisión 37) |
| Tablero vacío indistinguible de petición fallida | Sin paso (decisión 36) |
| El botón "Continuar proceso" se traga el fallo permanente | Sin paso (decisión 39) |
| La rama sin enlace no anuncia el plazo | Riesgo abierto |
