# La etapa psicométrica hoy, de punta a punta

Cómo funciona la etapa **tal como está en el código** de la rama de trabajo, leído el
2026-09-11 tras el paso 7 y el rescate, y actualizado el 2026-09-12 con el cambio de la cuenta
compartida (decisiones 34 y 40) y el del correo inventado (decisión 33), y el 2026-09-13 con
las conexiones de la empresa y la conexión de la oferta (paso 8a, decisión 41) y con el portal
leyendo la lista y "Puntaje mínimo" (paso 8b, decisiones 8 y 41), y el 2026-09-14 con el documento,
el tipo y el plazo en la invitación y el descarte por documento (paso 5a, decisión 45) y con la
conexión de PsicoAlianza guardada, validada y consultada por el backend (paso 5b, decisiones 44 y
46). No es historia ni
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
  resultados en lote**. Hoy tiene una sola implementación: el adaptador de EvaluaTest.
- **La lectura única de conexiones**: un servicio de la capa psicométrica que, dada una empresa
  y un proveedor, devuelve **su conexión** —identificador, nombre, credenciales descifradas y el
  correo de pruebas de la empresa— o falla como **sin conexión** si no existe o está
  incompleta. Es **la única regla de lectura de credenciales del backend**: por ahí pasan el
  adaptador, la creación con IA, la sincronización del índice y el servicio de empresas
  (decisión 41). Lee la lista `psychometricConnections`; el bloque viejo `evaluatestCredentials`
  sigue en la base y **nadie lo lee ni lo escribe**.
- **El adaptador de EvaluaTest**: pide a la lectura única la conexión de EvaluaTest de la
  empresa, hace contra el cliente los pasos que EvaluaTest exige y traduce sus estados a los
  neutros del puerto. El embudo no lee ninguna credencial (decisiones 34 y 40).
- **El cliente de EvaluaTest**: las peticiones HTTP. Exige credenciales en cada llamada; **ya
  no existe la cuenta compartida del entorno** (decisión 34).
- **El cron**: cada 5 minutos consulta resultados por el puerto y decide el veredicto.

## 1 · La empresa se conecta y configura la oferta

1. En *Mi compañía*, la sección de la prueba se titula *Conexión de pruebas psicométricas* y
   muestra, si la conexión de EvaluaTest está configurada, **su nombre, el proveedor entre
   paréntesis y el correo** —«EvaluaTest Medicall (EvaluaTest) — correo»—; si no, *sin proveedor
   conectado*. El botón abre un modal con **nombre, correo y contraseña**: el nombre viene con el
   de la conexión que haya, aunque esté incompleta, o con «EvaluaTest» si no hay ninguna; **la
   contraseña viene siempre vacía y es obligatoria**, porque guardar valida contra EvaluaTest y
   sin ella no puede — renombrar exige volver a teclearla (decisión 41). El portal valida
   primero, recibe el identificador de empresa que EvaluaTest devuelve y solo entonces guarda,
   mandando nombre, correo, contraseña e identificador. **El backend lo guarda como una conexión
   con nombre** en la lista de la empresa —`id`, `name`, `provider` (`evaluatest`) y una bolsa
   `credentials` con correo, contraseña cifrada e identificador— (decisiones 1 y 41). Un nombre
   ausente o en blanco conserva el guardado, y si no hay, «EvaluaTest». **Ningún otro guardado de
   la página manda ya la conexión**: solo el modal. El backend conserva su regla de tres casos
   para ese bloque —correo y contraseña vacíos → se quita la conexión; correo con contraseña
   vacía → se conserva la guardada; lo demás → se crea o se actualiza—, pero desde el portal ya
   no se llega a quitar ni a mandar vacía: **no hay "desconectar"**. Sirve de vuelta el bloque
   **derivado de la lista, sin contraseña** —de ahí sale el correo que se muestra— y la lista con
   `id`, `name`, `provider` y `configured`. La contraseña no sale del backend.

   **El backend ya guarda, valida y consulta la conexión de PsicoAlianza; el portal todavía no la
   manda** (paso 5b, decisión 46; la pantalla es del paso 6, y en local se inserta a mano):

   - **Guardar por proveedor.** El mismo bloque del modal —que conserva su nombre de EvaluaTest,
     contrato con el portal de hoy— acepta `provider`: vacío o ausente es EvaluaTest, y un valor
     que no sea `evaluatest` ni `psicoalianza` se rechaza con mensaje propio. La regla de tres
     casos se aplica **solo a la conexión de ese proveedor**: guardar PsicoAlianza en una empresa
     con EvaluaTest deja las dos, y quitar una no toca la otra; cada oferta sigue usando la
     conexión con la que se activó. Al reconstruir se parte de la conexión guardada y se pisan
     solo correo y contraseña —el identificador de empresa, solo con EvaluaTest—: **renombrar la
     conexión de PsicoAlianza conserva su sesión acuñada** y cualquier otro campo de la bolsa. Sin
     nombre nace como «PsicoAlianza».
   - **Validar sin login.** La misma ruta de validación acepta `provider`; con PsicoAlianza responde
     por su adaptador **sin llamar a nadie** —válida si trae correo y contraseña, sin identificador
     de empresa— porque validar sería acuñar una sesión y un captcha rechazado acusaría a la
     contraseña (decisión 44). Con EvaluaTest sigue haciendo login por el puerto.
   - **El estado de la sesión.** Una ruta de solo lectura bajo *Mi compañía* responde `connected`,
     `no_session`, `expired` o `no_connection`, comprobando de verdad con la petición barata del
     cliente y **sin acuñar nada**; primero resuelve la conexión, así que con la sesión manual
     encendida una empresa sin PsicoAlianza sale `no_connection` y no «conectada». El botón para
     conectar llega con el acuñador (2c).
   - **Plazo en días enteros.** Al crear o editar la empresa, un plazo de la prueba con decimales
     se rechaza si la empresa tiene —o va a tener en esa misma petición— conexión de PsicoAlianza,
     mirando la lista resultante. Con EvaluaTest se sigue aceptando. Es la mitad de producto de la
     guarda del adaptador (§2); la variable de entorno no se valida.
2. Al crear o editar una oferta, el reclutador ve los controles de la prueba psicométrica
   **solo si la conexión de EvaluaTest de la empresa está configurada** —correo, contraseña e
   identificador de empresa—, y no basta con que haya alguna conexión: los controles llaman a
   EvaluaTest. Si no, en su lugar ve un aviso
   neutro —*tu empresa no tiene un proveedor de pruebas psicométricas conectado; esta etapa se
   omitirá*— con un enlace a *Mi compañía* si tiene permiso para editar la empresa, y si no,
   la indicación de pedírselo a un administrador (decisión 40). Con conexión, elige una
   vacante de la lista que el puerto devuelve, fija el **puntaje mínimo** (decisión 8; el campo
   guardado sigue siendo `minIGIScore`) y, opcionalmente, pruebas adicionales — estas últimas no
   pasan por el puerto: son exclusivas de EvaluaTest (decisión 4).
3. Al guardar con la prueba activa, el backend comprueba por el puerto que la vacante sigue
   sirviendo. **Si la empresa no tiene conexión, la comprobación falla antes de tocar al
   proveedor y la ruta rechaza con un mensaje propio** —conéctalo en Mi compañía antes de
   activar la prueba—, distinto del «no se pudo verificar, reintenta» de un fallo pasajero
   (decisión 40). Apagar la prueba no exige conexión. Con conexión, guarda la configuración en
   el bloque de siempre de la oferta —vacante, nombre, dos códigos propios, puntaje mínimo y
   pruebas adicionales— **más `connectionId`, la conexión de la empresa con la que se activó,
   y `providerData`, una bolsa para otro proveedor** (decisiones 5 y 41). Los dos se arrastran
   en cada guardado: cambiar el puntaje o apagar la prueba no los borra. Cada vez que se abre la
   oferta, el portal vuelve a comprobar la vacante y avisa si dejó de servir.

   **Migración única, antes de desplegar este backend** (decisión 41): un script de consola
   crea la conexión de EvaluaTest de cada empresa a partir de su bloque viejo y rellena
   `connectionId` en las ofertas con la prueba activa. Sin él, ninguna empresa tiene conexión y
   la etapa se salta en silencio para todas.
4. **Una oferta con la prueba activa cuya empresa ya no tiene conexión** —solo puede pasar
   si se borraron las credenciales después, o si la oferta se creó desde administración, que
   copia la configuración sin comprobar nada— muestra en el detalle un aviso de advertencia
   propio: *la prueba está activada, pero tu empresa ya no tiene proveedor; la etapa se está
   omitiendo*. Sin interruptor, sin botón de configurar y sin la alerta de estado de la
   vacante, que consultaría al proveedor sin conexión. El detalle tampoco pide las pruebas de
   la vacante hasta saber que la conexión de EvaluaTest de la empresa está configurada.

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
que copia la configuración tal cual— y sigue igual: la conexión se resuelve por empresa y
proveedor, que con una sola por proveedor es la misma (decisiones 2 y 41). Nada decide todavía
con `connectionId`; el puerto recibe la empresa. Después:

1. **Calcula el plazo**, una sola vez y antes de invitar, con el mismo resolutor que usa el
   descarte (empresa > entorno > 2 días). Ese único valor va a la invitación y al mensaje de
   WhatsApp, también en la rama demo (decisión 45). Si esa lectura falla, no se invita: cae como
   fallo pasajero (abajo).
2. Llama a **la invitación del puerto** con la vacante y su nombre, la empresa, nuestra
   referencia del candidato, su nombre, su correo, **su documento y el tipo de documento, todos
   tal cual están guardados, con su nulo si no tiene**, y el plazo. Ya no se inventa ningún
   correo (decisión 33). Qué hacer con el documento, el tipo y el plazo lo sabe cada adaptador:
   **EvaluaTest los ignora**; PsicoAlianza exige documento y plazo, traduce el tipo a su catálogo
   (vacío → CC; desconocido → OTRO) y manda el documento sin espacios, puntos, comas ni guiones,
   sin tocar lo guardado (decisión 45).
3. El adaptador comprueba, **en este orden y antes de tocar al proveedor**, y cada
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
   documento no se alcanza hasta que una empresa use PsicoAlianza (paso 4).

   Con todo en orden, con EvaluaTest pasan **cuatro** cosas (32-a): se resuelve el código de
   evaluación de la vacante, se registra al candidato con nuestra referencia, se le invita, y
   **si la invitación falla se le manda el correo directo**.
4. El embudo guarda en el candidato: el proveedor (`evaluatest`), el identificador que
   EvaluaTest le dio, la fecha de consulta, y en la bolsa del proveedor **el correo de
   registro solo si difiere del real** — vacío significa *empareja por el correo verdadero*
   (32-d). El estado del candidato pasa a *esperando resultado externo*. El guardado es con
   reintento (varios candidatos de la misma oferta terminan a la vez).
5. Le escribe por WhatsApp: el enlace que devolvió la invitación, su correo enmascarado, las
   instrucciones y **el plazo**, el mismo valor que se calculó antes de invitar y que viajó en
   la invitación. Si la invitación no trajo enlace, el mensaje solo dice que llegará por
   correo — ⚠️ y no anuncia el plazo, aunque corre igual (riesgo abierto; con EvaluaTest hoy
   es inalcanzable).

### Si el arranque falla

- **Fallo pasajero** (red, proveedor caído, sin código de evaluación, **o la lectura del
  plazo**, que va antes de invitar): se le avisa al
  candidato **una sola vez** —con un enlace de respaldo si se puede armar, o el aviso del
  correo si no—, se le deja *esperando resultado externo* **sin identificador** y se guarda.
  El enlace de respaldo lo arma **el adaptador**: con el código de evaluación guardado en la
  oferta si lo hay, y si no resolviéndolo por el cliente con la credencial de la empresa; el
  embudo ya no llama al cliente ni lee credenciales aquí. **El cron lo reintenta** cada 5 minutos (§4). ⚠️ *Sin código de evaluación*
  cuenta como pasajero a propósito: EvaluaTest responde igual cuando el código no existe y
  cuando el endpoint falla (decisión 39).
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
*esperando resultado externo*.

## 3 · El cron consulta resultados

Cada 5 minutos, con un candado para que no corran dos pasadas a la vez. Recorre **todas las
ofertas menos las canceladas** que tengan candidatos esperando resultado en esta etapa, y por
cada oferta:

1. Salta la oferta si no tiene la prueba encendida.
2. Resuelve si la empresa está en demo desde un mapa cargado una vez por ciclo.
3. Separa a los pendientes en dos: **los que tienen identificador del proveedor** entran a la
   consulta; los que no, van al reintento del arranque (§4).
4. Carga en un solo golpe los correos reales de los que va a consultar.
5. Hace **una sola llamada al puerto por oferta** (decisión 22) con, por candidato, nuestra
   referencia, su identificador, el correo de registro y el correo real. El adaptador trae
   el tablero de la vacante y empareja **por dos llaves**: primero por correo —el de registro
   si existe, si no el real— y como respaldo por identificador.
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
registro, hasta que el plazo la descarte (decisión 40; medido el 2026-09-12: hoy nadie).

## 4 · Dentro del bucle, por candidato, en este orden

Cada iteración recarga la oferta fresca (aprobar a uno sube la versión del documento).

1. **Sin identificador del proveedor → reintenta el arranque entero** (§2). Si el reintento
   falla de forma **permanente**, lo **descarta** con *arranque fallido* — es el rescate del
   2026-09-11; antes se quedaba dentro para siempre, ocupando plaza y teléfono de pruebas
   (decisión 39). Si la empresa **no tiene conexión**, el reintento **aprueba la etapa** y el
   candidato sigue su proceso, igual que en el arranque (decisión 40). Si falla de forma
   pasajera, se registra, se cuenta como error y sigue esperando. ⚠️ Si el documento de la persona no se puede cargar, no se intenta nada y no
   se descarta nada. Medido el 2026-09-11: hoy no hay nadie sin identificador.
2. **Vencimiento**: si entró a la etapa hace más días que el plazo, le escribe que no se
   recibió su resultado a tiempo y lo descarta con `psychometric_external_timeout`. El plazo
   es la ventana que se le anunció; no se detiene por nada (decisión 36).
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
  discrepar del guardado) y la credencial de la empresa resuelta con la regla del adaptador.
  Si el adaptador falla ahí —también por *sin conexión*—, cuenta como error del ciclo y el
  candidato sigue esperando, como con cualquier excepción. Una oferta demo se las salta por
  su bandera, antes de llamar (§7).
- **Puntaje bajo** → le escribe que se recibieron sus resultados y se seguirá analizando su
  perfil, y descarta con `psychometric_score_<puntaje>`.
- **Prueba adicional no aprobada** (o no encontrada: se tratan igual) → mismo mensaje, y
  descarta con `psychometric_exam_<nombre>`.

El descarte archiva la etapa donde cayó; el portal la lee de ahí y solo deduce por el motivo
en registros viejos (decisión 17).

## 6 · Lo que queda escrito en el candidato

Seis campos con nombre neutro más una bolsa (decisión 15, paso 6b). **Al escribir, siempre
los nuevos; al leer, el nuevo y si está vacío el viejo.** Solo dos se leen:

| Campo | Quién lo lee |
| --- | --- |
| `psychometricProvider` | Nadie todavía (decisión 6; hoy siempre `evaluatest`) |
| `psychometricCandidateId` | El cron (a quién consultar, y a quién reintentar), el retomar, el reenvío del botón |
| `psychometricScore` | Nadie |
| `psychometricState` | Nadie |
| `psychometricLastPolledAt` | Nadie |
| `psychometricProviderData` | El cron, para el correo de registro. Guarda además el código de estado y el resultado por prueba adicional |

Los seis campos viejos con prefijo `evaluatest` siguen en el esquema, solo se leen. La
compatibilidad caduca sola: nadie está a mitad de prueba más que el plazo.

🔴 **Sin vuelta atrás**: la versión anterior del backend no lee los campos nuevos y
reinvitaría a quien se invitó después del despliegue (registro del paso 6b).

## 7 · El modo demo: cinco puntos, todos en el embudo

Una empresa marcada como demo en la base (sin pantalla) enseña el producto a un cliente
potencial con una candidata configurada. La etapa psicométrica **no llama nunca a EvaluaTest**
y **el puerto no sabe que existe la demo** (decisión 38). Los cinco puntos:

1. **La invitación** (§2): en vez del puerto, fabrica un identificador determinístico y
   **positivo**, un enlace de apariencia normal que no lleva a ninguna prueba, y escribe los
   campos nuevos como cualquiera. El mensaje al candidato es el mismo.
2. **El temporizador**: tras el mensaje, agenda una pasada del cron a los segundos de retraso
   configurados (45 por defecto) para que la demo se resuelva sin esperar 5 minutos.
3. **La sustitución de la consulta** (§3): en vez del puerto, un constructor sintético
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
  alerta si la vacante dejó de servir. **Sin conexión de la empresa**, en su lugar el aviso de §1 —el
  informativo si la oferta no tiene prueba, el de advertencia si la tiene activa y se está
  omitiendo—, con enlace a *Mi compañía* solo para quien puede editar la empresa (decisión 40).
- **Lo que no ve**: nada de los campos del candidato de §6 (el portal no los lee).

## 9 · Lo que este flujo todavía arrastra, con su paso

| Qué | Dónde cae |
| --- | --- |
| Creación desde administración: copia la configuración de la prueba sin comprobar la conexión ni la vacante | Anotado, del equipo interno (decisión 40) |
| El bloque viejo `evaluatestCredentials` sigue en la base sin lectores ni escritores | Limpieza aparte (decisión 41) |
| Puntaje ausente leído como cero | Etapa 3 (decisión 37) |
| Tablero vacío indistinguible de petición fallida | Sin paso (decisión 36) |
| El botón "Continuar proceso" se traga el fallo permanente | Sin paso (decisión 39) |
| La rama sin enlace no anuncia el plazo | Riesgo abierto |
