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
     empleo»** como valor por defecto del paso (idea de diseño en *Fuera del alcance* de ofertas sin
     ATS).
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
6. **La republicación de Pandapé en Computrabajo: un dato de la empresa que solo lee el paso**
   (usuario, 2026-10-07; punto C). Lo integró Elvis el 2026-08-03 («feat(pandape): republicar en
   Computrabajo al publicar de verdad»), pensado para el único cliente que usa Pandapé (usuario), y hoy
   está fijo en el código para todas las empresas. Rehecha el mismo día: la primera versión la volvía
   configurable desde la pestaña Flujo; el usuario la simplifica.
   - 🔴 **La lógica de Elvis no se toca.** La publicación en Pandapé sigue pidiendo siempre la
     republicación, igual que hoy, al crear y al reintentar. No hay interruptor en la pestaña Flujo ni
     cambia nada de lo que se le manda al robot. Los fallos que tenga esa lógica son de su tarea
     (*Fuera del alcance*).
   - **Uno a muchos.** En la configuración del Pandapé de la empresa se guarda **la lista de portales
     en los que republica**: hoy, Computrabajo. Si mañana republica también en elempleo, se añade a la
     lista; si otro portal republica en alguno, tiene su propia lista. Los valores son los portales de
     Essperto, no los 16 que ofrece Pandapé: el dato solo sirve para el paso. LinkedIn no entra: no es
     un portal y no sale en el paso (decisión 1).
   - **El valor dice la verdad** (usuario): toda empresa que configure Pandapé queda con Computrabajo en
     la lista, la actual y las nuevas, porque el robot republica para todas. Un «apagado» que el robot
     no respeta haría que el paso no avisara y la oferta saliera igual en Computrabajo, gastando
     créditos. Se descartó a sabiendas que la publicación leyera la lista: tocaba la lógica de Elvis y
     mandaba al robot una combinación que nunca ha corrido (publicar sin republicar).
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
   - **Lo que queda para Elvis**: confirmar que la republicación usa la cuenta de Pandapé y no la de
     Computrabajo de la empresa (lo que dice el código, punto C). Lo demás lo contestó el usuario: era
     solo para ese cliente, no debe salir dos veces (lo cubre el paso) y los reintentos quedan fuera.
   - 🔴 **Al desplegar**: la empresa que ya tiene Pandapé tiene que quedar con Computrabajo en la lista.
     Va a *Antes de desplegar*.
7. **La pieza de cada portal se niega a publicar si ese portal no está apuntado en la oferta**
   (usuario, 2026-10-07). Cierra el hueco del reintento automático (punto B) sin tocar los reintentos.
   🔴 **No debe romper las herramientas de desarrollo que publican a propósito** —«Crear borrador en
   Pandapé», las pruebas de crear en cada portal— (aviso del usuario). Leído el 2026-10-07: esas
   pruebas despachan el robot por su propio camino, no por las tres funciones de publicación que
   envuelve la pieza de cada portal, así que la comprobación no las alcanza. **El brief pide al
   ejecutor confirmarlo** recorriendo todos los despachos de los robots de crear oferta (hay seis: los
   tres de publicación y tres de prueba) y cualquier otro botón de desarrollo que publique.
8. **«Configurado» en el paso es tener usuario y contraseña** (usuario, 2026-10-07). Un portal sin uno
   de los dos sale como no configurado. Coincide con lo que exige la publicación y con el aviso de Mi
   Compañía (ver *Fuera del alcance* de ofertas sin ATS); hoy la lista de la oferta solo mira que no
   esté apagado (punto G).

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
  acaba en Computrabajo. Elvis lo confirma (decisión 6).
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

Releído el 2026-10-07 por el planificador nuevo (backend `d96be7b`, sin cambios; portal `f94bfb3`, un
commit de Elvis que abre en otra pestaña «Conectar un proveedor» del paso psicométrico, sin relación
con la publicación): A a F se sostienen, con los matices de B y C.

## Fuera del alcance, a sabiendas

- **La lógica de la republicación de Pandapé en Computrabajo** (decisión 6; usuario, 2026-10-07). Que
  republique para todas las empresas, que lo vuelva a pedir en cada reintento y que eso pueda duplicar
  la vacante es de la tarea de Elvis. Este frente no lo cambia, ni para bien ni para mal.
- **Que la empresa pueda apagar la republicación.** No hay interruptor: el dato de la decisión 6 solo
  informa al paso.
- **Elegir canales al crear por WhatsApp**: al final, si sobra (decisión 1).
- **El formulario público como casilla por oferta, LinkedIn como casilla y que las ofertas viejas ganen
  un portal** (decisión 1).

## Preguntas abiertas

1. ~~El punto único solo en la creación~~: cerrada (decisión 5).
2. **Pandapé y Computrabajo** (decisión 6): solo queda que Elvis confirme que la republicación usa la
   cuenta de Pandapé. No bloquea: el diseño ya parte de lo que dice el código.
3. ~~Las pruebas a mano de ofertas sin ATS sin resultado anotado~~: cerrada el 2026-10-07, bien según
   el usuario; anotadas en esa tarea.

## Pasos

Rama nueva desde `develop`, en los dos repositorios. Sin pasos hasta acordar el alcance.

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

## Antes de desplegar

- 🔴 **La empresa que ya usa Pandapé tiene que quedar con Computrabajo en su lista de republicación**
  (decisión 6). Sin eso, su paso no avisa y la oferta sale igual en Computrabajo por Pandapé. Cómo se
  hace —migración o valor al leer— lo decide el brief del backend.
