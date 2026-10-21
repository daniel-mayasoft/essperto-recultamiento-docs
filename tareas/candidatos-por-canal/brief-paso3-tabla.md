# Brief · Paso 3 — la tabla «Candidatos por canal» en el portal

Para quien ejecuta este paso. Solo portal, solo presentación: cambia los textos de una tabla de la
analítica y quita un respaldo que ya no hace falta. Brief corto y una ronda de opinión previa.

Antes de empezar, lee `../../CLAUDE.md`, `../psicoalianza/arranque-del-ejecutor.md` (cómo se trabaja
aquí, y que **el portal no tiene pruebas automáticas**) y la bitácora de este frente, `bitacora.md`:
**el vocabulario, las decisiones 5, 6, 8 y 20 a 22, y la entrada del registro de avance del paso 2
revisado**, que lista los identificadores de canal que manda el backend. Los pasos 1 y 2 del backend ya
están en `develop`. Si algo no cuadra con el código, dilo en la opinión previa: gana el código.

## Rama

`feat/candidates-by-channel` del portal, en `986bead`, limpia. `develop` no tiene nada nuevo.

## Qué le pasa a una persona

Marta abre **Analítica** y baja hasta la tabla del panel general, debajo de los gráficos.

| | Hoy | Después |
| --- | --- | --- |
| Título | «Calidad por canal de entrada» | «Candidatos por canal» |
| Las filas de portal | «Elempleo», «Pandape» | «ElEmpleo», «Pandapé» |
| LinkedIn y el enlace compartido | «Linkedin», «Shared link» (en inglés también con el portal en español) | «LinkedIn», «Enlace compartido» |
| El portal sin identificar | «ATS (sin plataforma identificada)» | «Portal sin identificar», con su explicación al pasar el ratón |
| Una fila sin candidatos | Tasa «0.0%» | Tasa «—» |
| Con el portal en inglés | Lo mismo, en inglés | Los textos de la decisión 20 en inglés |

## Qué se hace

1. **Los textos de la decisión 20**, en español y en inglés, bajo los textos de la analítica que ya
   existen para esta tabla. Cada identificador de canal de la bitácora tiene su etiqueta. Un
   identificador desconocido sigue saliendo con su nombre legible, como hoy.
2. **La etiqueta de cada fila se decide por el identificador de canal**, que el backend ya manda único
   por fila. Hoy se decide en parte por el origen: con el backend nuevo, el alta manual y la fila
   `manual` ya no se confunden con el enlace compartido (punto N de la bitácora).
3. **La explicación de «Portal sin identificar»** (decisión 22). Usa el mismo patrón que ya usa esa
   pantalla en sus cifras con explicación: el texto subrayado con puntos que muestra la ayuda al pasar el
   ratón. Así no aparece un segundo estilo de ayuda en la misma pantalla.
4. **La tasa «—» en las filas sin candidatos** (decisión 21). Solo en esta tabla.
5. **Se quita el respaldo al campo viejo** `atsPlatforms` (decisión 5): su tipo y su uso en esta
   pantalla. 🔴 `atsPlatforms` también nombra otras cosas en el portal, como la configuración de las
   etapas y los modelos: se quita editando esta pantalla, **nunca con un buscar y reemplazar**.
6. **La tabla sale siempre.** Hoy se esconde si no hay filas. Con el backend nuevo siempre hay al menos
   dos, así que la condición sobra; si propones dejarla como red, dilo.

Las filas llegan ya ordenadas del backend (decisión del paso 2): el portal no las reordena.

## 🔴 Dónde se para

- **Nada del backend.**
- **Ninguna otra tabla ni gráfico de la analítica**, ni el detalle de una oferta.
- **No se cambian las columnas** (decisión 6) ni sus títulos.
- **No se crea un módulo compartido de nombres de portal.** Ya hay varias copias en el portal; esta
  pantalla usa sus textos traducidos, como el resto de la tabla.
- Sin comentarios que expliquen la lógica en el código, sin formateador, sin lint. Identificadores en
  inglés, también en los parámetros de los callbacks.

## Verificación

- `npm run typecheck`, una vez, frente a la línea base.
- **A mano, en local**, con el backend de `develop` y una empresa con datos (`../../entorno-local.md`).
  Recorre cada caso y di el resultado de cada uno:
  1. Una empresa con candidatos de portal, alta manual y carga masiva: cada fila con su nombre de la
     decisión 20 y sus cifras; la suma de las filas es el total de candidatos del panel.
  2. Una fila en cero, por ejemplo un portal configurado sin candidatos en el periodo: candidatos 0,
     viables 0 y tasa «—».
  3. Un periodo sin ofertas, con el filtro de fechas: la tabla sale, con alta manual, carga masiva y
     los portales configurados en cero.
  4. Con candidatos viejos sin portal guardado: la fila «Portal sin identificar», y al pasar el ratón,
     la explicación.
  5. La empresa con el formulario público encendido: la fila «Enlace compartido».
  6. El portal en inglés: el título y todas las filas en inglés.
  Si te falta algún dato para un caso (por ejemplo, no hay ninguna participación vieja sin portal en
  local), dilo en vez de darlo por visto.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados: lo que no cuadre, y si
   dejas o quitas la condición que esconde la tabla.
2. Después: qué cambió, el resultado de la comprobación de tipos frente a la línea base y el de cada
   caso a mano.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
