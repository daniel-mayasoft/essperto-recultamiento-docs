# Bitácora · paso de canales de publicación al crear la oferta

**La fuente única de la verdad de este frente.** Aquí están las decisiones numeradas, lo que el
código dice y los documentos no, lo que queda fuera, el avance y lo que hay que hacer antes de
desplegar. Los briefs apuntan aquí por número; no repiten las decisiones.

Qué se pide y el alcance acordado con la dirección: `requisitos.md`. Cómo funciona hoy y dónde está
cada pieza: `planning.md`, empezando por su sección *Actualizado el 2026-10-07*, con las correcciones
de *Lo que dice el código*, más abajo, que ganan sobre él. La tarea hermana, cerrada:
`../ofertas-sin-ats/bitacora.md`.

## Vocabulario de este frente

- **Portal** — Computrabajo, elempleo o Pandapé. En el código, «ATS».
- **Canal de publicación** — por dónde se difunde la oferta para que lleguen candidatos solos: hoy,
  los tres portales y el formulario público de postulación. LinkedIn existe, pero aplazado.
- **Portal habilitado** — una credencial de portal de la empresa no marcada como deshabilitada.
- **Lista de plataformas de la oferta** — las entradas de portal que la oferta guarda al crearse. De
  ella leen la extracción de candidatos, la analítica y `hasPublicationChannels`.
- **El paso** — el paso nuevo de canales al final del asistente de creación.

## Decisiones

1. **Alcance** (usuario, 2026-10-07):
   - **Entra**: el paso con los tres portales, sus valores por defecto y los no configurados
     deshabilitados; la oferta guarda solo lo elegido, comprobado en el backend; el punto único de
     decisión; la regla de Pandapé y Computrabajo (decisión 6); **el interruptor «Portales de
     empleo»**, que al final vive solo en el portal (decisión 11).
   - **Pendiente, al final si sobra**: elegir canales al crear por WhatsApp. El agente todavía no está
     en uso y el simulador del servidor de pruebas no llega a su línea: solo se podría comprobar con
     pruebas automáticas.
   - **No entra**: el formulario público como casilla por oferta (sigue siendo de la empresa),
     LinkedIn como casilla (su publicación está aplazada y escondida), y que las ofertas viejas ganen
     un portal después.
2. **Un portal configurado pero deshabilitado en la empresa sale deshabilitado en el paso**, igual que
   uno no configurado (usuario, 2026-10-07). Si la empresa lo apagó, es por algo (por ejemplo, Pedro
   apagó elempleo por falta de créditos).
3. **La arquitectura copia la de las redes sociales** (usuario, 2026-10-07): una interfaz común de
   canal de publicación, una pieza por portal que envuelve la función de publicación que ya tiene
   **sin cambiar cómo publica**, y un registro de canales. El punto único de decisión recorre lo
   elegido para la oferta y le pide a cada canal que publique. Alcance de la interfaz: **publicar y
   decir si el canal está disponible para la empresa**. La extracción, el archivado y las credenciales
   desde un solo sitio siguen fuera. Precedente: el publicador y el registro de redes sociales de la
   rama de captación por redes.
4. **La estimación no se ajusta** (usuario, 2026-10-07): con lo que entra, la cuenta del planificador
   es de unas 4,5 jornadas frente a 3, sin WhatsApp. El usuario decide no replantearla.
5. **El punto único de decisión se aplica en la creación**; los reintentos ya actúan solo sobre el
   portal de la oferta que falló (punto B). Confirmada por el usuario el 2026-10-07, con el caso de
   Pedro: crea una oferta solo con Computrabajo, falla por créditos, la reintenta, y el reintento no
   puede llegar a Pandapé porque no está apuntado en la oferta. Lo acordado con la dirección («la
   función única se usa al crear, al republicar y al reintentar») se cumple en el resultado —la oferta
   solo sale donde se eligió, también al reintentar— pero no en la forma: los reintentos no pasan por
   el punto único, y la «republicación» no existe en el código. No es un recorte que haya que
   comunicar. Va con la decisión 7, que cierra el único hueco.
6. **La republicación de Pandapé en Computrabajo pasa a depender de un dato de la empresa**
   (usuario, 2026-10-08; punto C). Lo integró Elvis el 2026-08-03 («feat(pandape): republicar en
   Computrabajo al publicar de verdad»), pensado para el único cliente que usa Pandapé (usuario), y hoy
   está fijo en el código para todas las empresas. Es la tercera versión: la primera la hacía
   configurable desde la pestaña Flujo y la segunda dejaba la lógica intacta con un dato que solo
   leía el paso; esta es la más barata y la única en que el dato no puede mentir.
   - **Cómo funciona hoy** (releído el 2026-10-08): la publicación de Pandapé le pide al robot que
     republique en Computrabajo con **una sola línea fija en «sí»**, sin ninguna condición, y es el
     único sitio del backend que lo pide. La republicación la hace Pandapé con su propia cuenta y sus
     créditos, en su paso «Divulgación»; no usa las credenciales de Computrabajo de la empresa. La
     prueba de Pandapé de las herramientas de desarrollo no manda esa línea y el robot entonces no
     republica.
   - **El cambio en lo de Elvis es esa línea**: deja de ser «sí» fijo y lee el dato de la empresa.
     Cómo publica el robot no cambia. Los reintentos pasan por la misma publicación, así que lo
     respetan solos.
   - **El dato: aparte de las credenciales, uno a muchos.** Un dato propio de la empresa que dice en
     qué portales republica cada portal de origen; hoy, como mucho, Pandapé → [Computrabajo]. Si mañana
     hay otro destino u otro origen, se añade sin rehacer nada. **No va dentro de la entrada de
     Pandapé de las credenciales**: guardar desde Mi Compañía rehace cada entrada desde cero con solo
     el portal, el usuario, la contraseña y si está encendido, y lo borraría (comprobado el
     2026-10-08). LinkedIn no entra: no es un portal (decisión 1).
   - **El switch**, en el modal de edición de Pandapé en Mi Compañía: «Republicar en Computrabajo», la
     única opción por ahora. En los demás portales no aparece.
   - **Cada empresa**: la actual se escribe **a mano en la base** con Pandapé ligado a Computrabajo, y
     sigue igual que hoy. Una empresa nueva que configura Pandapé nace **apagada**: no republica y el
     paso no avisa —**cambia respecto a hoy**, a propósito (usuario)—, hasta que encienda el switch.
   - **El paso**, cuando la empresa tiene el enlace y Pandapé está marcado (Pedro con Pandapé y
     Computrabajo):
     1. Computrabajo sale **desmarcado** y con un aviso sutil: la oferta saldrá en Computrabajo a
        través de Pandapé. **No queda bloqueado**: se puede marcar.
     2. Al marcarlo, una confirmación: ya saldrá allí por Pandapé, se publicará dos veces y gastará
        créditos de las dos cuentas. Si acepta, queda marcado y se publica por los dos caminos —lo que
        pasa hoy—; si cancela, sigue desmarcado. Hay un caso legítimo: cuando la cuenta de Pandapé se
        queda sin créditos de Computrabajo, la republicación no sale y el sistema ya lo avisa.
     3. Si desmarca Pandapé, Computrabajo vuelve a marcarse solo y el aviso desaparece.
     4. Si vuelve a marcar Pandapé, Computrabajo se desmarca solo, sin confirmación, y el aviso vuelve.
   - **Bordes del paso**: con el enlace y **sin Computrabajo configurado**, Computrabajo sale
     deshabilitado como no configurado (decisión 8) y, al marcar Pandapé, el mismo aviso sutil, porque
     la oferta sí llega allí por Pandapé. **Sin el enlace**, el paso no avisa ni confirma nada. Las
     cinco entradas al asistente llegan al mismo paso. **Al copiar**, las casillas parten de la
     empresa, no de la oferta original.
   - **El backend no tiene regla para esto**: publica lo elegido. Publicar dos veces en Computrabajo,
     aceptado en la confirmación, es una elección válida.
   - **Lo que queda para Elvis**: si el robot respeta que no se le pida republicar cuando publica de
     verdad. Esa combinación solo ha corrido en la prueba, que además deja borrador; afecta solo a
     empresas nuevas con el switch apagado, y hoy no hay ninguna. Lo demás lo contestó el usuario: era
     solo para ese cliente, no debe salir dos veces (lo cubre el paso) y los duplicados por reintento
     quedan fuera.
   - 🔴 **Al desplegar, el dato de la empresa actual se escribe ANTES que el backend.** Si el backend
     va primero, sus ofertas dejan de republicarse hasta que alguien lo escriba. El código viejo ignora
     el dato, así que escribirlo antes no rompe nada. En *Antes de desplegar*.
7. **La pieza de cada portal se niega a publicar si ese portal no está apuntado en la oferta**
   (usuario, 2026-10-07). Cierra el hueco del reintento automático (punto B). Para eso los tres
   reintentos piden la publicación a la pieza del portal en vez de llamar a la función directamente;
   cómo eligen el portal no cambia (corregido el 2026-10-08: decía «sin tocar los reintentos», y sin
   ese cambio la negativa no llega al hueco).
   🔴 **No debe romper las herramientas de desarrollo que publican a propósito** —«Crear borrador en
   Pandapé», las pruebas de crear en cada portal— (aviso del usuario). Leído el 2026-10-07: esas
   pruebas despachan el robot por su propio camino, no por las tres funciones de publicación que
   envuelve la pieza de cada portal, así que la comprobación no las alcanza. **El brief pide al
   ejecutor confirmarlo** recorriendo todos los despachos de los robots de crear oferta (hay seis: los
   tres de publicación y tres de prueba) y cualquier otro botón de desarrollo que publique.
8. **«Configurado» en el paso es tener usuario y contraseña** (usuario, 2026-10-07). Un portal sin uno
   de los dos sale como no configurado. Coincide con lo que exige la publicación y con el aviso de Mi
   Compañía (ver *Fuera del alcance* de ofertas sin ATS); hoy la lista de la oferta solo mira que no
   esté apagado (punto G). El backend ya entrega por la API si un portal tiene contraseña guardada, sin
   la contraseña (punto H).
9. **Las entradas sin casillas usan los portales por defecto de la empresa** (usuario, 2026-10-08). El
   agente de WhatsApp, Maya por WhatsApp y el alta del superadmin no preguntan por los canales. Si la
   petición **no trae** elección, la oferta sale con los portales habilitados de la empresa, con la
   regla de hoy (punto G): lo mismo que obtiene quien pasa por el paso sin tocar nada. Si la trae
   **vacía**, la oferta nace sin portales (ofertas sin ATS). El superadmin usa la misma petición que el
   portal, así que puede mandar la elección sin cambios. **Que el agente y Maya pregunten por los
   canales va al final**, como paso propio, si sobra tiempo.
10. **El backend rechaza la creación si se elige un portal que la empresa no puede usar** (usuario,
    2026-10-08): no configurado (decisión 8) o apagado. Caso: Pedro tiene el asistente abierto, un
    compañero apaga elempleo, y Pedro crea con elempleo marcado; recibe «elempleo ya no está habilitado
    en tu empresa», el asistente conserva lo escrito y él lo desmarca. Quitarlo en silencio le haría
    creer que salió en elempleo.
11. **El interruptor general «Portales de empleo» vive solo en el portal** (usuario, 2026-10-08).
    Apagado: apaga todos los portales y sus interruptores quedan grises. Encendido: los interruptores
    se pueden tocar, pero siguen apagados; el reclutador enciende los que quiera. No se guarda: al
    cargar sale encendido si algún portal lo está. Lo que sí se guarda es el apagado de cada portal,
    igual que apagarlos uno por uno. Rara pero coherente: si se enciende sin encender ningún portal y se
    recarga, vuelve a salir apagado. Sustituye la idea de diseño de ofertas sin ATS (todo o nada como
    dato propio, sin tocar cada portal): sin dato en el backend, `hasPublicationChannels` y el aviso no
    cambian por él.
12. **La forma de la arquitectura** (usuario, 2026-10-08; decisión 3). La misma que en redes sociales
    —una interfaz, una pieza por portal y un registro—, pero las piezas se arman dentro del servicio de
    ofertas y apuntan a sus tres funciones de publicación, que se quedan donde están, intactas. Sacarlas
    a piezas independientes sería mover cientos de líneas y crear una dependencia en círculo (el
    servicio usaría las piezas y las piezas al servicio).

## Lo que dice el código y los documentos no

Comprobado leyendo `develop` el 2026-10-07 (backend `d96be7b`, portal `4ffee9c`).

- **A. El asistente crea la oferta al final, en una sola petición.** Las preguntas y la prueba
  psicométrica se guardan después, pero la oferta, con sus pasos desactivados, viaja en la petición de
  crear cuando se pulsa el último «Crear». El paso al final encaja: lo elegido puede ir en esa misma
  petición.
- **B. Solo la creación lanza los tres portales mirando a la empresa.** Los otros caminos que publican
  —el reintento automático tras un fallo del robot y el reintento manual por falta de créditos— actúan
  sobre **un solo portal que ya está en la lista de la oferta**, el que falló. Si la lista se arma con
  lo elegido, esos caminos ya respetan la elección sin tocarlos. No existe una «republicación» que
  llame a los tres portales. Comprobado buscando en todo el backend las llamadas a las tres funciones
  de publicación: hay cuatro sitios (crear, dos reintentos automáticos y el manual). El aviso diario de
  publicaciones atascadas (7:00) no vuelve a publicar: solo marca el fallo y avisa. ⚠️ **Un hueco**
  (releído el 2026-10-07): el reintento automático genérico toma el portal del aviso del robot y, si no
  viene, **da por hecho Computrabajo**; y la publicación en Computrabajo mira la empresa, no la oferta.
  Una oferta solo con Pandapé cuyo aviso de fallo llegara sin portal se publicaría en Computrabajo. El
  robot de Pandapé sí manda el portal, así que hoy es teórico. Lo cierra la decisión 7.
- **C. 🔴 Pandapé republica siempre en Computrabajo.** Al publicar de verdad en Pandapé, el robot
  pide también republicar en Computrabajo desde Pandapé: consume créditos de Computrabajo y ese
  identificador no queda en la oferta. Una oferta para la que se elige Pandapé y no Computrabajo
  **acaba también en Computrabajo**. Y si se eligen los dos, puede salir dos veces. **También en cada
  reintento de Pandapé**, no solo al crear: el reintento vuelve a pedir la republicación. **La hace
  Pandapé por dentro, con su propia cuenta** (releído el 2026-10-07): el robot la lee en el paso
  «Divulgación» de Pandapé, que ofrece 16 portales; el aviso que ya existe dice «tu cuenta de Pandapé no
  tiene créditos para ese portal», y la publicación de Pandapé no lee las credenciales de Computrabajo
  de la empresa. Así que una empresa con Pandapé y **sin** Computrabajo configurado en Essperto también
  acaba en Computrabajo. Con la decisión 6, eso pasa a depender del dato de la empresa.
- **D. La publicación en Computrabajo cambió esta semana** (Elvis el 2026-10-05, Henry el 2026-10-06):
  hay un estado nuevo, **borrador** (la oferta existe en Computrabajo pero no quedó publicada), y la
  extracción de candidatos también mira los borradores. No afecta a este frente: la forma en que
  publica cada portal no se toca, y la entrada del portal sigue en la lista de la oferta.
- **E. `hasPublicationChannels` ya cuenta «algún portal en la lista de la oferta».** Si la lista se arma
  con lo elegido, responde bien sin cambios. Solo hay que tocarla si entra el interruptor general o el
  formulario público por oferta.
- **F. La lista de canales que acepta la API al crear solo se usa en el modo de simulación** de
  portales, para identificadores de prueba, y el portal la manda vacía (punto C de ofertas sin ATS).
  Reutilizarla para la elección mezclaría dos significados.
- **G. La lista de la oferta y la publicación no exigen lo mismo** (2026-10-07). La lista apunta todo
  portal que la empresa no tenga apagado, aunque le falte usuario o contraseña; la publicación exige los
  dos. Esa oferta queda pendiente en ese portal y el aviso diario la marca como fallida. Decisión 8.
- **H. El backend ya no entrega las contraseñas por la API** (2026-10-08; `035a3e6`, en `develop` y en
  `main`). Portales, EvaluaTest y antecedentes salen sin contraseña, con la señal de si hay una
  guardada. El portal puede saber si un portal está configurado (decisión 8) sin verla. La deuda que lo
  contaba en `CLAUDE.md` estaba desfasada; corregida.

Releído el 2026-10-07 por el planificador nuevo (backend `d96be7b`, sin cambios; portal `f94bfb3`, un
commit de Elvis que abre en otra pestaña «Conectar un proveedor» del paso psicométrico, sin relación
con la publicación): A a F se sostienen, con los matices de B y C.

## Fuera del alcance, a sabiendas

- **La lógica de la republicación de Pandapé en Computrabajo, salvo su línea** (decisión 6; usuario).
  Que la vuelva a pedir en cada reintento y que eso pueda duplicar la vacante es de la tarea de Elvis.
  Este frente solo hace que la petición dependa del dato de la empresa.
- **Elegir canales al crear por WhatsApp, en el agente y en Maya**: al final, si sobra (decisiones 1
  y 9).
- **El formulario público como casilla por oferta, LinkedIn como casilla y que las ofertas viejas ganen
  un portal** (decisión 1).

## Preguntas abiertas

1. ~~El punto único solo en la creación~~: cerrada (decisión 5).
2. **Pandapé y Computrabajo** (decisión 6): a Elvis, si el robot respeta publicar de verdad sin
   republicar. No bloquea: solo afecta a empresas nuevas con el switch apagado.
3. ~~Las pruebas a mano de ofertas sin ATS sin resultado anotado~~: cerrada el 2026-10-07, bien según
   el usuario; anotadas en esa tarea.

## Pasos

Rama nueva desde `develop`, en los dos repositorios. Alcance acordado el 2026-10-08.

| Paso | Qué | Repositorio | Qué ve una persona | Estado |
| --- | --- | --- | --- | --- |
| 1 | La pieza de cada portal, el registro, el punto único al crear y la negativa a publicar un portal no apuntado en la oferta (decisiones 3, 5, 7 y 12) | backend | Nada: se publica igual que hoy | Aprobado (`brief-paso1-piezas-y-punto-unico.md`); sin commit |
| 2 | La creación recibe, comprueba y guarda lo elegido (decisiones 8 a 10); el dato de republicación, su guardado y la línea de Elvis (decisión 6) | backend | Una empresa nueva con Pandapé deja de republicar | Sin brief |
| 3 | El paso nuevo del asistente, con el aviso y la confirmación de Computrabajo (decisión 6) | portal | El paso | Sin brief |
| 4 | El switch de republicación en el modal de Pandapé y el interruptor general (decisiones 6 y 11) | portal | Los dos interruptores | Sin brief |
| Cierre | Fusión, pruebas a mano en el servidor de pruebas y paso a `main` | los dos | — | — |
| Final, si sobra | Elegir canales por WhatsApp, en el agente y en Maya (decisión 9) | backend | La pregunta en la conversación | — |

## Registro de avance

- **2026-10-07** — Bitácora creada. Leídos `requisitos.md`, `planning.md` (con su sección del
  2026-10-07) y la bitácora de ofertas sin ATS; comprobado el código de `develop`. Cuatro preguntas
  abiertas. Sin brief.
- **2026-10-07** — Decisiones 1 a 4 con el usuario; la 5 y la 6, pendientes. Hallado el autor de la
  republicación de Pandapé en Computrabajo (Elvis). Sin brief.
- **2026-10-07** — Decisión 6 con el diseño del usuario. El planificador de ofertas sin ATS pasa el
  frente a un planificador nuevo, en otra conversación, por contexto.
- **2026-10-07** — Planificador nuevo. Releídos A a F contra `develop`: se sostienen; matices en B
  (reintento que da por hecho Computrabajo) y C (Pandapé republica también al reintentar), y punto G.
  Decisión 5 confirmada; decisiones 7 y 8; una quinta pregunta para Elvis. Sin brief.
- **2026-10-07** — Pruebas pendientes de ofertas sin ATS, bien según el usuario. Decisión 6 rehecha:
  la lógica de Elvis no se toca; la empresa guarda en qué portales republica su Pandapé, solo para el
  paso; Computrabajo sale desmarcado con aviso y se puede marcar tras confirmar. De las preguntas para
  Elvis queda una, que no bloquea. Sin brief.
- **2026-10-08** — Alcance cerrado. Decisión 6 rehecha por tercera vez: la línea de Elvis lee un dato
  de la empresa, aparte de las credenciales, con un switch en el modal de Pandapé; la empresa actual
  se escribe a mano. Decisiones 9 a 12: entradas sin casillas, rechazo del portal no disponible,
  interruptor general solo en el portal y forma de la arquitectura. Punto H; corregida la deuda de
  contraseñas en `CLAUDE.md`. Partido en cuatro pasos. Sigue el brief del paso 1.
- **2026-10-08** — Rama `feat/publication-channels`. Línea base en `develop` (`d96be7b`), medida por
  el planificador con la caché limpia: **compila; 192 suites y 2.020 pruebas que pasan, 1 suite y 43
  omitidas**. Brief del paso 1 escrito. Al prepararlo: la prueba de reintentos sustituye las funciones
  de publicación después de construir el servicio (las piezas tienen que llamarlas al publicar), y la
  de crear sin portales exige tres avisos del log que el punto único elimina (se cambian por «no se
  llama a ninguna»). Decisión 7 corregida: los reintentos pasan por la pieza.
- **2026-10-08** — Opinión previa del paso 1 contestada. `develop` avanzó a `9736f86` (limpieza de
  datos personales en los logs, una corrección del orquestador, pruebas contra desarrollo y una marca
  para el aviso del robot): no toca el servicio de ofertas; **misma línea base**. Comprobado por el
  ejecutor: cuatro sitios llaman a las tres funciones, diez despachos de robots y ninguna herramienta
  de desarrollo pasa por las piezas, y los tres reintentos llevan la lista de la oferta. Corregido el
  brief: 36 pruebas arman el servicio sin constructor (registro a la primera, la pieza llama a la
  función al publicar), y cambia también la prueba del modo demo. Aceptados: el reintento genérico
  cae en Computrabajo si no conoce el portal y luego actúa la negativa; una sola clase con una
  instancia por portal; el punto único recorre el registro, así que un portal repetido en la lista se
  publica una vez; los nombres.
- **2026-10-08** — **Paso 1 revisado y aprobado.** Nueve archivos, índice y árbol coincidiendo; las
  tres funciones de publicación sin tocar. Compila; **195 suites y 2.030 pruebas que pasan, 1 suite y
  43 omitidas**, con la caché limpia, corrido por el planificador: **nueva línea base**. Decisiones del
  ejecutor aceptadas: las piezas reciben la oferta guardada con su identificador, que el compilador
  acepta en los cuatro caminos sin conversiones; se corrige la prosa de cabecera de la prueba de crear
  sin portales, que ya era falsa, y se quita su ayuda para leer el log, que nadie usa; en el
  reintento propio de elempleo, sin pieza no se publicaría, lo que no puede pasar. El título de la
  prueba del modo demo apagado seguía diciendo «disparando los 3 bots»: se corrige antes del commit.
- **2026-10-08** — **Paso 1, segunda ronda, aprobada** (a petición del usuario). El recorrido del
  punto único sale del servicio de ofertas al registro (`publishToListedChannels`), que recibe el
  logger para avisar; el armado de las tres piezas se queda en el servicio, porque necesita sus
  funciones privadas. Corregido el título de la prueba del modo demo. No alivia el tamaño del
  servicio: lo que pesa son las tres funciones de publicación y sus traductores, que la decisión 12
  deja donde están. Compila; **195 suites y 2.030 pruebas que pasan**, igual que antes, corrido por el
  planificador. Índice y árbol coincidiendo.

## Antes de desplegar

- 🔴 **Escribir a mano en la base, ANTES de desplegar el backend, que el Pandapé de la empresa que ya
  lo usa republica en Computrabajo** (decisión 6). Si el backend va primero, sus ofertas dejan de
  republicarse hasta que se escriba. El código viejo ignora el dato. La consulta exacta la deja el
  paso 2.
