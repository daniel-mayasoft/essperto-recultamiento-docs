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

  ⚠️ **Corregido el 2026-09-13: la variable que mandaba era la IP, no el navegador.** El
  mismo Chrome automatizado, sin ventana, **entra a la primera saliendo por una IP móvil
  colombiana** (proxy DataImpulse; ver la medición y la decisión 43). Por IP residencial
  rotativa, 3 de 3 rechazos; por la IP de casa, rechazado el 2026-09-09. La conclusión
  "no volver por esta vía" valía para el endurecimiento del navegador, que en efecto no
  aporta; la vía del navegador sí sirve con la IP correcta.
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
   qué criterio se aprueba. ~~No se extiende el bloque actual de EvaluaTest.~~ **Corregida
   por la 41** (2026-09-12): sí se extiende. La neutralidad la da el ayudante de lectura,
   no el nombre de los campos.
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
19. ~~**Al guardar una oferta se escriben las dos formas de configuración** durante la
    etapa 1, leyendo la nueva primero; cuando esté estable se deja de escribir la
    vieja.~~ **RETIRADA por la 41** (2026-09-12): no hay dos formas. Se conserva el texto
    porque explica el riesgo que la 41 resuelve de otra manera. Sin migración: el guardado ya
    reescribe el bloque completo, así que las
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

    ⚠️ **Esa razón describe cómo usa 2Captcha el otro proyecto, no lo que el servicio
    ofrece** (anotado el 2026-09-13): 2Captcha también entrega tokens de v3 por API. No
    cambia el veredicto de la medición, pero sí la lista de alternativas si se vuelve a
    intentar un solucionador.

    🔴 **Superada en la práctica el 2026-09-13**: SolveCaptcha no entra (ver *Medición del
    captcha*), y el login humano con sesión reutilizada que aquí se descartaba es lo que se
    usa **provisionalmente y solo en local** — decisión 42.

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

    🔴 **Revertida a medias el 2026-09-13 (decisión 43).** La mitad del *sin navegador* cae:
    el login **sí** necesita un navegador real saliendo por IP móvil, porque el solucionador
    no entra, y ese navegador **corre en el backend**, a sabiendas de lo que esta decisión
    decía de Alpine. La mitad del *por HTTP* se queda, y es la que importa: el navegador
    **solo acuña la sesión**, menos de un minuto cada varios días; todo el trabajo contra
    PsicoAlianza sigue siendo HTTP con cookies. Robot-manager fue referencia, no destino.
25. ~~**El captcha vive en su propio módulo, con puerto y adaptador**~~ **DESCARTADA el
    2026-09-13 (decisión 43)**: no hay módulo de captcha, porque no hay solucionador. El
    captcha lo resuelve la propia página de PsicoAlianza dentro de un Chrome real; lo que
    hace falta como infraestructura es el **proxy**, y ese sí sigue exactamente esta forma
    —módulo propio, puerto sin proveedor, un adaptador por servicio, sin selector mientras
    haya uno—. El brief `brief-etapa3-paso1-modulo-captcha.md` se conserva como registro de
    la forma; su precisión de abajo sobre los dos ejes vale igual para el proxy. El texto
    original: **El captcha vive en su propio módulo, con puerto y adaptador**, al nivel de los
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

    ✅ **Precisada el 2026-09-13, al escribir el brief del paso 1 de la etapa 3, con el usuario.**
    El módulo varía en dos ejes que no se tocan entre sí: **el proveedor** —quién resuelve, un
    adaptador por servicio— y **el tipo de captcha** —qué se resuelve—. El tipo **viaja en cada
    petición**, no se fija al construir el adaptador: un mismo servicio resuelve varios tipos, y un
    mismo backend puede necesitar a la vez un v3 para PsicoAlianza y un v2 para un portal de
    empleo. Solo se implementa el v3, y no hay variable para elegir proveedor mientras haya uno.
    **El puntaje mínimo es del sitio, no del módulo**: viaja en la petición, y su valor se
    configura del lado de PsicoAlianza (paso 2). La petición de v3 lleva además la dirección de la
    página, que el servicio exige.

    ⚠️ **`CAPTCHAS.md` contradice al servicio** (documentación oficial de SolveCaptcha, consultada
    el 2026-09-13): el servicio pide preguntar cada 5 segundos tras una espera inicial —la página de
    v3 dice de 10 a 15, la general de 15 a 20; se toman 15—, y allí se pregunta cada 2. Se sigue al
    servicio. `CAPTCHAS.md` describe otro proyecto y no se corrige desde aquí.

    🔴 **Corregido en la opinión previa del paso 1 (2026-09-13): el puntaje.** Esta nota decía que el
    servicio acepta de 0.3 a 0.9; ese rango no es el de v3. La página de v3 da una escala de 0.1 a
    0.9, **0.4 por defecto** si no se manda, y avisa de que **hoy es casi imposible conseguir un
    token por encima de 0.3**. Eso toca a la decisión 23 más que al módulo: "subir desde abajo" casi
    no tiene recorrido. **Si PsicoAlianza rechaza los tokens de 0.3, pagar más no lo arregla y la
    apuesta del solucionador de pago se cae.** La medición del paso 2 decide si la etapa sigue por
    este camino, y va antes que cualquier otra cosa de ese paso.

    ⚠️ ~~Es el primer puerto/adaptador del backend.~~ **Ya no** (2026-09-10): la capa
    psicométrica llegó primero y el precedente está sentado — puerto sin conocer al
    proveedor, adaptador envolviendo el cliente, token resuelto por alias a una sola
    instancia, y datos propios del proveedor en una bolsa opaca. **Seguir ese patrón en
    vez de inventar otro.**
26. **La sesión se cachea de forma agresiva y el login es raro.** Cada autenticación
    cuesta dinero y hasta dos minutos de espera.

    ⚠️ **Los «dos minutos» eran del solucionador de pago y ya no valen** (corregido el 2026-09-14,
    al preguntarlo el usuario). Ese número salía de que SolveCaptcha tardaba 16–17 segundos por
    token y con reintentos se acercaba a dos minutos. Con el camino oficial —Chrome por proxy móvil,
    decisión 43— el captcha lo ejecuta la propia página: arrancar el navegador, cargar el login por
    red móvil, teclear, esperar la nota de Google y enviar son del orden de **quince a treinta
    segundos por intento**. 🔴 **Sin cronometrar**: ese rango sale de sumar las esperas que el script
    de la evidencia se impone, no de una medición, y no incluye los reintentos por captcha
    rechazado. **Quien mida la tasa pendiente debe anotar también los tiempos.** Lo que no cambia es
    el fondo de esta decisión: el login sigue siendo caro y raro, y la sesión se cachea. Con la sesión durando 5 días al marcar
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
    tocar configuración guardada, que va en otro paso. ~~Se revisa cuando la
    configuración de la oferta se vuelva neutra (decisión 7), que es el momento
    natural, no antes.~~ **Revisada el 2026-09-12 con la 41: se queda numérico.** El campo
    de la oferta no cambia, y PsicoAlianza usa números.
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

    **Concretado el 2026-09-12, brief `brief-correo-inventado.md`:** el motivo es
    `psychometric_missing_email`, fijo; *sin correo* cubre nulo y en blanco; el candidato
    **no recibe mensaje** —mismo trato que el fallo permanente de la 39, porque inventar uno
    tocaría la conversación (31)—; y el visor le da **grupo propio**, *Psicométrica — sin
    correo*, porque *no completó* diría que no hizo algo que nunca se le mandó. Medido: nadie
    en vuelo con correo inventado y una persona de cada ~190 afectada, casi todas de la cuenta
    de pruebas.

    **Dónde vive la comprobación, decidido en la opinión previa (2026-09-12): en el adaptador,
    no en el embudo.** Qué datos exige un proveedor lo sabe su adaptador —EvaluaTest el correo;
    PsicoAlianza también el documento—, así que el correo de la invitación del puerto pasa a
    poder faltar y el adaptador lanza un error propio de *falta un dato del candidato* después
    de resolver la credencial y comprobar el nombre de la vacante. Ese orden resuelve solo el
    caso de la empresa sin conexión, que aprueba aunque falte el correo (40), sin método nuevo
    ni lectura extra. Supera la 32-e en lo que decía de que la operación siempre recibe correo:
    eso valía mientras el correo se inventaba en el embudo.

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

    ✅ **Ampliada el 2026-09-14 para PsicoAlianza** (opinión previa del paso 3, decidido por el
    usuario): califican también **el plazo ausente o no entero** y **la persona que no aparece en el
    tablero tras invitarla**. Los dos cumplen lo mismo que el nombre de vacante: reintentar no los
    arregla, y como pasajeros dejaban a la persona atascada. Lo de abajo sigue valiendo para EvaluaTest.

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

    **Los textos, decididos el 2026-09-12.** Dos escenarios, cada uno con versión de
    administrador (enlace a Mi compañía) y de miembro (sin enlace):

    - *Empresa sin proveedor y oferta sin prueba* (informativo; al crear y en Filtros):
      «Tu empresa no tiene un proveedor de pruebas psicométricas conectado. Esta etapa se
      omitirá en esta oferta.» Admin: «Conectar un proveedor en Mi compañía →». Miembro:
      «Pídele a un administrador que lo configure.»
    - *Oferta con la prueba activa y empresa que perdió el proveedor* (advertencia; solo en
      Filtros): «Esta oferta tiene la prueba psicométrica activada, pero tu empresa ya no
      tiene un proveedor conectado. La etapa se está omitiendo.» Admin: «Reconectar el
      proveedor en Mi compañía →». Miembro: «Avisa a un administrador de tu empresa.»

    Se eligió decir el efecto sobre la oferta y no sobre el candidato, y darle al segundo
    escenario aviso propio: con un solo texto, una oferta que lleva semanas dejando pasar
    gente sin filtro se vería igual que una que nunca tuvo prueba. Sin "tenant", "EvaluaTest"
    ni "credenciales": el texto sigue valiendo con otro proveedor. El enlace va a la página
    de Mi compañía entera; aterrizar en la sección es otro cambio y queda fuera.

    **Impedir encender la prueba, revisado camino por camino el 2026-09-12.** Ningún camino
    comprueba hoy que la empresa tenga conexión; no hacía falta, porque la comprobación de la
    vacante al guardar pasaba con la cuenta compartida. Al quitarla, esa comprobación falla
    por credenciales y el reclutador leería «no se pudo verificar la vacante, reintenta» en
    vez de la verdad. Por caminos: el **formulario** ya no llega, porque el portal oculta la
    sección sin credenciales; la **creación con IA y el agente de WhatsApp** eligen la vacante
    de la lista de la empresa, que sin credenciales está vacía; la **creación desde
    administración** copia la configuración tal cual, sin comprobar nada, y es del equipo
    interno. ✅ **Decidido el 2026-09-12: la ruta que guarda la configuración comprueba la
    conexión** antes de mirar la vacante, y rechaza con mensaje claro. Es red de seguridad del
    backend frente al portal: el aviso de este mismo cambio hace que la sección aparezca sin
    conexión (solo con el aviso), y el brief 8 y el arreglo de las contraseñas van a cambiar
    la señal con la que el portal decide mostrarla. Administración se queda fuera y anotada.
    Brief: `brief-cuenta-compartida.md`.

    **Lo que se rompe al quitar la cuenta compartida, levantado del código el 2026-09-12.**
    El cliente la usa en ocho sitios con la misma regla —si le pasaron credenciales las usa,
    si no las del entorno—. Llegan con credenciales vacías: el adaptador (selector, comprobación
    de vacante, pruebas del formulario, invitación y consulta) cuando la empresa no tiene las
    tres cosas, y la lectura laxa del embudo (pruebas adicionales del veredicto y enlace de
    respaldo del arranque) cuando faltan correo o contraseña. La creación con IA, la
    sincronización del índice y la validación de conexión **no** la usan. Además: **las
    máquinas de desarrollo** prueban hoy contra EvaluaTest con la cuenta del entorno local sin
    saberlo, y después del cambio necesitan una empresa con credenciales guardadas — avisar al
    equipo, es un cambio de rutina; tres variables de entorno desaparecen (correo, contraseña,
    identificador) y se quedan el correo de pruebas, el plazo y la base del enlace; y cuatro
    pruebas de la capa afirman hoy que el respaldo existe y pasan a afirmar lo contrario.

    ✅ **El caso del cron es teórico** (medido el 2026-09-12): una persona que ya esperara
    resultado en una empresa sin credenciales quedaría, sin respaldo, en *no se pudo
    consultar* hasta que el plazo la descartara. Hoy no hay nadie así — ver *Mediciones*.

    ⚠️ **Coordinar antes del brief:** Elvis y Henry Peña tocaron la semana del 2026-09-07 justo
    estas pantallas — el guardado de credenciales de EvaluaTest, el detalle de la oferta y el
    formulario de creación.
41. **Lo guardado se extiende, no se duplica: campos nuevos al lado de los de siempre, una
    migración única, y una sola copia de cada dato** (2026-09-12, decidido con el usuario tras
    leer los siete lectores de la configuración de la oferta). Corrige la 7, retira la 19 y
    cierra la 28 y B6.

    **Qué se guarda.** En la empresa, una **lista de conexiones** (decisión 1): cada una con
    identificador, nombre, proveedor y las credenciales que ese proveedor pida. En la oferta,
    **dos campos más en el bloque de siempre**: `connectionId` (decisión 5) y `providerData`,
    una bolsa para lo que otro proveedor necesite. Los campos actuales se quedan con su
    nombre: `jobProfileId` es la vacante, `minIGIScore` el puntaje mínimo, y `jobProfileCode`,
    `evaluationCode` y `selectedTests` quedan vacíos en una oferta de otro proveedor.

    **Por qué así y no un bloque nuevo.** Se pesaron tres formas. *Dos bloques, escribiendo
    los dos mientras se pueda volver atrás* (la 19): seguro, pero deja el mismo dato en dos
    sitios, una limpieza pendiente y un riesgo de que alguien escriba uno sin el otro. *Solo
    el bloque nuevo, leyendo el viejo si falta*: obliga a pasar por el ayudante a los siete
    lectores del backend y al portal, o muestran datos desactualizados; y una oferta creada
    tras el despliegue queda sin bloque viejo, así que al volver atrás el código anterior la
    aprueba sin filtro. *Extender el bloque*: los siete lectores y el portal **no se tocan**
    porque los campos que leen siguen ahí; no hay dos copias; no queda limpieza. El precio es
    cosmético: una oferta de PsicoAlianza vivirá en un bloque llamado `evaluatestConfig` con
    un `minIGIScore` que no es IGI. Solo lo ve quien abra la base a mano; la etapa lo lee
    como *vacante* y *puntaje mínimo* a través del ayudante, y el reclutador ve *Puntaje
    mínimo*.

    **Migración única, hecha por una persona antes de desplegar**, con un script de consola
    como los de las mediciones: a cada empresa con bloque de EvaluaTest se le crea su
    conexión a partir de él; a cada oferta con la prueba activa se le rellena `connectionId`
    con la única conexión de su empresa (decisión 2). Son 3 empresas y 69 ofertas; se
    verifica contando. 🔴 **El backend nuevo da por hecho que las conexiones existen**: si se
    despliega sin correr el script, ninguna empresa tiene conexión y la etapa se salta en
    silencio (decisión 40). El orden es script, backend, portal.

    **El bloque viejo de la empresa deja de ser fuente pero no se borra en este cambio**:
    nadie lo lee, y dejarlo mantiene abierta la vuelta atrás. Se borra en una limpieza aparte
    cuando la etapa esté estable en producción. ⚠️ Sí cambia de fuente **para todos sus
    lectores**: el adaptador, la creación con IA, la sincronización del índice y el servicio
    de empresas pasan a leer la lista por **una sola lectura**, porque una contraseña cambiada
    en la lista no vuelve al bloque viejo.

    **Contrato con el portal, hasta que el portal cambie.** El portal de hoy manda y lee el
    bloque de EvaluaTest por la ruta de Mi compañía. El backend sigue aceptando ese envío
    —lo escribe en la lista— y sigue sirviendo ese bloque **derivado de la lista**, para que
    el portal actual no vea a la empresa "sin credenciales". La lista nueva se sirve **sin
    contraseñas**: nombre, proveedor y si está configurada. Cuando el portal pase a la lista,
    ~~el modal pide la contraseña solo al cambiarla~~ el modal pide **siempre** la contraseña,
    vacía, porque guardar valida contra EvaluaTest y sin contraseña no puede: renombrar la
    conexión exige volver a teclearla, y se acepta (corregido en la opinión previa del 8b,
    2026-09-13). ✅ **Adelantado al 8a en la opinión previa
    (2026-09-13):** el backend conserva la contraseña guardada cuando llega vacía con correo
    —hoy escribe nulo y rompe la conexión en silencio—, y con eso el bloque derivado ya se
    sirve sin contraseña; la fuga de esta credencial queda cerrada en el 8a. De la misma ronda:
    el guardado general de Mi compañía manda siempre el bloque, con nulos si no hay, así que
    correo y contraseña vacíos quitan la conexión de la lista; la creación de empresa pasa por
    la misma escritura; y la ruta de configuración arrastra `connectionId` y `providerData` al
    reasignar el bloque entero.

    **El puerto no cambia en la etapa 1.** Sus operaciones siguen recibiendo la empresa; el
    adaptador resuelve *la conexión de EvaluaTest de esa empresa*, que con la decisión 2 es
    una. Pasar la conexión concreta por el puerto es de la etapa 3, cuando pueda haber dos.
    La oferta ya la guarda desde ahora para que ese día no haya que deducirla (5).

    Se parte en dos briefs: **8a backend** (esquemas, lectura única de conexiones, ayudante de
    la oferta, la ruta que guarda la conexión, el script) y **8b portal** (conexión con
    nombre sin contraseña, señal "hay conexión", *Puntaje mínimo* — decisión 8).
42. **Mientras no haya forma de entrar sola, la sesión de PsicoAlianza se consigue a mano y se
    pega en el `.env` local. Es temporal y solo para desarrollo** (2026-09-13, decidido por el
    usuario tras la medición del captcha). Reabre la mitad de la 23 que descartaba el login
    humano: se descartó cuando había alternativa, y hoy no la hay.

    **Qué se hace.** Quien desarrolla entra a PsicoAlianza en su navegador con *permanecer
    conectado*, copia las cookies de la sesión y las pega en una variable del `.env` del backend
    local (cómo, en `../entorno-local.md`). El cliente de PsicoAlianza las manda tal cual en cada
    petición y **no intenta ningún login**: ni contraseña, ni captcha, ni CSRF de login. Cuando la
    sesión caduque —5 días, ver A13— se vuelve a entrar y a pegar.

    **Por qué así.** Para no parar la etapa: de los seis pasos, solo la obtención de la sesión
    depende del captcha. El cliente, el adaptador, el resolvedor, la conexión y el portal se
    escriben y se prueban en local igual con una sesión pegada que con una conseguida sola. El
    día que exista una forma de obtenerla —respuesta de PsicoAlianza, otro solucionador, o lo que
    se decida— se cambia **solo la pieza que consigue la sesión**. Por eso el cliente se escribe
    desde ya como *dado una sesión viva*, con la fuente de la sesión separada (paso 2).

    **Qué no cambia.** La conexión de la empresa sigue en la base, como cualquier conexión (34,
    40 y 41): es la que dice qué proveedor usa cada empresa y con qué cuenta. En el `.env` va
    **solo la sesión**, leída desde un único sitio y con un nombre que diga lo que es. No es la
    cuenta compartida que se acaba de quitar: no elige proveedor ni sustituye a la conexión, solo
    evita el login.

    🔴 **No se despliega así.** Una sesión pegada a mano muere a los 5 días sin avisar a nadie, y
    con la decisión 36 el plazo sigue corriendo: a los 2 días de sesión muerta el cron descarta
    gente real diciéndole que su resultado no llegó, sin que nadie haya podido preguntar. Está en
    `before-deploy.md` como bloqueo: PsicoAlianza no sale a un servidor hasta que la sesión se
    consiga sola, o exista una alerta a soporte cuando muera y alguien que la renueve.

    **Lo que se mide gratis por el camino:** si la cookie de *permanecer conectado* reautentica
    sola cuando caduca `ats_session`, si esa reautenticación estira su vida, y cuánto dura de
    verdad. Son los datos que la medición del captcha nunca llegó a producir, y los necesita
    cualquier camino que se elija después.

    ~~Las pruebas con proxy que el usuario hace en paralelo quedan fuera de esta decisión y de
    los briefs.~~ **Entraron el mismo día**: el proxy móvil funcionó y es el camino oficial
    (decisión 43). La sesión a mano se queda como **red de emergencia y para local**, no como
    "mientras tanto".
43. **El login de PsicoAlianza lo hace un Chrome sin ventana saliendo por IP móvil, dentro
    del backend, y solo para acuñar la sesión; el proxy es un módulo propio con puerto y
    adaptador** (2026-09-13, decidido con el usuario tras la prueba con proxy móvil). Es el
    **camino oficial**. Revierte a medias la 24, descarta la 25 y confirma la 26.

    **Lo que la prueba demostró (script en `evidencia/login-por-proxy-movil.mjs`; detalle en
    *Medición con proxy*):** el mismo Chrome
    automatizado que el sitio rechazaba desde IP de casa y desde proxy residencial rotativo
    (3 de 3 rechazos) **entra saliendo por una IP móvil colombiana** (DataImpulse, sesión
    pegajosa, con y sin ventana). La propia página ejecuta el captcha; el script solo escribe
    y hace clic. *Permanecer conectado* viene marcado por defecto y emite la cookie de
    recuerdo de 5 días. ⚠️ **Número de intentos por anotar**: el traspaso dice que entró
    siempre, pero no cuántas veces de cuántas; el usuario lo completa aquí.

    **La arquitectura, toda en el backend:**

    | Pieza | Dónde | Qué hace |
    | --- | --- | --- |
    | **Módulo `proxy`** | Nuevo, al nivel de los demás módulos | Un puerto con una operación, *arrendar una IP*: recibe país, tipo de IP y adherencia (pegajosa con un identificador que **genera quien llama**, o rotativa); devuelve protocolo, host, puerto, usuario y contraseña como datos estructurados, más hasta cuándo vale. Un adaptador por proveedor —DataImpulse hoy—, que es solo cómo se codifican país y sesión en las credenciales. Errores propios: *sin configurar* (al arrendar, no al arrancar) y *petición no soportada* (antes de tocar nada). Sin selector de proveedor mientras haya uno: cambiarlo es un adaptador y una línea |
    | **Almacén de sesión** | En la conexión de la empresa, en la base | Las cookies (`ats_session`, `remember_web_<hash>`) cifradas como la contraseña, cuándo se acuñaron, cuándo se vieron vivas, y si hay un login en curso desde cuándo. No en memoria ni en el `.env`: sobrevive reinicios y todas las instancias comparten un login |
    | **Cliente dado una sesión** | Capa psicométrica, PsicoAlianza | HTTP con las cookies del almacén; CSRF fresco antes de cada envío; guarda las cookies reemitidas; si lo mandan al login, lanza *sesión caducada* y no insiste |
    | **Acuñador de sesión** | Capa psicométrica, PsicoAlianza | Pide al puerto de proxy una IP móvil pegajosa con identificador nuevo; lanza Chrome sin ventana por esa IP, sin la marca de automatización; va a `/login`, escribe, hace clic; clasifica el resultado —*entró*, *captcha rechazado*, *credenciales rechazadas*, *bloqueada*, *desconocido*— con captura en los fallos; guarda las cookies. Reintentos: rechazo de captcha → otro arriendo y repetir hasta N; bloqueo o credenciales → parar en seco |

    🔴 **Corregido el 2026-09-14: el acuñador NO bloquea imágenes, CSS ni fuentes.** Esta decisión lo
    pedía para gastar menos proxy, y la medición del otro chat (`proxy-login.md`) desmonta las dos
    mitades de ese razonamiento:

    - **No hace falta.** Un login gasta **~2,8 MB**, o sea unos 360–400 logins por gigabyte. Con la
      cookie de cinco días son seis u ocho logins al mes: **~20 MB, centavos de centavo**. Lo que
      manda el coste es la **frecuencia** de login, no el tamaño de cada uno.
    - **Y puede romper el login.** El único intento con los recursos bloqueados **salió rechazado**.
      ⚠️ Con la tasa sin medir eso no prueba que bloquear rompa —pudo ser el fallo aleatorio de
      siempre—, pero basta para no meterlo en el diseño: se estaría arriesgando el login para
      ahorrar céntimos.

    **Si algún día hay que achicar** —muchas cuentas, o sesiones que mueran seguido—, lo que el otro
    chat propone es más seguro: **no cargar la página de trabajo después de entrar**, porque las
    cookies llegan ya en la respuesta del envío del formulario. Se ahorra sin tocar nada de lo que
    el captcha mira, y es **después** de autenticar.
    | **Fuente manual** | La de la 42 | Red de emergencia y local: pegar cookies a mano |

    **Lo que le pasa a una candidata.** El cron consulta su resultado por HTTP. Si la sesión
    murió, el cliente lanza *sesión caducada*, el acuñador entra en menos de un minuto, guarda
    las cookies y la consulta se repite en la misma pasada. Ella no nota nada. Si el acuñador
    agota sus intentos, esa pasada termina en *no se pudo consultar* —ya tolerado— y se avisa a
    soporte, porque con la 36 el plazo sigue corriendo: **dos días sin sesión son descartes
    reales**, y el aviso tiene que llegar a alguien que sepa pegar una sesión a mano (42).

    **Protecciones, todas obligatorias:** un login a la vez por conexión, con marca de tiempo y
    reseteo si se atasca (precedente: el bug de `scrapingClaimedAt` encoló miles de tareas);
    tope de logins por día por conexión; ante *bloqueada* o *credenciales* nunca reintentar;
    Chrome como proceso hijo con tiempo límite duro y cierre garantizado, nunca en el hilo de
    una petición; ni contraseña, ni credenciales del proxy, ni cookies al registro.

    **Lo que cuesta, y es el único cambio no aditivo de la etapa:** la imagen del backend
    carga Chromium (de 300 a 500 MB más), y durante el minuto del login la instancia puede
    doblar su memoria (pico de 200 a 400 MB sobre los 150 a 300 del backend). En Docker, sin
    GPU y sin la memoria compartida del contenedor, que por defecto es de 64 MB y tumba a
    Chrome. Va en `before-deploy.md`.

    ✅ **El despliegue, leído el 2026-09-14** (`.deploy/test/docker-compose.yml` y el `Dockerfile`
    del backend), que era el dato que faltaba:

    | Qué | Cómo está |
    | --- | --- |
    | Imagen del backend | **`node:20-alpine`**, una sola etapa. Es exactamente el caso que la decisión 24 llamaba «el peor sitio para alojar Chromium»: en Alpine, Chromium es un paquete aparte del sistema y Puppeteer no trae el suyo |
    | Instancias del backend | **Una sola**, sin réplicas |
    | Límite de memoria del backend | **Ninguno declarado** — compite con los otros ocho contenedores del mismo servidor |
    | 🔴 **Navegadores en ese servidor** | **Ya hay dos**: los dos robot-manager corren sin ventana, con **3 GB y 2 GB** de límite, clave de solucionador de captcha y **líneas de proxy ya cableadas** (hoy comentadas) |

    🔴 **Ese último punto cambia el cuadro, y la decisión de meter Chrome en el backend se tomó
    sin verlo.** El acuñador no estrena nada en ese servidor: **la infraestructura de navegador ya
    existe al lado**, dimensionada para ello. Como una sola instancia del backend, el candado de
    «un login a la vez» no tiene que coordinar procesos, pero el precio de Alpine sigue ahí. **Se
    replantea con el usuario antes de escribir el brief del 2c**; lo decidido sigue siendo el
    backend hasta que él diga otra cosa.

    ✅ **Las dos mediciones que bloqueaban el brief del acuñador están hechas** —la cruzada de IP el
    2026-09-13 y la tasa el 2026-09-14—, así que **la medición ya no bloquea el 2c**. Lo que sigue
    faltando para escribirlo es el dato de la imagen del backend, y conviene cerrar antes la
    comparación con ventana (abajo). Las dos, para el registro:

    1. ✅ ~~Que la sesión acuñada por IP móvil sirva desde otra IP.~~ **MEDIDA Y CONFIRMADA**: sirve.
       Era el supuesto que sostenía toda la arquitectura —acuñar por móvil y trabajar por HTTP desde
       el servidor— y el único que, de haber salido mal, habría obligado a que el backend saliera por
       el proxy en **todas** las peticiones, con el gasto disparado.
    2. 🔴 **La tasa sin ventana**, N de N, para escribir la política de reintentos con un número.
       ✅ **Primera medida sistemática, hecha por el planificador el 2026-09-14** (script propio, diez
       intentos seguidos con veinticinco segundos entre ellos, rotando la IP pegajosa en cada uno):

       | Variante | Entraron | Tiempo medio por intento |
       | --- | --- | --- |
       | Proxy móvil, sin ventana, **perfil de Chrome persistente** | **4 de 10** | **18 s** |
       | Proxy móvil, sin ventana, **perfil limpio en cada intento** | **2 de 10** | 34 s |
       | **Sin proxy**, sin ventana, IP residencial | **0 de 3** | 11 s |

       **Todos los fallos fueron rechazo del captcha**: ninguno de red, ninguno de credenciales, y
       **ninguna señal de bloqueo de la cuenta** tras unos treinta intentos en el día.

       🔴 **Lo que queda probado, y refuta una conclusión que circuló el mismo día: sin ventana SÍ se
       entra.** Seis éxitos en veinte intentos sin ventana. La lectura contraria —que el modo
       invisible delata al navegador y nunca pasa— se apoyaba en tres fallos seguidos, y con una tasa
       de este orden eso ocurre **una de cada tres veces** por azar (corregido el 2026-09-14: la primera
       versión decía «más de la mitad», que vale con el 20% de la primera tanda, no con el 30% final). **Antes de montar una
       pantalla virtual en la imagen del servidor hay que medirlo con muestras comparables**, porque
       esa pieza no es gratis.

       ⚠️ **Lo que NO queda probado: que el perfil persistente mejore la tasa.** 4 contra 2 sobre diez
       intentos es demasiado poco para afirmarlo; haría falta del orden de treinta o cuarenta por
       variante. Lo que **sí** está medido es que **abarata el login**: los tiempos caen a la mitad
       porque la página de login llega cacheada. Como además no cuesta nada adoptarlo, **el acuñador
       del paso 2c usa perfil persistente**, por los tiempos, no por la tasa.

       ✅ **La cifra que faltaba para dimensionar los reintentos: alrededor de un 30% por intento.**
       De ahí sale la política del 2c: con ese número hacen falta **unos cinco intentos para entrar
       con un 80% de confianza, y ocho para un 95%**, y como cada intento cuesta de 18 a 34 segundos,
       **conseguir una sesión cuesta del orden de uno a dos minutos**, no los veinte segundos de un
       intento suelto. El tope diario por conexión tiene que contar **intentos**, no sesiones.

       🔴 **Pero el orden de los éxitos dice que ese cálculo no se puede usar tal cual** (anotado el
       2026-09-14, al pedirlo el chat de mediciones). En qué intento entró cada tanda:

       | Tanda | Secuencia | Entró en |
       | --- | --- | --- |
       | Perfil limpio | ✗✗✗✗✗ **✓✓** ✗✗✗ | **6 y 7** |
       | Perfil persistente | ✗ **✓✓** ✗✗ **✓** ✗✗ **✓** ✗ | **2, 3, 6 y 9** |
       | Perfil persistente (la abortada) | ✗ **✓** … | **2** |

       Dos cosas saltan, y ninguna encaja con tiradas independientes:

       - **El primer intento no entró nunca**, en ninguna de las tres tandas.
       - **Los éxitos vienen pegados**: 6 y 7 en una, 2 y 3 en otra.

       ⚠️ **Eso invalida el cálculo de «cinco intentos para el 80%»**, que da por hecho que cada
       intento es independiente del anterior. Si la reputación va por rachas —del perfil, de la IP del
       momento o de la hora—, la probabilidad real de entrar en N intentos no es esa. Con seis éxitos
       en veinte no se puede modelar; **el brief del 2c debe reintentar por tiempo o por número con un
       tope, y no apoyarse en esa cuenta de probabilidad**. Si alguien repite la medición, anotar
       **siempre la secuencia**, no solo el total.

       🔴 **Dos trampas de la medición, para quien la repita.** La primera tanda con perfil **se
       saboteó sola**: en cuanto un intento entró, el perfil se quedó con la sesión y los siguientes
       fallaban con un error extraño, porque PsicoAlianza **echa del login a quien ya está dentro** y
       el botón desaparecía. Hay que **borrar las cookies del sitio entre intentos y conservar las de
       Google**, que son las que dan reputación. Y los intentos que entran parecen más lentos solo
       porque al entrar se carga la página de trabajo: **no cargarla acorta el login además de
       ahorrar datos**.

    **Riesgo aceptado a sabiendas:** es la apuesta de la 23 con más maquinaria —entrar al
    sitio del proveedor por IP móvil para pasar su protección contra robots, con la cuenta de
    gerencia del cliente—. Si PsicoAlianza lo nota, la cuenta expuesta es la del cliente. Sigue
    sin hacerse lo más barato: **preguntarle a PsicoAlianza** si tienen usuario de integración o
    pueden eximir una IP; si contestan que sí, el acuñador y el proxy sobran.

44. **Validar la conexión de PsicoAlianza no hace login. Lo que se le enseña al reclutador es el
    estado de la sesión** (2026-09-14, decidido con el usuario). Es un cambio de comportamiento
    respecto a EvaluaTest y por eso es decisión de producto, no de código.

    **Cómo es hoy con EvaluaTest, leído del código:** al guardar la conexión en Mi compañía, el
    portal hace **primero** un login real; si falla, muestra error y **no guarda nada**; si va bien,
    guarda, y de paso se queda con el identificador de empresa que ese login descubre. Se dispara
    solo al pulsar guardar en ese modal —configurar, cambiar contraseña o **renombrar la conexión**,
    que obliga a reteclear la contraseña (41)—, así que es raro y con EvaluaTest tarda un segundo.

    **Por qué con PsicoAlianza no sirve.** Validar allí es acuñar una sesión: Chrome, proxy móvil y
    captcha. Tres motivos, en orden de peso:

    1. 🔴 **El mensaje acusaría a quien no tiene la culpa.** Si el captcha rechaza, el reclutador lee
       *credenciales inválidas* con su contraseña bien escrita, la vuelve a teclear, vuelve a fallar
       y concluye que la cuenta está rota. Es el fallo silencioso de siempre: el error señala la
       causa equivocada.
    2. **Ataría el paso 3 al acuñador** (2c), que espera la medición de la tasa, y bloquearía justo
       lo que se quería desbloquear al aparcar el proxy.
    3. **La espera**, de quince a treinta segundos con el formulario colgado (ver la corrección de
       tiempos en la 26). Es el motivo más débil de los tres.

    **Qué se hace en su lugar**, y sale de una asimetría medida el 2026-09-14: **comprobar una sesión
    es barato —menos de un segundo— y conseguirla es lo caro.** Así que la pantalla puede comprobarla
    cuantas veces haga falta:

    | Lo que pasa | Lo que ve el reclutador |
    | --- | --- |
    | Hay cookie y responde | **Conectado** |
    | Se está comprobando | Un indicador de carga, un segundo |
    | No hay, o ya no sirve | **Sin conexión**, con el aviso de que la etapa se está omitiendo (decisión 40) y **un botón explícito para conectar** |

    Ese botón es el único sitio donde se acuña, con su espera **pedida a propósito** en vez de un
    formulario bloqueado, y si falla puede decir la verdad —*no se pudo conectar, reintenta*— sin
    acusar a las credenciales.

    🔴 **Sesión y credenciales no son lo mismo, y la etiqueta no puede confundirlas.** Puede haber
    sesión viva con una contraseña que ya no sirve —la pegó alguien a mano, o se guardó hace días— y
    al revés: credenciales perfectas y ninguna sesión porque el captcha no pasó. Por eso la etiqueta
    dice *conectado*, que es lo que se sabe, y no *credenciales válidas*, que no se sabe.

    **Dónde cae cada parte:** en el **paso 3**, una línea — la validación del adaptador **no llama a
    nadie** y da por buena la conexión que tenga correo y contraseña. **Toda la pantalla es del paso
    5**: la etiqueta, los tres estados, el botón y la operación que pregunta por el estado de la
    sesión, que hoy no existe en el puerto.

45. **Lo que PsicoAlianza exige del candidato lo pasa el embudo tal cual, y el adaptador lo traduce
    y lo protege** (2026-09-14, decidido con el usuario sobre mediciones en producción de ese día;
    paso 5a). El embudo pasa a la invitación el documento, el tipo de documento y el plazo **tal como
    están guardados**; quien sabe qué hacer con ellos es el adaptador de cada proveedor. EvaluaTest
    los ignora.

    **El tipo de documento**, según el catálogo de PsicoAlianza (A14): vacío → **CC** (decisión 12);
    CC, TI, PA, CE y PEP → su número; **PT y cualquier texto desconocido → OTRO**, nunca CC, porque
    no se afirma lo que no se sabe. **Medido**: de 8.272 candidatos, 4.747 tienen el tipo vacío y
    3.525 CC, y ningún otro valor. Hoy todo sale como CC; la tabla es para lo que llegue mañana.

    **El documento se limpia al mandarlo** —espacios, puntos, comas y guiones, como en la carga
    masiva— en los dos lados al buscar en el tablero, y **lo guardado no se toca**. **Medido: hoy no
    hay ningún documento con separadores**; el usuario lo dejó **como protección** para el futuro.

    🔴 **Un documento sin ningún dígito cuenta como sin documento**: descarte con motivo propio,
    `psychometric_missing_document`, sin mensaje, con el mismo trato que el correo (33). **Medido**:
    1.389 documentos llevan letras, pero 1.368 son un lote de agosto de 2026 que empieza por «DEM» y
    sin portal de origen; quedan unos once con un nombre de ciudad en el campo, y con PsicoAlianza se
    registraría a esa persona con «Bogotá» como CC en la cuenta del cliente. **Lo que la guarda no
    hace**: corregir un documento mal tecleado — ese riesgo sigue aceptado (B1). De las 33 personas
    que han pasado por la etapa psicométrica, **una** no tiene documento y ninguna lo tiene con letras.

    **El motivo tiene grupo propio en el visor**, *Psicométrica — sin documento*, como el de correo:
    en «sin correo» diría lo que no es, y en «no completó», que no hizo algo que nunca se le mandó.

    **El plazo se calcula antes de invitar**, una sola vez, y el mismo valor va a PsicoAlianza y al
    mensaje de WhatsApp: así no pueden diferir. ✅ **Y arregla de paso un fallo latente** (levantado
    por el ejecutor en la opinión previa del 5a, comprobado en el código): hoy la lectura del plazo va
    **después** de invitar y guardar; si falla, la persona queda invitada y con identificador pero
    **sin mensaje de WhatsApp y sin enlace**, y el cron no la reinvita porque ya tiene identificador.
    Con la lectura antes, el fallo es pasajero como cualquier otro: aviso de respaldo, sin
    identificador, y el cron reintenta.

    ⚠️ **Lo que este paso no cierra, anotado** (mismo origen): el plazo que se manda a PsicoAlianza
    queda fijo al invitar, y el cron lo recalcula en cada pasada con la configuración viva de la
    empresa. Si alguien cambia el plazo con gente a mitad de prueba, los dos relojes se separan. Ya
    pasa hoy entre el mensaje y el descarte; no lo introduce este paso y no tiene paso.

46. **La conexión de PsicoAlianza se guarda por proveedor, convive con la de EvaluaTest, y su estado
    se comprueba de verdad** (2026-09-14, decidido con el usuario; paso 5b).

    **Conviven las dos conexiones.** Guardar PsicoAlianza en una empresa con EvaluaTest **no quita** la
    de EvaluaTest: cada oferta sigue usando la conexión con la que se activó (5 y 41), y cuál usan las
    ofertas nuevas lo decide el selector del paso 6 (3). Quitar una al guardar la otra dejaría a las
    ofertas vivas sin conexión y la etapa se saltaría en silencio (40). Es la respuesta a la mitad de
    B3 que dependía del backend; la otra mitad —qué se le ofrece al reclutador— es del paso 6. La
    decisión 2 («una conexión por empresa, por ahora») queda como regla de pantalla, no de datos.

    **El estado de la sesión se comprueba de verdad**, con la petición barata del cliente (44): leer
    solo la fecha de «visto vivo» diría *conectado* con una sesión ya muerta, que es justo lo que la
    etiqueta no puede hacer.

    **La conexión no se puede guardar desde el portal de hoy**, que no manda el proveedor, y **no se
    añade una ruta de administración para ello**: hasta el paso 6 se inserta a mano en local, como
    hasta ahora. Una pieza menos.

    **Y al reconstruir una conexión se conserva lo que ya tenía** —la sesión, y cualquier campo de la
    bolsa que el bloque no traiga— y se pisan solo los campos que llegan. Es lo que cierra la trampa
    5b del paso 2.

    ⚠️ **Laguna aceptada al revisar el diff (2026-09-14):** la guarda del plazo salta solo cuando la
    petición trae un plazo con decimales. Añadir PsicoAlianza a una empresa que **ya tenía** 1,5 días
    guardados pasa. Hoy ninguna empresa tiene plazo propio, y si ocurriera lo frena el adaptador con
    el error permanente y su alerta a soporte, así que no es silencioso. Sin paso.

47. **En la base vive solo la cookie de *permanecer conectado*; la corta vive en memoria** (2026-09-14,
    decidido con el usuario sobre la medición de ese día; paso 2d, el cambio propio de la cookie).
    Cierra el hallazgo 2 del bloque A: PsicoAlianza reemite la cookie corta con otro texto en cada
    respuesta, y guardarla en cada cambio sería una escritura cifrada en el documento de la empresa
    por petición —del orden de mil al día por empresa con el cron y las invitaciones—.

    **Medido**: la cookie de 5 días **basta sola** para un endpoint de datos —responde 200 con las
    vacantes y emite una corta nueva—, y la corta vieja sigue sirviendo tras recibir la nueva. Por eso
    la corta no hace falta persistirla: al reiniciar, la primera petición va solo con la de 5 días y
    PsicoAlianza reautentica.

    **Regla**: el almacén escribe en la base **solo cuando cambia la cookie de 5 días** —al acuñar
    (2c), o si PsicoAlianza la reemitiera, que no se ha visto—; la corta reemitida va a **memoria del
    proceso, por empresa**. «Visto vivo» se escribe donde hoy: en la comprobación explícita y junto a
    esa escritura rara de la cookie de 5 días. La sesión pegada del `.env` no cambia, y sigue siendo
    una sola copia global. **La huella de la copia es la tira cifrada tal como está en la base**, sin
    cifrar ni descifrar para comparar: el cifrado lleva sal e IV aleatorios y re-cifrar daría siempre
    otra tira (opinión previa del 2d). Una sesión guardada solo con la corta, sin la de 5 días, no
    sobrevive a un reinicio: coherente, y el `.env` local pide las dos.

    🔴 **La copia en memoria recuerda de qué valor guardado nació**: si al leer la base el valor es
    otro —el acuñador guardó una sesión nueva, o se quitó la conexión—, la copia se descarta. Sin eso,
    una sesión recién acuñada perdería contra una corta vieja en memoria.

    **Lo que no cambia**: el cliente sigue diciendo «guarda estas cookies» y el almacén decide qué va a
    dónde; el esquema es el mismo; hay una sola instancia del backend (leído del despliegue), y con
    varias cada una tendría su corta y todas la misma de 5 días.

## Falta de PsicoAlianza

| #   | Qué                                               | Por qué importa                                                                  |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| A1  | ~~Escala del puntaje y cómo se ve un reprobado~~ **RESUELTO** (2026-09-14) | Escala ~0–100, más alto mejor; `-2.0` es centinela de "sin puntaje" y **se sustituye por la nota real al terminar**. ✅ **Reprobado visto**, presentando una prueba a propósito lejos del perfil: `recomendacion` **`1`** = «No recomendado», con ajuste `43.25`, frente al `3` = «Recomendado» de las notas altas. Ver *Tanda de comprobaciones*, bloque D. **Sigue sin verse el `2`**, y el umbral exacto con el que PsicoAlianza corta tampoco se conoce — no hace falta: el veredicto lo damos nosotros con el puntaje mínimo de la oferta |
| A2  | ~~Login: qué pide, qué devuelve, duración del token~~ **RESUELTO** | Formulario Laravel, sesión por cookie (5 días con *permanecer conectado*), reCAPTCHA v3 validado en servidor. Ver *Confirmado*, *Riesgos* y B7 |
| A3  | ~~¿El listado paginará algún día?~~ **RESUELTO** | Ya pagina (`length` por defecto 10). Un `length` alto trae todas; si no, hay que recorrer páginas o se pierden vacantes sin error |
| A4  | ~~Campos de cada vacante del listado~~ **RESUELTO** | `id`, `nombre`, estado, empresa, contadores y `pruebas[]` embebidas. Ver *Confirmado*. Falta decidir B5 (si la IA sugiere) |
| A5  | ~~Invitación: URL, cuerpo, respuesta~~ **RESUELTO** | `POST /procesos-participantes/{proceso}`, en lote. Éxito da 201 con `{message, agregados}` y **no** devuelve el `id`: hay que buscar al candidato después por documento en el tablero. Contrato en el API doc |
| A6  | ~~¿El enlace es común o personal?~~ **RESUELTO** | Personal por candidato (`control-acceso/{uuid}`). No vuelve en la invitación, pero **sí por la API**: `POST /regenerar-acceso-usuario/{id}` (método POST, ver el API doc). Se puede reenviar por WhatsApp. Destraba B2 |
| A7  | ~~Resultados: ¿por candidato o por vacante?~~ **RESUELTO** | Por vacante: `GET /participantes-proceso/{id}` trae todos sus participantes con puntaje y estado. Confirma el lote de la decisión 22. Contrato en el API doc |
| A8  | ~~¿Hay estado "en progreso"?~~ **RESUELTO** | Sí, por prueba (`agendas[].estado`): 1 Agendada, 3 Finalizada, 4 Expirada. El veredicto vive en `agendas[].recomendacion`, no en la etapa del candidato. Ver API doc |
| A9  | ¿Avisan por webhook?                              | Si avisan, este proveedor no necesita cron                                       |
| A10 | Credenciales que pide la conexión                 | Define el formulario de ajustes                                                  |
| A11 | ~~¿Cómo se sabe si una vacante sigue sirviendo?~~ **RESUELTO a medias** (2026-09-14) | Por el estado del proceso, y son **tres** los vistos, no dos: `2` Activo, `3` Completado y **`5` Suspendido** (este no estaba en el contrato). Usable es **solo el 2**; el 3 y el 5 no. 🔴 **Cualquier otro valor tiene que quedar como indeterminado**, no como usable: aparecerán más. Medido: de 113 vacantes, 18 activas, 89 completadas y 6 suspendidas |
| A12 | ¿Ambiente de pruebas o desvío de correos?         | Sin eso, cada ensayo invita a una persona real                                   |
| A13 | ~~Qué cookies emite el login con *permanecer conectado* marcado~~ **RESUELTO** | Emite `remember_web_<hash>` y estira la sesión a 5 días. Con esa cookie Laravel reautentica solo, sin login ni captcha, si se toca el portal cada 5 días. Ver *Confirmado* y decisión 26 |
| A14 | ~~Catálogo de tipos de documento~~ **RESUELTO** (2026-09-14) | Leído del atributo `value` de cada opción del desplegable del formulario de invitar, **no del orden de la lista**, que no coincide: CC `1`, TI `2`, PA `3`, CE `4`, OTRO `5`, PEP `6`. Detalle en el contrato. El paso 3 sigue mandando siempre CC; traducir nuestro tipo —texto libre— a este número es del **paso 5** (decisión 12) |

## Falta decidir

| #   | Qué                                                  | Ejemplo                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | ~~Qué se hace con el documento que teclea el candidato~~ **DECIDIDO: se corre con el riesgo** | No se le pregunta nada (decisión 31), así que el documento llega como lo tecleó el candidato al postularse en el portal. **Se usa en la etapa 5 para invitar y solo se puede comprobar en la 7**, contra la foto de la cédula — que tolera **un** error en 10 dígitos, así que cambiar dos de orden ya rebota. Si está mal, el candidato queda pidiendo reenviar el frente sin entender por qué. **Se acepta a sabiendas y no se añade nada para manejarlo.** Ojo: en PsicoAlianza queda registrado con el documento errado, y corregirlo aquí no lo corrige allá |
| B2  | ~~Candidato sin correo~~ **RESUELTO, y corregido por la decisión 33** | Lo que sigue en pie: el enlace personal se obtiene por la API (`POST /regenerar-acceso-usuario/{id}`, funciona registrado o no), **lleva a presentar las pruebas** y se manda por WhatsApp, así que **el enlace no depende del correo**. ~~Al candidato sin correo se le inventa uno único y no reutilizable~~ — **retirado por la decisión 33** (2026-09-11): no se inventa ningún correo; quien no trae correo no puede ser invitado y **se descarta** |
| B3  | Cambio de proveedor con ofertas vivas                | Hay gente a mitad de prueba cuando la empresa se cambia. Incluye las ofertas guardadas en la forma vieja, que no llevan su conexión: ver la nota de la decisión 5 |
| B4  | De dónde se corta el indicativo del teléfono         | Se guarda con +57                                                                                                                                                                                                                        |
| B5  | ¿La IA sigue sugiriendo vacante?                     | Depende de A4                                                                                                                                                                                                                            |
| B6  | ~~Qué se hace con lo ya guardado~~ **RESUELTO** (2026-09-12) | Configuración de la oferta y conexión de la empresa: **se extiende lo guardado y se migra una vez**, ver la 41. Lo anterior sigue valiendo para los otros dos: **sin migración en los dos.** Campos del candidato (paso 6b): al leer, el nuevo y si está vacío el viejo; al escribir, siempre el nuevo — la compatibilidad caduca sola. Motivos de rechazo (paso 7): el portal y las métricas entienden viejo y nuevo **para siempre**, porque un rechazado no caduca. **Falta solo la configuración de la oferta**, que es del brief 8. **Esos dos pasos son el precedente para leer, no para escribir**: la oferta escribe las dos formas mientras se pueda volver atrás (decisión 19 y su aclaración del 2026-09-11) |
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

**Una más, el 2026-09-12, para el cambio de las decisiones 34 y 40:**

| Qué | Resultado | Comprobación de que el cero es real |
| --- | --- | --- |
| Personas esperando resultado en ofertas de empresas sin credenciales de EvaluaTest | **0** | Sin el filtro de credenciales salen las 18, todas de Medicall Talento Humano, que las tiene. El cruce con las empresas funciona igual con el identificador tal cual y convertido |

La consulta: las ofertas no canceladas, desenrollar candidatos, filtrar etapa psicométrica
en espera externa, cruzar con `tenants` por `tenantId`, y quedarse con las empresas cuyas
credenciales de EvaluaTest tengan vacío el correo, la contraseña cifrada o el identificador
de empresa; agrupar por nombre de empresa.

**Dos más, el 2026-09-12, para el cambio de la decisión 33** (el correo inventado). El correo
del candidato nace en nulo y no se recorta, así que se contaron aparte el nulo y la cadena
vacía: hoy el correo inventado solo cubre el nulo, y una cadena vacía iría tal cual al
proveedor.

| Qué | Resultado | Comprobación |
| --- | --- | --- |
| Personas esperando resultado ahora **sin correo** (las que tendrían un correo inventado en vuelo) | **0** de 52 | Las 52 salen igual sin cruzar con la colección de candidatos: el cruce no duplica. Eran 18 el día anterior; entraron 34 en un día |
| Personas que han pasado por la etapa **sin correo**, en toda la base | **10 de 1.860** (0,5%) | 1 de Medicall Talento Humano (1.576 con correo) y 9 de Mayasoft Servicios Temporales (274 con correo). Ninguna con cadena vacía |

**Lectura:** no hay nadie a mitad de prueba con correo inventado, así que el brief de la 33 no
tiene que dejar a nadie fuera; y la decisión saca del proceso a una persona de cada ~190,
casi todas de Mayasoft Servicios Temporales, que **es una cuenta propia de pruebas**
(confirmado el 2026-09-12). El número real para clientes es **una persona en toda la
historia**: el cambio se despliega sin aviso.

Las consultas: la primera es la de arriba con el cruce a `candidates` por
`candidates.candidate` y un `$switch` sobre `person.email` (nulo / vacío / con correo); la
segunda igual pero filtrando a quien tiene `psychological_exam` en `stage.name` o en
`stageHistory.name`, cruzando además con `tenants`, y agrupando por empresa y caso de correo.

### Cuenta compartida — ✅ HECHO (2026-09-12)

Las decisiones 34 y 40, en su propio cambio y en los dos repositorios. Brief en
`brief-cuenta-compartida.md`. El cliente de EvaluaTest ya no tiene cuenta del entorno: las
tres variables se fueron del cliente y del esquema, y las credenciales son obligatorias en
todas sus firmas. El adaptador lanza un error propio de *sin conexión* cuando a la empresa le
falta cualquiera de las tres cosas o no llega empresa, y absorbió las dos llamadas que el
embudo hacía al cliente con su lectura laxa: las pruebas adicionales del veredicto y el enlace
de respaldo del arranque, que conserva el atajo del código guardado. **El embudo ya no lee
credenciales ni toca el cliente en la etapa.** Ante *sin conexión* el arranque aprueba la etapa
y sigue —también en el reintento del cron a quien no tiene identificador—, y la ruta de
configuración rechaza activar la prueba con mensaje propio. El portal muestra los dos avisos
decididos con enlace a Mi compañía según permiso, espera a que cargue la empresa antes de
decidir escenario y ya no pide las pruebas de la vacante sin saber que hay conexión.

**Lo que salió de la opinión previa y valió la ronda:** la prueba del ciclo mixto se ponía en
rojo a propósito —le daba a la empresa real credenciales en nulo y afirmaba la cuenta
compartida— y quedó como excepción declarada a "si se pone en rojo, el cambio está mal"; el
portal pedía las pruebas de la vacante antes de cargar la empresa, y dejaba un error en el
registro del backend por cada apertura de una oferta en el escenario 2; y son cuatro los
lectores de credenciales, no dos: la creación con IA y la sincronización del índice tienen su
propia copia de la regla estricta, no usan la cuenta compartida y **quedaron fuera**, para el
brief 8.

**Verificado:** backend 98 suites y 866 pruebas (857 pasan, 9 omitidas; once nuevas) antes del
merge de `develop` que entró encima —trajo la validación de ciudad y departamento, sin tocar la
zona psicométrica— y 99 suites y 882 pruebas después; portal con tipos limpios.

⚠️ **Para el despliegue:** retirar las tres variables de los entornos desplegados y de los
archivos locales —parte de la rotación de la decisión 21—, avisar al equipo de que probar en
local exige una empresa con credenciales guardadas, y portal antes que el backend o a la vez.

### Correo inventado — ✅ HECHO (2026-09-12)

La decisión 33, en su propio cambio y en los dos repositorios. Brief en
`brief-correo-inventado.md`. El correo de la invitación del puerto pasa a poder faltar, y el
adaptador de EvaluaTest —que es quien sabe qué datos exige su proveedor— lanza un error propio
de *falta un dato del candidato* cuando no hay correo, nulo o en blanco, después de resolver la
credencial y comprobar el nombre de la vacante y antes de tocar al proveedor. El arranque deja
de inventar un correo y, ante ese error, descarta con `psychometric_missing_email`, sin
mensaje, por el mismo bloque que atiende a la empresa sin conexión: las cinco puertas lo tratan
igual y el demo no pasa por ahí. El portal lo traduce y le da grupo propio en el visor,
*Psicométrica — sin correo*.

**Lo que salió de la opinión previa y valió la ronda:** el brief se contradecía en el orden
—pedía descartar antes de invitar y a la vez que la empresa sin conexión aprobara aunque
faltara el correo, y *sin conexión* solo se sabe al invitar—; se resolvió moviendo la
comprobación al adaptador, donde va la regla de qué exige cada proveedor, en vez de una lectura
extra en el embudo. La red de seguridad del camino real pasaba gracias al correo inventado, y
se conservó dándole correo al candidato del montaje por parámetro. El caso del brief contaba al
revés qué recibe el candidato antes de la etapa: quien contesta preguntas no recibe nada tras
la última. Y el visor gana grupo propio porque *no completó* le diría al reclutador que la
persona no hizo algo que nunca se le mandó.

**Verificado:** backend 99 suites y 889 pruebas (880 pasan, 9 omitidas; siete nuevas); portal
con tipos limpios. Medido antes: nadie en vuelo con correo inventado y una persona de cada
~190 afectada, casi todas de la cuenta de pruebas. Se despliega sin aviso; portal antes que
backend o a la vez.

Queda un comentario de una línea en el enum, junto al valor nuevo, como llevan todos los
valores de ese enum. Se aceptó por coherencia con el archivo.

### Paso 8a — ✅ HECHO (2026-09-13)

La conexión de la empresa y la conexión de la oferta, solo backend. Brief en
`brief-paso-8a-conexiones-backend.md`. La empresa gana la lista `psychometricConnections`
(identificador, nombre, proveedor y una bolsa de credenciales con la contraseña cifrada); la
oferta gana `connectionId` y `providerData` en el bloque de siempre. **Una lectura única de
conexiones**, en la capa psicométrica, resuelve la de un proveedor con la contraseña
descifrada y el correo de pruebas de la empresa, o falla como *sin conexión*; por ella pasan
el adaptador —que dejó de inyectar el modelo de empresa—, la creación con IA, la sincronización
del índice y el servicio de empresas. **El bloque viejo `evaluatestCredentials` queda en el
esquema sin lectores ni escritores** (comprobado buscando en todo el código). El servicio de
empresas traduce a la lista lo que el portal de hoy sigue mandando, con la regla de tres
casos —vacío del todo quita la conexión; contraseña vacía con correo **conserva la guardada**;
lo demás crea o actualiza—, la creación de empresa pasa por la misma función, y lo servido es
el bloque derivado **sin contraseña** más la lista sin credenciales: **la fuga de esta
credencial quedó cerrada aquí**. La ruta de configuración resuelve la conexión antes de
comprobar la vacante, la guarda y la arrastra en cada guardado; un ayudante entrega al embudo
la configuración en forma neutra y sus seis lecturas pasan por él. Nada visible.

**Lo que salió de la opinión previa y valió la ronda:** la ruta reasignaba el bloque entero y
habría borrado los campos nuevos en cada guardado; el guardado general de Mi compañía manda el
bloque siempre, con nulos, y la creación de empresa lo copiaba tal cual; la respuesta al portal
copia el documento entero y habría servido la lista cruda; y el adaptador podía soltar el
modelo de empresa.

**Verificado:** backend 102 suites y 912 pruebas (903 pasan, 9 omitidas; 23 nuevas), en dos
corridas — en la primera una suite no pudo arrancar y en la segunda pasó entera, ruido del
entorno de pruebas. Portal sin tocar. Queda un comentario viejo del servicio de empresas que
dice que descifra las credenciales de EvaluaTest y ya no lo hace: se ajusta en el commit.

🔴 **Antes de desplegar este backend hay que correr la migración de conexiones**, paso a paso
en `before-deploy.md`. Sin ella, ninguna empresa tiene conexión y la etapa se salta en silencio.

### Paso 8b — ✅ HECHO (2026-09-13)

La conexión con nombre en el portal, y "Puntaje mínimo". Brief en
`brief-paso-8b-conexiones-portal.md`. **Único paso visible de la etapa.** En el backend, la
conexión acepta un nombre —vacío o en blanco conserva el guardado— e IGI sale de siete textos:
tres que el agente de WhatsApp le muestra al reclutador, la plantilla del estado de la prueba en
el borrador por WhatsApp y tres instrucciones al modelo; el campo `minIGIScore` y el parámetro
de la herramienta no cambian. En el portal, la contraseña salió del tipo de la empresa; la señal
de proveedor pasó a ser *la conexión de EvaluaTest está configurada*, en sus cuatro sitios del
detalle y la creación; Mi compañía muestra nombre, proveedor y correo, y su modal pide nombre,
correo y contraseña —esta siempre vacía y obligatoria, validando antes de guardar— con los
textos en claves de idioma; ningún otro guardado de la página manda ya la conexión; y "Puntaje
mínimo" reemplaza a IGI.

**Lo que salió de la opinión previa y valió la ronda:** la contraseña del modal contradecía a la
41 (se corrigió la 41); IGI estaba en más textos de los que decía el brief, y la plantilla del
borrador se escapaba a una búsqueda que descartaba las líneas con el nombre del campo —es la
trampa 3 del brief—; la señal tenía que ser la conexión *de EvaluaTest* y no "alguna", y en
cuatro sitios, no dos; la sección de Mi compañía necesitaba dos fuentes (nombre de la lista,
correo del bloque derivado); el nombre en blanco rompía el guardado; y "a la vez" no existe en
un despliegue: el orden quedó en `before-deploy.md`.

**Verificado:** backend 102 suites y 916 pruebas (907 pasan, 9 omitidas; cuatro nuevas); portal
con tipos limpios.

**Dos textos corregidos después, en un cambio pequeño del portal (2026-09-13):** el botón de la
sección decía «Editar credenciales» —con una clave compartida con los modales de portales de
empleo y antecedentes, que no se tocan— y pasó a clave propia, «Editar conexión»; y la
descripción de la prueba al crear y en el detalle decía que la evaluación llega «por correo»,
cuando el enlace llega por WhatsApp y el correo de EvaluaTest es solo respaldo.

### Estado a 2026-09-13 — ✅ ETAPA 1 CERRADA

Rama `feat/integrate-psicoanalisis-provider` en los dos repositorios, **al día con `develop`**
(cero commits por detrás a la última consulta del remoto, 2026-09-13). Backend verde: 102
suites, 916 pruebas, 9 omitidas; portal con tipos limpios. Commiteados todos los pasos de la
etapa 1 (1 a 8b), el rescate, la cuenta compartida y el correo inventado, y también los dos
textos del portal (corregido el 2026-09-13: esta línea los daba por pendientes de commit, y el
último commit del portal los trae). **La rama no está desplegada**: se despliega entera, y lo que hay
que hacer antes está en `before-deploy.md`.

### Lo que hereda la etapa 3

Todo lo decidido que cae ahí, para que no se pierda (regla de la hoja de ruta). Nada de esto
está empezado.

**El bloqueo:** el login de PsicoAlianza está detrás de reCAPTCHA v3 (*Riesgos*). ~~Decidido
resolverlo con SolveCaptcha (23), por HTTP y sin navegador (24), en su propio módulo con puerto
y adaptador (25), cacheando la sesión de forma agresiva (26). Falta medir con qué puntaje
mínimo pasa el sitio, subiendo desde abajo.~~ **Resuelto el 2026-09-13 en dos vueltas** (ver
*Dónde va la etapa 3*): el solucionador no entra (1 de 85) y se descarta; entra un Chrome sin
ventana por IP móvil, y ese es el camino oficial (43), con la sesión a mano como red (42). La
26 se queda: la sesión se cachea en la conexión de la empresa y el login es raro.

**El adaptador de PsicoAlianza:** invitación en cuatro pasos (27); tipo de documento del
candidato con CC por defecto (12); traducir el centinela `-2.0` a *sin puntaje* (37); y lo que
el contrato todavía no sabe: umbral de aprobación y cómo se ve un reprobado (A1), si avisan por
webhook (A9), qué credenciales pide la conexión (A10), cómo saber si una vacante sirve (A11), y
si hay ambiente de pruebas (A12).

**La capa, cuando haya dos proveedores:** el resolvedor que elige adaptador por conexión (38);
pasar la conexión concreta por el puerto en vez de la empresa (41); que el cron pregunte al
proveedor de la invitación, que el candidato ya guarda (6); la comprobación de vacante por
proveedor (10); y qué ve una empresa demo en el selector cuando exista el resolvedor (sección
*Abierto, para cuando exista el resolvedor*).

**El portal y los lectores que la 41 dejó en EvaluaTest:** el selector de proveedor, que solo
aparece con más de una conexión (3); esconder las pruebas adicionales a otro proveedor (4);
generalizar la señal del portal, que hoy es *la conexión de EvaluaTest configurada*; y el
precio de la 41 — el agente de WhatsApp, el borrador, la creación con IA y la lista de ofertas
leen los campos de EvaluaTest del bloque de la oferta, y una oferta de otro proveedor los
tendrá vacíos.

**Preguntas de negocio abiertas:** cambio de proveedor con ofertas vivas, incluidas las que
nunca guardaron conexión (B3 y la nota de la 5); de dónde se corta el indicativo del teléfono
(B4); si la IA sigue sugiriendo vacante (B5).

**Sin paso, y fuera de cualquier etapa:** el arreglo del cliente para distinguir *no pude
preguntar* de *no hay nadie* (36); el botón «Continuar proceso» que se traga el fallo permanente
(39); la limpieza del bloque viejo `evaluatestCredentials` cuando la etapa lleve tiempo estable
en producción (41); las contraseñas de portales de empleo y antecedentes que el backend sigue
sirviendo descifradas (deuda conocida del contexto del proyecto); y el comentario del barrido de
flujos atascados que nombra un campo viejo del candidato (registro del 6b).

🔴 **El orden de despliegue vigente es el de `before-deploy.md`: migración, backend, y portal
inmediatamente después.** Las entradas del paso 7, la cuenta compartida y el correo inventado
dicen «portal antes que backend, o a la vez»; eran ciertas para cada cambio suelto y quedan como
registro, pero la rama se despliega entera y ese orden ya no vale.

### Lo que falta para cerrar la etapa 1

🔴 **Todo lo que hay que hacer antes de desplegar la rama está en `before-deploy.md`**
(creado el 2026-09-13): la migración de conexiones paso a paso, las variables que retirar, el
orden de despliegue (migración, backend y portal; corregido el 2026-09-13, decía
"portal-backend"), el aviso al equipo y la rotación de credenciales. La rama se despliega
entera al final, y ese archivo es la lista que se recorre ese día. Lo que quede anotado solo
aquí no se va a hacer.

Dos briefs, cada uno con su línea de parada, más tres cambios de comportamiento que van
aparte porque **ninguno es un refactor invisible**. Los números son de brief, no de orden:
no se renumeran cuando uno se cierra.

| # | Brief | Nota |
| --- | --- | --- |
| 7 | ✅ **Los motivos de rechazo con prefijo neutro** — HECHO, commiteado en los dos repositorios: `brief-paso-7-motivos-neutros.md` | Decisiones 13 y 16. **Toca los dos repositorios**: enum del backend, etiquetas y textos del portal |
| 8a | ✅ **Backend: la conexión de la empresa y la conexión de la oferta** — HECHO el 2026-09-13, `brief-paso-8a-conexiones-backend.md` | Decisiones 1, 2, 5, 7, 28 y **41**. Lista de conexiones en la empresa, `connectionId` y `providerData` en la oferta, lectura única de conexiones para sus cuatro lectores, ayudante de lectura de la oferta para la etapa, y el script de migración con su comprobación. Nada visible |
| 8b | ✅ **Portal: conexión con nombre y puntaje mínimo** — HECHO el 2026-09-13, `brief-paso-8b-conexiones-portal.md` | Decisiones 8 y 41. Modal de conexión con nombre y sin contraseña de vuelta, señal "hay conexión", "IGI" → "Puntaje mínimo". **Visible a propósito** |

~~El proveedor falso y el resolvedor.~~ **Descartados de la etapa 1** por la decisión 38.
El resolvedor pasa a la etapa 3.

Aparte, y **cada uno en su propio cambio**: el **rescate de los candidatos atascados** de
la decisión 39 —los que hoy esperan un resultado que nunca van a recibir—, que saca gente
del proceso y por eso no cabe dentro del 6a (✅ **HECHO** el 2026-09-11; brief:
`brief-rescate-de-atascados.md`; reusa el motivo de arranque fallido, que el portal ya
traduce, así que **no toca el frontend**); la decisión 33 (se elimina el correo
inventado y el candidato sin datos se descarta — ✅ **HECHO el 2026-09-12**, commiteado en
los dos repositorios; brief: `brief-correo-inventado.md`) y las decisiones 34 y 40, que van juntas
(se elimina el respaldo por entorno, y la empresa sin conexión propia se queda sin prueba
psicotécnica, con aviso al reclutador y sin detener a ningún candidato) — ✅ **HECHO el
2026-09-12**, commiteado en los dos repositorios; brief: `brief-cuenta-compartida.md`; el aviso
de credenciales incompletas se fue con el respaldo, y la ruta de configuración rechaza activar
la prueba sin conexión.
La mitad viva de la 35 **ya está cerrada** en el paso 5.

**Orden propuesto el 2026-09-11:** el cambio de la 34 y la 40 fue **antes** del
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

## Dónde va la etapa 3

> Registro de avance de la etapa 3, abierto el 2026-09-13. Lo que hereda de la etapa 1 está en
> *Lo que hereda la etapa 3*, más arriba; aquí va cómo se parte, lo que apareció al contrastar esa
> lista con el código y con el contrato, y cada paso según se cierre.

**Se prueba en local antes que en el servidor de pruebas.** Cómo levantar el entorno:
`../entorno-local.md`. La etapa 1 sigue sin desplegar.

### Cómo se parte

Los números son de brief, no de orden, y no se renumeran. Del 2 al 3 son aditivos —nada los llama—
y llevan brief corto y una ronda; del 4 en adelante tocan el embudo o se ven, y llevan el
tratamiento completo. **Con el 5 cerrado se puede probar en local de punta a punta**; el 6 va
después, porque en local la conexión y la configuración de la oferta se pueden escribir a mano.
**Repartido el 2026-09-13 (decisión 43):** el 2 y el 2b son independientes y pueden ir en paralelo;
el 2c necesita a los dos y, además, las dos mediciones pendientes de la 43 y saber cómo se
construye la imagen. El 2 y el 2b se escriben ya.

| # | Paso | Riesgo |
| --- | --- | --- |
| 1 | ~~El módulo de captcha~~ **Descartado** (decisiones 25 y 43): no hay solucionador. El brief `brief-etapa3-paso1-modulo-captcha.md` queda como registro de la forma que el 2b copia | — |
| 2 | ✅ **HECHO el 2026-09-13.** El cliente de PsicoAlianza **dado una sesión viva**: el almacén de sesión en la conexión de la empresa, la fuente manual del `.env` (decisión 42), el CSRF de las peticiones, las peticiones del contrato, *sesión caducada* como error propio y el registro sin cookies ni contraseñas; la lectura única de conexiones reconoce la de PsicoAlianza — brief `brief-etapa3-paso2-cliente-psicoalianza.md` | Aditivo |
| 2b | El módulo `proxy`: puerto de *arrendar una IP*, adaptador de DataImpulse, errores propios, sin selector (decisión 43). Nada lo llama hasta el 2c | Aditivo |
| 2c | El acuñador de sesión: Chrome sin ventana por el puerto de proxy, clasificador, reintentos, candado y tope, aviso a soporte; Chromium en la imagen del backend (decisión 43). **Espera las dos mediciones y el dato de la imagen** | Aditivo en código; **la imagen no** |
| 2d | **El almacén guarda solo la cookie de 5 días** y deja la corta en memoria (decisión 47). Antes del 2c, para que lo encuentre resuelto — brief `brief-etapa3-paso2d-cookie-de-sesion.md` | Toca el almacén del paso 2 |
| 3 | ✅ **HECHO el 2026-09-14.** El adaptador de PsicoAlianza contra el puerto psicométrico, con la invitación real de comprobación hecha — brief `brief-etapa3-paso3-adaptador-psicoalianza.md`, registro en *Paso 3* | Aditivo |
| 4 | El resolvedor de adaptador por conexión, y el cron preguntando al proveedor de la invitación (decisiones 6, 38 y 41). Puede partirse. 🔴 **No puede mandar ninguna empresa a PsicoAlianza antes de que el 5 esté hecho**: sin plazo ni documento, cada candidato sale descartado (opinión previa del paso 3) | Embudo |
| 5a | **Embudo**: el documento, su tipo y el plazo en la invitación, la traducción del tipo y la limpieza del documento en el adaptador, y el motivo *sin documento* con su grupo en el portal (decisión 45) — brief `brief-etapa3-paso5a-embudo-psicoalianza.md`, opinión previa el 2026-09-14 | Embudo y portal |
| 5b | **Conexión**: guardar y validar la conexión de PsicoAlianza por proveedor, sin login y conservando la sesión, la ruta que pregunta si la sesión está viva (44), y no aceptar plazos con decimales en una empresa con PsicoAlianza (decisión 46) — brief `brief-etapa3-paso5b-conexion-psicoalianza.md` | Ruta de producción |
| 6 | Portal: selector de proveedor, modal por proveedor, pruebas adicionales solo de EvaluaTest (decisiones 3 y 4) | Visible |

**Antes del paso 2, fuera del código:** cuenta de PsicoAlianza para probar y **una sesión de esa
cuenta pegada en el `.env` local** (decisión 42; cómo sacarla, en `../entorno-local.md`). Para el 2b
y el 2c, la cuenta del proxy móvil (DataImpulse, ya contratada) en el `.env` con las variables
neutras de `../entorno-local.md`, y Chrome instalado en la máquina. La clave de SolveCaptcha ya no
hace falta. **La conexión de PsicoAlianza no
va en el `.env`**, ni siquiera en local: se guarda en la base como cualquier conexión (decisiones 34
y 40, y las reglas de credenciales del backend); cómo insertarla en local llega con el paso 2. En el
`.env` va solo la sesión, que es otra cosa: la conexión dice *qué cuenta usa esta empresa*; la sesión
es *ya estoy dentro de esa cuenta*.

### Lo que la lista de herencia no tenía (contrastado el 2026-09-13)

Levantado leyendo el código y `psicoalianza-api.md`. Cada punto cae en el paso indicado.

- **Dos plazos** (paso 3). PsicoAlianza fija la ventana de la prueba al invitar
  (`dias_vencimiento_agendas`); nuestro cron descarta con su propio plazo (empresa > entorno > 2
  días). Si no coinciden, o PsicoAlianza cierra antes y la persona espera un resultado imposible, o
  descartamos a quien todavía podía presentarla. Hay que mandar nuestro plazo al invitar, y decidir
  qué es una agenda *Expirada* en los estados neutros.
- ~~**Quién decide el aprobado** (paso 3).~~ ✅ **DECIDIDO con el usuario el 2026-09-13/14.** Manda
  **nuestro puntaje mínimo de la oferta**, como con EvaluaTest: el adaptador entrega el índice de
  talento como puntaje y la regla del embudo no cambia. El veredicto propio de PsicoAlianza
  (`recomendacion`, con `1` = «No recomendado» y `3` = «Recomendado») **se guarda en la bolsa del
  proveedor** por si algún día se quiere, pero no decide.

  ✅ **Y una persona con varias pruebas, una terminada y otra vencida, cuenta como NO completada**
  (decidido el 2026-09-14). PsicoAlianza da un veredicto **por prueba**, no por persona, así que hay
  que juntarlas: solo se da por terminada a quien tenga **todas** sus pruebas finalizadas. Aprobar
  con media evaluación es peor que esperar, y a quien no las termine ya lo saca el vencimiento con
  su propio mensaje.
- **Reinvitar** (paso 3). El cron reintenta cada 5 minutos una invitación que falló por algo
  pasajero. En EvaluaTest registrar es *registra o recupera*; en PsicoAlianza no está capturado qué
  pasa al invitar a quien ya está en la vacante.
- **El desvío de correos de pruebas no sirve** (pasos 3 y 5). En PsicoAlianza un correo es de una
  sola persona en toda la plataforma: redirigir a todos los candidatos de prueba a una dirección da
  *ya fue tomado* desde el segundo.

  ⚠️ **Y la lectura única lo entrega igual** (levantado en la opinión previa del paso 2, 2026-09-13):
  devuelve el correo de pruebas **de EvaluaTest** para cualquier proveedor, sin mirar cuál es. Una
  conexión de PsicoAlianza sale con ese campo relleno y no debe usarse. No se toca en el paso 2
  —cambiarlo afecta a EvaluaTest—: ~~se decide en el paso 3~~ ✅ **decidido el 2026-09-14: el
  adaptador de PsicoAlianza no lo lee**, con su prueba. La lectura única no cambia.
- **Al guardar la conexión desde el portal hay que conservar la sesión** (paso 5; encontrado el
  2026-09-13 verificando la opinión previa del paso 2). La ruta que guarda una conexión **reconstruye
  el objeto con los campos que conoce** y descarta el resto: hoy solo toca la de EvaluaTest, así que
  no rompe nada, pero el día que guarde la de PsicoAlianza, **renombrar la conexión tiraría la sesión
  acuñada** y el acuñador gastaría un login de proxy móvil para nada.
- **El documento** (pasos 3 y 5). La invitación del puerto ya prevé el número de documento, pero el
  arranque no lo pasa (comprobado leyendo la única llamada). Nuestro tipo de documento es texto libre
  y de PsicoAlianza solo se conoce el identificador de CC. Sin documento se descarta (decisión 33), y
  un motivo nuevo toca el portal.
- **El coste del login** (paso 2). Cada login pasa por el servicio de pago, tarda hasta unos dos
  minutos y cuesta dinero. La sesión de EvaluaTest vive en memoria: se pierde en cada reinicio y
  cada instancia hace la suya. Validar la conexión en Mi compañía también es un login. Falta saber
  cuántas instancias del backend corren en los servidores.
- **Llamadas fijas a EvaluaTest** (paso 4). El embudo llama al adaptador de EvaluaTest sin pasar
  por el puerto en el enlace de respaldo del arranque y en las pruebas adicionales del veredicto; el
  servicio de ofertas, en las pruebas de la vacante; y el arranque escribe siempre `evaluatest` como
  proveedor del candidato. Falta comprobar si alguna de esas llamadas se alcanza con una oferta de
  PsicoAlianza.
- **Cuenta del solucionador** (antes del paso 1). `CAPTCHAS.md` pide decidir si se comparte cuenta
  con el otro proyecto: compartir es compartir saldo.
- **Contraseñas en el registro** (paso 2). Los clientes de la casa vuelcan peticiones enteras; el
  de EvaluaTest tapa la contraseña del login a mano. El nuevo la tapa desde el principio, y la clave
  del solucionador también.

~~🔴 **Contradicción abierta entre las decisiones 27 y 31, se decide antes del brief del paso 3.** La
27 dice que si el documento ya existe en PsicoAlianza con otro correo, se invita con el correo que
devuelve la consulta. La 31 dice que en ese mismo caso se falla de forma visible. No pueden valer las
dos.~~

✅ **DISUELTA por medición el 2026-09-14** (ver *Tanda de comprobaciones*, hallazgo 6): el caso que
las enfrentaba **no existe**. Si el documento ya está registrado, PsicoAlianza **ignora en silencio
el correo que le mandes**: responde que invitó, no duplica y deja el correo original. Así que no hay
nada que rechazar (31) y la 27 acierta por otro motivo — se invita con el correo que devuelve la
consulta **para guardar el que esa persona tiene de verdad allá**, no para evitar un error.

### Medición del captcha — ❌ RECHAZADO (2026-09-13)

Decidido con el usuario medir **antes** de programar nada de la etapa: un script desechable, fuera
de los repositorios, que entra exactamente como entraría el backend (decisión 24). Pide la página
de login, lee de ella la clave del sitio, le pide a SolveCaptcha un token v3 con la acción `submit`,
pide el CSRF fresco como hace la página, envía el formulario con "permanecer conectado" y comprueba
si la sesión quedó viva. La mecánica leída de la página coincide con *Confirmado de PsicoAlianza*.

| Puntaje pedido | Intentos | Token entregado | Resultado |
| --- | --- | --- | --- |
| 0.3 | 4 | Sí, en 16–17 s | Los 4 rechazados: «No hemos podido verificar que eres una persona» |
| 0.7 | 2 | Sí, en 16–17 s | Los 2 rechazados, mismo mensaje |
| 0.9 | 2 | Sí, en 16–17 s | Los 2 rechazados, mismo mensaje |
| 0.3, **con navegador** | 3 | Sí, en 16–17 s | Los 3 rechazados, mismo mensaje |
| 0.7 y 0.9, **con navegador** | 2 + 2 | Sí, en 17–22 s | Los 4 rechazados, mismo mensaje |

La última fila repite la forma de robot-manager, a petición del usuario: Chrome real con la página
de login cargada, correo y contraseña tecleados, y el propio código de la página enviando el
formulario, con el token de SolveCaptcha entregado en lugar del de Google. **Mismo resultado que por
HTTP: lo que falla es el token, no la forma de enviarlo.** Coste total de los quince intentos: unos
dos centavos de dólar.

⚠️ **Exploración en curso, pedida por el usuario: la lectura de abajo está en revisión.** En la demo
de reCAPTCHA v3 de 2Captcha, cuya verificación devuelve lo que responde Google, dos tokens de
SolveCaptcha sacaron **0.9 (pedido 0.3) y 0.7 (pedido 0.9)**, con el dominio y la acción correctos.
O sea: el servicio **sí** consigue notas altas, y la nota pedida no manda sobre la obtenida. Que
PsicoAlianza rechace por nota baja deja de ser la explicación segura: puede que Google califique
distinto en cada sitio —esa demo la resuelven sin parar— o que PsicoAlianza compruebe algo más que
la nota.

✅ **Primer login por HTTP conseguido (2026-09-13), con tokens Enterprise.** Dos pruebas más lo
aclararon:

- En la **demo neutral de Google** (`recaptcha-demo.appspot.com`), tres tokens normales de
  SolveCaptcha sacaron **0.9** los tres, pedidos 0.3, 0.9 y 0.3. ~~El servicio no tiene un problema
  de nota.~~ **Eso no se sigue** (corregido el 2026-09-13): Google calcula la nota **por sitio**, con
  el tráfico de cada clave, así que un token que vale 0.9 en la demo puede valer 0.1 en
  PsicoAlianza. La demo solo prueba que el servicio produce tokens válidos; de la nota en
  PsicoAlianza no dice nada.
- En PsicoAlianza, pidiendo el token con **`enterprise=1`** —la variante Enterprise de SolveCaptcha—,
  **un intento de dos entró**: redirección a `/inicio`, sesión viva y la cookie `remember_web_<hash>`
  de *permanecer conectado*. El otro fue rechazado con el mensaje de siempre. Con `userAgent` y sin
  Enterprise, 2 de 2 rechazados.

~~**Lectura provisional:** la clave se verifica como Enterprise y los tokens normales no le
sirven.~~ **No se sostuvo, corregido el mismo día:** diez intentos más con `enterprise=1` —seis
solos y cuatro con `userAgent`— dieron **0 de 10**. Enterprise va **1 de 12**; los tokens normales,
**0 de 17**. Un éxito en doce no distingue a Enterprise de la suerte.

**Lo que sí queda probado:** PsicoAlianza **puede** aceptar un token de SolveCaptcha por HTTP, y ese
login deja la cookie de *permanecer conectado*. Y tras unos treinta logins rechazados en el mismo
día, la cuenta **no se bloqueó**: el rechazo sigue siendo el del captcha. Eso abre una vía que no
depende de acertar la variante: **reintentar hasta entrar una vez, y vivir de la cookie** (decisión
26), si esa cookie reautentica sola.

**Medido a continuación, 2026-09-13: esa vía tampoco se sostiene con estos números.** Veinte intentos
seguidos con `enterprise=1` y veinte con tokens normales, parando al primer éxito: **0 de 40**. El
acumulado del día queda así:

| Variante | Éxitos |
| --- | --- |
| Tokens normales, HTTP y Chrome, cualquier puntaje, con y sin `userAgent` | **0 de 37** |
| `enterprise=1`, con y sin `userAgent` | **1 de 32** |
| Tokens normales en la demo neutral de Google | 0.9 de nota los 3 |

Con un éxito en 69 intentos, entrar costaría de media decenas de intentos y hasta media hora, sin
garantía; y la prueba de si la cookie de *permanecer conectado* reautentica sola **no llegó a
correr**, porque no hubo login. La cuenta sigue sin bloquearse tras unos setenta rechazos.

**Lectura:** los tokens de SolveCaptcha son buenos donde se puede medir, y PsicoAlianza los rechaza
casi siempre. Qué comprueba de más no se puede ver desde fuera. Queda para decidir con el usuario.

**Última hipótesis probada, 2026-09-13: pasarle a SolveCaptcha las cookies de sesión de la página y
el user agent** —para que resuelva como un navegador con sesión abierta en el sitio, no como uno
recién nacido—, junto con `enterprise=1`. **0 de 8.** Con esto, el acumulado del día por variante es
concluyente:

| Variante de SolveCaptcha | Éxitos |
| --- | --- |
| Token normal (HTTP y Chrome, puntajes 0.3/0.7/0.9, con y sin `userAgent`) | 0 de 37 |
| `enterprise=1` (con y sin `userAgent`) | 1 de 40 |
| `enterprise=1` + cookies de sesión + `userAgent` | 0 de 8 |
| **Total** | **1 de 85** |

**Veredicto: SolveCaptcha no resuelve el reCAPTCHA v3 de PsicoAlianza de forma fiable.** Se cubrió
todo lo que el servicio ofrece por configuración; el único éxito en 85 es indistinguible del azar.
Quedan sin probar dos cosas que no se pueden medir en una sesión: **resolver con un proxy
residencial** pasado a SolveCaptcha (hace falta un proxy; su documentación no confirma proxy para
v3) y **pedir a soporte de SolveCaptcha que ajuste su solucionador para este sitekey** (días). La
decisión de fondo —qué camino toma la autenticación de PsicoAlianza— queda con el usuario.

**Los caminos, con lo que le pasa a una candidata en cada uno** (escritos aquí el 2026-09-13; una
versión anterior de este párrafo remitía a un texto que solo existía en el chat del planificador):

| Camino | Qué le pasa a la candidata | Riesgo real |
| --- | --- | --- |
| **Preguntarle a PsicoAlianza**: usuario de integración, clave, IP exenta del captcha, o webhook (A9) | Recibe su enlace siempre | Nadie lo ha preguntado: todo lo de "API no pública" es observado, no consultado. Es el cliente pagando por el servicio. **Es el camino que se recomienda, y sigue sin hacerse** |
| **Login humano y sesión reutilizada**, cada 5 días | Recibe su enlace mientras alguien renueve la sesión | Si nadie la renueva, la decisión 36 hace el resto: a los 2 días de sesión muerta se la descarta diciéndole que su resultado no llegó. Solo vale en un servidor con alerta a soporte cuando la sesión muera |
| **Otro solucionador o proxy residencial**, como experimento acotado | Igual que hoy: nadie sabe si entra | Una tarde y un presupuesto fijo. La probabilidad es desconocida; no baja de cero por probar |
| **Insistir hasta entrar**: 1 % por intento, la cuenta no se bloquea, dos centavos cada quince intentos | Entra "a veces" | Cientos de intentos fallidos de *verificar que eres una persona* contra el login del proveedor del cliente. Queda en la lista por honestidad; **no se recomienda** |

✅ **Decidido el 2026-09-13: el segundo, provisional y solo en local** (decisión 42), para seguir
desarrollando el resto de la etapa mientras se resuelve cómo se consigue la sesión. El primero
sigue siendo el que hay que hacer, y no depende de código. **Y esa misma tarde apareció un quinto
camino que esta tabla no tenía, y es el oficial: ver *Medición con proxy*, abajo.**

**Lo que se sabe:**

- **El rechazo es del captcha, no de las credenciales**: el mensaje es el del captcha, y PsicoAlianza
  rechaza por captcha antes de mirar el usuario. Las credenciales no llegaron a comprobarse.
- **El servicio tarda lo mismo pida el puntaje que pida**: 16–17 segundos con 0.3 y con 0.9. Pedir
  más no le cuesta más trabajo, lo que encaja con su propio aviso de que por encima de 0.3 casi no
  entrega: **el puntaje pedido no es una garantía**.
- **Encaja con lo del 2026-09-09** (*Riesgos*): un navegador automatizado desde IP residencial
  también fue rechazado. PsicoAlianza exige un puntaje que ni ese navegador ni este servicio
  alcanzan.

**Lo que no se sabe:** qué puntaje exige PsicoAlianza —Google no lo dice al que envía— ni si otro
servicio de pago lo alcanzaría.

🔴 **Consecuencia: la decisión 23 no funciona como está.** Con SolveCaptcha no se entra a
PsicoAlianza por HTTP. El paso 1 queda en espera. ~~Los pasos 2 a 6 no arrancan hasta decidir cómo
se autentica el sistema.~~ **Sí arrancan** (decisión 42, el mismo día): con la sesión conseguida a
mano y pegada en el `.env` local, el cliente y todo lo que viene detrás se desarrollan igual. ~~Lo que
sigue pendiente es cómo se consigue la sesión sola, que es lo único que bloquea el despliegue.~~
**Resuelto la misma tarde: abajo.**

### Medición con proxy — ✅ ENTRA (2026-09-13, la misma tarde)

Hecha por el usuario en otro chat, con un script desechable fuera de los repositorios (Node,
`puppeteer-core` manejando el Chrome instalado). Un quinto camino que la tabla de arriba no tenía:
**el mismo navegador automatizado, pero saliendo por otra IP.**

| Variante | Resultado |
| --- | --- |
| Chrome automatizado, IP de casa (el 2026-09-09) | Rechazado |
| Chrome automatizado **sin ventana y sin proxy**, IP de casa (medido por el planificador el 2026-09-14) | **0 de 3.** Confirma con número lo del 2026-09-09 y **descarta que baste una IP residencial**: el proxy móvil hace falta. Tiempo medio, 11 s por intento — arrancar el navegador 0,4 s, cargar el login 4,3 s, teclear 2,4 s, enviar y esperar 3,6 s |
| SolveCaptcha, cualquier variante (esta mañana) | 1 de 85 |
| Chrome automatizado por **proxy residencial rotativo** | 0 de 3 |
| Chrome automatizado por **proxy móvil colombiano** (DataImpulse, sesión pegajosa), con ventana | **Entra** — ⚠️ N de N por anotar |
| Igual, **sin ventana** | **Entra a la primera** — ⚠️ N de N por anotar |

Lo que hace el script: pide al proxy una IP pegajosa por intento (país y sesión codificados en el
usuario del proxy), lanza Chrome con esa IP y sin la marca de automatización, va a `/login`,
escribe correo y contraseña con pausas, hace clic; la propia página ejecuta el captcha y envía.
Éxito = redirige fuera de `/login`; rechazo = queda en `/login` con el mensaje del captcha.
*Permanecer conectado* viene marcado por defecto, así que el login deja `ats_session`,
`remember_web_<hash>` (5 días, como dice la ayuda del propio sitio: «hasta 5 días sin caducar por
inactividad») y `XSRF-TOKEN`.

**Los scripts están guardados en `evidencia/`**, sin secretos (leen el `.env` del backend):
`login-por-proxy-movil.mjs` es el que entró —la copia es la versión con ventana; la corrida sin
ventana solo cambió esa bandera a `true`—, `login-sin-proxy.mjs` la versión que el sitio rechaza,
y `medicion-solvecaptcha.mjs` el de la mañana. Son evidencia, no código de producción: el 2b y el
2c se escriben desde cero dentro del backend, con identificadores en inglés y sin comentarios.

**Lo que el brief del 2b y del 2c necesitan saber del proxy y de Chrome**, sacado del script y
del reporte del usuario:

| Qué | Valor | Nota |
| --- | --- | --- |
| Proveedor | DataImpulse, plan móvil | Contratado por el usuario |
| Gateway | `gw.dataimpulse.com`, puerto **823** HTTP o **824** SOCKS5 | Se usó HTTP |
| Usuario del proxy | `<login>__cr.co__sid.<número>` | `__cr.co` = Colombia; `__sid.<número>` = sesión pegajosa: la misma IP mientras se repita el número. **Un número nuevo por intento**, generado por quien llama |
| Contraseña del proxy | La de la cuenta, sin sufijos | Va por autenticación de proxy, no en la URL |
| IP de salida vista | Comcel/Claro, marcada como móvil | Comprobada pidiendo la IP pública antes del login |
| Chrome | `puppeteer-core` @23 manejando el Chrome instalado, no el Chromium empaquetado | En el servidor cambia: Chromium en la imagen (43) |
| Banderas | `--proxy-server=http://<gateway>:<puerto>` y `--disable-blink-features=AutomationControlled` (quita `navigator.webdriver`) | Sin ventana con `headless: true` |
| Autenticación del proxy | `page.authenticate` con usuario y contraseña | |
| Flujo | `/login`, esperar `#email`, `#password` y `#enviar_inicio_sesion`; escribir con pausas; clic; la página ejecuta el captcha y envía | *Permanecer conectado* ya viene marcado |
| Éxito | La URL sale de `/login` (se vio `/procesos`) | Cookies: `ats_session`, `remember_web_<hash>`, `XSRF-TOKEN` |
| Rechazo | Sigue en `/login` con «No hemos podido verificar que eres una persona» | Rotar `__sid` y repetir |
| Bloqueo | Texto con «demasiados intentos» o «bloquead» | **Parar en seco**: es la cuenta de gerencia del cliente |
| Coste | Unos 2 USD por GB de tráfico móvil. ✅ **Medido el 2026-09-13**: **~2,8 MB por login**, unos 360–400 logins por GB → con seis u ocho logins al mes, **centavos de centavo** | ~~Bloquear imágenes, CSS y fuentes~~ **No**: no hace falta y el único intento bloqueado salió rechazado (ver la corrección en la decisión 43) |

**Lectura:** lo que PsicoAlianza —o Google para su clave— castiga es **la IP**, no el navegador ni
el endurecimiento. Corrige el riesgo del 2026-09-09 que decía "no volver por esta vía".

**Lo que esta medición no dice, y falta:** si la sesión sirve desde otra IP que la que la creó, y
la tasa exacta. Las dos están en la decisión 43 como condición del brief del acuñador.

✅ **Decidido el 2026-09-13, y cierra el bloqueo: el proxy móvil es el camino oficial** (decisión
43), todo en el backend. El login humano (42) queda como red de emergencia y para local.

### Medición cruzada de IP — ✅ LA SESIÓN NO ESTÁ ATADA A LA IP (2026-09-13)

La medición que sostenía toda la arquitectura de la decisión 43, y salió bien. Script
`test-cross-ip.mjs`, del chat de mediciones.

**Qué se hizo:** acuñar una sesión entrando por **IP móvil colombiana** con el proxy, y después
usar esas cookies **desde otra máquina y otra IP residencial, sin proxy ninguno**.

| Qué se mandó desde la otra IP | Resultado |
| --- | --- |
| Todas las cookies de la sesión | Redirige a `/inicio` |
| Solo `ats_session` | Redirige a `/inicio` |
| Solo `remember_web_<hash>` | Redirige a `/inicio` |

**Lo que queda probado, y es el permiso para construir el 2c como está diseñado:**

- **PsicoAlianza no ata la sesión a la IP que la creó.** El navegador acuña por móvil y el backend
  trabaja por HTTP desde la IP del servidor. Si esto hubiera salido mal, el backend tendría que
  salir por el proxy en **todas** las peticiones y el gasto dejaría de ser casi cero.
- **La cookie de *permanecer conectado* reautentica sola**, y ahora está comprobado **desde otra
  IP**. Confirma A13 y la decisión 26 por observación y no por lectura de su documentación, y
  significa que al acuñador le basta con guardar esa cookie para sobrevivir a la caducidad de la
  sesión corta.

⚠️ **Lo que no dice:** cuánto dura de verdad. Que reautentique hoy no mide los cinco días.

📌 Las dos direcciones IP concretas quedaron en la salida del script y **no se copian aquí**: una es
la IP doméstica de quien lo corrió, rotan las dos, y dentro de un mes no significan nada.

### Paso 2 — ✅ HECHO (2026-09-13)

El cliente de PsicoAlianza con la sesión ya abierta, solo backend. Brief en
`brief-etapa3-paso2-cliente-psicoalianza.md`. En su subcarpeta de la capa psicométrica quedaron el
**almacén de sesión** —cookies cifradas en un campo propio de la conexión de la empresa, con sus
fechas—, el **cliente** con las siete peticiones del contrato, y *sesión caducada* como error propio
con su motivo. La sesión sale del `.env` **solo con las dos condiciones** (interruptor encendido y
cookies pegadas, decisión 42) y, si no, de la conexión; sin ninguna, *sin sesión*. La lectura única
reconoce a PsicoAlianza en sus dos tablas, con correo y contraseña como campos obligatorios. Las dos
piezas quedan registradas en el módulo de ofertas **sin enlazarse al puerto psicométrico**: elegir
proveedor es el paso 4. **Nada lo llama todavía y el flujo de la etapa no cambia.**

**Lo que salió de las dos rondas de opinión previa y valió su precio:**

- **El brief daba por observada una respuesta que nadie vio.** Decía que sin sesión PsicoAlianza
  sirve el formulario de login, y de ahí deducía una sola forma de detectarlo. Se reconocen **cuatro**
  —formulario con 200, redirección al login, 401 y 419—, y solo la primera está observada, además
  sobre la página de login y no sobre un endpoint de datos. Las otras tres son supuestos del
  comportamiento por defecto de su framework.
- **La escritura de la sesión podía perderse contra el guardado de Mi compañía**, que lee la lista
  entera de conexiones y la reescribe entera. El almacén actualiza **solo el campo de sesión de esa
  conexión, localizándola por su identificador**. Comprobado además que ese guardado no borra la
  conexión de PsicoAlianza: solo reconstruye la de EvaluaTest.
- **El campo de sesión hay que declararlo en el esquema** o Mongo lo descarta al guardar **sin ningún
  error**: la sesión parecería guardada y no estaría.
- **La comprobación de sesión viva no lanza**: devuelve *viva* o *muerta*, porque su trabajo es
  contestar esa pregunta. Solo las operaciones de datos lanzan. ~~Es además el único momento en que se
  escribe *visto vivo por última vez*~~ ⚠️ **Corregido el 2026-09-14** (levantado por el ejecutor en
  la opinión previa del 2d): en el código, guardar cookies **también** lo escribe, junto a ellas, y
  la prueba del paso 2 lo afirma así. Con el 2d esa escritura queda solo cuando cambia la cookie de 5
  días, que es raro (47). Hacerlo en cada petición serían escrituras continuas sobre el documento de
  la empresa, varias por pasada del cron. Y desde el 5b la comprobación de sesión tiene un tercer
  valor, *sin sesión*, distinto de *muerta*.
- **Las cookies de la sesión pegada no se escriben en la base**, o esa empresa quedaría con una
  sesión que se usaría en cuanto alguien apague el interruptor. Viven en memoria mientras dure el
  proceso.
- **El registro deja fuera la parte de parámetros de la ruta**: la consulta del correo lleva **el
  número de documento de la candidata** dentro de la dirección.
- **El interruptor manual vale para todas las empresas a la vez**, así que el arranque lo anuncia
  como advertencia.
- **Faltaba el cableado, y era omisión del brief.** Sin registrar las piezas, nada garantizaba que
  Nest supiera construirlas y el paso 3 lo habría descubierto con un arranque que se niega.

🔴 **Tres supuestos que hereda el paso 3, y el primero no estaba en ningún sitio hasta ahora:**

1. **El cliente descarta la cookie del token antifalsificación** al guardar las reemitidas, y no la
   vuelve a mandar. El script de la evidencia **sí la mandaba**, así que es una divergencia con lo
   único probado en vivo. Probablemente da igual, porque ese token viaja en el formulario, pero nadie
   lo ha comprobado. **Si el paso 3 encuentra rechazos 419 con la sesión viva, es lo primero que hay
   que mirar.**
2. ~~**La forma del cuerpo de la invitación.**~~ ✅ **RESUELTO el 2026-09-14, capturando el payload
   real del portal** (está en el contrato). Y el resultado es que **la forma que armó el paso 2 no es
   la suya**: nosotros mandamos los participantes como campos sueltos con índice y tres claves; el
   portal manda **un solo campo con el JSON dentro**, siete claves —las cuatro de teléfono en nulo— y
   el tipo de documento **como texto**. ⚠️ **La nuestra funciona** —se invitó de verdad ese día y la
   persona apareció en el tablero—, pero depende de que su backend acepte las dos formas. **Se alinea
   con la del portal en el paso 3**, donde el brief ya lo pide. De la misma captura salió el texto
   por defecto de su correo, que también estaba inventado.
3. **Las tres formas supuestas de sesión muerta** (redirección, 401 y 419), de arriba.

**Verificado**, corrido por el planificador sobre el conjunto del cambio: backend 106 suites y 951
pruebas (942 pasan, 9 omitidas; **35 nuevas** desde las 916 del cierre de la etapa 1). Portal sin
tocar. Control negativo corrido en cinco puntos —el interruptor ignorado, el 419 quitado, el
documento en el registro, PsicoAlianza fuera de la tabla de campos obligatorios y la escritura sin
localizar la conexión—, más el del cableado. ⚠️ **Una corrección del planificador**: en la primera
revisión contó 24 pruebas nuevas leyendo *940 passed* como si fuera el total, cuando el total era
949. Es el fallo contra el que avisa este documento — leer una salida sin mirarla entera.

**Cómo se prueba contra PsicoAlianza de verdad**, para el paso 3: hacen falta las dos cosas, la
conexión insertada a mano en la base local y la sesión pegada en el `.env` con el interruptor
encendido. Los dos instructivos están en `../entorno-local.md`.

### Tanda de comprobaciones para el paso 3 (2026-09-14)

Lo que el brief del paso 3 no puede suponer y hay que preguntarle a PsicoAlianza ejecutando. Se
corre con un script desechable fuera de los repositorios que **monta el cliente ya compilado del
paso 2** con un almacén de mentira: así, además de contestar, comprueba el código que va a
producción. Va por bloques, y se para entre uno y otro.

#### Bloque A · solo lectura — ✅ HECHO

**Primera vez que el cliente del paso 2 habla con PsicoAlianza de verdad, y funciona.**

| Qué | Resultado |
| --- | --- |
| ¿La sesión sigue viva? | La página de login redirige (302) y el cliente lo lee como **viva** |
| Listado de vacantes activas | **18**, con el sobre desenvuelto y sin mandar tamaño de página |
| El correo de un documento que no existe | Responde que **no lo conoce**, como dice el contrato |

🔴 **Hallazgo 1: hay un tercer estado de vacante, y el contrato solo tenía dos.** De **113**
vacantes: **18 activas (2)**, **89 completadas (3)** y **6 suspendidas (5)**. El estado 5 no estaba
documentado. **Toca a A11 —cuándo una vacante deja de servir—: el adaptador tiene que tratar
completada y suspendida como no usable**, y dejar *indeterminado* para cualquier estado que
aparezca y no conozca. Confirmado de paso que una vacante completada sigue marcada como no
archivada, como decía el contrato.

🔴 **Hallazgo 2: PsicoAlianza reemite la cookie de sesión en todas las respuestas.** El cliente pidió
guardar cookies nuevas en **las tres** peticiones que hizo. *(Inferencia, no observada: su framework
cifra esa cookie con un valor aleatorio en cada respuesta, así que el texto cambia siempre aunque la
sesión sea la misma.)*

**La consecuencia es de diseño y hay que resolverla antes de que la sesión viva en la base:** tal
como está, **cada petición provocaría una escritura cifrada** en el documento de la empresa, y el
cron hace varias por pasada cada cinco minutos. Hoy no se nota porque la sesión pegada a mano vive
en memoria (decisión 42), así que **no bloquea el paso 3**, pero sí hay que decidirlo antes del 2c.
Las salidas posibles, sin elegir todavía: guardar solo cada cierto tiempo, guardar solo cuando
cambie algo que no sea el cifrado, o no guardar la cookie corta y quedarse solo con la de
*permanecer conectado*, que es la que de verdad reautentica (medición cruzada de IP).

✅ **La tercera salida, medida el 2026-09-14 sobre un endpoint de datos** (la medición cruzada de IP
solo lo había visto en la página de login). Sesión recién pegada, tres peticiones al listado de
vacantes activas, solo lectura, sin login ni captcha:

| Cookies enviadas | Respuesta |
| --- | --- |
| Todas (control) | 200, 15 vacantes |
| **Solo la de *permanecer conectado*** | **200, las mismas 15 vacantes**, y una cookie corta nueva |
| Ninguna (control negativo) | **401** |

**La cookie de 5 días basta sola para trabajar**: con la corta vencida o ausente, PsicoAlianza
reautentica y responde con datos. Eso hace viable **guardar en la base solo esa cookie, escrita al
acuñar, y dejar la corta en memoria**: casi cero escrituras. ⚠️ **No se puede usar la cookie corta
nueva como prueba de nada**: el control negativo también la recibe, porque el servidor abre una
sesión anónima a cualquiera. La prueba son las vacantes.

**De paso queda observado el 401** como respuesta de un endpoint de datos sin sesión: era una de
las tres formas **supuestas** de sesión muerta que heredó el paso 3 del paso 2. Las otras dos
—redirección al login y 419— siguen sin verse.

✅ **DECIDIDO por el usuario el 2026-09-14: se adopta.** En la base se guarda **solo la cookie de
*permanecer conectado***, escrita al acuñar; la corta vive en memoria y, si se pierde o vence, la de
5 días reautentica. Con la de 5 días vencida, la petición falla como *sesión caducada* y toca acuñar.
✅ **Y va en un cambio pequeño propio, antes del 2c** (decidido por el usuario el mismo día): toca el
almacén de sesión del paso 2, que está cerrado, y así el 2c lo encuentra resuelto. Su brief lo
escribe este planificador, después de proponerlo entero.

#### Bloques B y C · invitar de verdad — ✅ HECHO (2026-09-14)

Se invitó al documento del propio usuario, con su correo, a una vacante activa. **Nueve peticiones,
todas por el cliente del paso 2.** Lo que contestó PsicoAlianza:

| Qué | Resultado |
| --- | --- |
| **La forma del cuerpo de la invitación** | ✅ **Funciona**: 201 y *agregados: 1* a la primera. ⚠️ Pero al capturar después el payload del portal se vio que **no es la suya** — ver el supuesto 2 del paso 2, y el contrato |
| **El plazo** | 🔴 **Se respeta**: mandamos 2 días y la agenda quedó cerrando **exactamente 2 días después**. Confirma el mecanismo de los dos plazos: el que mandamos manda |
| **El candidato recién invitado** | Puntaje `-2.0` (el centinela de *sin nota*), agenda en estado 1 *Agendada*, recomendación `0`, ajuste `null` |
| **El enlace personal** | ✅ Se obtiene con el identificador que trae el tablero |
| **Ningún 419 en las nueve peticiones** | El supuesto de la cookie que el cliente descarta **no molesta** — no es prueba definitiva, pero es buena señal |

🔴 **Hallazgo 3: la cookie reemitida NO invalida la anterior.** Se probó a propósito: tras una
petición, la cookie tal como está en el `.env` **sigue sirviendo**. Cierra la trampa 3 del brief del
paso 2, que estaba marcada como sin verificar. *(La sesión que se murió a mitad de la primera tanda
fue porque el usuario pulsó «cerrar sesión» en el navegador, no por la rotación.)*

🔴 **Hallazgo 4: el contador de participantes del listado miente.** El listado daba **0
participantes** para esa vacante y su tablero traía **uno real**, con una prueba agendada y vencida
desde hace meses. **Ese contador no sirve para decidir nada**; hay que mirar el tablero.

🔴 **Hallazgo 5: reinvitar no duplica, pero responde como si hubiera invitado.** Se invitó dos veces
al mismo documento en la misma vacante: la segunda respondió **201 y *agregados: 1*** igual que la
primera, y el tablero **siguió con una sola fila** para ese documento. **El número que devuelve la
invitación no dice si realmente se invitó a alguien**, así que el paso 3 no puede confiar en él:
para saberlo hay que buscar a la persona en el tablero, que además es un paso que ya está en la
decisión 27. Como reinvitar es inofensivo, **el reintento del cron es seguro**.

✅ **Y tampoco le escribe al candidato** (comprobado el 2026-09-14): de las **tres** invitaciones al
mismo documento llegó **un solo correo**. Era el riesgo de verdad —el cron reintenta cada cinco
minutos y podría haber llenado el buzón de una persona real—, y no existe.

🔴 **Hallazgo 6, y resuelve la contradicción 27/31 de una forma que nadie había previsto:
PsicoAlianza ignora el correo cuando el documento ya existe.** Se invitó el mismo documento con un
correo distinto: respondió **201**, no dio error, no duplicó, y al volver a consultar, **el correo
registrado seguía siendo el original**. No hay *«ya fue tomado»* por documento — ese error del
contrato aparece cuando el **correo** pertenece a otra persona, que es el caso inverso.

🔴 **Corregido el 2026-09-14, al leer la ficha completa tras el bloque D: el correo NO se descarta —
se guarda en otro sitio.** La frase anterior («el correo que mandamos se descarta en silencio») era
**falsa**, y se escribió mirando una sola fuente. Hay **dos correos distintos para la misma persona**,
y cada consulta devuelve uno:

| Dónde se mira | Qué devuelve |
| --- | --- |
| La consulta previa por documento | El correo **original** con el que se registró la persona |
| La ficha del participante en el tablero | El **último** correo que se mandó al invitar |

O sea que la tercera invitación **sí cambió algo**: el correo de la ficha, no el del registro. Y la
consulta previa siguió devolviendo el viejo, que es lo que despistó.

✅ **Y cuál de los dos recibe el correo, comprobado el 2026-09-14: el registrado.** La invitación
llegó a la dirección que devuelve la consulta por documento, **no** a la que se mandó en la última
invitación. Así que el correo de la ficha del participante es **decorativo**: se guarda, se le
enseña al reclutador del cliente en su portal, y no se usa para nada.

**Consecuencia para el paso 3, y es la importante:** en PsicoAlianza **el correo no sirve como llave
para reencontrar a una persona** —hay dos y no coinciden—, así que ~~el emparejamiento va **por
documento**, como ya decía la decisión 27~~. **Corregido el 2026-09-14** (levantado por el ejecutor
del paso 3): **al invitar** se busca a la persona por documento, como dice la 27; **al consultar
resultados** se empareja **solo por el identificador** que esa búsqueda obtuvo, porque el documento
no viaja en la consulta del cron (ver *Contraste del brief del paso 3 contra el código*).

🔴 **Y la 27 acierta, ahora por un motivo firme: hay que invitar con el correo que devuelve la
consulta.** No para evitar un error, sino por dos cosas medidas: es **el único que la persona va a
recibir**, y mandar otro **ensucia su ficha** con una dirección que el reclutador del cliente verá y
que no sirve para nada. Del *correo de registro* que guarda el candidato (decisión 15, 32-d) se
anota ese mismo, el registrado, sabiendo que **no se usa para emparejar**.

⚠️ **Lo que esto no rompe:** que la invitación le llegue a una dirección distinta de la que tenemos
guardada del candidato da igual, porque **el enlace se le manda por WhatsApp** (B2) y el correo de
PsicoAlianza es solo un respaldo.

~~🔴 **Lo que la tanda dejó abierto, y no estaba en ninguna lista: qué dice el correo que PsicoAlianza
le manda al candidato.**~~ ✅ **DECIDIDO por el usuario el 2026-09-14, la misma tarde.** La
invitación lleva un título y un cuerpo, y en la tanda se mandaron textos inventados sobre la marcha
que le llegaron a una persona. Se resolvió capturando el payload que manda el propio portal de
PsicoAlianza cuando un reclutador invita desde su pantalla (está en el contrato):

- **Se usa su plantilla por defecto, tal cual**: «Comienza tus pruebas» y su cuerpo. Fija para todas
  las empresas, en un solo sitio del adaptador, sin configurar. Laura recibe el mismo correo que
  recibiría de cualquier cliente de PsicoAlianza.
- **No se intenta apagar el correo.** El botón «Comenzar» de ese correo y el enlace que pedimos por
  la API llevan **a la misma pantalla** —la lista de tareas pendientes de la persona, desde donde
  entra a la prueba—, así que los dos canales se refuerzan. Y **pedir el enlace por la API no
  invalida el botón del correo** (confirmado por el usuario ese día): cierra la nota «invalidación sin
  confirmar» del contrato.
- ⚠️ **Lo que sí queda, y es del embudo (paso 4/5), no del adaptador**: las instrucciones que hoy van
  por WhatsApp son de EvaluaTest —«haz clic en *Aplicar ahora*», «regístrate con tu correo»— y con
  PsicoAlianza engañan: el enlace entra directo a las tareas pendientes, sin registro. El texto tiene
  que ir por proveedor. Nadie lo tenía anotado.

### Contraste del brief del paso 3 contra el código (2026-09-14, planificador)

Antes de entregar el brief se leyeron el puerto, sus tipos, los tres errores, el adaptador de
EvaluaTest, el cliente y el almacén del paso 2 y las dos llamadas del embudo al puerto. **Dos puntos
del brief no se podían implementar tal como estaban escritos**, y tres más faltaban. Todo está
corregido en el brief; aquí queda el porqué y lo que hereda el paso 5:

| Qué decía el brief | Qué hay en el código | Qué se decidió |
| --- | --- | --- |
| Los resultados se emparejan **por documento**, con el identificador de respaldo | Lo que el cron manda por candidato es la referencia, el identificador del proveedor y los dos correos. **El documento no viaja** | Emparejar **solo por el identificador de PsicoAlianza**, su llave global de la persona, que la invitación obtuvo buscándola por documento. Ninguna pieza compartida se toca. Si algún día se quiere el documento como segunda llave, es un campo opcional más en el pedido del cron: **paso 5, si hace falta** |
| La vacante se comprueba distinguiendo completada de suspendida | La única petición de vacantes del cliente **filtra por activas**: una completada no aparece y no se distingue de una inexistente | El paso 3 **añade al cliente el listado sin filtro** (medido en el contrato: sin tamaño de página trae todas). No está → indeterminada; archivada → no usable |
| «Todo lo demás son archivos nuevos» | El error *falta un dato del candidato* tiene el campo acotado a «correo» | Se **amplía** para nombrar «documento»: segunda pieza compartida, aditiva. ⚠️ **Hereda el paso 5:** el embudo convierte hoy ese error **siempre** en `psychometric_missing_email`; con un documento ausente diría lo que no es. Va junto al motivo nuevo que ya tenía anotado |
| Nada sobre el tipo de documento | El cliente exige un identificador de tipo por invitado; el puerto no lo trae; la decisión 12 dice «el del candidato, CC por defecto», y de PsicoAlianza solo se conoce CC=1 | **Siempre CC** en el paso 3. Mandar el real es del **paso 5**; el catálogo de tipos de PsicoAlianza ya está medido — fila **A14** en *Falta de PsicoAlianza* |
| Nada sobre el correo de pruebas de EvaluaTest que la lectura única entrega a cualquier proveedor («se decide en el paso 3») | Confirmado: lo entrega | **El adaptador de PsicoAlianza no lo lee**, con su prueba. Cerrado |

**Tres líneas más que el brief no tenía**, sacadas del código: *sesión caducada* a mitad de una
invitación es **pasajero, nunca permanente** (la 39 reserva ese tipo al nombre de vacante); una
persona **sin agendas** o con una agenda en un estado desconocido cuenta como *sigue en ello*, y el
adaptador **nunca** devuelve *rechazado por el proveedor*; y con la sesión manual encendida **el
almacén entrega sesión sin mirar si la empresa tiene conexión**, así que la comprobación de conexión
del adaptador va primero y no es redundante.

**Y una decisión que no es aditiva, tomada con el usuario:** el cliente del paso 2 **cambia cómo
codifica los participantes** para alinearse con el payload del portal (un solo campo con el JSON,
siete claves, tipo como texto), aunque la forma actual funcionó el 14. Motivo: es la única forma que
el portal de ellos usa de verdad, el paso 2 la dejó aislada en una función para poder corregirla de
un toque, y se vuelve a comprobar con una invitación real al documento del usuario, que el reporte
del paso 3 tiene que traer.

### Opinión previa del paso 3 (2026-09-14)

Once puntos del ejecutor, verificados contra el código por el planificador, y dos de ellos cerrados
con mediciones de solo lectura ese mismo día. Todo está incorporado al brief.

| Punto | Qué se hizo |
| --- | --- |
| La tanda seguía diciendo «emparejar por documento» | Corregido en la tanda |
| No estaba medido que el listado sin filtros trajera las archivadas | ✅ **Medido**: sin el parámetro de archivadas llegan 118, 5 archivadas. En el contrato |
| Qué puntaje llega de alguien con pruebas en otra vacante | ✅ **Medido, sin riesgo**: cada agenda trae su vacante y en los 118 tableros todas son de la del tablero; el índice de talento es **de la participación** (58 de 62 personas en varias vacantes tienen uno distinto en cada una). **El contrato decía que era de la persona y estaba mal**; corregido |
| Una vacante activa sin pruebas pasaba por usable | Aceptado: no usable, con el motivo que ya usa EvaluaTest. Hoy ninguna está así |
| El plazo puede tener decimales y PsicoAlianza usa días enteros | **Decidido por el usuario**: el adaptador lo trata como error permanente, y no aceptar decimales en la configuración de una empresa con PsicoAlianza va a los pasos 5 y 6. Medido en producción: **ninguna empresa tiene plazo propio**, todas usan el del entorno |
| Nadie tenía asignado que el embudo pase el plazo | **Asignado al paso 5**, junto al documento. Y el 4 no puede mandar ninguna empresa a PsicoAlianza antes del 5 |
| Quien no aparece en el tablero tras invitar se quedaba atascado para siempre | **Decidido por el usuario**: error permanente, comparando el documento sin espacios. **Amplía la decisión 39** |
| Los motivos de «no usable» llegan tal cual al portal, con la bolsa entera | Aceptado: motivos con nombre fijo y bolsa casi vacía. El texto que ve el reclutador, paso 6 |
| Sesión caducada en la consulta acaba como *no se pudo consultar* | Correcto hoy. **Hereda el 2c**: el reintento tras acuñar va dentro del adaptador o del cliente, no en el cron |
| El WhatsApp enseña nuestro correo enmascarado y PsicoAlianza avisa a otro | **Hereda el paso 4/5**, junto a las instrucciones de EvaluaTest del mismo mensaje |
| Cambios sin commitear en la documentación | Eran del planificador; no se mezclan con el diff del paso |

### Paso 3 — ✅ REVISADO (2026-09-14), pendiente de commit

El adaptador de PsicoAlianza, solo backend. Implementa las cinco operaciones del puerto **sin
registrarse en su token**, que sigue apuntando a EvaluaTest (con prueba). Por el camino, el cliente del
paso 2 gana el listado de vacantes sin filtros y manda los participantes como los manda el portal; el
tipo de la invitación del puerto gana el plazo, opcional; y el error de dato faltante puede nombrar el
documento. **Nada lo llama todavía y el flujo de la etapa no cambia.**

**Verificado por el planificador** sobre el conjunto: compila; backend **107 suites y 993 pruebas (984
pasan, 9 omitidas; 42 nuevas** desde las 951 del paso 2); todo en el índice; sin merge de `develop`;
EvaluaTest y el token del puerto intactos; sin comentarios nuevos en código ni identificadores en
español.

**Una corrección del planificador sobre el diff:** el cuerpo del correo no era el del portal —sin las
negritas y con otro texto en el enlace— porque **el contrato lo describía con palabras**. Se puso el HTML
exacto en el contrato, se corrigió el adaptador, y la prueba pasó de mirar si contenía dos frases a
comparar el cuerpo entero, con control negativo: sin las negritas, falla.

✅ **Invitación real de comprobación**, al documento y al correo del usuario, en una vacante donde **no
estaba** —comprobado antes de invitar, porque en una donde ya estuviera la invitación responde lo mismo
aunque no invite—: la 1135, OPERARIO DE PRODUCCIÓN — MANISOL. Por el adaptador compilado y la sesión
pegada:

| Qué | Resultado |
| --- | --- |
| Comprobar la vacante | Usable. Antes, la 4590 elegida primero salió **completada** y el script se paró sin invitar, que es lo que tiene que hacer |
| La invitación, **con la codificación del portal** | 201. La persona **aparece** en el tablero, con identificador y enlace personal. **Cierra el cambio de codificación** |
| El plazo | La agenda cierra **exactamente 2 días después** |
| El estado leído | *sigue en ello* |
| 🔴 **El estado de la agenda recién creada** | **`2` «Iniciada»**, que nunca se había visto: en la tanda, una invitación nueva salió «Agendada». Causa sin medir; lo probable es haber leído el tablero después de pedir el enlace. El adaptador lo trata como sin terminar, que es justo la guarda del brief. En el contrato |
| El registro del cliente | Método, ruta y código: **ni el documento ni el correo** |

⚠️ **Falta que el usuario confirme** que el correo llegó con el cuerpo nuevo y que se ve bien.

**Decisiones que no estaban en el brief**, aceptadas:

- **Un tablero vacío deja a cada persona como *no aparece*, no como *no se pudo consultar*** como en
  EvaluaTest. El cliente de PsicoAlianza falla ruidoso cuando la petición falla, así que un tablero vacío
  lo está de verdad; y a quien se consulta ya se le encontró allí al invitar, así que sigue esperando y
  el plazo corre, que es lo decidido (36).
- **El plazo se comprueba entre el nombre de vacante y los datos del candidato**: es configuración, como
  el nombre, y su error permanente gana a *falta un dato*.

**Lo que falta para que una persona real pase por PsicoAlianza**, que decide el orden de lo que sigue:
el paso 5 —plazo y documento desde el embudo, tipo de documento real—, el paso 4 —el resolvedor, que no
se enciende antes del 5—, y una forma de tener sesión en un servidor (2c).

#### Bloque D · presentar y reprobar — ✅ HECHO (2026-09-14). **Cierra A1**

El usuario presentó la prueba respondiendo a propósito lejos del perfil del cargo. Así se ve un
reprobado, que es lo que llevaba abierto desde la etapa 2:

| Campo | Antes de presentar | Después |
| --- | --- | --- |
| `estado` de la agenda | 1 *Agendada* | **3 *Finalizada*** |
| `recomendacion` | `0` | **`1`** |
| `estado_recomendacion` | «Pruebas pendientes» | **«No recomendado»** |
| `ajuste` | `null` | **`43.25`** |
| `indice_talento` | `-2.0` (centinela) | **`"43.3"`** |
| `fecha_procesamiento` | `null` | La hora en que se calificó |

🔴 **`recomendacion: 1` es «No recomendado».** El contrato solo tenía `0` pendiente y `3`
recomendado; **el 1 no estaba**. Sigue sin verse el `2`, que probablemente sea una banda intermedia.
**El adaptador no puede tratar «lo que no sea 3» como reprobado**: tiene que reconocer el 1 y dejar
lo desconocido como indeterminado, o una banda nueva descartaría gente sin que nadie lo decidiera.

**Lo demás que confirma esta ficha:**

- ✅ **El centinela `-2.0` se sustituye por la nota real al terminar**, tal como suponía la decisión
  37. Con una sola prueba, el índice del candidato es el ajuste de esa prueba redondeado a un
  decimal — con varias habrá que ver cómo pondera.
- ✅ **La etapa del candidato sigue en `9` «En pruebas»** aunque la prueba esté finalizada y no
  recomendada. Confirma el contrato: **la etapa no sirve para decidir nada**, el veredicto vive en la
  agenda.
- **El ajuste es contra un perfil con nombre** (aquí, uno «operativo»), que la agenda trae en un
  campo propio. Es lo que explica que un DISC pueda «reprobar»: no hay respuestas malas, hay
  distancia al perfil del cargo.
- ⚠️ **La ficha del participante trae datos personales que nosotros nunca mandamos** —nombre y
  apellidos, fecha de nacimiento, dirección, teléfonos, ciudad—, porque la persona ya existía en la
  plataforma. **El cliente no debe volcar esa ficha al registro**, que es justo la deuda conocida del
  proyecto con los clientes externos.

⚠️ **Lo que esta tanda dejó en la cuenta del cliente**: una persona de prueba invitada a una vacante
activa —que además tenía un participante real dentro, porque el contador decía cero— y hasta tres
correos de invitación a la misma dirección. Conviene sacarla del proceso a mano cuando el bloque D
termine.
