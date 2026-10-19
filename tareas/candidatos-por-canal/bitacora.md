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

Ninguna todavía. Antes de planificar pasos se confirman con el usuario la estimación y las preguntas
abiertas.

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

## Fuera del alcance, a sabiendas

Pendiente de acordar con el usuario.

## Preguntas abiertas

Ver el registro de avance del 2026-10-19: se le presentan al usuario numeradas.

## Pasos

Rama `feat/candidates-by-channel`, desde `develop` (backend `740f478`, portal `986bead`), en los dos
repositorios. Sin pasos hasta cerrar las preguntas.

## Registro de avance

- **2026-10-19** — Bitácora creada. Leídos `requisitos.md` y `planning.md`, con sus secciones del
  2026-10-19; comprobada la tabla de estado contra `develop`. Corregido el cruce del planning (punto A).
  Ramas creadas en los dos repositorios, limpias y sin seguimiento a `develop`, para que un envío no
  acabe ahí. Sin brief.

## Antes de desplegar

- **Avisar de que las cifras de los portales cambian, a la baja**: deja de contarse a una persona en
  un portal por otra oferta (`requisitos.md`, *Notas de alcance*).
- **Avisar a Elvis** de que se toca su tabla, y por qué.
