# Integrar PsicoAlianza

Bitácora. Abierta el 2026-09-08.

## Objetivo

La etapa de prueba psicométrica funciona hoy contra un único proveedor, EvaluaTest, y
su nombre está incrustado en el código, en la base de datos y en el portal. Hay que
poder usar PsicoAlianza, y dejar el camino abierto para un tercero.

No es una etapa nueva: es un proveedor alternativo dentro de una etapa que ya existe.

## Punto de partida

> **Rama base: `develop`, en los dos repositorios.** Está bastante por delante de
> `main` en esta zona. Todo lo de abajo está verificado contra develop.

"EvaluaTest" no es un valor guardado: es el nombre de los campos. Lo que más pesa:

- El tenant guarda un bloque de credenciales con la forma exacta de EvaluaTest, y la
  oferta un bloque de configuración igual de específico.
- Cada candidato arrastra seis campos con el nombre del proveedor en el prefijo.
- **Ya hay un segundo camino metido con un condicional dentro del arranque de la
  etapa**: el modo demo, configurable por empresa, fabrica un identificador sintético
  y no llama a EvaluaTest. Es justo la forma que queremos evitar — y a la vez encaja
  natural como un proveedor falso más cuando exista la capa. Tiene pruebas: si se
  rompe, se nota.
- La creación de ofertas con IA elige el cargo de EvaluaTest sola, con un índice
  semántico que se sincroniza cada seis horas.

A favor, y no era así en `main`: los motivos de rechazo ya están **centralizados** en
un enum tipado, con constructores para los que llevan un dato dentro, en un archivo
que se declara *contrato con el frontend* y lista qué tocar al agregar uno. Los
consumidores son tres: el texto que lee el reclutador, la deducción de la etapa donde
cayó el candidato, y el embudo del servicio de métricas. Los códigos numéricos de
estado de EvaluaTest también salieron ya a su propio enum, y el arranque de la etapa
se llama `startPsychologicalExam`.

Precedente a no repetir: los tres portales de empleo se soportaron con condicionales
repartidos por diez archivos, sin capa de proveedor.

## Flujo general

Al terminar, una empresa podrá hacer sus pruebas psicotécnicas con PsicoAlianza en vez
de EvaluaTest, sin que nada más del proceso de reclutamiento cambie. Y el proveedor que
venga después costará una fracción de esto.

### Etapa 1 · Preparar el sistema para trabajar con varios proveedores de pruebas

La etapa de prueba psicométrica está escrita contra EvaluaTest. Se reescribe para que
hable con **el proveedor que tenga configurado cada empresa**. Se toca ese tramo y su
consulta de resultados, dónde se guardan las credenciales y la configuración de la
oferta, y la pantalla donde el reclutador la define. El resto del embudo no se toca.

Va primero, y su resultado no se ve: al terminarla EvaluaTest funciona exactamente
igual que hoy. Sin este paso, PsicoAlianza solo puede entrar a base de parches
repartidos por el código — que es lo que ya se hizo con los tres portales de empleo, y
se vuelve a pagar entero con cada plataforma nueva.

**Arranca con red.** Ya existen pruebas automáticas que ejercitan el arranque de la
etapa y el ciclo completo del cron, incluida una escrita como no-regresión —comprueba
que con el modo demo apagado se sigue registrando en EvaluaTest de verdad— y otra que
corre una oferta demo y una real en el mismo ciclo. No hay que escribirlas desde cero,
solo completarlas. El modo demo entra aquí como una implementación más de la capa, en
vez del condicional que es hoy.

### Etapa 2 · Analizar la API de PsicoAlianza — ✅ HECHA (2026-09-09)

Se capturó entera con una sesión abierta a mano. **El contrato resultante está en
`psicoalianza-api.md`**; lo de abajo es lo que se buscaba, y quedó todo cubierto.

> **Sobre el orden:** el plan ponía la etapa 1 primero, pero se hizo antes la 2, para
> dibujar el puerto con el contrato del segundo proveedor delante y no calcarlo de
> EvaluaTest. Con la 2 cerrada, la etapa 1 arranca sin ese riesgo.

- **Autenticación** — qué pide, qué devuelve y cuánto dura el token.
- **Listado de vacantes activas** — qué campos trae cada vacante y si pagina.
- **Enlace de la vacante** — si viene en el listado o se arma aparte, y si es común o
  personal por candidato.
- **Invitar candidato** — cuerpo exacto y si devuelve un identificador de candidato.
- **Resultados** — si se consulta por candidato o por vacante, y qué estados maneja.

### Etapa 3 · Implementar PsicoAlianza como proveedor

Escribir su cliente contra la capa de la etapa 1 —autenticarse, listar vacantes,
invitar y consultar resultados— y agregar su formulario de conexión en los ajustes de
la empresa. Al terminarla, un candidato de una empresa configurada con PsicoAlianza
recibe su enlace y el sistema lee su resultado.

### Etapa 4 · Los datos que PsicoAlianza exige y no siempre tenemos

Para invitar a alguien, PsicoAlianza exige su número de documento y su correo. El
sistema los toma de lo que publica el portal de empleo, y a veces no vienen.

Cuando falte el documento, se le pide al candidato por WhatsApp en vez de descartarlo:
descartar no deja rastro y pierde gente que sí servía. El correo es el caso más
delicado — hoy, si el candidato no tiene, el sistema usa uno interno, porque el enlace
de verdad le llega por WhatsApp; con PsicoAlianza hay que confirmar si su invitación
funciona igual o si el correo es imprescindible.

Va en una etapa aparte porque toca la conversación con el candidato, que hoy funciona
y es lo más delicado de mover.

### Etapa 5 · Validación de punta a punta y salida a producción

Se da por terminado cuando se cumplen las dos condiciones:

- Un candidato real de una empresa con PsicoAlianza recorre la etapa completa —recibe
  su enlace, hace la prueba, y el sistema lo avanza o lo descarta solo—.
- Una empresa con EvaluaTest sigue funcionando igual que antes, sin que nadie le haya
  tocado su configuración.

### Riesgos

- **La API de PsicoAlianza no es pública ni versionada.** Se consume la misma que usa
  su portal web, así que puede cambiar sin aviso y enterarnos en producción. Es el
  mismo trato que ya tenemos con EvaluaTest.
- **No hay ambiente de pruebas.** Cada ensayo crea candidatos reales en la cuenta real
  del proveedor.
- **Hay supuestos de PsicoAlianza sin confirmar** —cómo entrega los resultados, si el
  enlace es común o por candidato, en qué escala viene el puntaje—. La etapa 2 existe
  para cerrarlos; hasta entonces, el tamaño de las etapas 3 a 5 es una estimación.
- **El login está protegido con reCAPTCHA v3 validado en el servidor.** Verificado el
  2026-09-09 y **reproducido el mismo día**: desde IP residencial limpia y con ventana
  visible, Google emite el token sin queja —2382 caracteres— y el servidor lo descarta
  igual. Lo que falla no es generar el token: es el **puntaje de reputación** que Google
  le pone a un navegador recién nacido, sin historial ni cookies propias. De ahí que los
  parches anti-detección muevan poco — actúan sobre señales de mucho menos peso que la
  reputación. Ver la decisión 23. Bloquea las etapas 3 a 5.
- **El endurecimiento del navegador está agotado y no sirvió** (2026-09-09). Se probó
  con perfil persistente y calentado, complemento de sigilo, la marca de control
  automático desactivada y comportamiento humano simulado —puntero en curva, scroll
  irregular, tecleo con pausas variables—. Resultado idéntico al del script pelado:
  token emitido (2318 caracteres), respuesta 302 y el mismo mensaje de rechazo. **No
  hay que volver a intentarlo por esta vía**; el puntaje depende de reputación
  acumulada, que un proceso automatizado no puede sostener.
- **El solucionador de pago es una apuesta contra el v3, no una solución cerrada.**
  Falla en silencio, tiene costo recurrente, y si el proveedor lo detecta quien queda
  expuesta es la cuenta del cliente. Se asume a sabiendas en la decisión 23.
- **Credencial de acceso expuesta.** La contraseña de la cuenta de gerencia de
  PsicoAlianza (compartida) quedó registrada durante el análisis del 2026-09-09; hay
  que rotarla, junto a la credencial commiteada de la decisión 21.

## Confirmado de PsicoAlianza

> El detalle de cableado de cada endpoint —URL, parámetros, campos de respuesta— vive
> en `psicoalianza-api.md`. Aquí queda solo lo que pesa en una decisión.

- Se usarán los endpoints de su portal web; hay que autenticarse primero. **La
  autenticación no entrega un token: es un formulario web de Laravel** que deja la
  sesión en cookies de servidor. No hay token que decodificar. Las cookies y sus vidas,
  en el API doc.
- **El login está protegido con reCAPTCHA v3** (invisible, por puntaje) y se valida en
  el servidor: rechaza antes de mirar credenciales. Verificado el 2026-09-09; sus
  consecuencias van en *Riesgos* y la decisión 23.
- **La mecánica del captcha ya está resuelta y no hay que volver a averiguarla.** La
  clave pública viene en el parámetro `render` del script de Google; la etiqueta de
  acción es `submit`, que es el valor por defecto más común; y el token va a un campo
  oculto estándar (`g-recaptcha-response`), no al estado de ningún framework. El orden
  del envío importa: el formulario pide primero un CSRF fresco, después ejecuta el
  captcha y solo entonces envía. Con esto, conectar un solucionador de pago es corto —
  lo único que falta es con qué puntaje mínimo pasa.
- **El rechazo del captcha se distingue del de credenciales**: dice "No hemos podido
  verificar que eres una persona". Cualquier prueba puede decir cuál de los dos falló
  sin adivinar.
- **Listado de vacantes capturado** (`GET /procesos-listado-tabla`, contrato en el API
  doc). Cierra A3 y A4. La vacante trae sus pruebas embebidas, confirmado. Dos cosas que
  pesan en decisiones abiertas:
  - **El enlace del candidato NO viene en el listado** — ningún campo de URL ni token.
    De dónde sale queda para la invitación o un detalle aparte (A6 sigue abierto).
  - **Cada vacante trae un `medio_envio`** (visto `correo` y vacío). Que el medio se
    defina por vacante toca B2 (candidato sin correo): falta ver qué otros valores
    admite y si alguno no exige correo.
- Se elige **una sola** vacante.
- La invitación pide: país y tipo de documento (por ahora fijos, CC y Colombia),
  número de documento, correo y opcionalmente celular sin indicativo.
- El puntaje llega como texto con decimales: `"indice_talento": "85.0"`.
- **La sesión por cookie sirve desde HTTP puro, sin navegador** (comprobado en vivo el
  2026-09-09, concreta la decisión 24). No hace falta Puppeteer para operar el portal.
- **Soporta varias sesiones a la vez**: una segunda sesión no tumba la primera
  (comprobado el 2026-09-09). Desaparece el riesgo de que el proceso automatizado y la
  persona que use la cuenta compartida se expulsen mutuamente.
- **Marcar "permanecer conectado" da una sesión de 5 días con cookie de recuerdo** que
  reautentica sola al caducar, **sin login ni captcha** (comprobado el 2026-09-09;
  mecánica en el API doc). Baja el gasto del solucionador de pago a casi cero. Cierra
  A13 y refuerza la decisión 26.

## Decidido

1. Las conexiones de pruebas del tenant se guardan como **lista con nombre**, no como
   un bloque por proveedor. Motivo: una empresa con dos cuentas del mismo proveedor no
   cabe de otra forma, y retrofitearlo obliga a migrar dos veces.
2. Por regla de producto, **una conexión por empresa** por ahora.
3. El selector de proveedor en el modal solo aparece si hay más de una conexión.
4. El formulario del modal se conserva: activar, elegir una vacante, puntaje mínimo.
   La sección de exámenes adicionales solo aplica a EvaluaTest.
5. La oferta **congela** qué conexión usa, siempre, aunque no se haya mostrado
   selector. Si se deduce al leer, habilitar la segunda conexión vuelve ambiguas las
   ofertas viejas.
6. Cada candidato en curso lleva anotado a qué proveedor fue invitado: el cron
   pregunta al del momento de la invitación, no al que hoy diga la oferta.
7. La configuración guardada en la oferta es neutra: qué conexión, qué se eligió y con
   qué criterio se aprueba. No se extiende el bloque actual de EvaluaTest.
8. "IGI" sale de la interfaz —es marca de EvaluaTest— y pasa a "puntaje mínimo".
9. Se reutiliza el patrón de autenticación existente: login, cookies, token cacheado,
   un reintento ante "no autorizado".
10. La comprobación de vacante válida es por proveedor, o no se muestra. Hoy hay una
    alerta que avisa si la vacante ya no sirve; no puede quedarse llamando a
    EvaluaTest con un identificador de otro proveedor.
11. ~~**Número de documento faltante: se le pide al candidato por WhatsApp**, no se
    descarta.~~ **RETIRADA por la decisión 31** (2026-09-10). **No se le pregunta nada al
    candidato.** El flujo lo diseñó otro equipo y la integración entra por debajo sin
    tocarlo, así que no se agrega ningún mensaje ni paso a la conversación.

    Consecuencias asumidas a sabiendas: el documento llega como venga del portal de
    empleo, **con el riesgo de que esté mal escrito** —lo tecleó el candidato al
    postularse— y sin forma de confirmarlo antes de invitar. Y si no viene, no hay a
    quién pedírselo: ver la decisión 33.
12. El tipo de documento no se manda siempre como CC: si el candidato trae uno
    propio desde el portal de empleo, se manda el suyo. CC queda como valor por
    defecto, no como valor único.
13. **Los motivos de rechazo pasan a un prefijo neutro** de ahora en adelante, y el
    portal aprende a leer los viejos y los nuevos. El motivo dice *por qué* se
    rechazó; *quién* evaluó vive en el campo de proveedor del candidato (decisión 6).
    Hoy están mezclados: reusar el prefijo de EvaluaTest para PsicoAlianza dejaría
    todos los rechazos diciendo "evaluatest", y el día que se pregunte cuál proveedor
    rechaza más, la base no puede responder.
14. **Se elimina el respaldo por variables de entorno.** Hoy, una empresa sin
    credenciales propias no falla: entra con la cuenta global de EvaluaTest escrita en
    el código. Con dos proveedores, una empresa configurada con PsicoAlianza cuya
    conexión falte terminaría invitando candidatos a la cuenta de otro, sin error
    visible. Quitarlo cierra además la credencial commiteada.
15. **Los seis campos del candidato pasan a prefijo `psychometric`**, con la frontera
    movida: núcleo neutro (`psychometricProvider`, `psychometricCandidateId`,
    `psychometricScore`, `psychometricState`, `psychometricLastPolledAt`) más una
    bolsa opaca por proveedor (`psychometricProviderData`) donde EvaluaTest guarda lo
    suyo — el correo de registro, su código numérico de estado y el resultado por
    prueba. Hoy el cron compara contra los códigos 5 y 6 de EvaluaTest en medio de su
    propia lógica; con `psychometricState` cada proveedor traduce los suyos y el
    pipeline deja de saber que existen.

    Se descarta el prefijo `test` porque en este proyecto ya significa *modo de
    pruebas QA* (`testPhone`, `testConfig`), y `evaluation` porque ya es el código
    público de la vacante en EvaluaTest.

    **Sin migración.** Al leer se mira el campo nuevo y, si está vacío, el viejo; al
    escribir, siempre el nuevo. Proveedor vacío significa EvaluaTest. Sin esa regla,
    un candidato a mitad de prueba se lee como "registro fallido" y el sistema lo
    inscribe e invita **por segunda vez**. La compatibilidad caduca sola: nadie puede
    estar a mitad de prueba más que el plazo configurado.
16. **Los cuatro motivos de rechazo de la etapa pasan a prefijo `psychometric`**
    (concreta la decisión 13): `psychometric_score_<n>`,
    `psychometric_failed_<prueba>`, `psychometric_discarded`, `psychometric_timeout`.
    Se cambian los cuatro y no solo los que escribirá PsicoAlianza:
    dejar dos convenciones para la misma etapa hace que dos rechazos del mismo
    proveedor en el mismo minuto se vean distintos, y nadie deduce la regla después.
    El portal sigue entendiendo los viejos, que son candidatos reales que el
    reclutador todavía consulta.

    Son **tres** los consumidores a actualizar, no uno: el texto que lee el
    reclutador, la deducción de la etapa donde cayó el candidato (que ya es solo un
    respaldo para registros viejos) y el embudo del servicio de métricas. El enum de
    motivos lleva en su cabecera la lista de lo que hay que tocar al agregar uno.
17. ~~**Tomamos el arreglo de la atribución del vencimiento.**~~ **RETIRADA.** El
    supuesto era falso: se analizó sobre `main`, y en `develop` no hay tal bug. La
    deducción por motivo está unificada en una sola función y es el **último** recurso
    — primero se usa la etapa que manda el backend, y todos los caminos de descarte la
    archivan antes de cerrar al candidato. La lista de motivos incompleta es un
    respaldo documentado para registros viejos, no un olvido. No hay nada que arreglar
    ni nada que acordar con Elvis.
18. **El modo demo se convierte en un proveedor falso más**, dentro de la etapa 1. El
    arranque de la etapa deja de preguntar si la empresa está en demo: resuelve su
    conexión como cualquier otra, y lo que responde es un proveedor de mentira que
    inventa el identificador, devuelve un enlace de juguete y contesta "aprobado"
    pasado el retardo configurado. Queda de paso como la prueba más barata de la capa.
    **Solo la parte psicométrica** — el modo demo también simula el lector de
    documentos y los antecedentes, y eso no se toca.
19. **Al guardar una oferta se escriben las dos formas de configuración** durante la
    etapa 1, leyendo la nueva primero; cuando esté estable se deja de escribir la
    vieja. Sin migración: el guardado ya reescribe el bloque completo, así que las
    ofertas se migran solas al editarlas y las que nadie toca se siguen leyendo. El
    doble guardado existe solo para que **devolverse sea inofensivo** — si no, una
    oferta guardada con la forma nueva aparece sin prueba configurada bajo el código
    viejo.
20. **Criterio de pruebas: lo necesario es lo que avisaría si rompemos EvaluaTest**, no
    cubrirlo todo. Con lo que ya existe, lo que falta y vale la pena son los **dos
    caminos de descarte del cron** —reprueba por puntaje y vence por plazo—, porque
    son los que sacan gente del proceso y una regresión ahí no se nota: el candidato
    recibe el mismo mensaje neutro en los dos casos.
21. **El respaldo por entorno se acota, no se borra** (corrige la decisión 14). Sigue
    existiendo y funcionando igual para las empresas de EvaluaTest; simplemente no
    aplica cuando la empresa tiene una conexión explícita de otro proveedor. Así
    ninguna empresa que hoy dependa de él se ve afectada, y desaparece el escenario que
    creamos nosotros: una empresa con PsicoAlianza cuya conexión falle invitando
    candidatos a la cuenta de EvaluaTest de otro.

    **La credencial commiteada va aparte.** Quitarla del código no la quita del
    historial de git: el arreglo real es rotarla, y eso necesita acceso a la cuenta.
    Se reporta y se sigue por su lado; meterlo aquí haría creer que quedó resuelto.
22. **La consulta de resultados recibe un lote de candidatos, no uno.** EvaluaTest solo
    sabe responder por vacante y PsicoAlianza probablemente por candidato: pedirlos de
    a uno obligaría a EvaluaTest a traer el tablero completo por persona. Es el único
    punto donde el contrato ingenuo se paga caro.
23. **El login se automatiza con un solucionador de captcha de pago, y el proveedor es
    SolveCaptcha** (cierra B7). El login humano con sesión reutilizada queda
    **descartado**: la casilla de permanecer conectado lo hacía viable con una sesión
    por semana, pero no se quiere depender de que alguien la abra a mano.

    **SolveCaptcha y no 2Captcha**, aunque la cuenta disponible fuera de 2Captcha. En
    el proyecto de referencia los dos servicios no son intercambiables: SolveCaptcha es
    el que entrega el token de reCAPTCHA v3, y 2Captcha cubre los demás tipos a través
    de un complemento de navegador que **aquí no sirve**, porque el v3 no tiene widget
    que detectar. Ver `CAPTCHAS.md`, que además lista tres errores de esa
    implementación que no hay que copiar.

    Se asumen los riesgos anotados arriba. Lo que falta antes de darlo por bueno es
    **con qué puntaje mínimo pasa el sitio**: se prueba subiendo desde abajo, y cada
    escalón es más caro y más lento.
24. **El login de PsicoAlianza se hace por HTTP desde el backend, sin navegador.** El
    solucionador de pago genera el token en su propia infraestructura y lo entrega por
    API: no hay que ejecutarlo dentro de una página. Con la mecánica ya conocida
    —clave, acción, campo oculto y el CSRF previo— autenticarse es una petición con
    cookies, que es exactamente lo que ya hace el cliente de EvaluaTest.

    Se descarta meter Puppeteer en el backend: el proyecto declara que los robots de
    navegador son procesos externos que no corren aquí, y la imagen es Alpine, el peor
    sitio para alojar Chromium.
25. **El captcha vive en su propio módulo, con puerto y adaptador**, al nivel de los
    demás módulos del backend. El puerto pide lo mínimo —un token para una clave de
    sitio, una acción y un puntaje mínimo— y cada servicio trae su adaptador:
    SolveCaptcha ahora, 2Captcha el día que haga falta. La mecánica de cada uno (uno
    encola y pregunta, el otro crea tarea y consulta) queda dentro de su adaptador.

    No va en la capa psicométrica: el captcha es infraestructura, no un concepto de
    pruebas psicotécnicas, y el día que lo necesite un portal de empleo tendría que
    moverse o duplicarse. Tampoco en la carpeta compartida, que hoy son dos utilidades
    sueltas sin módulo donde registrar el proveedor activo.

    **El puntaje mínimo es configuración, no constante.** Todavía no se sabe cuál
    acepta el sitio y habrá que subirlo a tientas. Es el primer puerto/adaptador del
    backend, que hasta hoy solo tiene "clientes": conviene que quede bien, porque
    sienta el precedente.
26. **La sesión se cachea de forma agresiva y el login es raro.** Cada autenticación
    cuesta dinero y hasta dos minutos de espera. Con la sesión durando 5 días al marcar
    *permanecer conectado*, reautenticar en cada pasada del cron dispararía la
    factura y multiplicaría las probabilidades de que el proveedor lo note. Extiende la
    decisión 9 de token cacheado a la cookie de sesión.
27. **La invitación de PsicoAlianza lleva tres pasos, no uno**, por cómo funciona su
    API (contrato en el API doc):
    1. **Consultar el correo del documento** (`/obtener-correo-usuario`) antes de
       invitar. Si el documento ya existe, se invita con el correo que devuelve; si no,
       con uno nuevo. El correo es único por usuario y un par inconsistente da 400.
    2. **Invitar** (`POST /procesos-participantes/{proceso}`). La respuesta de éxito no
       trae el `id` del candidato.
    3. **Buscar al candidato por documento** en el tablero de la vacante para quedarse
       con su `id` de PsicoAlianza. Es el equivalente al `findCandidateByExternalId` de
       EvaluaTest, así que el puerto de la etapa 1 ya debe contemplar este paso —no es
       exclusivo de un proveedor.
    4. **Pedir el enlace personal** con `GET /regenerar-acceso-usuario/{id}` y
       entregarlo por WhatsApp. Se pide una sola vez y se guarda: regenerar
       probablemente invalida el anterior.
28. **El identificador de vacante del puerto es numérico.** Los dos proveedores
    conocidos lo usan así y la oferta ya lo guarda así; volverlo texto obligaría a
    tocar configuración guardada, que va en otro paso. Se revisa cuando la
    configuración de la oferta se vuelva neutra (decisión 7), que es el momento
    natural, no antes.
29. **Lo que es de un proveedor y tiene que cruzar el puerto viaja en una bolsa
    opaca.** No solo la credencial: también los datos de la vacante que el puerto no
    necesita y el detalle del porqué una vacante no sirve. El puerto la transporta sin
    leerla y **quien la abre es el consumidor que ya conoce a ese proveedor**. Es el
    mismo patrón de núcleo neutro más bolsa por proveedor de la decisión 15, aplicado
    a los valores de retorno.

    Sin eso no se podía cumplir a la vez "el puerto no conoce a EvaluaTest" y "las
    rutas devuelven exactamente lo de antes": el selector de vacantes necesita la
    etiqueta del árbol de EvaluaTest para agrupar, y el guardado de la oferta necesita
    el código con el que se arma el enlace del candidato.
30. ~~**La credencial la sigue armando el consumidor**, no el adaptador.~~ **SUPERADA
    por el paso 2** (2026-09-09). Fue cierta durante el paso 1 y duró un paso. Hoy es al
    revés: **el puerto recibe la referencia del tenant y cada adaptador resuelve su
    propia credencial**. El servicio de ofertas ya no arma nada.

    El motivo del cambio: con la credencial viajando opaca por el puerto, el adaptador
    la convertía a ciegas, y una credencial con otra forma no fallaba — llegaba al
    cliente como indefinida y este caía al respaldo por entorno, o sea a la cuenta
    global de EvaluaTest, con candidatos de por medio. Al desaparecer el parámetro, esa
    trampa dejó de existir en vez de quedar documentada.
31. **La integración es transparente: no se cambia el flujo que ya existe.** El embudo lo
    diseñó y revisó otro equipo. PsicoAlianza entra por debajo — **no se agregan pasos a
    la conversación con el candidato ni se reordenan etapas** para acomodar a un
    proveedor. Acordado con el equipo el 2026-09-10.

    Descartado por eso mismo: adelantar la validación documental antes de la prueba
    psicométrica. Gastaría el lector de documentos en gente que quizá no pase la prueba,
    cambiaría el orden **para todas las empresas** —también las de EvaluaTest, que no
    necesitan el documento— y pedir la cédula tan pronto aumenta el abandono.

    **Lo que sí se hace, y no toca el flujo:** antes de invitar se consulta el correo
    del documento (contrato en el API doc). Si ese documento ya está registrado con otro
    correo, **no se inventa nada ni se sigue en silencio**: se falla de forma visible.

    ⚠️ **Ojo con lo que esa consulta NO hace.** No verifica identidad: solo dice si
    PsicoAlianza ya conoce ese documento. Un documento mal tecleado que allá no exista
    devuelve vacío, parece correcto y se invita igual. **El dedazo sigue apareciendo dos
    etapas después**, en la validación documental. Ver B1.

    **Esto retira la decisión 11**: no se le pregunta nada al candidato, ni el documento
    ni ninguna otra cosa. Qué pasa con quien no trae los datos obligatorios, en la 33.
32. **Lo que la invitación de EvaluaTest hace hoy y hay que preservar entero**
    (levantado del código el 2026-09-10, al revisar el paso 3). Son cuatro cosas que no
    se ven leyendo solo el camino feliz, y perder cualquiera rompe en silencio:

    **a) Son cuatro pasos, no tres.** Resolver el código de la vacante, registrar,
    invitar — y **si la invitación falla, mandar el correo directo**. Ese cuarto existe
    porque el endpoint de correo acepta la dirección explícita, y cubre el caso en que
    al candidato no se le encuentra por la vía normal. Sin él, algunos candidatos
    dejan de recibir su prueba sin que nada falle.

    **b) El correo de pruebas tiene tres estados, no dos.** Ausente = se aplica el
    desvío del entorno. **Nulo = se apaga el desvío para esa empresa.** Con dirección =
    se usa esa. El embudo hoy manda **nulo** cuando la empresa no tiene correo de
    pruebas — o sea, apaga el desvío a propósito. Reproducir "ausente" en vez de "nulo"
    cambia a quién le llegan los correos en QA.

    **c) El enlace no sale de la invitación.** Se arma después, con una dirección base
    del entorno, y **si no se pudo resolver el código de evaluación no se manda enlace**
    y el mensaje al candidato cambia. Esa regla existe porque el código equivocado
    servía una página vacía con respuesta 200 y nadie se enteraba. La operación puede
    devolver el enlace, pero **debe poder devolver "ninguno"**, y esa rama del mensaje
    se queda en el embudo (decisión 31).

    **d) El correo de registro se guarda solo si difiere del real**, y **nulo significa
    "empareja por el correo verdadero"**. No es un campo informativo: es la clave con la
    que el cron localiza al candidato en el tablero.

    **e) Al candidato sin correo se le inventa uno interno** —una dirección con nuestro
    propio dominio construida con el identificador del candidato— y con esa se registra
    e invita. Aparece en **cuatro** sitios del arranque de la etapa, así que es regla, no
    descuido. **Hoy eso no falla: funciona.** Si la capa lo convirtiera en error, ese
    candidato pasaría de ser invitado a no serlo, en silencio.

    **Dónde vive esa regla: se queda en el embudo.** La dirección inventada es una
    convención nuestra, no una conducta de ningún proveedor, y sacarla de ahí sería
    cambiar el flujo (decisión 31). La operación del puerto **siempre recibe un correo**;
    nunca le llega vacío. De paso sirve igual para PsicoAlianza, que exige correo único
    por persona: la dirección inventada ya es única por candidato.

    **f) La referencia que EvaluaTest usa para reencontrar al candidato es NUESTRA.** Lo
    registra con nuestro identificador interno y después lo busca por él, con un endpoint
    dedicado. PsicoAlianza hace lo equivalente buscándolo por documento (decisión 27).
    Los dos necesitan una forma de reencontrar a la persona, así que **es una entrada del
    contrato** — y no se deduce de "los datos del candidato", porque no es del candidato.

    **g)** ~~El nombre de la vacante viaja con un valor por defecto escrito a mano y se
    conserva por paridad.~~ **SUPERADA por la decisión 35 y ya implementada** en el paso
    3 (2026-09-10). Eran **dos** valores por defecto, no uno: el de la invitación y otro
    distinto para el correo de respaldo. Los dos se quitaron; hoy la invitación aborta
    antes de tocar al proveedor si la vacante no trae nombre, y un nombre en blanco
    cuenta como ausente. Sigue pendiente la otra mitad: que el embudo capture esa
    excepción (ver decisión 35).
33. **Sin datos obligatorios, el candidato se descarta. No se inventa ni se pregunta.**
    Como no se le pide nada al candidato (decisión 31), quien no traiga del portal de
    empleo lo que el proveedor exige **no puede ser invitado**, y sale del proceso.

    **Se elimina el correo inventado.** Hoy, al candidato sin correo se le fabrica una
    dirección interna y con esa se le registra e invita (ver 32-e). Era un atajo de
    desarrollo: se quita, **también para EvaluaTest**, y ese candidato pasa a
    descartarse.

    ⚠️ **Es un cambio de comportamiento, no un refactor invisible.** Hoy esos candidatos
    se invitan y pueden presentar la prueba; mañana salen del proceso. Va **en su propio
    cambio**, nunca dentro de un paso que promete no cambiar nada — el paso 3 sigue
    asumiendo que el correo siempre llega (32-e), y el atajo se retira después.

    🔴 **Toca los dos repositorios.** Un motivo de descarte nuevo es contrato con el
    portal: hay que añadirlo al enum del backend **y** a la tabla de etiquetas y a los
    textos en español e inglés del frontend. Si no, al reclutador le sale el código
    crudo y las métricas lo cuentan como "otros".

    **Riesgo aceptado:** el documento llega como lo tecleó el candidato al postularse en
    el portal, sin forma de confirmarlo. Si está mal escrito, se descubre dos etapas
    después, en la validación documental. Se corre con ese riesgo a propósito (ver B1).
34. **El respaldo por entorno se elimina: sin credenciales propias no se usa el proveedor
    de pruebas.** Corrige las decisiones 14 y 21. Que una empresa sin conexión entre con
    la cuenta compartida no tiene lógica y arrastra dos problemas reales: **los candidatos
    de varias empresas —con documento y resultados— quedan juntos en una sola cuenta**, y
    el reclutador de esa empresa **ve en su selector las vacantes de las demás**. Encima,
    la contraseña de esa cuenta está commiteada.

    **Y el coste es mínimo: lo usa una sola empresa de cuatro** (medido el 2026-09-10:
    3 con conexión completa, 1 sin ninguna, 0 a medias). No es un cambio masivo, es un
    caso.

    ✅ **Comprobado el 2026-09-10: no afecta a ningún cliente real.** Esa única empresa
    es **Gilbersoft Inc., una cuenta de pruebas**. No hay migración que hacer, ni cuenta
    que conseguirle, ni conversación comercial pendiente: el respaldo se puede quitar sin
    tocar a nadie.

    Ojo con cómo se leyó ese dato: no tiene filtro de la etapa psicométrica, y **el
    sistema trabaja con una lista de pasos desactivados**, así que **ausencia significa
    activada**. Esa cuenta sí correría la etapa — por eso importaba que fuera de pruebas
    y no de un cliente.
35. **Nada de valores por defecto inventados en lo que ve el candidato: si falta el dato,
    se aborta.** Corrige la 32-g, que pedía conservarlos por paridad.

    El caso que lo decide: hoy, si la oferta no tiene guardado el nombre de la vacante,
    al candidato le llega una invitación a **"ADMINISTRADOR (A)"** — un cargo escrito a
    mano hace años. Alguien que se postuló como médico recibe una prueba de
    administrador y no entiende nada. Hay un segundo por defecto para el correo
    ("Prueba psicométrica") y el mismo problema.

    **El campo es opcional y nace en nulo**, así que el caso es alcanzable: hay ofertas
    que pueden no tenerlo.

    Preferimos el fallo ruidoso: no invitar y que se vea, antes que invitar con un dato
    inventado que confunde a una persona real.

    ⚠️ **El paso 4 tiene que capturar esa excepción.** Si el embudo no la maneja, el
    candidato queda a medias en la etapa — cambiaríamos un correo confuso por un
    candidato colgado, que es peor.

## Falta de PsicoAlianza

| #   | Qué                                               | Por qué importa                                                                  |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| A1  | Escala del puntaje (casi) | Notas reales vistas `84.6`/`85.0`, ambas `"Recomendado"` → escala ~0–100, más alto mejor, como la base. **Ojo:** `-2.0` es centinela de "sin puntaje", no una nota. Falta el umbral exacto de aprobación y ver un reprobado |
| A2  | ~~Login: qué pide, qué devuelve, duración del token~~ **RESUELTO** | Formulario Laravel, sesión por cookie (5 días con *permanecer conectado*), reCAPTCHA v3 validado en servidor. Ver *Confirmado*, *Riesgos* y B7 |
| A3  | ~~¿El listado paginará algún día?~~ **RESUELTO** | Ya pagina (`length` por defecto 10). Un `length` alto trae todas; si no, hay que recorrer páginas o se pierden vacantes sin error |
| A4  | ~~Campos de cada vacante del listado~~ **RESUELTO** | `id`, `nombre`, estado, empresa, contadores y `pruebas[]` embebidas. Ver *Confirmado*. Falta decidir B5 (si la IA sugiere) |
| A5  | ~~Invitación: URL, cuerpo, respuesta~~ **RESUELTO** | `POST /procesos-participantes/{proceso}`, en lote. Éxito da 201 con `{message, agregados}` y **no** devuelve el `id`: hay que buscar al candidato después por documento en el tablero. Contrato en el API doc |
| A6  | ~~¿El enlace es común o personal?~~ **RESUELTO** | Personal por candidato (`control-acceso/{uuid}`). No vuelve en la invitación, pero **sí por la API**: `GET /regenerar-acceso-usuario/{id}`. Se puede reenviar por WhatsApp. Destraba B2 |
| A7  | ~~Resultados: ¿por candidato o por vacante?~~ **RESUELTO** | Por vacante: `GET /participantes-proceso/{id}` trae todos sus participantes con puntaje y estado. Confirma el lote de la decisión 22. Contrato en el API doc |
| A8  | ~~¿Hay estado "en progreso"?~~ **RESUELTO** | Sí, por prueba (`agendas[].estado`): 1 Agendada, 3 Finalizada, 4 Expirada. El veredicto vive en `agendas[].recomendacion`, no en la etapa del candidato. Ver API doc |
| A9  | ¿Avisan por webhook?                              | Si avisan, este proveedor no necesita cron                                       |
| A10 | Credenciales que pide la conexión                 | Define el formulario de ajustes                                                  |
| A11 | ¿Cómo se sabe si una vacante sigue sirviendo?     |                                                                                  |
| A12 | ¿Ambiente de pruebas o desvío de correos?         | Sin eso, cada ensayo invita a una persona real                                   |
| A13 | ~~Qué cookies emite el login con *permanecer conectado* marcado~~ **RESUELTO** | Emite `remember_web_<hash>` y estira la sesión a 5 días. Con esa cookie Laravel reautentica solo, sin login ni captcha, si se toca el portal cada 5 días. Ver *Confirmado* y decisión 26 |

## Falta decidir

| #   | Qué                                                  | Ejemplo                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | ~~Qué se hace con el documento que teclea el candidato~~ **DECIDIDO: se corre con el riesgo** | No se le pregunta nada (decisión 31), así que el documento llega como lo tecleó el candidato al postularse en el portal. **Se usa en la etapa 5 para invitar y solo se puede comprobar en la 7**, contra la foto de la cédula — que tolera **un** error en 10 dígitos, así que cambiar dos de orden ya rebota. Si está mal, el candidato queda pidiendo reenviar el frente sin entender por qué. **Se acepta a sabiendas y no se añade nada para manejarlo.** Ojo: en PsicoAlianza queda registrado con el documento errado, y corregirlo aquí no lo corrige allá |
| B2  | ~~Candidato sin correo~~ **RESUELTO** | El enlace personal se obtiene por la API (`POST /regenerar-acceso-usuario/{id}`, funciona registrado o no) y **lleva a presentar las pruebas**; se manda por WhatsApp, igual que hoy con EvaluaTest. La invitación exige correo único por usuario, así que al candidato sin correo se le inventa uno **único y no reutilizable** —nunca recibe nada, el enlace va por WhatsApp— |
| B3  | Cambio de proveedor con ofertas vivas                | Hay gente a mitad de prueba cuando la empresa se cambia                                                                                                                                                                                  |
| B4  | De dónde se corta el indicativo del teléfono         | Se guarda con +57                                                                                                                                                                                                                        |
| B5  | ¿La IA sigue sugiriendo vacante?                     | Depende de A4                                                                                                                                                                                                                            |
| B6  | Qué se hace con lo ya guardado                       | Config, seis campos por candidato y motivos de rechazo llevan el nombre del proveedor                                                                                                                                                    |
| B7  | ~~Cómo autenticarse contra el reCAPTCHA v3 del login~~ **DECIDIDO** | Solucionador de pago con **SolveCaptcha**; el login humano queda descartado. Ver decisión 23. Queda por medir con qué puntaje mínimo pasa el sitio |
| B8  | ~~¿El identificador de empresa hace falta para considerar válida una conexión?~~ **CERRADO: no afecta a nadie** | Medido en producción el 2026-09-10: **cero empresas** con correo y contraseña pero sin identificador. La divergencia entre las cuatro resoluciones existe en el código pero **no toca a ningún tenant**, así que se puede unificar con la regla estricta sin riesgo y **el recableado del embudo deja de estar bloqueado**. Sigue en pie la otra mitad: solo el orquestador arrastra el correo de pruebas, y la resolución canónica tiene que conservarlo o se rompe el desvío de QA (ya cubierto en el paso 3) |

## Riesgos de la etapa, heredados

- El emparejamiento por correo descarta por vencimiento a quien hizo la prueba con
  otro correo del que tenemos.
- El cron de resultados no tiene guarda de solapamiento; otros procesos del mismo
  archivo sí la tienen.

## Dónde va la etapa 1

> Esta sección es el registro de avance: qué paso se hizo, qué dejó atrás y qué falta.
> **Para saber en qué punto está el trabajo hoy, empieza por *Estado* y por *Lo que falta
> para cerrar la etapa 1*, más abajo.**

**La etapa 2 está cerrada** (2026-09-09). Se capturó con una sesión abierta a mano —sin
gastar el solucionador de pago, porque analizar la API no dependía del captcha— todo el
recorrido: listado de vacantes, participantes y resultados, la consulta previa de correo,
la invitación y el enlace personal del candidato. El contrato está en
`psicoalianza-api.md`. Quedaron resueltas A2 a A8, A13 y B2.

Sigue abierto, sin bloquear nada: el umbral exacto de aprobación (A1, hace falta ver a
alguien reprobar), si `medio_envio` admite un valor distinto de `correo` —ya poco
relevante, porque el enlace se entrega por WhatsApp—, y las decisiones de negocio B1 y B5.

**La etapa 1 arrancó**, y ya sin el riesgo que justificaba posponerla: el contrato de
PsicoAlianza para listar, invitar y consultar resultados está capturado, así que el
puerto se puede dibujar sin calcarlo de EvaluaTest. Va **por pasos**, cada uno con su
brief y su revisión de diff, porque son decisiones encadenadas.

### Paso 1 — ✅ HECHO (2026-09-09)

El puerto y el adaptador de EvaluaTest, sin tocar el orquestador. Brief en
`brief-paso-1-puerto-psicometrico.md`. Quedó el puerto con tres operaciones de lectura
—listar vacantes, comprobar que una vacante sigue sirviendo y validar una conexión—, el
adaptador envolviendo el cliente que ya existía sin reescribirlo, y dos consumidores
colgados del puerto: el servicio de ofertas y el controlador de tenants. Como hay un
único proveedor, el módulo lo resuelve directo al adaptador. Decisiones nuevas: 28, 29 y
30.

EvaluaTest se comporta igual que antes y ninguna ruta cambió. Se agregó una prueba de
paridad porque **ninguno de los tres caminos recableados tenía cobertura** y lo que se
rompe al pasar por el puerto no falla ruidoso, se degrada.

**Lo que el paso siguiente hereda y tiene que mover.** Dos fugas, las dos en el servicio
de ofertas, las dos cubiertas por la prueba de paridad y por eso no bloquearon:

- Se ramifica sobre el motivo opaco comparando contra un valor de EvaluaTest, para
  elegir qué mensaje ve el reclutador. Antes lo garantizaba el tipo.
- Abre la bolsa opaca para sacar el código con el que se arma el enlace del candidato.

Son el precio de conservar el contrato con el frontend en este paso, y desaparecen
cuando la configuración de la oferta se vuelva neutra (decisiones 7 y 19).

**Falta del paso 1:** verificarlo en pantalla. No bloquea, y no necesita despliegue.

### Paso 2 — ✅ HECHO (2026-09-09)

Cada adaptador resuelve su propia credencial. Brief en
`brief-paso-2-resolucion-de-credenciales.md`. El puerto dejó de recibir la credencial y
pasó a recibir la referencia de la empresa; con eso desapareció la trampa que dejó el
paso 1 (ver decisión 30). La consulta de exámenes adicionales salió del puerto y pasó a
ser un método propio del adaptador, porque es exclusiva de EvaluaTest (decisión 4).

El tercer estado de la comprobación de vacante se llama `undetermined` **del puerto hacia
adentro**; lo que sale por la ruta sigue siendo el vocabulario del portal, que es
contrato. El adaptador se registra una sola vez y el token del puerto es un alias de esa
misma instancia, no una construcción nueva.

Las otras tres resoluciones de credenciales —orquestador, creación con IA y
sincronización del índice— quedaron **sin unificar a propósito**, que era lo que B8
bloqueaba. B8 ya está cerrado; unificarlas es trabajo del recableado.

### Paso 3 — ✅ HECHO (2026-09-10)

La invitación entra al puerto. Brief en `brief-paso-3-invitacion-en-el-puerto.md`. Una
sola operación que recibe la vacante con su nombre, la empresa, **nuestra referencia del
candidato** y sus datos, y devuelve el identificador que le da el proveedor, el enlace y
la bolsa de datos propios. Detrás, el adaptador hace los cuatro pasos de la 32-a,
respaldo por correo incluido.

**Nada la llama todavía**: el embudo sigue invitando por su cuenta. Era aditivo a
propósito, porque conectarlo era pisar B8.

De aquí salió la decisión 35, y su mitad del adaptador **ya está implementada**: sin
nombre de vacante la invitación aborta antes de tocar al proveedor. La única mitad viva
es que el embudo capture esa excepción, en el recableado.

La resolución de credenciales del adaptador arrastra ahora el correo de pruebas con la
forma del embudo —empresa sin correo propio manda **nulo**, no ausencia (32-b)— y deja un
aviso cuando una empresa tiene credenciales incompletas. Ese aviso era el instrumento
para medir B8; **ya cumplió su función** y hay que decidir si se queda.

### Estado a 2026-09-10

Rama `feat/integrate-psicoanalisis-provider` en los dos repositorios, con `develop`
mergeado. Backend verde: 91 suites, 768 pruebas, 9 omitidas. **Las dos preguntas que
bloqueaban murieron el mismo día y las dos a favor** (B8 y la cuenta compartida, ver
decisiones 34 y B8): el recableado del embudo está desbloqueado y el respaldo por entorno
se puede quitar sin migrar a nadie.

### Lo que falta para cerrar la etapa 1

Cinco briefs, cada uno con su línea de parada, más tres cambios de comportamiento que van
aparte porque **ninguno es un refactor invisible**:

| # | Brief | Nota |
| --- | --- | --- |
| 4 | **La consulta de resultados en lote entra al puerto** | Aditivo, como el 3. En lote por vacante, nunca de a un candidato (decisión 22) |
| 5 | **El modo demo como proveedor falso**, con la selección de proveedor y el recableado del arranque de la etapa | Es la primera vez que hay dos proveedores, así que aquí sí hace falta elegir (decisión 18). Tiene que capturar la excepción de la decisión 35 |
| 6 | **El recableado del cron con los campos neutros del candidato** | El más grande (decisión 15). Probablemente se parta en dos |
| 7 | **Los motivos de rechazo con prefijo neutro** | Decisiones 13 y 16. **Toca los dos repositorios**: enum del backend, etiquetas y textos del portal |
| 8 | **Las conexiones como lista con nombre** y la configuración neutra de la oferta con doble escritura | Decisiones 1, 5, 7 y 19 |

Aparte, y **cada uno en su propio cambio**: la decisión 33 (se elimina el correo
inventado y el candidato sin datos se descarta), la 34 (se elimina el respaldo por
entorno) y la mitad viva de la 35 (el embudo captura el aborto por vacante sin nombre).

El selector de proveedor en el portal es de la **etapa 3**, no de esta.

### Lo único que sigue esperando al equipo

Si la cuenta compartida es parte de lo que se vende. Es la última pregunta que no se
puede responder leyendo código.
