# Brief · Paso 3 — el paso de canales en el asistente de creación

Para quien ejecuta este paso. Añade al final del asistente de creación de ofertas un paso nuevo donde
el reclutador elige en qué portales se publica, y manda esa elección al backend, que ya la acepta
(paso 2). Solo portal. El portal no tiene pruebas automáticas y lo que se elija aquí decide dónde se
publica cada oferta: **una ronda de opinión previa, y si aparece algo grande se para**.

Antes de empezar, lee en la bitácora **las decisiones 1, 2, 6, 8, 9 y 10**, y en la tabla de *Pasos*
la nota del paso 3. El backend está en la rama `feat/publication-channels` (pasos 1 y 2, commits
`4733ddb` y `3bd0b88`).

## Rama

`feat/publication-channels` en `esscoti-frontend`, **nueva, desde `develop`** (`f94bfb3`). Línea base:
`npm run typecheck` sin errores; compruébalo antes de empezar.

## Qué le pasa a una persona

Pedro tiene Computrabajo y elempleo encendidos, con usuario y contraseña, y Pandapé sin configurar.

| | Hoy | Después |
| --- | --- | --- |
| Pedro crea una oferta | Seis pasos; se publica en todos sus portales | Siete pasos. El último muestra Computrabajo y elempleo **marcados** y Pandapé **deshabilitado** con su indicación. Si no toca nada, se publica igual que hoy |
| Pedro desmarca elempleo | — | Se publica solo en Computrabajo |
| Pedro desmarca todo | — | La oferta se crea sin portales; los candidatos se cargan manualmente |
| Laura, sin portales | Seis pasos; el aviso del primer paso | Siete pasos; los tres portales deshabilitados; el aviso del primer paso, igual |
| Un portal configurado pero **apagado** en Mi Compañía | — | Deshabilitado, con su indicación (decisión 2) |
| Un portal sin usuario o sin contraseña | — | Deshabilitado, como no configurado (decisión 8) |
| Un compañero apaga elempleo mientras Pedro tiene el asistente abierto | — | Al crear, el error del backend arriba del asistente, que sigue abierto con todo lo escrito (decisión 10) |
| Crear con IA, copiar, el botón del listado vacío, la dirección que abre la IA | Llegan al mismo asistente | Igual, con el mismo paso |
| Copiar una oferta | — | Las casillas parten de la empresa, **no** de la oferta copiada |
| Editar o ver una oferta | — | Sin cambios: el paso no existe ahí |

**La republicación de Pandapé** (decisión 6), en una empresa con Pandapé ligado a Computrabajo:

1. Al abrir el paso con Pandapé marcado: Computrabajo **desmarcado** y un aviso sutil debajo. Se puede
   marcar.
2. Al marcar Computrabajo con Pandapé marcado: una confirmación. Si acepta, queda marcado; si
   cancela, sigue desmarcado.
3. Al desmarcar Pandapé: Computrabajo vuelve a marcarse solo (si está disponible) y el aviso se va.
4. Al volver a marcar Pandapé: Computrabajo se desmarca solo, sin confirmación, y vuelve el aviso.
5. Con el enlace y **sin Computrabajo disponible**: Computrabajo deshabilitado con su indicación, y al
   marcar Pandapé, el mismo aviso sutil.
6. **Sin el enlace**: el paso no avisa ni confirma nada. 🔴 **Las empresas existentes llegan sin el
   dato** (el campo no viene): «no viene» es «sin enlace».

## Qué se hace

### 1 · El paso, al final

Séptimo paso, después de la agenda de la entrevista, con su título en el indicador de pasos. Los tres
portales en orden fijo —Computrabajo, elempleo, Pandapé—, con los nombres que el portal ya usa para
ellos.

- **Disponible** = la credencial de ese portal tiene usuario, tiene contraseña guardada (`configured`)
  y no está apagada. Mira **la primera credencial de ese portal**, la misma que mira el backend
  (paso 2). Disponible → marcado por defecto. No disponible → deshabilitado y con su indicación, que
  distingue «sin configurar» de «apagado».
- **La empresa en modo demo** ve el paso igual; el backend ignora la elección.
- **El botón «Atrás» del paso nuevo** vuelve al de la agenda. ⚠️ Hoy el «Atrás» del último paso
  vuelve **dos** pasos (salta el de documentos); al dejar de ser el último, la agenda pasa al «Atrás»
  general. Compruébalo.
- El aviso del primer paso («No tienes canales de publicación habilitados…») **no cambia**.

### 2 · La elección viaja en la creación

La creación manda `selectedAtsPlatforms` con los portales marcados, **siempre**, aunque esté vacía:
vacía significa «sin portales», y sin el campo el backend publicaría en todos (decisión 9).
**No se toca `atsIds`** (la fila de identificadores del modo de simulación, punto F).

### 3 · 🔴 Trampa: la empresa puede llegar tarde

El asistente se puede abrir **antes de que carguen los datos de la empresa** (el botón del listado
vacío lo permite; ver *Pruebas a mano* de ofertas sin ATS). Si las casillas se calculan al abrir con
la empresa todavía vacía, salen todas desmarcadas y la oferta se crea **sin portales sin que nadie
lo haya elegido**, en silencio. Los valores por defecto tienen que salir de la empresa ya cargada, y
nunca se manda una elección calculada sin ella. Propón cómo en la opinión previa.

### 4 · El tipo de la empresa

Declara `atsCrossPosting` en el tipo de la empresa del portal, opcional, con la forma que devuelve el
backend: una lista de entradas con `sourcePlatform` y `targetPlatforms`.

### 5 · Los textos

En los textos del portal, español e inglés, bajo los de la creación de ofertas. **Confirmados por el
usuario el 2026-10-09; literales:**

| Dónde | Español | Inglés |
| --- | --- | --- |
| Título del paso | Canales de publicación | Publication channels |
| Explicación del paso | Elige en qué portales de empleo se publica esta oferta. | Choose which job boards this offer is published on. |
| Portal sin configurar | Sin configurar. Configúralo en Mi Compañía. | Not set up. Set it up in My Company. |
| Portal apagado | Apagado en Mi Compañía. | Turned off in My Company. |
| Aviso de Pandapé | Esta oferta también saldrá en Computrabajo a través de Pandapé. | This offer will also be posted on Computrabajo through Pandapé. |
| Confirmación: título | ¿Publicar también en Computrabajo? | Also publish on Computrabajo? |
| Confirmación: mensaje | La oferta ya saldrá en Computrabajo a través de Pandapé. Si la marcas, se publicará dos veces y gastará créditos de las dos cuentas. | The offer will already be posted on Computrabajo through Pandapé. If you select it, it will be published twice and use credits from both accounts. |
| Confirmación: botones | Marcar igual / Cancelar | Select anyway / Cancel |
| Sin los datos de la empresa (decisión 13, añadido en la opinión previa) | Cargando los portales de tu empresa… | Loading your company's job boards… |

## 🔴 Dónde se para

- **Nada de Mi Compañía**: ni el switch de republicación ni el interruptor general (paso 4).
- **Ni el aviso del primer paso ni el modo editar o ver** cambian.
- **Ni el formulario público ni LinkedIn** salen en el paso (decisión 1).
- **Nada del backend.**
- Sin comentarios en el código, sin formateador, sin lint. Identificadores en inglés, también en los
  parámetros de los callbacks, aunque el archivo tenga nombres en español de antes.

## Lo que tu opinión previa tiene que confirmar

1. **Cómo resuelves la trampa del punto 3**, y que ningún camino manda una elección calculada sin la
   empresa.
2. **Que las cinco entradas llegan a este paso** y que al copiar no se arrastra nada de la oferta
   original.
3. **Qué pasa con el estado del paso al cerrar y volver a abrir el asistente**: tiene que empezar de
   cero, como los demás pasos.
4. **El «Atrás»** del paso nuevo y del de la agenda.
5. Los nombres que propones.

## Verificación

- `npm run typecheck`, **una vez**, sin errores.
- **Las pruebas a mano son del cierre, en el servidor de pruebas** (usuario), no de este paso. El
  planificador las escribe a partir de la tabla de arriba. Si al trabajar ves algo que conviene
  probar y no está en la tabla, dilo en el reporte.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados.
2. Después: qué cambió y el resultado real de la comprobación de tipos.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
