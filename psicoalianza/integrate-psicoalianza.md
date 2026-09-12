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
solo completarlas.

> ⚠️ Esta sección se escribió al abrir el frente y describe la intención inicial. **El
> modo demo ya no se convierte en un proveedor de la capa** —se queda como condicional,
> ver la decisión 38— y el resolvedor pasó a la etapa 3. Para el estado real, ir a *Dónde
> va la etapa 1*, al final.

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

  ⚠️ **Dónde está exactamente, comprobado el 2026-09-10 con una búsqueda en todo el
  espacio de trabajo:** la contraseña, escrita, está en **un solo archivo** —el de entorno
  local del backend, en texto plano, donde alguien la dejó como nota—. **No puede filtrarse
  por git**: ese archivo está ignorado y nunca se commiteó. **En estos `.md` no está**, y no
  debe entrar: aquí solo se registra que hay que rotarla. La otra copia viva está en el
  historial de la conversación donde se hizo el análisis, que no es un archivo de este
  repositorio. Quien rote tiene que limpiar además el archivo de entorno de cada máquina de
  desarrollo, porque ahí sobrevive a la rotación.

## Confirmado de PsicoAlianza

> El detalle de cableado de cada endpoint —URL, parámetros, campos de respuesta— vive
> en `psicoalianza-api.md`. Aquí queda solo lo que pesa en una decisión.

- Se usarán los endpoints de su portal web; hay que autenticarse primero. **La
  autenticación no entrega un token: es un formulario web de Laravel** que deja la
  sesión en cookies de servidor. No hay token que decodificar. Las cookies y sus vidas,
  en el API doc.
- ✅ **Re-confirmado que es v3 y no v2** (2026-09-10, tras una duda planteada). El
  discriminador está en cómo carga el script de Google: **el parámetro `render` lleva la
  clave del sitio**, y así carga v3 y solo v3. El v2 carga el script a secas —Google busca
  los widgets de la página— o con `render=explicit` para montarlo a mano, y en los dos
  casos **la clave va en un atributo del elemento, nunca en la URL**. Encaja con lo demás
  ya observado: la etiqueta de acción `submit` es un concepto exclusivo de v3, y el rechazo
  por puntaje también.

  ⚠️ La confusión es fácil y va a volver: el **v2 invisible** se ve igual desde fuera —sin
  casilla, se ejecuta solo al enviar—. Mirar esa línea es la única forma de separarlos sin
  capturar tráfico. **No reabrir sin evidencia nueva de ese tipo.**
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

   ⚠️ **Choca con la 19 en un caso** (levantado el 2026-09-11). La oferta que nadie
   vuelve a editar no se migra, así que **nunca tendrá su conexión guardada** y hay que
   deducirla al leer. Hoy no es ambiguo —una conexión por empresa (decisión 2) y solo
   EvaluaTest—. Lo es el día que una empresa tenga dos conexiones, o se pase de proveedor
   con ofertas viejas todavía vivas. Se decide con B3, en la etapa 3.
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

    🔴 **La bolsa tiene dos escritores en momentos distintos, y hay que empalmarla, no
    reemplazarla** (levantado por el ejecutor el 2026-09-10 al revisar el brief del 6b). El
    correo de registro lo escribe la invitación una sola vez; el código de estado y el
    resultado por prueba los escribe el cron en cada pasada. Si el cron guarda la bolsa
    entera con lo suyo, **borra la llave con la que se localiza al candidato**, y el
    respaldo por el campo viejo no rescata a quien se invitó después del despliegue, porque
    ese campo ya no se escribe. Esa persona acaba descartada por vencimiento sin un solo
    error en el registro, y solo en las empresas con correo de pruebas configurado — o sea
    donde se prueba antes de soltar algo.

    Segundo filo de la misma trampa: el campo se declara como objeto libre, así que
    **mutarlo por dentro no se guarda**. Hay que construir una bolsa nueva a partir de la
    anterior y asignarla entera, desde **un solo sitio** que usen los dos escritores.

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

    ⚠️ **Nombres corregidos el 2026-09-11, al escribir el brief 7.** Esta decisión proponía
    `psychometric_timeout` y `psychometric_failed_<prueba>`, pero el código de hoy es
    `evaluatest_external_timeout` y `evaluatest_exam_<nombre>`. **Solo cambia el prefijo**,
    en los cuatro: `psychometric_external_timeout`, `psychometric_discarded`,
    `psychometric_score_<puntaje>` y `psychometric_exam_<nombre>`. Cambiar también la palabra
    es renombrar por renombrar, y en la prueba adicional rompe la forma que el traductor del
    portal ya sabe desarmar.

    ⚠️ **Y los consumidores no son los que dice arriba.** Medido el 2026-09-11: la deducción
    de etapa del portal **no se amplía** —es último recurso y los registros nuevos traen su
    etapa—; el servicio de métricas **no analiza** los códigos, cuenta el texto literal, así
    que hay que unificar viejo y nuevo antes de contar; y falta uno que la cabecera del enum
    no nombra: **el visor del embudo del portal**, que hoy muestra estos cuatro motivos crudos.
17. ~~**Tomamos el arreglo de la atribución del vencimiento.**~~ **RETIRADA.** El
    supuesto era falso: se analizó sobre `main`, y en `develop` no hay tal bug. La
    deducción por motivo está unificada en una sola función y es el **último** recurso
    — primero se usa la etapa que manda el backend, y todos los caminos de descarte la
    archivan antes de cerrar al candidato. La lista de motivos incompleta es un
    respaldo documentado para registros viejos, no un olvido. No hay nada que arreglar
    ni nada que acordar con Elvis.
18. ~~**El modo demo se convierte en un proveedor falso más**, dentro de la etapa 1.~~
    **RETIRADA el 2026-09-10.** El modo demo **se queda como está**: un condicional en el
    embudo, con sus cuatro puntos actuales. Ver la decisión 38, que explica por qué y qué
    se pierde. El texto original se conserva abajo porque describe bien lo que el modo
    demo hace hoy.

    **El modo demo se convierte en un proveedor falso más**, dentro de la etapa 1. El
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

    ⚠️ **Aclarado el 2026-09-11, porque se confunde fácil: son dos piezas, no una, y
    ninguna sustituye a la otra.**

    - **Leer la nueva y, si falta, la vieja tratándola como EvaluaTest.** Protege al
      código nuevo frente a las ofertas que nadie vuelve a editar. Dura mientras existan
      esas ofertas; quitarla del todo exige convertirlas una vez, y no hace falta para
      cerrar ninguna etapa.
    - **Escribir también la vieja al guardar.** Protege otra cosa: si hay que volver a la
      versión anterior, el código que queda corriendo **no tiene el respaldo de arriba** y
      solo conoce la forma vieja. Una oferta editada después del despliegue y guardada solo
      en la nueva aparecería sin prueba, y el arranque de la etapa **la aprueba sola**: los
      candidatos pasan sin filtro y nada falla. Dura unas semanas: con el brief 8 estable,
      un cambio pequeño deja de escribir la vieja, y volver atrás desde ahí cae en una
      versión que ya lee la nueva.

    **La regla que ordena las dos:** la versión a la que se podría volver tiene que
    entender lo que haya guardado en la base. Se despliega la rama entera, así que esa
    versión es la de antes de la rama.

    🔴 **El paso 6b no es el precedente para escribir.** Escribió solo la forma nueva a
    propósito (decisión 15), y eso lo deja sin vuelta atrás: ver su entrada. Lo que el 6b
    sí sienta como precedente es la lectura.
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
    acepta el sitio y habrá que subirlo a tientas.

    ⚠️ ~~Es el primer puerto/adaptador del backend.~~ **Ya no** (2026-09-10): la capa
    psicométrica llegó primero y el precedente está sentado — puerto sin conocer al
    proveedor, adaptador envolviendo el cliente, token resuelto por alias a una sola
    instancia, y datos propios del proveedor en una bolsa opaca. **Seguir ese patrón en
    vez de inventar otro.**
26. **La sesión se cachea de forma agresiva y el login es raro.** Cada autenticación
    cuesta dinero y hasta dos minutos de espera. Con la sesión durando 5 días al marcar
    *permanecer conectado*, reautenticar en cada pasada del cron dispararía la
    factura y multiplicaría las probabilidades de que el proveedor lo note. Extiende la
    decisión 9 de token cacheado a la cookie de sesión.
27. **La invitación de PsicoAlianza lleva cuatro pasos, no uno**, por cómo funciona su
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
    4. **Pedir el enlace personal** con `POST /regenerar-acceso-usuario/{id}` y
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

    ✅ **Esa excepción la captura el embudo desde el paso 5** (decisión 39): el arranque la
    deja salir al mecanismo de arranque fallido en vez de aparcar al candidato, así que no
    queda nadie colgado. Una versión anterior de esta nota decía que la capturaba el paso 4.

36. **La consulta de resultados no distingue "no pude preguntar" de "no hay nada", y el
    reloj del vencimiento no se detiene** (levantado del código el 2026-09-10, al
    preparar el paso 4). **Es un fallo latente que ya existe hoy**, no algo que
    introduzca la capa.

    Cuando la petición del tablero de EvaluaTest falla —HTTP de error o respuesta que no
    es JSON— el cliente **no lanza: devuelve una lista vacía** y solo deja un aviso en el
    registro. Con la lista vacía, todos los candidatos pendientes quedan "sin
    coincidencia" y el cron los trata como *aún no terminaron*: los sigue esperando, que
    para una pasada es lo correcto.

    ⚠️ **Lo que no se detiene es el plazo.** El cron corre cada 5 minutos; si el
    proveedor está caído más días que el plazo configurado, esos candidatos **se
    descartan por vencimiento sin que nadie haya conseguido preguntar nunca**, y reciben
    un mensaje diciendo que no llegó su resultado a tiempo.

    🔴 **Son dos caminos, no uno** (levantado el 2026-09-10 al revisar el brief del paso
    4). Si falla la autenticación o se cae la red, el cliente **sí lanza**, y el cron
    atrapa la excepción por oferta y **se salta la oferta entera**. Los dos casos son "no
    pude preguntar" y se comportan distinto: con la lista vacía se guarda la marca de
    última consulta de cada candidato, con la excepción no se guarda nada.

    **El paso 4 los reduce a uno**: la operación atrapa también la excepción y devuelve a
    todos los candidatos pedidos como "no se pudo consultar", sin tragarse el motivo, que
    sigue yendo al registro.

    ✅ **Qué hace el embudo con ese estado, decidido el 2026-09-10: nada con el plazo.** Se
    leyó el código y el plazo no es un temporizador nuestro: es **la ventana que el
    candidato tiene para presentar la prueba**, la que se le anuncia en el mensaje y la que
    fija el propio proveedor, y la diseñó el equipo del embudo. Así que ante *no se pudo
    consultar* el candidato **sigue esperando y el plazo corre igual**, y el mensaje de
    descarte tampoco cambia. El paso 6a solo lo deja **distinguible** en el registro y en el
    resumen del ciclo, para poder medir cuánto pasa. Corrige lo que decía antes esta
    decisión: que dejar de correr el reloj iba en el recableado del cron. Si algún día se
    reabre, el supuesto sin verificar de abajo hay que cerrarlo antes.

    🔴 **Supuesto sin verificar, y hay que cerrarlo ANTES de actuar sobre ese estado**
    (2026-09-10, al revisar el diff del paso 4). La lista vacía del cliente significa dos
    cosas que no se pueden separar desde fuera: *la petición falló* y *la vacante no tiene
    ningún candidato en el tablero*. El adaptador las trata a las dos como "no se pudo
    consultar", que es lo único que puede hacer sin tocar el cliente.

    Eso da por hecho que un tablero **no puede** estar legítimamente vacío mientras
    esperamos a alguien —porque a esa persona ya se la registró—. **No está comprobado.**
    Si el supuesto es falso, el recableado que deje de correr el reloj ante "no se pudo
    consultar" **congelaría el plazo para siempre** a quien nunca presenta la prueba: el
    error espejo del que se está arreglando.

    **El arreglo de fondo es del cliente** —devolver "no pude" y "no hay nadie" como cosas
    distintas—, y va en su propio cambio.

    🔴 **Y hay un tercer efecto, el único que saca gente del proceso** (levantado por el
    ejecutor el 2026-09-10 al revisar el brief del 6a, y comprobado en el código). Hoy,
    cuando la petición **lanza**, el cron **abandona la oferta antes de entrar al bucle por
    candidato**, y en ese bucle está el descarte por vencimiento. O sea que una caída
    **congela de rebote** a todos los candidatos de esa oferta: mientras dure, nadie vence.

    Al pasar la consulta por el puerto, la excepción se atrapa dentro del adaptador, el
    bucle corre siempre, y una empresa con el acceso roto más días que el plazo **empieza a
    descartar candidatos por vencimiento** sin que nadie haya conseguido preguntar.

    **Se asume en el 6a**, por tres motivos: ese congelado no lo diseñó nadie —sale de
    abandonar la oferta, y de paso se salta también el reintento del arranque—; conservarlo
    obligaría a saltarse la oferta siempre que todo vuelva como *no se pudo consultar*, y
    eso **congelaría el plazo para siempre** en el camino de la lista vacía, que es el
    frecuente y el error espejo de arriba; y la política ya está decidida —ante *no se pudo
    consultar* el candidato sigue esperando y el plazo no se toca—, así que el paso la
    aplica en vez de inventarla.
37. **Un puntaje ausente se lee como cero, y eso reprueba a quien no hizo nada**
    (levantado del código el 2026-09-10). El cliente convierte el puntaje faltante del
    tablero en **cero** al normalizar la fila. Si EvaluaTest marca a alguien como
    evaluado y no manda nota, el embudo lee cero, lo compara contra el puntaje mínimo y
    lo descarta.

    Hoy está tapado a medias porque el embudo solo mira el puntaje cuando el candidato
    está evaluado. **El puerto no lo arregla ni lo empeora**: entrega el puntaje solo en
    el estado terminado, que es lo mismo que hace el embudo. El arreglo real es del
    cliente —distinguir "sin nota" de "nota cero"— y va en su propio cambio.

    ⚠️ Ojo con el segundo proveedor: PsicoAlianza usa `-2.0` como centinela de *sin
    puntaje*. Ahí el mismo error daría un número negativo en vez de un cero, igual de
    reprobatorio.

    **De paso, código muerto que el recableado debe quitar:** el cron avisa de filas del
    tablero "sin correo, no indexables", pero el cliente ya las descarta antes de
    entregárselas. Ese aviso no puede dispararse nunca. El respaldo por identificador
    rescata al candidato con el correo **alterado**, no al que no tiene correo.

38. **El modo demo se queda como condicional, y el resolvedor sale de la etapa 1**
    (2026-09-10). Retira la decisión 18.

    **Qué lo decide:** con el modo demo quieto, **en toda la etapa 1 hay un solo proveedor
    real**, así que no hay nada que elegir y el resolvedor no le sirve a nadie todavía.
    Pasa a la **etapa 3**, cuando PsicoAlianza exista de verdad. Se descargan dos piezas
    de andamiaje, no una.

    **Y el argumento que justificaba el proveedor falso era más débil de lo que parecía.**
    Se defendía como "la primera prueba real del puerto", pero es una implementación
    degenerada: se inventa todos los datos y no llama a nada, así que valida la **forma**
    del contrato y no su semántica. No habría encontrado ninguna de las cosas que sí
    mordieron —los cuatro pasos de la invitación (32-a), las dos llaves del emparejamiento,
    la ambigüedad de la lista vacía (36)—. Todas salieron de leer un proveedor de verdad.

    A favor, además: **las pruebas del modo demo son la red de seguridad de toda la etapa
    psicométrica**. Dejarlo quieto las mueve lo mínimo, y son justo las que avisan si se
    rompe EvaluaTest.

    ⚠️ **Lo que NO era gratis.** El modo demo fabricaba una fila con la forma del tablero de
    EvaluaTest y la metía por el mismo código de emparejamiento que la fila real. Cuando el
    embudo pasó a consumir lo que devuelve el puerto, esa rama tuvo que producir la forma
    nueva. ✅ **Hecho en el paso 6a**: el constructor sintético, dentro del embudo, produce
    resultados con la forma del puerto y **devuelve el *no aparece* explícito** para quien
    sigue dentro de su retraso simulado, en vez de omitirlo.

    🔴 **Y hay un tercer momento del modo demo que no cabe en ningún adaptador**: un
    temporizador que, tras mandarle el mensaje al candidato, dispara la consulta de
    resultados antes del siguiente tick del cron, para que una demo en vivo se resuelva en
    segundos en vez de en cinco minutos. **Se queda en el embudo.** Queda escrito porque el
    paso siguiente lo va a encontrar y puede confundirlo con rama muerta.

    **Son CINCO los puntos que toca el modo demo, no cuatro** (el quinto, verificado el
    2026-09-10):

    1. La invitación, en el arranque de la etapa.
    2. El temporizador que dispara la consulta antes del siguiente tick del cron.
    3. La sustitución del tablero en el cron.
    4. La acción de administración, que atrasa a mano la fecha de arranque para meter al
       candidato en la ventana y después dispara la consulta.
    5. 🔴 **La consulta de las pruebas adicionales, que una oferta demo se salta.** Es una
       condición **aparte y posterior al emparejamiento**, dentro de la rama del veredicto
       — no es la sustitución del tablero.

    ⚠️ **El quinto es el que más cuidado pide, y está escondido justo donde va a trabajar
    el recableado del cron.** Es el único sitio donde olvidar la bandera provoca una
    **llamada real a EvaluaTest para una empresa de demostración**, con un identificador de
    candidato inventado. Y como una empresa demo normalmente no tiene credenciales propias,
    esa llamada sale **con la cuenta compartida** (hoy; después de la decisión 34 fallaría
    de otra forma).

    No rompe nada visible: devuelve unas interpretaciones donde no están las pruebas
    configuradas, cada una cuenta como *no aprobada* —una prueba que no se encuentra no es
    lo mismo que una reprobada, pero el código las trata igual— y **el candidato demo queda
    rechazado por una prueba que nunca existió, en mitad de una demostración en vivo**.

    **Lo que se pierde:** la capa se queda con **una sola implementación** hasta que llegue
    PsicoAlianza, así que el contrato sigue sin validar por un segundo consumidor. Lo
    mitiga que su API ya está capturada: el puerto se contrasta contra ella sobre el papel,
    que es lo que se viene haciendo.
39. **Un fallo que no se arregla reintentando se distingue por el tipo del error, y solo
    hay uno** (2026-09-10, implementado en el paso 5).

    El arranque de la etapa se tragaba cualquier excepción: avisaba al candidato, lo dejaba
    esperando resultado externo y el cron reintentaba cada cinco minutos. Para una caída
    pasajera es lo correcto. Para una oferta sin nombre de vacante guardado no hay nada que
    reintentar (decisión 35), y esa persona se pasaba días esperando hasta que el plazo la
    descartaba **con un mensaje diciendo que su resultado no llegó a tiempo, cuando nunca
    hubo resultado que esperar**.

    **Cómo se distingue:** el adaptador lanza un error de **tipo propio**, nunca un texto
    reconocible —un texto dura hasta que alguien reescribe un mensaje—. El arranque, ante
    ese tipo, deja salir la excepción en vez de aparcar al candidato, y actúa el mecanismo
    que la casa ya tenía para cualquier etapa que falla al arrancar: alerta por correo,
    vuelta a la cola, tres intentos y descarte con un motivo que **ya existía**. Por eso no
    toca el portal ni choca con la renumeración de motivos.

    **Lo aceptado a sabiendas:** ese candidato queda descartado **sin recibir ningún
    mensaje**. Es lo que ya les pasa a los candidatos de cualquier otra etapa que falla al
    arrancar.

    🔴 **Solo el nombre de vacante ausente califica.** El otro aborto del adaptador —sin
    código de evaluación— **no** lleva el tipo permanente: la consulta que trae ese código
    **devuelve exactamente lo mismo cuando la vacante no tiene código que cuando el
    endpoint falla**, y está medido que el 0,10% de las peticiones falla con 500 y se
    arregla al primer reintento. Marcarlo permanente convertiría una caída del proveedor en
    descartes reales en tres intentos.

    **Los cuatro puntos de entrada, trazados** (2026-09-10, antes de commitear): el
    despacho por etapa y el retomar desde el bombeo llevan la excepción al mecanismo; el
    reintento manual del administrador la deja salir como error de la petición, con el
    estado del candidato intacto —mejor que responder "reintentado" cuando no fue verdad—;
    y el cron la atrapa y la cuenta.

    ⚠️ **La quinta puerta se traga el error, y es la única que queda muda:** el botón
    "Continuar proceso" de un recordatorio entra por el webhook de mensajes, que atrapa
    cualquier fallo a propósito para no tumbar el procesamiento del mensaje. Ahí el
    candidato conserva su estado pero **gastó la reapertura de la ventana de WhatsApp
    pulsando un botón que no hizo nada**.

    ⚠️ **Esto impide casos nuevos; no rescata a los ya atascados.** Quien hoy esté aparcado
    esperando resultado sin identificador del proveedor sigue ahí, porque quien lo reintenta
    es el cron y el cron no se tocó. Lo único que cambia para ellos es que ahora **suman al
    contador de errores del ciclo** en vez de reintentarse en silencio.

    🔴 **Y "sigue ahí" es literal: no lo descarta el plazo** (corregido el 2026-09-11; antes
    esta decisión decía que sí, y era falso). El bloque del reintento termina en un **retorno
    incondicional** y la comprobación del vencimiento está **debajo**, así que esa persona
    nunca llega a ella. Tampoco la tocan los otros barridos: el de conversaciones sin
    respuesta solo mira a quien espera respuesta del candidato, y el de flujos atascados solo
    mira el estado de arranque. **No recibe nada nunca y no sale nunca.**

    ⚠️ **Mientras tanto ocupa una plaza:** su estado cuenta como candidato en vuelo, así que
    reserva cupo y mantiene ocupado su teléfono de pruebas. Una oferta con la vacante sin
    nombre acumula gente que no avanza y plazas que no se liberan, y lo único que las libera
    hoy es cancelar la oferta. Por eso el rescate no es "descartarlos antes": es **sacarlos
    de un sitio del que no hay salida**. ✅ **Hecho el 2026-09-11**, en su propio cambio:
    `brief-rescate-de-atascados.md`.

40. **Sin conexión propia, la empresa no hace pruebas psicotécnicas — y eso no detiene a
    nadie** (2026-09-10, decidido por el equipo). Completa la 34, que decía *qué* se quita
    pero no *qué pasa entonces*.

    La 34 elimina el respaldo por entorno. Faltaba lo que ocurre con una empresa que tenga
    la etapa encendida y no tenga credenciales: **no se le habilita la prueba
    psicotécnica**, y ya. Nada de invitar con la cuenta compartida de otro.

    🔴 **No es bloqueante, y esa es la mitad importante.** El candidato **no se queda
    parado ni se descarta**: la etapa no se ejecuta y su proceso sigue. El embudo ya sabe
    hacer exactamente eso —cuando una oferta no tiene la prueba configurada, el arranque
    aprueba la etapa y pasa a la siguiente—, así que esto **reusa un camino que ya existe**
    en vez de inventar un estado nuevo.

    **Y hay que avisar, porque el silencio aquí es caro.** Mientras falte la conexión, esa
    empresa **deja pasar candidatos sin filtrar** creyendo que los filtra. El aviso va al
    reclutador, no solo al registro: un error de configuración que solo se ve en los logs
    no lo arregla quien puede arreglarlo.

    ⚠️ **Abierto, y es de producto:** si además hay que **impedir encender la etapa** al
    guardar la oferta cuando la empresa no tiene conexión. Eso sí bloquea, pero bloquea una
    *configuración* y no a una persona, y evita que la situación llegue a existir. Se
    decide antes de escribir el brief.

    **Va en su propio cambio**, con la 34, porque cambia comportamiento.

    ⚠️ **Levantado del código el 2026-09-11, para el brief de este cambio:**

    - **El respaldo no vive en el aviso de credenciales incompletas: vive en el cliente de
      EvaluaTest**, que usa la cuenta del entorno cada vez que le llegan credenciales
      vacías. Le llegan vacías por dos caminos: el adaptador —sus cinco operaciones con
      credencial, incluido el selector de vacantes del reclutador— y la lectura propia del
      embudo, **más laxa** porque no exige el identificador de empresa, que usan las pruebas
      adicionales del cron y el enlace de la rama de error del arranque. Quitar el respaldo
      es quitarlo del cliente y **dejar una sola regla de lectura de credenciales**, que es
      la unificación que el paso 2 dejó para el recableado y los pasos 6a y 6b aplazaron. La
      creación de ofertas con IA y la sincronización del índice **ya no usan** la cuenta
      compartida: se saltan a la empresa sin credenciales.
    - **El modo demo no depende de la cuenta compartida** (corregido el mismo 2026-09-11: una
      primera versión de esta nota decía que sí). En el backend el selector de vacantes no
      tiene rama demo, y a una empresa sin credenciales le listaría la cuenta compartida,
      pero **el portal no llega a pedirlo**: solo muestra la sección de prueba psicométrica
      —al crear la oferta y en su detalle— si la empresa tiene credenciales de EvaluaTest
      guardadas. Una empresa demo sin credenciales no tiene prueba en sus ofertas y la etapa
      se salta, hoy y después de este cambio; una con credenciales usa las suyas. La única
      forma de que una oferta demo tenga prueba sin credenciales es crearla desde
      administración, que acepta la configuración directamente.
    - 🔴 **Dónde va la comprobación de "sin conexión".** El sitio que parece natural —junto a
      *oferta sin prueba configurada, aprobar*— está **antes** de la comprobación del modo
      demo, y ahí una demo en vivo se saltaría la prueba. Va en la **rama real**: la rama
      demo no usa credenciales.

    **Decidido el 2026-09-11: la demo se queda como está.** Se descartó dejarle a la empresa
    demo las credenciales de la cuenta compartida: no se le guarda nada y el modo demo no se
    toca. Si no tiene credenciales, sus ofertas siguen sin prueba psicométrica, como hoy.

    **Decidido el 2026-09-11: cómo es el aviso al reclutador.** Hoy hay dos sitios y ninguno
    sirve tal cual. Al crear la oferta, el paso de la prueba muestra un aviso que habla de
    "tenant" y de "EvaluaTest" y no lleva a ningún sitio. En el detalle de la oferta, pestaña
    Filtros, la sección **desaparece sin decir nada** — y ahí es donde más importa, porque una
    oferta que ya tenía la prueba activa se la salta sin que el reclutador lo sepa. Se pone
    **un mensaje neutro en los dos sitios**, del estilo *tu empresa no tiene un proveedor de
    pruebas psicométricas conectado; esta etapa se omitirá*, con **enlace a Mi compañía solo
    para quien tiene permiso de editar la empresa**, que es el que exige esa sección; a quien
    no lo tiene se le dice que lo pida a un administrador de su empresa. Con eso **este cambio
    toca los dos repositorios**. El portal no tiene pruebas: el cambio tiene que ser pequeño y
    se verifica leyendo.

    **La pregunta de impedir encender la prueba casi se contesta sola:** en el portal ya es
    imposible, porque sin credenciales no se muestra la sección. Queda revisar, al escribir el
    brief, los otros caminos que crean ofertas —el agente de WhatsApp y la creación desde
    administración— y decidir si el backend también la rechaza.

    ⚠️ **Coordinar antes del brief:** Elvis y Henry Peña tocaron la semana del 2026-09-07 justo
    estas pantallas — el guardado de credenciales de EvaluaTest, el detalle de la oferta y el
    formulario de creación.

## Falta de PsicoAlianza

| #   | Qué                                               | Por qué importa                                                                  |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| A1  | Escala del puntaje (casi) | Notas reales vistas `84.6`/`85.0`, ambas `"Recomendado"` → escala ~0–100, más alto mejor, como la base. **Ojo:** `-2.0` es centinela de "sin puntaje", no una nota. Falta el umbral exacto de aprobación y ver un reprobado |
| A2  | ~~Login: qué pide, qué devuelve, duración del token~~ **RESUELTO** | Formulario Laravel, sesión por cookie (5 días con *permanecer conectado*), reCAPTCHA v3 validado en servidor. Ver *Confirmado*, *Riesgos* y B7 |
| A3  | ~~¿El listado paginará algún día?~~ **RESUELTO** | Ya pagina (`length` por defecto 10). Un `length` alto trae todas; si no, hay que recorrer páginas o se pierden vacantes sin error |
| A4  | ~~Campos de cada vacante del listado~~ **RESUELTO** | `id`, `nombre`, estado, empresa, contadores y `pruebas[]` embebidas. Ver *Confirmado*. Falta decidir B5 (si la IA sugiere) |
| A5  | ~~Invitación: URL, cuerpo, respuesta~~ **RESUELTO** | `POST /procesos-participantes/{proceso}`, en lote. Éxito da 201 con `{message, agregados}` y **no** devuelve el `id`: hay que buscar al candidato después por documento en el tablero. Contrato en el API doc |
| A6  | ~~¿El enlace es común o personal?~~ **RESUELTO** | Personal por candidato (`control-acceso/{uuid}`). No vuelve en la invitación, pero **sí por la API**: `POST /regenerar-acceso-usuario/{id}` (método POST, ver el API doc). Se puede reenviar por WhatsApp. Destraba B2 |
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
| B2  | ~~Candidato sin correo~~ **RESUELTO, y corregido por la decisión 33** | Lo que sigue en pie: el enlace personal se obtiene por la API (`POST /regenerar-acceso-usuario/{id}`, funciona registrado o no), **lleva a presentar las pruebas** y se manda por WhatsApp, así que **el enlace no depende del correo**. ~~Al candidato sin correo se le inventa uno único y no reutilizable~~ — **retirado por la decisión 33** (2026-09-11): no se inventa ningún correo; quien no trae correo no puede ser invitado y **se descarta** |
| B3  | Cambio de proveedor con ofertas vivas                | Hay gente a mitad de prueba cuando la empresa se cambia. Incluye las ofertas guardadas en la forma vieja, que no llevan su conexión: ver la nota de la decisión 5 |
| B4  | De dónde se corta el indicativo del teléfono         | Se guarda con +57                                                                                                                                                                                                                        |
| B5  | ¿La IA sigue sugiriendo vacante?                     | Depende de A4                                                                                                                                                                                                                            |
| B6  | ~~Qué se hace con lo ya guardado~~ **CASI RESUELTO** (2026-09-11) | **Sin migración en los tres.** Campos del candidato (paso 6b): al leer, el nuevo y si está vacío el viejo; al escribir, siempre el nuevo — la compatibilidad caduca sola. Motivos de rechazo (paso 7): el portal y las métricas entienden viejo y nuevo **para siempre**, porque un rechazado no caduca. **Falta solo la configuración de la oferta**, que es del brief 8. **Esos dos pasos son el precedente para leer, no para escribir**: la oferta escribe las dos formas mientras se pueda volver atrás (decisión 19 y su aclaración del 2026-09-11) |
| B7  | ~~Cómo autenticarse contra el reCAPTCHA v3 del login~~ **DECIDIDO** | Solucionador de pago con **SolveCaptcha**; el login humano queda descartado. Ver decisión 23. Queda por medir con qué puntaje mínimo pasa el sitio |
| B8  | ~~¿El identificador de empresa hace falta para considerar válida una conexión?~~ **CERRADO: no afecta a nadie** | Medido en producción el 2026-09-10: **cero empresas** con correo y contraseña pero sin identificador. La divergencia entre las cuatro resoluciones existe en el código pero **no toca a ningún tenant**, así que se puede unificar con la regla estricta sin riesgo y **el recableado del embudo deja de estar bloqueado**. Sigue en pie la otra mitad: solo el orquestador arrastra el correo de pruebas, y la resolución canónica tiene que conservarlo o se rompe el desvío de QA (ya cubierto en el paso 3) |

### Abierto, para cuando exista el resolvedor (etapa 3)

**Qué ve el reclutador de una empresa en modo demo en el selector de vacantes.** Si la
empresa demo tiene credenciales guardadas, ve las vacantes reales de esa cuenta, porque el
modo demo **no es un proveedor: son cinco momentos** del recorrido (decisión 38) y ninguno
toca ese camino. Si no las tiene, el portal ni siquiera muestra la sección (ver la 40).

El día que un resolvedor decida *todas* las operaciones, ese reclutador dejaría de ver
vacantes reales y vería las falsas. Puede ser lo que queramos o no, pero **es un cambio de
comportamiento** y se decide entonces. **En la etapa 1 no se plantea**: el token del puerto
sigue apuntando al adaptador de EvaluaTest de principio a fin (decisión 38).

## Riesgos de la etapa, heredados

- El emparejamiento por correo descarta por vencimiento a quien hizo la prueba con otro
  correo del que tenemos. **Más estrecho de lo que parece** (revisado el 2026-09-10): hay
  un respaldo por identificador del proveedor que rescata justamente ese caso, así que
  solo muerde si fallan **las dos** llaves — por ejemplo si la persona se registró por su
  cuenta y el proveedor le dio otro identificador.
- ~~El cron de resultados no tiene guarda de solapamiento.~~ **RESUELTO antes de este
  frente** (comprobado en el código el 2026-09-10): tiene su bandera y su candado, y el
  comentario explica que se volvió necesaria con el modo demo, porque hay dos caminos que
  disparan la consulta fuera del tick normal. **No escribir un brief para arreglarlo.**
- 🔴 **La rama sin enlace no anuncia el plazo, y el plazo corre igual** (abierto en el
  paso 5). Al partir el mensaje del arranque en dos, quien no recibe enlace se queda solo
  con el aviso de que llegará por correo: pierde el enmascarado de su dirección, las
  instrucciones y **cuánto tiempo tiene**. El descarte por vencimiento no depende de que
  el mensaje lo mencione, así que el reloj corre igual. Hoy es inalcanzable —con
  EvaluaTest la invitación aborta antes si no hay código—, pero el contrato del puerto
  permite un proveedor que no dé enlace, y ese día esa persona no sabrá de cuánto tiempo
  dispone.

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

El puerto y el adaptador de EvaluaTest, sin tocar el orquestador. Quedó el puerto con tres operaciones de lectura
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

Cada adaptador resuelve su propia credencial. El puerto dejó de recibir la credencial y
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

La invitación entra al puerto. Una sola operación que recibe la vacante con su nombre, la empresa, **nuestra referencia del
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
para medir B8; **ya cumplió su función** y hay que decidir si se queda. ⚠️ **Asignado al
cambio de las decisiones 34 y 40** (2026-09-11): su texto dice que se usará la cuenta
global del entorno, y deja de ser cierto en cuanto se quite ese respaldo. Ahí se decide si
se borra o se reescribe.

### Paso 4 — ✅ HECHO (2026-09-10)

La consulta de resultados entra al puerto, en lote por vacante. Brief en
`brief-paso-4-resultados-en-el-puerto.md`. La operación recibe la vacante y la lista de
quién se espera —cada uno con su identificador en el proveedor, obligatorio, y **los dos
correos**, el de registro y el suyo— y devuelve por cada uno un estado de cinco valores,
el identificador con el que se le encontró, el puntaje solo si terminó, y la bolsa del
proveedor. **El emparejamiento vive dentro del adaptador.**

**Nada la llama todavía**: el cron sigue consultando por su cuenta.

De prepararlo y revisarlo salieron las decisiones **36 y 37**, las dos sobre fallos que ya
existen en producción y que este paso no arregla — solo los hace visibles en el contrato.

El diff incluyó además un archivo de tipos nuevo —los tipos salieron del puerto a un
archivo aparte—, y con eso se tocó el servicio de ofertas, que el brief dejaba fuera. El
cambio se acordó a mitad del paso y se avisó antes de hacerlo; se aceptó porque el
resultado es más limpio y revertirlo costaba más de lo que arreglaba.

⚠️ **No es el ejemplo de "refactorizar de paso"**, que es una regla que se sostiene sola:
lo que hay que evitar es que una reorganización **entre en el diff sin avisar**. Aquí se
avisó, que es exactamente lo que la regla pide.

### Paso 5 — ✅ HECHO (2026-09-10)

El arranque de la etapa invita por el puerto. Brief en
`brief-paso-5-recableado-del-arranque.md`. **Es el primer paso que toca el embudo**: donde
antes se hacían a mano los cuatro pasos de EvaluaTest ahora hay una llamada, y de su
respuesta salen el identificador del proveedor, el correo de registro —con la regla de
siempre: solo se guarda si difiere del real— y el enlace, que ya no se arma aquí. La rama
del modo demo no se tocó, temporizador incluido.

🔴 **No fue invisible, y era a propósito:** una oferta sin nombre de vacante guardado hoy
invitaba igual, con un cargo escrito a mano hace años; desde este paso **no invita**. Es la
mitad viva de la decisión 35, ya cerrada.

De aquí salió la **decisión 39**, que es donde vive lo que este paso decidió y el código no
cuenta: cómo se distingue un fallo permanente de uno pasajero, por qué solo hay uno, qué le
pasa a ese candidato, y las cinco puertas por las que se entra al arranque.

**Dos cosas quedaron abiertas y no son código:** los candidatos que ya estaban atascados
antes de este paso siguen igual — y no los descarta nada, ni siquiera el plazo (ver 39), y la rama sin
enlace se quedó sin anunciar el plazo mientras el reloj corre igual (ver *Riesgos de la
etapa*).

**Tres diferencias con lo de antes que no son de negocio, pero conviene no redescubrirlas
leyendo el diff** (las dos primeras se reportaron y no habían llegado aquí; la tercera
apareció en la auditoría de la rama del 2026-09-10):

- **El identificador del proveedor ya no se guarda antes de invitar.** Antes se anotaba en
  cuanto el candidato quedaba registrado, así que un fallo a mitad de la invitación lo
  dejaba guardado igual. Ahora la operación devuelve todo junto o lanza, así que no hay
  nada que guardar. **Se arregla solo** —el cron ve que falta y reintenta el arranque, y
  registrar es *registra o recupera*—, pero deja de ser literalmente lo mismo.
- **La invitación pasó a resolver credenciales con la regla estricta**, la que también
  exige el identificador de empresa. Es la regla que ya usaban las rutas; el embudo tenía
  una más laxa. B8 lo midió en **cero empresas afectadas**, pero es este paso el que lo
  enciende.
- **Se perdió una línea del registro**: antes se dejaba escrito el código de evaluación
  resuelto para cada candidato. Hoy no lo escribe nadie, ni el embudo ni el adaptador. No
  cambia comportamiento, pero era el rastro con el que se comprobaba a mano que un
  candidato recibió el enlace correcto.

✅ **Medido en producción el 2026-09-11: cero.** De 18 ofertas vivas con la prueba
psicométrica encendida, **ninguna** tiene el nombre de la vacante ausente ni en blanco. El
cero se comprobó quitando la condición del nombre —las 18 aparecen—, así que no es un filtro
mal escrito. **El paso 5 se despliega sin aviso.** La consulta contó también los nombres en
blanco, porque el campo se guarda recortado y una cadena de espacios queda como cadena vacía.

### Paso 6a — ✅ HECHO (2026-09-10)

El cron pregunta por el puerto. Brief en `brief-paso-6a-cron-por-el-puerto.md`. Desaparecen
del cron los dos índices, el emparejamiento y el enum de códigos del proveedor; el veredicto
mira un estado neutro y su regla no cambia. La llamada **no lleva a todos los pendientes**:
quien no tiene identificador del proveedor queda fuera y sigue reintentando el arranque.

**Lo que costó una ronda y valió la pena** (lo levantó el ejecutor, y el brief mentía):
hoy, cuando la consulta lanza, el cron **abandona la oferta antes del bucle**, y en ese
bucle está el descarte por vencimiento. O sea que una caída **congelaba de rebote** a todos
los candidatos de esa oferta. Al pasar por el puerto el bucle corre siempre, así que una
empresa con el acceso roto más días que el plazo **empieza a descartar gente**. Se asumió a
sabiendas — el razonamiento entero está en la decisión 36.

**Tres cosas que se arrastran hasta el 6b, todas anotadas:** el cron abre la bolsa del
proveedor para sacar el código numérico de estado y seguir guardándolo con el nombre de hoy;
la consulta resuelve credenciales con la regla estricta mientras la de pruebas adicionales
sigue con la laxa, **con dos reglas conviviendo en el mismo cron**; y la empresa se pasa
como texto directo aquí y con guarda en el paso 5, dos formas para el mismo dato.

**Coste medido:** una consulta más **por oferta** —la carga en bloque de los correos—, no
por candidato. Las cargas que ya había dentro del bucle no se tocaron, a propósito, para no
abrir una ventana nueva de dato desactualizado donde se aprueba y se descarta gente.

El constructor sintético del modo demo produce la forma nueva y **devuelve el "no aparece"
en vez de omitir al candidato**: con los resultados emparejados por nuestra referencia,
omitirlo dejaría un hueco en vez de un estado y rompería la sensación de *está evaluando* en
mitad de una demostración en vivo.

### Paso 6b — ✅ HECHO (2026-09-10)

Los seis campos del candidato pasan al núcleo neutro más la bolsa (decisión 15). Brief en
`brief-paso-6b-campos-neutros.md`. Sin migración: al leer, el nuevo y si está vacío el
viejo; al escribir, siempre el nuevo. **De los seis, solo dos se leen** —el identificador en
cuatro sitios y el correo de registro en uno—, así que el respaldo vive en cinco sitios y no
en más.

**Lo que esta ronda salvó** (lo levantó el ejecutor, no estaba en el brief): la bolsa tiene
dos escritores en momentos distintos y uno pisaba al otro. Está contado en la decisión 15.
La solución quedó en un único sitio que empalma la bolsa a partir de la anterior y la asigna
entera.

**Y un detalle del ayudante que decide un caso real:** al leer el correo de registro se
comprueba si la clave **está** en la bolsa, no si tiene valor. Un candidato en vuelo estrena
bolsa cuando el cron le escribe el estado, y esa bolsa todavía no lleva correo: con la
comprobación ingenua se le daría por registrado con el suyo real y **perdería la llave en su
primera pasada**.

Las dos lecturas del identificador dentro del cron comparten respaldo a propósito: una
decide a quién se le pregunta y la otra si se reintenta el arranque, y arreglar solo la
primera dejaría al candidato en vuelo entrando en la consulta para que lo reinvitaran acto
seguido.

**Pendiente menor:** queda un comentario en el barrido de flujos atascados que nombra el
campo viejo al contar el incidente de los cuatro candidatos parados hasta 9,6 días. El hecho
es cierto, el nombre ya no existe. Se ajusta cuando se toque esa zona.

🔴 **No tiene vuelta atrás, y eso es del despliegue** (levantado el 2026-09-11). Como solo se
escriben los campos nuevos, si tras desplegar la rama hubiera que volver a la versión
anterior, el código de antes no ve el identificador de quien se invitó después del
despliegue, lo toma por un registro fallido y **le manda la prueba otra vez**. Nadie pasa sin
filtro, pero esa persona recibe dos invitaciones. **Desplegada la rama, un fallo se corrige
hacia adelante, no volviendo a la versión anterior del backend.** Es también el motivo por el
que la configuración de la oferta no copia este paso al escribir (decisión 19).

### Rescate de los atascados — ✅ HECHO (2026-09-11)

Brief en `brief-rescate-de-atascados.md`. Cambio de comportamiento, en su propio commit. Cuando
el cron reintenta el arranque de un candidato sin identificador del proveedor y ese reintento
falla **de forma permanente**, lo descarta con el motivo de arranque fallido que ya existía.
Cualquier otro fallo sigue como estaba.

🔴 **El brief contaba mal el caso y el ejecutor lo corrigió** (ver decisión 39): esa gente no
la descartaba el plazo, **no la descartaba nada**. Se quedaba dentro para siempre, sin mensaje,
reservando plaza y teléfono de pruebas. Así que esto no adelanta un descarte: **abre una salida
donde no había ninguna**, y libera la plaza en esa misma pasada.

**Decisiones del ejecutor, aceptadas:** descarte directo y no la vuelta a la cola con tres
intentos, que devolvería a reintentar a alguien cuyo fallo ya se sabe permanente. Sin mensaje
al candidato. El contador de errores del ciclo deja de ser una señal permanente para una oferta
rota —sus atascados salen en la primera pasada—; sigue avisando la alerta por correo de cada
candidato nuevo que entre a esa etapa.

**Queda fuera, a propósito:** el candidato cuyo documento no se puede cargar. Su reintento ni
se intenta, y qué hacer con alguien que ya no existe es otra decisión.

✅ **Medido en producción el 2026-09-11: cero.** Hay 18 personas esperando resultado en la
etapa psicométrica, en todas las ofertas menos las canceladas, y **todas tienen identificador
del proveedor**: no hay nadie atascado. El cero se comprobó contando la etapa sin la condición
del identificador —salen las 18—. **El rescate se despliega sin sacar a nadie**; queda como
protección para el futuro.

### Paso 7 — ✅ HECHO (2026-09-11)

Los cuatro motivos de rechazo psicométricos pasan a prefijo neutro. Brief en
`brief-paso-7-motivos-neutros.md`. **Primer paso que toca los dos repositorios.** Solo cambia
el prefijo (corrige los nombres de la decisión 16): `psychometric_external_timeout`,
`psychometric_discarded`, `psychometric_score_<puntaje>` y `psychometric_exam_<nombre>`.

🔴 **Orden de despliegue: el portal antes que el backend, o a la vez.** El portal nuevo
entiende los dos códigos; el viejo no entiende los nuevos, y el reclutador los vería crudos.

**Lo que hace cada lado.** El backend escribe solo los nuevos; los dos valores fijos viejos
quedaron bajo el bloque del enum que ya dice que no se emiten, sin comentario nuevo, y los
constructores y prefijos viejos salieron del tipo que aceptan los descartes, así que el
compilador impide volver a escribir un código retirado. Las métricas traducen viejo a nuevo
antes de contar, desde un solo sitio, para que un mismo rechazo no salga en dos filas. El
portal traduce los dos, y el visor del embudo agrupa viejos y nuevos en sus dos grupos
psicométricos — **único cambio visible, a propósito**: antes mostraba el código crudo.

**Lo que salió de las rondas de revisión y no hay que redescubrir:**

- **El nombre de una prueba adicional podía secuestrar el grupo en el visor.** Las
  comprobaciones heredadas buscan *psicotécnica* o *psicométrica* en el texto, así que quien
  reprobaba una prueba llamada así caía en *no completó*. **Ya pasaba hoy.** Las comprobaciones
  nuevas van delante y lo arreglan para los dos códigos.
- **Una afirmación del brief era falsa**: decía que la única comparación del backend contra
  un motivo concreto era la de oferta cancelada. Hay más —sin teléfono en el cron y dos grupos
  fijos en las métricas para la tasa de respuesta—, y ninguna toca los psicométricos.
- **Cuatro puntos del ejecutor de una ronda se perdieron por el camino** y no llegaron al
  planificador. Se recuperaron en la siguiente, pero es el riesgo de llevar los mensajes a
  mano: si una opinión previa no tiene respuesta punto por punto, preguntar antes de asumir.

**Verificado:** backend 97 suites, 851 pruebas, 9 omitidas; portal con la comprobación de tipos
limpia. **El portal no tiene pruebas**: su parte se verificó leyendo, con la tabla de los ocho
códigos del reporte del ejecutor. Ninguna escritura usa ya un código retirado; los únicos usos
que quedan son las lecturas de la normalización de métricas.

⚠️ **Sigue sin poder comprobarse desde el código:** si algún informe, tablero o exportación
fuera de los dos repositorios filtra por `evaluatest_...`. Dejaría de contar a los rechazados
nuevos sin dar error, y la normalización de las métricas no lo protege porque esos informes
leen la base directamente.

### Mediciones en producción (2026-09-11)

Las dos que faltaban para desplegar, hechas en la base real con consultas de solo lectura:

| Qué | Resultado | Comprobación de que el cero es real |
| --- | --- | --- |
| Ofertas vivas con la prueba encendida y vacante sin nombre (paso 5) | **0** | Sin la condición del nombre salen 18 |
| Personas atascadas sin identificador del proveedor (rescate) | **0** | Sin la condición del identificador salen 18, todas esperando resultado |

**Ninguno de los dos despliegues necesita aviso.** Las consultas siguen en la bitácora y en
el brief del rescate por si hay que repetirlas.

### Estado a 2026-09-11

Rama `feat/integrate-psicoanalisis-provider` en los dos repositorios, con `develop`
mergeado. Backend verde: 98 suites, 855 pruebas, 9 omitidas (verificado tras commitear el
paso 7 y mergear `develop`, que solo trajo cambios del servicio de correo; portal con tipos
limpios; a `develop` solo le lleva un commit de merge **sin cambios de archivos**, así que no
hay nada pendiente de traer). **Las dos preguntas que
bloqueaban murieron el mismo día y las dos a favor** (B8 y la cuenta compartida, ver
decisiones 34 y B8): el recableado del embudo está desbloqueado y el respaldo por entorno
se puede quitar sin migrar a nadie.

### Lo que falta para cerrar la etapa 1

Dos briefs, cada uno con su línea de parada, más tres cambios de comportamiento que van
aparte porque **ninguno es un refactor invisible**. Los números son de brief, no de orden:
no se renumeran cuando uno se cierra.

| # | Brief | Nota |
| --- | --- | --- |
| 7 | ✅ **Los motivos de rechazo con prefijo neutro** — HECHO, commiteado en los dos repositorios: `brief-paso-7-motivos-neutros.md` | Decisiones 13 y 16. **Toca los dos repositorios**: enum del backend, etiquetas y textos del portal |
| 8 | **Las conexiones como lista con nombre** y la configuración neutra de la oferta con doble escritura | Decisiones 1, 5, 7, 19 y **28** —el identificador de vacante se revisa cuando la configuración se vuelve neutra, que es aquí—. **Aquí cae también la decisión 8** —sacar "IGI" de la interfaz y llamarlo "puntaje mínimo"—, porque es la misma pantalla que se toca. **Toca los dos repositorios**. Para lo ya guardado: B6 para leer y la 19 para escribir. ⚠️ **Hay que partirlo.** La configuración de la oferta no la usa solo la pantalla: en el backend la leen o la escriben, como mínimo, el embudo, el servicio de ofertas, la creación con IA, el agente de WhatsApp que crea ofertas, el borrador por WhatsApp y la creación desde administración (búsqueda de texto del 2026-09-11, que no descarta otros). La partición se propone después de leerlos, buscando que lean desde un único sitio que entienda las dos formas |

~~El proveedor falso y el resolvedor.~~ **Descartados de la etapa 1** por la decisión 38.
El resolvedor pasa a la etapa 3.

Aparte, y **cada uno en su propio cambio**: el **rescate de los candidatos atascados** de
la decisión 39 —los que hoy esperan un resultado que nunca van a recibir—, que saca gente
del proceso y por eso no cabe dentro del 6a (✅ **HECHO** el 2026-09-11; brief:
`brief-rescate-de-atascados.md`; reusa el motivo de arranque fallido, que el portal ya
traduce, así que **no toca el frontend**); la decisión 33 (se elimina el correo
inventado y el candidato sin datos se descarta) y las decisiones 34 y 40, que van juntas
(se elimina el respaldo por entorno, y la empresa sin conexión propia se queda sin prueba
psicotécnica, con aviso al reclutador y sin detener a ningún candidato). ⚠️ Ese cambio
tiene que tocar también **el aviso de credenciales incompletas** del adaptador, que hoy
dice que se usará la cuenta global (ver paso 3). Lo de impedir encender la prueba al guardar
una oferta sin conexión ya casi está contestado (ver la 40).
La mitad viva de la 35 **ya está cerrada** en el paso 5. Antes de escribir el brief de la 34
y la 40, leer lo levantado en la 40 el 2026-09-11: dónde vive de verdad el respaldo, dónde va
la comprobación de "sin conexión", por qué la demo no se toca, cómo es el aviso al reclutador
y qué caminos de creación de ofertas quedan por revisar.

**Orden propuesto el 2026-09-11, sin confirmar:** el cambio de la 34 y la 40 va **antes** del
brief 8 —es más pequeño, y al dejar una sola regla de lectura de credenciales el brief 8 tiene
menos lectores que tocar al convertir las conexiones en lista—; el de la 33 va a continuación,
antes del brief 8, porque toca la misma zona del arranque que la 40 y no se mezcla con ella.

Y la **decisión 37**, que no tenía dónde caer y se encontró aplicando la regla de abajo
(2026-09-10): el cliente convierte en **cero** el puntaje que el proveedor no manda, y un
cero reprueba. Su arreglo es del cliente, no de la capa, así que no cabe en ningún brief de
esta etapa.

✅ **Acotada el 2026-09-10, y resulta ser más pequeña de lo que parecía.** No es que el
proveedor falle: es que **al normalizar la fila del tablero convertimos el puntaje en número
con cero por defecto**, así que un campo ausente, vacío o ilegible se vuelve un cero — y un
cero reprueba. Para **EvaluaTest no se ha visto ocurrir**: quien termina, trae nota, así que
es un riesgo latente de frecuencia desconocida y **no se toca ahora**. Para **PsicoAlianza
es seguro**, porque usa `-2.0` como centinela de *sin puntaje todavía*, y ahí el mismo
patrón daría un número negativo, igual de reprobatorio.

**Dónde cae entonces:** en la etapa 3, con el adaptador de PsicoAlianza, que tiene que
traducir su centinela a *sin puntaje* en vez de entregarlo como nota. La pregunta de producto
—qué hacer con alguien terminado y sin nota— **solo hace falta contestarla si aparece**.

Dos decisiones más quedan explícitamente fuera de esta etapa, por la misma regla: la **12**
(el tipo de documento se manda el del candidato, con CC solo por defecto) es de la **etapa
3**, con la invitación de PsicoAlianza; y la **4** (qué conserva el formulario, y que la
sección de exámenes adicionales es exclusiva de EvaluaTest) se parte: la pantalla se toca
en el brief 8, junto a la decisión 8, y esconderle esa sección a otro proveedor es de la
etapa 3, cuando exista otro.

El selector de proveedor en el portal es de la **etapa 3**, no de esta — y con él la
decisión 3, que dice que solo aparece si hay más de una conexión.

✅ **La descripción de cómo funciona hoy la etapa de punta a punta existe desde el
2026-09-11**: `flujo-actual-etapa-psicometrica.md`, leída del código tras el paso 7 y el
rescate. Está en el orden de lectura del arranque y del contexto del proyecto, y **todo brief
que cambie el flujo la actualiza en la misma revisión del diff**. Esta bitácora sigue siendo
la fuente de las decisiones; aquella, del comportamiento. La bitácora se revisó contra el
código ese mismo día y se corrigieron las contradicciones que tenía: decisiones 35, 36, 38 y
39, filas B2 y B6, y la entrada del paso 3.

**Segunda revisión, el mismo 2026-09-11, al recibir el traspaso.** Se volvió a verificar el
estado —backend 98 suites y 855 pruebas, portal con tipos limpios, los dos al día con
`develop`— y se anotó: el choque de las decisiones 5 y 19 con las ofertas viejas, la
aclaración de la 19 (dos piezas) y la fila B6 corregida, la falta de vuelta atrás del paso 6b,
lo levantado en la 40 sobre el respaldo, el modo demo —corregido ese mismo día: no depende de
la cuenta compartida y se queda como está— y el aviso al reclutador, la 28 en la fila del
brief 8, y la 27
corregida (decía tres pasos y enumera cuatro).

**Sin paso todavía, cada uno en su propio cambio** (encontrados aplicando la regla de abajo el
2026-09-11; ninguno bloquea cerrar la etapa 1):

- **El arreglo del cliente de la decisión 36**: que la consulta del tablero distinga *no pude
  preguntar* de *no hay nadie*. Sin él no se puede actuar nunca sobre *no se pudo consultar*
  sin arriesgarse a congelar el plazo.
- **La quinta puerta de la decisión 39**: el botón "Continuar proceso" de un recordatorio se
  traga el fallo permanente, y el candidato gasta la reapertura de la ventana de WhatsApp en
  un botón que no hace nada. Prioridad baja.

⚠️ **Toda decisión tiene que tener un paso donde caiga.** Si al leer la lista de decisiones
encuentras una que no aparece en ninguna fila de arriba ni está marcada como de otra etapa,
es trabajo acordado que se va a perder solo. Anótala aquí en vez de suponer que alguien se
acordará.

### Lo único que sigue esperando al equipo

~~Si la cuenta compartida es parte de lo que se vende.~~ ✅ **CONTESTADO el 2026-09-10: no
se debe usar.** Una empresa sin credenciales propias de un proveedor **no hace pruebas
psicotécnicas**, y punto. Con eso la decisión 34 queda confirmada y la 40 deja de tener
alternativa: el respaldo por entorno se elimina.

Sigue abierto **rotar dos credenciales**, que necesitan acceso a las cuentas y no dependen de
nadie de este frente: la contraseña de **PsicoAlianza** (ver *Riesgos*) y la credencial de
**EvaluaTest** que sigue en el historial de git (decisión 21). Son los únicos riesgos de los
anotados que empeoran con el tiempo.
