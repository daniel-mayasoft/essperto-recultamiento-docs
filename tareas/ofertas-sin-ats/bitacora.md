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
  —crear, crear con IA y copiar— sí están apagados, con su texto al pasar el ratón. Las cuatro
  entradas llegan al mismo formulario y al mismo aviso, en el primer paso de la creación.
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

## Fuera del alcance, a sabiendas

- **Añadir un portal a las ofertas ya creadas cuando la empresa lo configura después** (punto I,
  decisión 6).
- **El agente de WhatsApp puede decir «no se pudo crear» de una oferta que sí se creó** (visto por
  el planificador en la opinión previa del paso 1; el usuario lo deja fuera el 2026-10-01). Después
  de crear, el agente guarda las preguntas de filtro y la prueba de EvaluaTest dentro del mismo
  bloque de errores: si ese guardado falla, Laura oye que no se pudo crear y, si reintenta, la oferta
  queda duplicada. Es anterior a este frente. La decisión 9 evita que la lectura del modo demo sume
  un caso más.
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
| 1 | Quitar la validación, probar el caso nuevo y cambiar la confirmación del agente de WhatsApp (`brief-paso1-backend.md`) | backend | Brief escrito |
| 2 | Encender los tres botones y cambiar el aviso del formulario | portal | Propuesto |
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

## Antes de desplegar

- **Backend primero, o los dos en la misma ventana.** Con el backend nuevo y el portal viejo, los
  botones siguen apagados y no pasa nada. Con el portal nuevo y el backend viejo, la empresa sin
  portales crea la oferta y recibe el error del backend.
