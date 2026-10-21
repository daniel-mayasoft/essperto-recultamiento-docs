# Bitácora · candidatos por canal en analítica

**La fuente única de la verdad de este frente.** Aquí están las decisiones numeradas, lo que el
código dice y los documentos no, lo que queda fuera, el avance y lo que hay que hacer antes de
desplegar. Los briefs apuntan aquí por número; no repiten las decisiones.

Qué se pide y el alcance acordado con la dirección: `requisitos.md`, empezando por su tabla
*Actualizado el 2026-10-19*. Cómo funciona hoy y dónde está cada pieza: `planning.md`, empezando por
su sección *Actualizado el 2026-10-19*, con las correcciones de *Lo que dice el código*, más abajo,
que ganan sobre él.

## Vocabulario de este frente

- **La tabla** — «Calidad por canal de entrada», en el panel global de la analítica. La añadió Elvis
  el 2026-09-30 (`054a480`). Esta tarea la completa; no hace otra.
- **Participación** — el registro de una persona dentro de una oferta. Una persona tiene una sola por
  oferta.
- **Origen** — por dónde entró esa persona a esa oferta, guardado en la participación: portal, alta
  individual, carga masiva o enlace público. Nulo en las participaciones anteriores al 2026-09-21, que
  se leen como portal.
- **Detalle de origen** — un segundo dato de la participación. Hoy solo se escribe con el enlace
  público: `linkedin`, o `manual` para el enlace que el reclutador compartió por su cuenta.
- **Ficha de la persona** — el registro único de la persona. Su lista de portales acumula todos por
  los que llegó alguna vez, a cualquier oferta.

## Decisiones

Tomadas con el usuario el 2026-10-19.

1. **Estimación: 2 jornadas**, la del estratega. Al usuario le es indiferente.
2. **Una participación vieja de portal cuyo portal no se puede saber va a una fila «Portal sin
   identificar»**: cuando la persona y la oferta tienen dos o más portales en común, o ninguno. No se
   inventa el dato ni se reparte. Las nuevas no tienen el problema (decisión 7). Su tamaño se mide en
   la base antes del brief (punto H).
3. **Canales que salen en cero**: alta individual y carga masiva siempre; cada portal configurado y
   habilitado en la empresa; el enlace compartido si la empresa tiene el formulario público encendido;
   LinkedIn si tiene la cuenta vinculada. Un canal que ya no está disponible pero trajo gente en el
   periodo sale igual, con sus cifras. **Ampliada por las decisiones 16 a 18.**
4. **«En el periodo» es la creación de la oferta**, como el resto del panel (punto C).
5. **Se retira el campo viejo `atsPlatforms` de la respuesta de la analítica**, y el portal quita su
   respaldo. Comprobado el 2026-10-19: solo lo lee la pantalla de analítica, y solo ella llama a ese
   cálculo. 🔴 **Hay homónimos**: `atsPlatforms` también nombra la elección de portales del agente de
   WhatsApp y de Maya, y un campo de la configuración de las etapas en el portal. No tienen nada que
   ver: el retiro se hace editando, nunca con un buscar y reemplazar.
6. **Se conservan las columnas de viables** (número y tasa) en todos los canales.
7. **El portal se guarda a partir de ahora en el detalle de origen** que ya usa el enlace público,
   al vincular a alguien desde un portal. No se crea un campo nuevo.
8. **Nombres de las filas**: «Enlace compartido» («Shared link») para el enlace que el reclutador
   comparte por su cuenta, y «LinkedIn». El resto de etiquetas, en el brief del portal.
9. **No se avisa a Elvis** (usuario, 2026-10-19; corrige la primera versión, que decía que sí). Era
   solo un aviso de cortesía de que se toca su tabla; nada de la tarea depende de él.
10. **Script de relleno para lo viejo** (usuario, 2026-10-19; punto I), en vez de deducir el portal
    cada vez que se abre la analítica. Escribe una sola vez, solo donde el dato está vacío:
    - una participación de portal cuya persona comparte **un solo** portal con la oferta → ese portal,
      en el detalle de origen (12.140 en producción; la referencia afinada es 12.136, punto L);
    - una participación sin origen y marcada como añadida a mano que **pasó por la petición de hoja de
      vida** → origen carga masiva (1);
    - una participación sin origen y marcada como añadida a mano que no pasó por ella → origen alta
      manual (26 altas individuales y **17 candidatos sintéticos de demo**, que el sistema crea
      imitando un alta individual);
    - el resto se queda vacío → «Portal sin identificar» (unas 2.600).
    Los 17 de demo como alta manual: confirmado por el usuario el 2026-10-19. No se excluyen de la
    analítica: solo existen en empresas de demostración y la analítica es de cada empresa, así que
    nunca inflan las cifras de un cliente real.
11. **El candidato sintético del modo demo se guarda con origen alta manual** a partir de ahora. Hoy
    se crea sin origen y la tabla lo cuenta como portal. Va en el paso 1. Confirmado por el usuario el
    2026-10-19.

Tomadas en la opinión previa del paso 1, el 2026-10-19.

12. **Al vincular desde un portal, el portal se guarda solo si no hay duda** (usuario; punto K): todo lo
    que manda el robot nombra el mismo portal, y ese portal es uno de los de la oferta. Si no, el
    detalle de origen queda vacío —sale como «Portal sin identificar», como la decisión 2— y queda una
    línea en el registro de la aplicación con la oferta y los portales recibidos, sin datos de la
    persona. Quedarse con el primero de la lista sería inventar el dato.
13. **En el script, «portal de la oferta» es el que tiene identificador externo** (punto L): por los
    que nunca se publicaron no pudo llegar nadie. En producción no cambia ninguna cifra.
14. **El script escribe localizando la participación por persona, no por posición**, con todas las
    condiciones de su regla dentro de la misma escritura, y una operación por participación para que
    las saltadas se cuenten bien. Las reglas y la escritura viven en el código fuente, con pruebas; el
    script solo recorre la base, carga las fichas por oferta y da el resumen, usando la versión
    compilada. Así la verificación no puede salir en verde sin haber probado lo que corre.
15. **Los comentarios que se vuelven falsos se recortan, sin añadir texto** (la regla de cero
    comentarios del proyecto). Si lo que queda deja de ser cierto, se borra entero.

Tomadas antes del brief del paso 2, el 2026-10-19 (usuario).

16. **Un canal se esconde solo si la empresa no puede usarlo hoy y nunca le trajo a nadie.** «Alguna
    vez», no «en el periodo»: se mira en todas las ofertas de la empresa, sin ningún filtro. Caso:
    LinkedIn trajo 5 personas en septiembre y caducó en octubre; mirando octubre, Marta ve «LinkedIn:
    0», no la fila desaparecida. Igual un portal que la empresa apagó después de usarlo. Sustituye a la
    última frase de la decisión 3.
17. **LinkedIn «se puede usar» si la cuenta está conectada del todo y el formulario público está
    encendido** (punto P). Sin página elegida, con la conexión caducada o con el formulario apagado, no
    puede traer a nadie, y solo sale si alguna vez trajo a alguien (decisión 16).
18. **«Portal sin identificar» queda fuera de la decisión 16**: sale solo si tiene candidatos en el
    periodo. Casi todas las empresas tienen gente vieja sin portal identificado, y con la regla de
    «alguna vez» saldría en cero para siempre en cualquier periodo nuevo.
19. **Computrabajo sale en cero aunque la empresa llegue a él a través de Pandapé** (usuario,
    2026-10-19, en la opinión previa del paso 2). Quien postula en Computrabajo por la republicación de
    Pandapé lo trae el robot de Pandapé y cuenta como Pandapé; «Computrabajo: 0» es cierto para la
    publicación directa, que el reclutador puede elegir en cualquier oferta. La aclaración en la fila de
    Pandapé se decide en el paso 3. **En producción ninguna empresa está en ese caso** (consulta del
    usuario, 2026-10-19).

Tomadas antes del brief del paso 3, el 2026-10-20 (usuario).

20. **Los textos de la tabla**: título «Candidatos por canal» («Candidates by channel»); filas
    Computrabajo, ElEmpleo y Pandapé, escritos como en el resto del portal y en los dos idiomas;
    LinkedIn; «Enlace compartido» («Shared link»); «Alta manual» («Manual entry») y «Carga masiva»
    («Bulk upload»), sin cambios; y «Portal sin identificar» («Unidentified job board»). Un canal que el
    portal no conozca sale con su nombre legible, como hoy.
21. **Una fila sin candidatos muestra «—» en la tasa de viables**, no «0 %»: no trajo a nadie, que no
    es lo mismo que «nadie de los que trajo era viable».
22. **«Portal sin identificar» lleva una explicación al pasar el ratón**: «Candidatos que llegaron por
    un portal antes de que el sistema guardara por cuál.» («Candidates who came from a job board before
    the system recorded which one.»). La aclaración de Pandapé con Computrabajo (decisión 19) no se
    pone: ninguna empresa está en ese caso.

## Lo que dice el código y los documentos no

Comprobado leyendo `develop` el 2026-10-19 (backend `740f478`, portal `986bead`). La tabla de estado
de `requisitos.md` se sostiene punto por punto; estas son las correcciones y los matices.

- **A. 🔴 El cruce «por el identificador de la vacante» no existe** (corrige el planning). La lista de
  portales de la ficha guarda **el identificador de la persona en ese portal**, no el de la vacante:
  el contrato del robot lo describe como «plataforma + id externo» del candidato, y la base tiene un
  índice **único** sobre portal e identificador en toda la colección de personas, que chocaría con dos
  candidatos de la misma vacante. Con lo que hay guardado, para lo anterior solo se puede cruzar **qué
  portales tienen en común la persona y la oferta**. Si es uno, es ese; si son dos o más, o ninguno,
  no se puede saber.
- **B. El portal sí se conoce al vincular a alguien desde un portal.** La llegada desde un portal
  recibe del robot la plataforma y crea la participación con origen «portal», pero no guarda cuál.
  Guardarlo a partir de ahora es una línea en ese punto.
- **C. La participación no guarda cuándo llegó la persona.** No tiene fecha propia: solo la del cobro
  (que no todas tienen) y las de sus etapas. Filtrar por «llegada en el periodo» exigiría un dato
  nuevo, y lo anterior quedaría sin él.
- **D. La tabla solo está en el panel global.** El detalle de cada oferta no la tiene; para ver una
  oferta se elige en el filtro de Ofertas, como el resto del panel.
- **E. La tabla se esconde si no hay ningún canal con candidatos.** Con los ceros tiene que salir
  siempre.
- **F. El enlace público ya distingue LinkedIn del enlace compartido** en el detalle de origen, y lo
  que no reconoce lo guarda como compartido. LinkedIn no depende de nadie.
- **G. Hoy, la suma de las filas puede pasar del total de candidatos**: una persona que llegó por
  portal y tiene dos portales en su ficha suma en los dos.

- **H. Casi todas las participaciones de portal están en ofertas con dos portales** (consulta del
  usuario, 2026-10-19, presumiblemente en producción): 15 en ofertas sin ningún portal, 34 en ofertas
  con uno y **14.724 en ofertas con dos**. Medido después, cruzando cada participación con la ficha de
  su persona: **12.140 (82 %) comparten un solo portal con su oferta** y se resuelven; **1.230 (8 %)
  comparten dos**; **1.403 (10 %) no comparten ninguno**. Ese último grupo es sospechoso: sugiere que
  no todas llegaron por portal. Hipótesis en comprobación: las altas manuales anteriores al
  2026-09-21, que tienen el origen vacío y se leen como portal, pero llevan la marca de añadidas a mano.
  Según git, la marca de añadido a mano existe desde el 2026-07-15, la carga masiva desde el
  2026-09-02 y el origen desde el 2026-09-21: entre el 2 y el 21 de septiembre, también las cargas
  masivas llevan la marca y el origen vacío. Se distinguirían porque la carga masiva es lo único que
  hace pasar a la persona por la petición de hoja de vida (`cv_request`); el alta individual entra
  directa a las preguntas. **Comprobado en producción el 2026-10-19**: de las 11.463 participaciones
  sin origen, solo 44 llevan la marca: 26 altas individuales (agosto y septiembre), 1 carga masiva
  (septiembre, con la petición de hoja de vida) y 17 candidatos sintéticos de empresas en modo demo.
  Las otras ~1.360 del grupo sin portal en común llegaron de verdad por portal y no hay dato que diga
  cuál.
- **J. La marca de añadido a mano la ponen tres caminos**, no uno: el alta individual (desde el
  2026-07-15), la carga masiva (desde el 2026-09-02) y **el candidato sintético del modo demo** (desde el
  2026-09-08). 🔴 **El modo demo sigue creando hoy participaciones sin origen**, que la tabla cuenta como
  portal (decisión 11).
- **I. Rellenar en la base lo que se pueda deducir** (propuesta del usuario, 2026-10-19): un script
  que escriba una sola vez el portal en las participaciones viejas que se resuelven, en vez de
  deducirlo cada vez que se abre la analítica. Lo escribe el ejecutor, en el repositorio, con modo de
  prueba que solo cuenta, solo escribe donde el dato está vacío, idempotente y con pruebas; lo corre
  el usuario, primero en el servidor de pruebas y después en producción, con copia de seguridad
  antes. La base no tiene otro historial que diga el portal por oferta: las corridas de los robots no
  guardan el portal, y la ficha de la persona no dice a qué oferta llegó por cada uno.

Vistos en la opinión previa del paso 1 y comprobados por el planificador el 2026-10-19.

- **K. El robot manda una lista de pares «portal + identificador de la persona»**, con al menos uno
  válido o la llamada se rechaza. El contrato no obliga a que sea uno solo, pero en la práctica lo es:
  cada corrida trabaja un portal. 🔴 **La lista cerrada de portales solo se valida cuando la lista llega
  como JSON**; cuando llega como texto, que es lo habitual porque viene con la hoja de vida adjunta,
  solo se pasa a minúsculas. De ahí la decisión 12.
- **L. Una oferta guarda una entrada por cada portal de la empresa, aunque nunca se publicara**
  (pendiente, fallida, a falta de plan), y esas no tienen identificador externo hasta publicarse. El
  robot solo recoge en las publicadas o en borrador. **Medido en producción el 2026-10-19 con los dos
  criterios** (todas las entradas, o solo las que tienen identificador), sobre las participaciones de
  portal sin la marca de añadida a mano: dan **lo mismo**, 12.136 con un portal en común, 1.229 con dos
  o más y 1.368 con ninguno. **La cifra de referencia del modo de prueba en la regla 3 es 12.136** más
  lo que haya entrado desde entonces; los 12.140 del punto H incluían algunas de las marcadas a mano.
  En `develop` no hay código que quite entradas de esa lista: se buscaron las formas de sacar, filtrar
  o reasignar la lista y la edición de la oferta no la toca. La búsqueda no cubre que se reescriba el
  documento entero. Hay que volver a mirarlo al fusionar `develop`, por «Canales de publicación».
- **M. La llamada de prueba que abre WhatsApp con un teléfono** crea una participación sin origen y le
  pone a la persona un Computrabajo inventado («test-» más el teléfono). La regla 3 podría tomarlo como
  real. **En producción no hay ninguna** (2026-10-19). No se toca.
- **N. Para el paso 2: «manual» significa dos cosas.** En el detalle de origen es el enlace compartido;
  en el origen, el alta individual. La analítica los lee siempre juntos.

Comprobados por el planificador antes del brief del paso 2, el 2026-10-19 (backend `3cbc499`).

- **O. «Portal configurado» ya tiene criterio en el código**: la API de la empresa marca un portal como
  configurado si tiene contraseña guardada, y el paso de canales del portal exige además usuario
  (decisión 8 de «Canales de publicación»). Habilitado es no estar apagado; un portal sin el dato cuenta
  como encendido. El interruptor general «Portales de empleo» no es un dato propio: apagarlo apaga cada
  portal.
- **P. LinkedIn tiene tres estados de conexión**: conectada, a falta de elegir la página de la empresa,
  y caducada. Solo publica conectada, y su candidato entra por el formulario público. **En producción
  ninguna empresa ha conectado LinkedIn y nadie ha entrado por el enlace público** (consultas del usuario,
  2026-10-19).
- **Q. «Canales de publicación» está cerrada**: en `main` y desplegada en producción el 2026-10-14. Una
  fusión de `develop` no trae nada suyo a medias.
- **R. La analítica carga hoy la ficha de cada candidato del periodo** para saber sus portales, y lo
  usan solo la tabla por canal y el campo viejo. Con el paso 2 no lo usa nadie y se retira. La analítica
  es siempre de una sola empresa, y ya lee su documento para el modelo de cobro.

## Fuera del alcance, a sabiendas

- **La llamada de prueba de WhatsApp** (punto M) sigue creando participaciones sin origen y un portal
  inventado. Sin casos en producción.

## Preguntas abiertas

Ver el registro de avance del 2026-10-19: se le presentan al usuario numeradas.

## Pasos

Rama `feat/candidates-by-channel`, desde `develop` (backend `740f478`, portal `986bead`), en los dos
repositorios. Pasos aprobados por el usuario el 2026-10-19.

| Paso | Qué | Repositorio | Estado |
| --- | --- | --- | --- |
| 1 | Guardar el origen completo: el portal al vincular desde un portal, el origen del candidato de demo (decisión 11), y el script de relleno con modo de prueba (decisión 10). **Tratamiento completo**: escribe en producción | backend | Revisado y aprobado; commit del usuario pendiente (`brief-paso1-origen-completo.md`) |
| 2 | La analítica: lee el origen guardado, separa LinkedIn del enlace compartido, los ceros y el retiro del campo viejo | backend | Revisado y aprobado; commit del usuario pendiente (`brief-paso2-analitica.md`) |
| 3 | La tabla «Candidatos por canal», con un nombre por fila y visible siempre (decisiones 20 a 22) | portal | Brief escrito (`brief-paso3-tabla.md`) |
| Cierre | Fusionar `develop`, desplegar, **correr el script justo después** (pruebas, luego producción, con copia de seguridad), pruebas a mano y avisar del cambio de cifras | los dos | Propuesto |

## Registro de avance

- **2026-10-19** — Bitácora creada. Leídos `requisitos.md` y `planning.md`, con sus secciones del
  2026-10-19; comprobada la tabla de estado contra `develop`. Corregido el cruce del planning (punto A).
  Ramas creadas en los dos repositorios, limpias y sin seguimiento a `develop`, para que un envío no
  acabe ahí. Sin brief.
- **2026-10-19** — Consulta del usuario sobre los portales de las ofertas (punto H). Decisiones 1 a 9.
  Pendiente: medir en la base cuántas participaciones quedan «sin identificar» (decisión 2) y el
  mensaje a Elvis.
- **2026-10-19** — Paso 1: opinión previa del ejecutor, contestada contra el código. Línea base: 203
  conjuntos de pruebas pasan y 1 omitido; 2.112 pruebas pasan y 43 omitidas. Decisiones 12 a 15, puntos
  K a N. Dos consultas del usuario en producción: ninguna persona creada por la llamada de prueba
  (punto M), y la medición del punto L.
- **2026-10-19** — Paso 1 revisado por el planificador. Verificación corrida sobre el conjunto: compila;
  205 conjuntos pasan y 2 omitidos, 2.140 pruebas pasan y 49 omitidas (las 6 de más omitidas son la
  prueba en vivo contra Mongo local, que el ejecutor corrió a propósito: 6 de 6). El script está en
  `scripts/`, que el `.gitignore` excluye: entra forzado al índice, como los demás scripts versionados.
  Una persona repetida dos veces en la misma oferta sale en el resumen como una escrita y una
  «saltada»: la primera escritura rellena las dos copias. **En producción no hay ninguna** (consulta
  del usuario, 2026-10-19).
- **2026-10-19** — Paso 2: opinión previa contestada. Línea base: 205 conjuntos pasan y 2 omitidos; 2.140
  pruebas pasan y 49 omitidas. Aprobado:
  - la historia de canales sale de una agregación por pareja origen + detalle, sin filtros;
  - la empresa se lee una sola vez, solo con los subcampos necesarios y sin los tokens de las cuentas
    sociales;
  - la regla de «portal utilizable» de la publicación pasa a una función suelta que usan la publicación
    y la analítica, sin tocar sus copias en el servicio de ofertas;
  - se retira la ficha del candidato del módulo de la analítica;
  - empates en orden fijo: los tres portales, LinkedIn, enlace compartido, alta manual, carga masiva,
    portal sin identificar y el resto por nombre;
  - tasa 0 en las filas en cero, y el «—» se decide en el paso 3.
  Decisión 19.
- **2026-10-19** — Paso 2 revisado por el planificador, con dos ajustes pedidos en la revisión: se
  borró entero el comentario del identificador de canal, que había quedado engañoso, y la agregación
  de la historia proyecta solo el origen y el detalle antes de desplegar las participaciones.
  Verificación corrida sobre el árbol final: compila; 205 conjuntos pasan y 2 omitidos; 2.162 pruebas
  pasan y 49 omitidas. Los dos conjuntos que fallaron en la máquina del ejecutor (plan de la empresa
  en administración y tope de la carga masiva) eran tiempos agotados por carga: pasan sin cambios.
  Para el paso 3, la respuesta trae un identificador de canal por fila: `computrabajo`, `elempleo`,
  `pandape`, `ats` (portal sin identificar), `manual`, `bulk`, `linkedin`, `shared_link`, más la de
  cualquier origen nuevo, con su propio nombre.
- **2026-10-20** — Revisado `develop` antes de fusionar y desplegar en pruebas (usuario). Backend: 6
  commits de Elvis desde `740f478`, hasta `dcb59c5` (archivado de Pandapé, prioridad del orquestador,
  aviso de tareas atascadas, compatibilidad mínima de 0,35, reintento del indexado). Comparte con esta
  rama el servicio de ofertas y el esquema de la oferta, pero en otras zonas: la fusión simulada no da
  conflictos. Variables nuevas, todas opcionales o con valor por defecto; sin dependencias nuevas.
  Portal: `develop` sigue en `986bead`. **Se despliega en pruebas sin el paso 3**: la tabla del portal
  todavía tiene el título viejo, y las filas `linkedin` y `shared_link` salen sin traducir.
- **2026-10-20** — Pasos 1 y 2 fusionados en `develop` (`98b340a`, con un commit más de Elvis,
  `1a876aa`, sobre el archivado de Pandapé, sin relación). Verificado `develop` fusionado: 210
  conjuntos y 2.202 pruebas pasan. Desplegado en pruebas, sin nada raro según el usuario. Script corrido
  por el usuario en pruebas: modo de prueba con 58 ofertas, 0 en la regla 1, 0 en la regla 2, 531 en
  la regla 3, 238 sin portal en común y 0 con dos o más; la pasada real escribió 531 y saltó 0; una
  segunda pasada en modo de prueba dio 0 en las tres reglas. La proporción sin portal en común (31 %)
  es mayor que en producción, por el modo de simulación de portales y los candidatos de prueba.

## Antes de desplegar

- 🔴 **El script de relleno se corre justo después de desplegar el backend**: primero con `--dry-run`
  en el servidor de pruebas y después de verdad; luego en producción, **con copia de seguridad antes**,
  primero con `--dry-run`. Lo corre el usuario. Hasta que se corra, lo viejo sale como «Portal sin
  identificar» una vez desplegado el paso 2.
  - Dentro del contenedor, desde su raíz: `docker exec selessia-backend node
    scripts/backfill-candidate-source.mjs --dry-run`, y después sin `--dry-run`. Usa la versión
    compilada de las reglas, que la imagen genera al construirse; la conexión sale del entorno del
    contenedor.
  - En producción, el modo de prueba debería dar: regla 1 · carga masiva, 1; regla 2 · alta manual,
    43; regla 3, unas 12.136; sin resolver, unas 1.368 sin portal en común y 1.229 con dos o más (punto
    L). Las tres últimas crecen con lo que haya entrado por portal antes del despliegue.
  - En la pasada real, **«saltadas» tiene que ser cero**: en producción no hay personas repetidas en
    una misma oferta (registro de avance del paso 1). Si sale otra cifra, algo cambió la lista mientras
    corría y hay que mirarlo antes de seguir. Una segunda pasada debe dar cero en las tres reglas.

- **A producción van el backend y el portal juntos** (usuario, 2026-10-20): el paso 3 se espera para no
  enseñar a los clientes la tabla a medio terminar.

- **Avisar de que las cifras de los portales cambian, a la baja**: deja de contarse a una persona en
  un portal por otra oferta (`requisitos.md`, *Notas de alcance*).
