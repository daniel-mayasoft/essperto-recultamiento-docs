# Brief · Paso 2 — la analítica cuenta cada candidato en su canal

Para quien ejecuta este paso. Solo backend, solo lectura: **no escribe nada en la base ni toca el
embudo**, pero cambia cifras que un cliente ya mira. Brief corto y una ronda de opinión previa; si
aparece algo grande, se para.

Antes de empezar, lee `../../CLAUDE.md`, `../psicoalianza/arranque-del-ejecutor.md` (cómo se trabaja
aquí y lo que ya salió mal) y la bitácora de este frente, `bitacora.md`: **el vocabulario, las
decisiones 2 a 8 y 16 a 18, y los puntos D, E, F, G, N, O, P y R**. El paso 1 ya está hecho (`3cbc499`):
las participaciones nuevas de portal guardan su portal en el detalle de origen, y un script rellenará
las viejas en el cierre. Si algo no cuadra con el código, dilo en la opinión previa: gana el código.

## Rama

`feat/candidates-by-channel` del backend, en `3cbc499`, limpia. **Mide la línea base de pruebas antes de
tocar nada.**

## Qué le pasa a una persona

Marta mira la analítica de su empresa, que tiene Computrabajo y elempleo configurados y el formulario
público apagado.

| | Hoy | Después |
| --- | --- | --- |
| Ana llegó a la oferta A por Computrabajo y tiene elempleo en su ficha por otra oferta | Suma en Computrabajo y en elempleo | Suma solo en Computrabajo |
| Una participación vieja de portal que el script no pudo resolver | Suma en cada portal de la ficha de la persona | Suma en «Portal sin identificar» |
| Nadie llegó por elempleo en el periodo | La fila no sale | «elempleo: 0» |
| La empresa apagó Pandapé después de que le trajera gente, y en el periodo no trajo a nadie | La fila no sale | «Pandapé: 0» (decisión 16) |
| Pandapé nunca configurado ni usado | No sale | No sale |
| Una persona llegó por LinkedIn y otra por el enlace compartido | Una fila «public_link» con las dos | Dos filas, una por canal |
| Ningún candidato en el periodo | La tabla se esconde | Salen al menos alta manual y carga masiva, en cero |

## Qué se hace

### 1 · Cada participación, a una sola fila

| La participación tiene… | Fila |
| --- | --- |
| origen portal, o vacío, y un detalle que es uno de los tres portales | ese portal |
| origen portal, o vacío, y cualquier otro detalle (vacío incluido) | Portal sin identificar |
| origen enlace público y detalle `linkedin` | LinkedIn |
| origen enlace público y cualquier otro detalle (vacío incluido) | Enlace compartido (punto F) |
| origen alta manual / carga masiva | la suya |
| cualquier otro origen | una fila con su propio nombre, como hoy |

🔴 **Nunca se mira el detalle sin el origen** (punto N): `manual` en el detalle de un enlace público es
el enlace compartido, no el alta manual.

Así la suma de las filas es exactamente el total de candidatos del panel (corrige el punto G).

### 2 · Los canales que salen aunque estén en cero (decisiones 3, 16, 17 y 18)

| Canal | Sale en cero si… |
| --- | --- |
| Alta manual y carga masiva | siempre |
| Cada portal | la empresa lo tiene configurado (usuario y contraseña) y no apagado (punto O), **o** alguna vez trajo a alguien |
| Enlace compartido | el formulario público está encendido, **o** alguna vez trajo a alguien |
| LinkedIn | la cuenta está conectada y el formulario está encendido (punto P), **o** alguna vez trajo a alguien |
| Portal sin identificar | nunca: sale solo con candidatos en el periodo |

«Alguna vez» es en **cualquier oferta de la empresa, sin ningún filtro** del panel: ni fechas, ni
estado, ni subconjunto de ofertas. Cómo leerlo sin cargar todas las participaciones en memoria lo
propones en la opinión previa.

### 3 · La respuesta

- Cada fila sigue teniendo canal, origen, candidatos, viables y tasa (decisión 6). **Un identificador de
  canal por fila, sin repetirse**: los tres portales, `ats` para el portal sin identificar, `manual`,
  `bulk`, `linkedin` y `shared_link`; las dos últimas con origen enlace público.
- **Orden**: de más a menos candidatos y, en los empates, siempre el mismo orden, para que las filas en
  cero no cambien de sitio entre una carga y otra. Propón cuál.
- **Se retira el campo viejo `atsPlatforms`** (decisión 5), con su cálculo. 🔴 Hay homónimos sin
  relación en el agente de WhatsApp, en Maya y en la configuración de etapas del portal: se retira
  editando este cálculo, **nunca con un buscar y reemplazar**.
- **Se retira la carga de las fichas de los candidatos** de la analítica global, que deja de usarse
  (punto R). Si encuentras otro uso, dilo.

## 🔴 Dónde se para

- **Nada del portal.** La tabla, sus textos y que salga siempre son el paso 3. El portal desplegado hoy
  lee `channels` y usa el campo viejo solo si `channels` no viene (comprobado por el planificador en
  `develop`, `986bead`), así que retirar el campo no lo rompe. Hasta el paso 3, las filas nuevas
  (`linkedin`, `shared_link`) salen allí con su identificador sin traducir: los dos pasos se despliegan
  juntos.
- **Los filtros no cambian**: «en el periodo» sigue siendo la creación de la oferta (decisión 4).
- **Ninguna otra parte del panel cambia**, ni el detalle de una oferta.
- **No se escribe nada en la base.** El script es del paso 1.
- Sin comentarios en el código, sin formateador y sin lint. Los identificadores van en inglés, también
  en las pruebas y en los parámetros de los callbacks.

## Pruebas y verificación

Sobre las pruebas de la analítica que ya existen:

- cada fila de la tabla del punto 1, `manual` en el detalle de un enlace público incluido;
- Ana, con dos portales en su ficha, suma en uno solo, y la suma de las filas es el total;
- cada regla del punto 2: canal disponible sin candidatos en cero, canal no disponible con historia en
  otra oferta fuera del periodo en cero, canal no disponible sin historia ausente, portal sin usuario o
  sin contraseña o apagado, LinkedIn en cada uno de sus tres estados y con el formulario apagado, y el
  portal sin identificar ausente sin candidatos en el periodo aunque los tenga en otra oferta;
- la historia no respeta los filtros: un canal usado solo en una oferta cancelada o fuera del rango
  sale en cero;
- empresa sin candidatos: salen alta manual y carga masiva en cero;
- el orden de los empates;
- el campo viejo ya no sale.

Cada prueba nueva lleva su **control negativo**: invierte la expectativa, comprueba que falla y bórralo.
`npx jest --clearCache`, `npm run build` y `npm test`, **una vez**, frente a la línea base.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados: cómo propones leer la
   historia, el orden de los empates, quién más lee `channels` o `atsPlatforms` (cómo lo comprobaste y
   qué no cubre la búsqueda), y lo que no cuadre.
2. Después: qué cambió y el resultado real de la verificación, frente a la línea base.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
