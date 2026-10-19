# Brief · Paso 1 — guardar el origen completo de cada participación

Para quien ejecuta este paso. Dos cambios pequeños en la entrada de candidatos y **un script que
escribe en la base de producción**. Por el script, **tratamiento completo**: tantas rondas como haga
falta. Solo backend.

Antes de empezar, lee `../../CLAUDE.md`, `../psicoalianza/arranque-del-ejecutor.md` (cómo se trabaja
aquí y lo que ya salió mal) y la bitácora de este frente, `bitacora.md`: **el vocabulario, las
decisiones 2, 7, 10 y 11, y los puntos A, B, H, I y J de *Lo que dice el código***. Si algo no cuadra
con el código, dilo en la opinión previa: gana el código.

## Rama

`feat/candidates-by-channel` del backend, desde `develop` (`740f478`), limpia. **Mide la línea base de
pruebas antes de tocar nada.** No tiene seguimiento a ningún remoto, a propósito.

## Qué le pasa a una persona

Este paso **no cambia lo que ve nadie en la analítica de un cliente**: la tabla sigue leyendo como
hoy hasta el paso 2.

| | Hoy | Después |
| --- | --- | --- |
| Ana llega a una oferta por Computrabajo | Su participación dice «llegó por un portal» | Dice además «Computrabajo», en el detalle de origen |
| Se crea una oferta en una empresa en modo demo y entra el candidato sintético | Su participación no tiene origen, y la tabla lo cuenta como portal | Origen «alta manual» (en la tabla actual pasa de la fila de portal a la de alta manual, solo en empresas de demo) |
| Alguien corre el script en modo de prueba | — | Ve cuántas participaciones resolvería cada regla, sin escribir nada |
| Alguien corre el script de verdad | — | Las participaciones viejas que se pueden resolver quedan con su origen; las demás, igual que estaban |

## Qué se hace

### 1 · El portal, al vincular a alguien desde un portal (decisión 7)

En la llegada de un candidato desde un portal, al crear su participación con origen «portal», se
guarda **qué portal** en el detalle de origen, el mismo campo que ya usa el enlace público. El portal
sale de lo que manda el robot en esa llamada. **Comprueba qué llega**: si siempre es un solo portal,
se guarda ese; si puede llegar más de uno, o ninguno, dilo en la opinión previa antes de decidir nada.

El comentario del campo en el esquema dice que solo se usa con el enlace público; deja de ser cierto.
Se corrige en una línea, sin explicar la regla de negocio (apunta a esta bitácora si hace falta).

### 2 · El origen del candidato de demo (decisión 11)

La inyección del candidato sintético del modo demo guarda origen **alta manual**. Nada más de la demo
cambia.

### 3 · El script de relleno (decisión 10)

Un script nuevo en `scripts/`, **siguiendo el precedente de `backfill-processed-at.mjs`**: la misma
forma de conectarse (`mongo-url.mjs`, sin valor por defecto), la misma opción `--dry-run`, el mismo
recorrido por ofertas y el mismo resumen al final.

Las reglas, en este orden, y **cada participación como mucho una**:

| # | Si la participación… | Escribe |
| --- | --- | --- |
| 1 | no tiene origen, lleva la marca de añadida a mano y pasó por la petición de hoja de vida (en su etapa actual o en su historial) | origen **carga masiva** |
| 2 | no tiene origen y lleva la marca de añadida a mano | origen **alta manual** |
| 3 | no tiene origen, o su origen es portal, no tiene detalle de origen, y su persona comparte **exactamente un** portal con la oferta | ese portal en el **detalle de origen** |
| — | cualquier otro caso | nada |

🔴 **Las reglas de seguridad, todas obligatorias:**

- **Solo escribe donde el dato está vacío.** Nunca pisa un origen ni un detalle de origen que ya
  exista.
- **Se puede correr dos veces**: la segunda no encuentra nada que hacer.
- **Cada escritura comprueba que la participación sigue siendo la misma**: misma persona en esa
  posición y el campo todavía vacío. El script modelo escribe por posición sin comprobarlo; si la lista
  cambió entre la lectura y la escritura, podría escribir en otra persona. Si la condición falla, esa
  participación se salta y se cuenta aparte.
- **Las fichas de las personas se cargan por oferta**, en una sola consulta, no una por participación.
- **El resumen cuenta cada regla por separado**, más las que no se resuelven, desglosadas en «ningún
  portal en común» y «dos o más», y las saltadas por la comprobación. Con esas cifras, el modo de
  prueba en producción debería dar lo que se midió el 2026-10-19 (punto H): 1 en la regla 1, 43 en la
  2 y 12.140 en la 3, más las que hayan entrado desde entonces.
- **No lo corres contra ninguna base compartida**: ni la del servidor de pruebas ni producción. Solo
  en local. Lo corre el usuario en el cierre.

**Cómo se prueba el script** lo propones en la opinión previa. Los scripts de `scripts/` no tienen
pruebas automáticas hoy; las reglas de arriba sí tienen que tenerlas, con su control negativo.

## 🔴 Dónde se para

- **Nada de la analítica.** Leer el detalle de origen, los ceros y el campo viejo son el paso 2.
- **Nada del portal.**
- **Ni el enlace público, ni la carga masiva, ni el alta individual** cambian su forma de guardar el
  origen: ya lo hacen bien.
- **No se ejecuta el script contra ninguna base compartida.**
- Sin comentarios que expliquen la lógica de negocio en el código, sin formateador, sin lint.
  Identificadores en inglés, también en las pruebas, en los parámetros de los callbacks y en el script
  (el modelo tiene nombres en español: no es la referencia).

## Pruebas y verificación

- **La llegada desde un portal** guarda el portal en el detalle de origen.
- **El candidato de demo** nace con origen alta manual.
- **Las reglas del script**, cada una, y los casos que no escriben nada: dos portales en común,
  ninguno, un detalle de origen ya puesto, un origen ya puesto. Y que la segunda pasada no escribe.
- **Control negativo** en cada prueba nueva: invierte la expectativa, comprueba que falla, bórralo.
- `npx jest --clearCache`, `npm run build` y `npm test`, **una vez**, frente a la línea base.
- **El script, en local**, contra una base con datos de prueba: el modo de prueba, la pasada real y una
  segunda pasada que no cambia nada. Pega los tres resúmenes en el reporte.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados: qué manda el robot (punto
   1), cómo propones probar el script y lo que no cuadre.
2. Después: qué cambió y el resultado real de la verificación, frente a la línea base.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
