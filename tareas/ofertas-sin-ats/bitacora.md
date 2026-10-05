# Bitácora · crear ofertas sin ATS configurado

**La fuente única de la verdad de este frente.** Aquí están las decisiones numeradas, lo que el
código dice y los documentos no, lo que queda fuera, el avance y lo que hay que hacer antes de
desplegar. Los briefs apuntan aquí por número; no repiten las decisiones.

Qué se pide y el alcance acordado con la dirección: `requisitos.md`. Cómo funciona hoy y dónde
está cada pieza: `planning.md`, con las correcciones de *Lo que dice el código*, más abajo, que
ganan sobre él.

## Vocabulario de este frente

- **Portal** — un portal de empleo: Computrabajo, elempleo o Pandapé. Es lo que el código y la
  interfaz llaman «ATS».
- **Portal habilitado** — una credencial de portal de la empresa que no está marcada como
  deshabilitada. Es la única condición que miran hoy el backend y el portal para decidir si hay
  «algún ATS»; no comprueban que la credencial tenga usuario y contraseña.
- **Oferta sin plataformas** — una oferta cuya lista de plataformas está vacía. Hoy solo nace así
  en el modo demo o, con el modo de simulación de portales, si la empresa no tiene ninguno.
- **Canales manuales** — la carga masiva (el Excel) y el alta individual desde la ficha de la
  oferta.
- **Canales de publicación** — el término del aviso para el reclutador. Hoy son solo los portales.

## Decisiones

Las tres primeras vienen de `requisitos.md` (2026-09-23); aquí solo se numeran.

1. **Elegir canales por oferta no es de este frente**: está en `../canales-de-publicacion/`.
2. **LinkedIn no se prepara.** No existe en el código (comprobado el 2026-09-30, después de la
   fusión de `feature/new-bots`). La reunión con Elvis no bloquea este frente.
3. **El aviso habla de «canales de publicación», no de «ATS».**
4. **La estimación de 2,5 jornadas queda confirmada** (usuario, 2026-09-30).
5. **La confirmación del agente de WhatsApp cambia en este frente** (punto B; usuario, 2026-09-30).
   Cuando la oferta nace sin plataformas, deja de decir que el sistema ya busca candidatos y dice
   que se cargan a mano. Va en el paso 1. La instrucción al agente es: «La oferta quedó creada, pero
   no se publicará en ningún canal. Los candidatos se cargan a mano desde el portal de Essperto.»
   El agente la redacta con sus palabras: no es una plantilla de WhatsApp. **No nombra la
   causa**: la condición es que la oferta nazca sin plataformas, sea porque la empresa no tiene
   portales o, cuando llegue la tarea de canales, porque no se eligió ninguno. El texto no debe
   decir que la empresa no tiene canales habilitados (usuario, 2026-09-30).
6. **Las ofertas creadas sin portal no ganan uno después en este frente** (punto I). Lo cubre la
   tarea del paso nuevo de canales de publicación al crear la oferta, que incluye la opción «sin
   portal» (usuario, 2026-09-30).
7. **El aviso del formulario dice**: «No tienes canales de publicación habilitados. La oferta se
   creará, pero los candidatos tendrás que cargarlos a mano.» (usuario, 2026-09-30). Va a los textos
   del portal, en español y en inglés, y sustituye al aviso actual.
8. **En una empresa en modo demo, el agente de WhatsApp dice lo de hoy** («el sistema ya comenzó a
   buscar candidatos»), aunque la oferta nazca sin plataformas: en la demo el candidato se inyecta
   solo y empieza a recibir mensajes (usuario, 2026-09-30). Es una excepción a la condición de la
   decisión 5.
9. **Si falla la lectura del modo demo, cuenta como «no es demo»** (usuario, 2026-10-01, a propuesta
   del ejecutor en la opinión previa del paso 1). Laura no debe oír «no se pudo crear» de una oferta
   que sí existe, porque al reintentar la duplicaría. El coste es que, con la base caída en plena
   demo, el agente diría que los candidatos se cargan a mano. El fallo queda en el log.
10. **Una oferta sin canales y fuera de modo demo lleva la frase nueva aunque no nazca activa.** Hoy
    la creación siempre la deja activa; es solo para que ninguna variante prometa una búsqueda.
11. **El agente de WhatsApp anticipa la búsqueda solo en condicional** (usuario, 2026-10-01). Sin
    esto, el agente puede decirle a Laura «confírmame y el sistema empieza a buscar candidatos» y, un
    minuto después, que los candidatos se cargan a mano. El agente **no sabe antes de crear la oferta
    si tendrá canales** —ninguna herramienta ni instrucción se lo dice—, así que el texto le hace
    hablar en condicional («si tienes canales, el sistema buscará candidatos») y lo remite al
    resultado. La condición es sobre **la oferta**, no sobre la empresa, para que siga siendo cierta
    cuando se elijan canales por oferta, y habla de «canales de publicación», no de «ATS»
    (decisión 3). Cambian dos textos que lee el modelo, y solo en esa frase:
    - Las instrucciones generales, en el paso de confirmar, pasan a: «Solo si el reclutador confirma,
      llama a `create_offer` para publicarla. Si la oferta va a tener canales de publicación, el
      sistema empezará a buscar candidatos; el resultado de `create_offer` dice si es así. NUNCA
      crees la oferta sin confirmación.»
    - La descripción de la herramienta de crear la oferta pasa a: «Publica la oferta usando el ÚLTIMO
      borrador generado con draft_offer. Si va a tener canales de publicación, el sistema empieza a
      buscar candidatos. Llamar SOLO después de que el reclutador confirme explícitamente el
      borrador.»
    **Se conserva «publicar»** (corregido el 2026-10-01; una primera versión decía «crear»). En las
    instrucciones del agente, publicar es que la oferta deje de ser borrador y quede en marcha en
    Essperto («Borrador = pendiente de publicar»), no subirla a un portal. En ese sentido, la oferta de
    Laura sí se publica.
    No tiene prueba automática: se revisa en el diff y con una conversación por WhatsApp de Laura y
    otra de Pedro en el cierre.
12. **El agente no promete que llegarán candidatos a una oferta sin canales** (usuario, 2026-10-01).
    Laura pregunta al día siguiente «¿ya llegaron candidatos?»; hoy el agente le contesta que la
    oferta está publicada y que le avisará cuando lleguen, y no llegará nadie si ella no los carga.
    Cambian dos textos:
    - Lo que devuelve la consulta de **una** oferta sin candidatos: si la oferta no tiene canales, la
      instrucción al agente pasa a «Responde que la oferta no tiene canales de publicación, así que
      los candidatos no llegan solos: se cargan a mano desde el portal de Essperto.» Con canales,
      como hoy. **Sin excepción de modo demo**: allí el candidato entra enseguida y la oferta casi
      nunca está vacía.
    - La regla general de las instrucciones para ofertas sin candidatos cambia su ejemplo, que
      promete («Aún no llegan postulantes, apenas la publicamos. Te aviso en cuanto haya
      novedades.»), por uno neutro: «Si la oferta aún no tiene candidatos, dilo con naturalidad (ej.
      "Todavía no hay candidatos en esta oferta.") en vez de quedarte en silencio o volver a
      preguntar.» **Neutro y no dos ejemplos, uno por caso**: el agente solo sabe si la oferta tiene
      canales cuando consulta una sola; al consultar varias o la lista, la herramienta no se lo dice
      y tendría que adivinar cuál usar (usuario, 2026-10-01).
    La respuesta de varias ofertas a la vez («Sin postulantes todavía.») no se toca: es un dato, no
    una promesa.
13. **«En proceso» deja de decir que el sistema capta candidatos** (usuario, 2026-10-01). La
    definición aparece en tres sitios: las instrucciones generales y los dos resúmenes de la lista de
    ofertas. Pasa a decir, sin condición, que la oferta está activa y el sistema filtra y hace avanzar
    a los candidatos que entran. Es cierta para Laura y para Pedro; Pedro deja de oír «captando».
    Las decisiones 12 y 13 amplían el paso 1, que no tenía commit: van en el mismo diff.
14. **El formulario público de postulación cuenta como canal de publicación** (usuario,
    2026-10-01; ver punto L). Sofía, sin portales pero con el formulario encendido en Mi Compañía,
    comparte el enlace de la oferta y los candidatos se registran solos: no debe oír que se cargan a
    mano. «Sin canales» pasa a ser: sin ningún portal habilitado **y** con el formulario apagado.
    - **En el backend, una sola pregunta, «¿esta oferta tiene canales de publicación?»**, que usan
      los dos puntos del agente de WhatsApp (decisiones 5 y 12). Hoy: algún portal en la oferta, o el
      formulario encendido en la empresa. **Excepción a no abstraer para dos usos, confirmada por el
      usuario el 2026-10-01**: la tarea de canales cambia esa respuesta (canales elegidos por oferta,
      LinkedIn entre ellos) y así la cambia en un solo sitio. Si leer la empresa falla, cuenta como
      formulario apagado y queda en el log, con el mismo criterio que la decisión 9.
    - **En el portal (paso 2)**, el aviso del formulario sale sin ningún portal habilitado y con el
      formulario apagado.
    - **LinkedIn no se cuenta aparte**: hoy solo puede publicar con el formulario abierto.
    - Los textos aprobados (decisiones 5, 7 y 12) no cambian.
15. **Una empresa en modo demo no ve el aviso del formulario del portal** (usuario, 2026-10-04). Sus
    ofertas nacen sin canales y el candidato de prueba entra solo; quien presenta la demo crea la
    oferta desde el portal delante del cliente. Es la misma excepción que la decisión 8 para el
    agente. La marca del modo demo ya llega al portal en los datos de la empresa; solo falta
    declararla en su tipo.
16. **El aviso en inglés**: «You have no publication channels enabled. The offer will be created,
    but you'll have to add candidates manually.» (usuario, 2026-10-04).

## Lo que dice el código y los documentos no

Comprobado leyendo el código el 2026-09-30, sobre `develop` después de la fusión de
`feature/new-bots` (backend `18b5463`, portal `78062ea`), que entró **después** de la verificación
del planning. Esa fusión no toca la creación de la oferta ni su validación; sí cambia la analítica
(punto F) y el formulario de la oferta en otras zonas.

- **A. La validación es una sola y la cruzan cinco entradas.** El rechazo vive solo en la creación
  del servicio de ofertas. Lo atraviesan el portal, la API del agente (que crea borradores), la
  herramienta del agente de WhatsApp, el flujo de Maya por WhatsApp y el alta del superadmin.
  Quitarla abre las cinco a la vez. Comprobado buscando en todo el backend quién llama a la
  creación y quién lee las credenciales de portal de la empresa: no hay otra comprobación de «al
  menos uno». La búsqueda no cubre una comprobación escrita sin nombrar esas credenciales.
- **B. El agente de WhatsApp le confirma al reclutador algo que dejará de ser cierto.** Tras crear
  la oferta, le indica al modelo que diga «El sistema ya comenzó a buscar candidatos». Con cero
  portales no busca nadie. Maya dice solo que la oferta se creó, sin prometer nada.
- **C. El Computrabajo «preseleccionado» del formulario no hace nada** (corrige el punto 7 del
  planning). No es una elección de portal: es la fila vacía del identificador de una oferta ya
  publicada en el portal. Al armar la petición, el portal descarta las filas sin identificador, y
  el backend ignora lo que mande el formulario salvo en el modo de simulación. Las plataformas de
  la oferta salen siempre de las credenciales de la empresa. **No hay que cambiarlo.** La misma
  fila aparece en el panel «Vinculación ATS» del detalle, que solo se ve con las herramientas de
  desarrollo.
- **D. El aviso del formulario sí se puede ver hoy** (corrige el planning). Hay una cuarta entrada
  al formulario: el botón del listado vacío, el que ve una empresa sin ninguna oferta. Ese botón
  no está apagado. Hoy una empresa nueva sin portales abre el formulario, ve el aviso de que «se
  guardará pero no podrá publicarse», y al guardar recibe el rechazo del backend. Los otros tres
  —crear, crear con IA y copiar— sí están apagados, con su texto al pasar el ratón. Hay una quinta
  entrada, vista por el ejecutor en la opinión previa del paso 2: el listado abre el asistente de IA
  si su dirección lleva el parámetro de «abrir IA», aunque el botón esté apagado; hoy ninguna pantalla
  enlaza así. Las cinco llegan al mismo formulario y al mismo aviso, en el primer paso de la creación.
- **E. Con cero plataformas, ningún proceso automático avisa de nada.** Recorrido camino por camino:
  - *Publicación al crear*: los tres envíos a los robots buscan la credencial de su portal; sin
    ella escriben una línea en el log y salen. No hay aviso al reclutador ni correo.
  - *Publicación atascada* (cron de las 7:00) y *reintento de publicación*: solo recorren entradas
    pendientes o fallidas de la lista de plataformas. Con la lista vacía no hay ninguna.
  - *Extracción de candidatos* (cron cada 5 minutos): consulta el tope de la oferta, que es solo
    lectura, y luego recorre las plataformas; con la lista vacía no despacha nada ni marca nada.
  - *Extracción caída* (aviso de «hace N días que no entran candidatos»): exige una plataforma con
    fallos acumulados. No aplica.
  - *Rescate del filtro de compatibilidad*: salta las ofertas con una extracción en curso. Una
    lista vacía no tiene ninguna, así que la oferta sí se rescata, que es lo correcto para los
    candidatos de la carga masiva.
  - *Archivado en Pandapé al cerrar o vencer*: solo actúa si hay una entrada de Pandapé publicada.
  - *Reapertura para procesar más*: recorre las plataformas para reactivar la extracción; con la
    lista vacía no hace nada y la oferta se reabre igual.
- **F. El cierre, el vencimiento y el tope no dependen de las plataformas.** Cerrar por plazas
  llenas, por candidatos agotados o por llegar al máximo de procesados, vencer, y el tope de entrada
  —que es uno solo para todos los canales— miran solo los candidatos de la oferta y sus plazas.
- **G. Los canales manuales no dependen de las plataformas de la oferta.** La carga masiva y el
  alta individual comprueban el estado de la oferta, los créditos y el tope, y crean la
  participación con su propio origen (`bulk` o `manual`). El orquestador del embudo no lee las
  plataformas de la oferta en ningún punto: solo una herramienta de pruebas que inventa una.
- **H. La analítica ya separa por canal de entrada**, desde la fusión de `feature/new-bots`: la
  calidad se cuenta por el origen de cada candidato, y la carga masiva y el alta individual tienen
  su propia fila. Una oferta sin plataformas no distorsiona nada. Lo único visible es que, en la
  tabla de ofertas, la columna de plataformas sale vacía para esa oferta.
- **I. Una oferta sin plataformas se queda sin ellas.** Si la empresa configura un portal después,
  ninguna pieza lo añade a las ofertas ya creadas: las plataformas se fijan al crear. Solo se añade
  una al vincular a mano el identificador de una oferta ya publicada, desde las herramientas de
  desarrollo.
- **J. El índice sobre las plataformas de la oferta no es único en el código.** Una lista vacía no
  choca con otra. Pero la creación conserva un manejador de «ya existe una oferta con algún atsId»,
  señal de que existió un índice único. **Mongoose crea índices, no borra los viejos**: sin mirar la
  base no se puede afirmar que no quede uno (pregunta 4).
- **K. Ninguna prueba del backend afirma hoy el rechazo.** Varias arman una empresa sin credenciales
  y crean ofertas. Las del límite por miembro y del cobro por procesados fallan antes, en la reserva
  por miembro o en la validación del piso y el techo, sin llegar a la de plataformas; las demás usan
  el modo demo. Leído el 2026-09-30; el paso 1 lo confirma corriendo las pruebas.

- **L. LinkedIn y el formulario público ya existen** (corrige la decisión 2 y el punto H). Entraron
  en `develop` el 2026-10-01 con la rama de captación por redes de Elvis, en los dos repositorios,
  después de crear nuestras ramas. Comprobado leyendo esa fusión:
  - **El formulario público** se enciende por empresa en Mi Compañía. Cada oferta tiene «Compartir»,
    con un enlace y un QR; quien se registra entra como candidato de enlace público. **Visible hoy.**
  - **LinkedIn** se vincula a la empresa **aparte de los portales**, y se publica a mano desde la
    ficha de cada oferta, no al crearla. **El panel está escondido**: la publicación en redes está
    aplazada. El backend rechaza publicar en LinkedIn si el formulario no está abierto.
  - No toca la creación de la oferta ni el agente de WhatsApp. En el portal toca el formulario de la
    oferta, en otra zona que el aviso.

## Fuera del alcance, a sabiendas

- **Añadir un portal a las ofertas ya creadas cuando la empresa lo configura después** (punto I,
  decisión 6).
- **El agente de WhatsApp puede decir «no se pudo crear» de una oferta que sí se creó** (visto por
  el planificador en la opinión previa del paso 1; el usuario lo deja fuera el 2026-10-01). Después
  de crear, el agente guarda las preguntas de filtro y la prueba de EvaluaTest dentro del mismo
  bloque de errores: si ese guardado falla, Laura oye que no se pudo crear y, si reintenta, la oferta
  queda duplicada. Es anterior a este frente. La decisión 9 evita que la lectura del modo demo sume
  un caso más.
- **Elegir canales al crear la oferta por WhatsApp.** El usuario cree que el agente debería ofrecer
  esa elección (2026-10-01). Se revisa en la tarea de canales de publicación; si entra, la decisión 11
  se vuelve a tocar allí.
- **El aviso de Mi Compañía** («No hay ninguna plataforma ATS habilitada. Las ofertas no se
  publicarán en ninguna plataforma») exige además que la credencial tenga usuario, y el listado y el
  formulario no. Sigue siendo cierto; no se toca (visto por el ejecutor en el paso 2).
- **El texto de los botones y avisos del listado está escrito a mano en español**, fuera de los
  textos traducidos. El texto nuevo sí va a los textos; los que se quitan, se quitan.

## Preguntas abiertas

4. **El índice en el servidor de pruebas** (punto J). En producción está comprobado (usuario,
   2026-09-30): **no hay ningún índice único** sobre las plataformas, solo el `_id` y el de búsqueda
   del código. Falta correr la misma consulta en pruebas antes del cierre.
Cerradas el 2026-09-30: la 1 (decisión 4), la 2 (decisiones 5 y 7), la 3 (decisión 5), la 5
(decisión 6) y la 6 (decisión 8).

## Pasos

Rama `feat/offers-without-ats`, desde `develop`, en los dos repositorios.

| Paso | Qué | Repositorio | Estado |
| --- | --- | --- | --- |
| 1 | Quitar la validación, probar el caso nuevo y cambiar la confirmación del agente de WhatsApp (`brief-paso1-backend.md`), y los textos del agente de las decisiones 11 a 13 | backend | Hecho: `d6faaf9`. Sin PR |
| 1b | Fusionar `develop` (captación por redes) en las dos ramas | los dos | Hecho: backend `569d7a5`; portal igual a `develop` (`cbc47b1`). Revisado |
| 1c | La pregunta única «¿la oferta tiene canales?» con el formulario público (decisión 14; `brief-paso1c-formulario-publico.md`) | backend | Aprobado (2026-10-01). Pendiente de commit |
| 2 | Encender los tres botones y cambiar el aviso del formulario (`brief-paso2-portal.md`) | portal | Aprobado (2026-10-04). Pendiente de commit |
| Cierre | Fusión en `develop`, pruebas a mano en el servidor de pruebas y paso a `main` | los dos | Propuesto |

## Registro de avance

- **2026-09-30** — Bitácora creada. Comprobados contra el código los ocho puntos de *Lo que hay que
  comprobar* del planning (el 6 ya estaba resuelto): el 7 no cuadra (punto C) y el aviso sí se ve
  hoy (punto D). Ramas creadas en los dos repositorios desde `develop` (backend `18b5463`, portal
  `78062ea`), limpias. Sin brief escrito todavía.
- **2026-09-30** — Respuestas del usuario: decisiones 4 a 6. Quedan abiertas la 2 (textos) y la 4
  (índice de la base, con las consultas ya entregadas).
- **2026-09-30** — Textos elegidos (decisiones 5 y 7). Índice comprobado en producción. Escrito el
  brief del paso 1. Abierta la pregunta 6, sobre el modo demo.
- **2026-09-30** — Decisión 8: en modo demo el agente mantiene el mensaje de hoy. Brief del paso 1
  completo. Solo queda abierta la comprobación del índice en pruebas.
- **2026-10-01** — Opinión previa del paso 1 contestada. Línea base: **162 suites y 1.652 pruebas
  que pasan, 9 omitidas**. `develop` avanzó tres commits de verificación de requisitos (orquestador
  del embudo y una prueba suya, uno de ellos un reformateo) que no tocan la zona: no se traen ahora,
  **se traen en el cierre**. Decisiones 9 y 10, y un caso nuevo en *Fuera del alcance*. Corregida la
  prueba a mano del brief: en local el orquestador no está configurado.
- **2026-10-01** — Paso 1 revisado por el planificador, leyendo el diff preparado: cinco archivos,
  índice y árbol coincidiendo. Compila; **164 suites y 1.659 pruebas que pasan, 9 omitidas**, con la
  caché limpia: 7 más que la línea base. Decisiones del ejecutor aceptadas: la prueba de la creación
  configura también la clave de los robots y la dirección base, para que cada envío llegue de verdad
  a mirar la credencial, y exige los tres avisos del log; se reutiliza la imitación del control de
  entrada que ya tenía nombre en español, sin renombrarla. **Prueba a mano en local sin hacer.**
  **Pendiente del usuario**: dos textos que el modelo del agente de WhatsApp lee antes de crear la
  oferta (la descripción de la herramienta y las instrucciones generales) siguen diciendo que crearla
  pone al sistema a buscar candidatos.
- **2026-10-01** — Decisión 11: se cambian los dos textos, con la búsqueda en condicional y sobre
  la oferta. La elección de canales por WhatsApp queda para la tarea de canales. Vuelve al ejecutor
  junto con la pregunta sobre el aviso de Jest de un proceso que no cierra limpio. La prueba a mano
  en local se retira: las pruebas a mano van al servidor de pruebas, en el cierre (usuario).
- **2026-10-01** — **Paso 1 revisado y aprobado.** Seis archivos, índice y árbol coincidiendo; los
  dos textos de la decisión 11, literales. Compila; **164 suites y 1.659 pruebas que pasan, 9
  omitidas**, con la caché limpia, corrido por el planificador: **nueva línea base**. El aviso de Jest
  de un proceso que no cierra limpio ya salía antes del cambio. Listo para commit; sigue el paso 2.
- **2026-10-01** — Antes del commit, el usuario pide revisar «Publica»: se conserva (decisión 11
  corregida). Revisados todos los textos del agente de WhatsApp que hablan de publicar, buscar o
  recibir candidatos, buscando las palabras y leyendo cada uno en su contexto; la búsqueda no cubre
  una promesa escrita con otras palabras. Entran las decisiones 12 y 13. Quedan sin tocar: el resumen
  de varias ofertas, la foto del candidato leída de los portales y «Borrador = pendiente de
  publicar». El paso 1 vuelve al ejecutor.
- **2026-10-01** — **Paso 1 aprobado, tercera ronda.** Siete archivos, índice y árbol coincidiendo;
  los textos de las decisiones 11 a 13, literales. La consulta de ofertas del agente ya traía las
  plataformas de cada oferta: no hubo que añadir nada. Compila; **165 suites y 1.661 pruebas que
  pasan, 9 omitidas**, con la caché limpia, corrido por el planificador: **nueva línea base**. Listo
  para commit; sigue el paso 2.
- **2026-10-01** — Paso 1 commiteado (backend `d6faaf9`; documentación `9fb7ce2`). Al preparar el
  paso 2 aparece en `develop` la rama de captación por redes (punto L). Decisión 14: el formulario
  público cuenta como canal. **Antes de seguir**: fusionar `develop` en las dos ramas (el usuario) y
  revisar cada fusión; luego una cuarta ronda corta del backend, en un commit nuevo, y el brief del
  paso 2. **Alcance**: con esta ronda, las 2,5 jornadas quedan con poco margen.
- **2026-10-01** — Paso 1b revisado. Backend: `develop` fusionado (`569d7a5`); frente a `develop`
  solo difieren los siete archivos del paso 1. Hubo que instalar las dependencias que trae la rama de
  Elvis (`npm ci`, sin tocar el archivo de versiones): sin ellas no compila. Compila; **175 suites y
  1.742 pruebas que pasan, 9 omitidas**, con la caché limpia: **nueva línea base**. Portal: avanzó
  hasta `develop` sin commits propios, dependencias instaladas, tipos sin errores. ⚠️ **Quien levante
  el entorno después de esta fusión tiene que reinstalar dependencias en los dos repositorios.**
- **2026-10-01** — Opinión previa del 1c contestada: se lee el campo de la empresa y no el estado
  del enlace, que no existe hasta que alguien lo pide y además crearía una dependencia circular. La
  pregunta se llama `hasPublicationChannels` y recibe la oferta entera. En la consulta refleja cómo
  está el formulario hoy, no cuando se creó la oferta.
- **2026-10-01** — **Paso 1c revisado y aprobado.** Cinco archivos, índice y árbol coincidiendo.
  Compila; **176 suites y 1.748 pruebas que pasan, 9 omitidas**, con la caché limpia, corrido por el
  planificador: **nueva línea base**. Decisiones del ejecutor aceptadas: la pregunta acepta la lista
  de plataformas sin tipar y comprueba ella misma que sea una lista, porque la consulta del agente
  trabaja con la oferta sin tipar; y el fallo de lectura se resuelve dentro de la pregunta, sin
  bloque de errores en el agente. Listo para commit; sigue el paso 2.
- **2026-10-02** — Paso 1c commiteado (backend `fce7c54`; documentación `08ae406`). `develop` no
  avanzó. Escritos el brief del paso 2 y `pruebas-a-mano.md`, con los casos del portal y del agente
  para el cierre. Abierta la decisión 15.
- **2026-10-04** — Decisiones 15 (sin aviso en modo demo) y 16 (el aviso en inglés). Brief del paso 2
  completo. `develop` sigue sin avanzar.
- **2026-10-04** — Opinión previa del paso 2 contestada: el brief cuadra con el código. Se quita el
  envoltorio del texto al pasar el ratón de crear y crear con IA, que queda vacío; el texto nuevo se
  llama `noPublicationChannels`. Corregido el punto D (cinco entradas) y dos casos más en
  `pruebas-a-mano.md`.
- **2026-10-04** — **Paso 2 revisado y aprobado.** Cinco archivos, índice y árbol coincidiendo. Los
  tres botones solo se apagan sin empresa cargada (y copiar, también durante una copia); el aviso
  sale sin portales, con el formulario apagado y fuera de modo demo, desde los textos del portal en
  los dos idiomas. Tipos sin errores, corrido por el planificador; sin rastro de los textos viejos.
  **Con esto el frente está completo en la rama**; falta el cierre.

## Antes de desplegar

- 🔴 **Las pruebas a mano se corren en el servidor de pruebas**, no en local (usuario, 2026-10-01),
  con el frente entero en `develop`. Si allí está encendido el modo de pruebas de los portales, ese
  modo ya se saltaba la validación: ver crearse la oferta no prueba el paso 1, que queda cubierto por
  las pruebas automáticas. Allí se prueba lo que ve la persona: crear y cargar a mano, el agente de
  WhatsApp con Laura y con Pedro, y el aviso del formulario.
- **Backend primero, o los dos en la misma ventana.** Con el backend nuevo y el portal viejo, los
  botones siguen apagados y no pasa nada. Con el portal nuevo y el backend viejo, la empresa sin
  portales crea la oferta y recibe el error del backend.
