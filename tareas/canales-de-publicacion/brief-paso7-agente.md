# Brief · Paso 7 — el agente de WhatsApp pregunta por los canales

Para quien ejecuta este paso. El agente de WhatsApp —el que conversa con el reclutador con un modelo de
lenguaje— muestra en el borrador de la oferta en qué portales se publicará, deja cambiarlos hablando,
y manda la elección al crear. Solo backend. Cambia lo que el modelo lee y lo que le dice a una
persona, así que lleva **una ronda de opinión previa**. Es el último paso de la tarea.

Antes de empezar, lee en la bitácora **las decisiones 6, 8, 9, 10, 15 y 16**, y en la de ofertas sin
ATS (`../ofertas-sin-ats/bitacora.md`) **las decisiones 5, 11 y 14**: son los textos del agente que
hablan de canales. El paso 6 (Maya) es el modelo más cercano: la consulta pública de portales
(`getAtsPlatformOptions`), el error propio de portal no disponible y la lista de nombres de portal.

## Rama

**Directamente en `develop`** (usuario), en un commit propio, encima del paso 6. Si el paso 6 no está
commiteado, dilo y espera. Línea base: **compila; 202 suites y 2.090 pruebas que pasan, 1 suite y 43
omitidas**; mídela antes de empezar.

## Cómo crea ofertas el agente hoy

1. El reclutador describe el cargo. El agente llama a la herramienta del borrador, que genera la
   oferta y le devuelve un resumen para presentarlo.
2. Si el reclutador pide cambios puntuales, el agente usa la herramienta de modificar el borrador.
3. Cuando el reclutador confirma, el agente llama a la herramienta de crear, que usa el último
   borrador y crea la oferta **sin elección**: con el paso 5, el backend aplica el valor por defecto.
4. El resultado de crear le dice al modelo si la oferta tiene canales (decisiones 5 y 14 de ofertas
   sin ATS).

El borrador pendiente se guarda en la sesión del agente, en la base. **El agente no está en uso** y
el simulador del servidor de pruebas no llega a su línea: esto se cubre solo con pruebas automáticas.

## Qué le pasa a una persona

Pedro tiene Computrabajo, elempleo y Pandapé disponibles. Medicall, lo mismo, y Pandapé ligado a
Computrabajo.

| | Hoy | Después |
| --- | --- | --- |
| Pedro pide una oferta | El borrador, sin portales | El borrador dice «Portales: Computrabajo, elempleo y Pandapé» |
| Medicall pide una oferta | Igual | «Portales: elempleo y Pandapé», con la nota de que Computrabajo sale a través de Pandapé |
| Pedro dice «sin elempleo» | — | El agente modifica el borrador; el resumen dice «Computrabajo y Pandapé» |
| Pedro dice «no la publiques en ningún portal» | — | El resumen dice que no se publica en ningún portal y que los candidatos se cargan manualmente |
| Medicall dice «también en Computrabajo» | — | Se añade; el agente le avisa de que saldrá dos veces y gastará créditos de las dos cuentas |
| Pedro pide un portal que no está disponible | — | El agente le dice que ese portal no está disponible y cuáles sí |
| Pedro confirma | Se crea sin elección | Se crea con la elección del borrador |
| Un compañero apaga elempleo antes de que Pedro confirme | — | El agente le dice que elempleo ya no está disponible y le pregunta si sigue sin él; no se crea |
| Laura, sin portales disponibles, o una empresa en modo demo | El borrador, sin portales | **Igual**: sin línea de portales, y la creación va sin elección |

## Qué se hace

### 1 · El borrador lleva los portales

Al generar el borrador se leen los portales con la consulta del paso 6. Si hay disponibles, el
borrador guarda la elección inicial —el valor por defecto— y el resumen que recibe el modelo suma la
línea de portales, con la nota de Computrabajo cuando corresponde. Si no hay ninguno, el borrador no
guarda elección.

Si el reclutador pide un borrador nuevo desde cero, la elección vuelve al valor por defecto. Propón
en la opinión previa si conviene conservarla, como ya se conserva el perfil de EvaluaTest.

### 2 · Cambiar los portales es un cambio puntual

La herramienta de modificar el borrador suma un campo opcional: la lista **completa** de portales donde
publicar, que reemplaza la anterior (como hace hoy con las preguntas de filtro). Solo acepta portales
disponibles; si le llega uno que no lo está, no cambia nada y le dice al modelo cuáles sí. Si la
lista nueva tiene Computrabajo y Pandapé con el enlace, el resultado le pide al modelo que avise de la
doble publicación.

### 3 · Crear manda la elección

La herramienta de crear manda la elección del borrador, si la hay. Si la creación se rechaza porque un
portal ya no está disponible (el error propio del paso 6), el borrador se conserva y el resultado le
pide al modelo que se lo diga al reclutador y le pregunte cómo sigue. Cualquier otro error, como hoy.

### 4 · Lo que lee el modelo

En las instrucciones generales, en el paso de presentar el borrador, la lista de lo que se resume
(«cargo, vacantes, ciudad, modalidad, salario, preguntas de filtro y EvaluaTest si aplica») suma
**los portales**, y una frase dice que el reclutador puede cambiarlos con la herramienta de
modificar. Las descripciones de las herramientas de modificar y de crear se ajustan a lo nuevo.
**El resto de los textos de las decisiones 5, 11, 12 y 13 de ofertas sin ATS no cambia.**

### 5 · Los textos

**Confirmados por el usuario el 2026-10-14; literales.** El modelo los lee y los redacta con sus palabras: no son
plantillas que lea el reclutador tal cual.

| Dónde | Texto |
| --- | --- |
| Línea de portales en el resumen del borrador | Portales: {portales}. |
| Nota, con enlace y Pandapé en la lista | (Computrabajo, a través de Pandapé.) |
| Línea sin portales | Portales: ninguno. Los candidatos se cargan manualmente. |
| Instrucción, al presentar el borrador | Di en qué portales se publicará; el reclutador puede cambiarlos y tú lo aplicas con `modify_draft`. |
| Resultado al añadir Computrabajo con el enlace | Computrabajo ya recibe la oferta a través de Pandapé: avisa al reclutador de que se publicará dos veces y gastará créditos de las dos cuentas. |
| Resultado con un portal no disponible | {portal} no está disponible en la empresa. Los disponibles son: {portales}. Díselo al reclutador. |
| Resultado del rechazo al crear | No se creó la oferta: {portal} ya no está disponible en la empresa. Díselo al reclutador y pregúntale si la publicas sin ese portal. |

Los nombres de los portales, de la lista que ya usa el backend (como en Maya): Computrabajo,
elempleo, Pandapé.

## 🔴 Dónde se para

- **Ni Maya, ni el portal, ni la creación** del backend.
- **El resto del agente no cambia**: consultar ofertas, editar una oferta ya creada, y los demás textos
  de las decisiones 5, 11, 12 y 13 de ofertas sin ATS.
- **Ni LinkedIn ni el formulario público.**
- Sin comentarios en el código, sin formateador, sin lint. Identificadores en inglés, también en las
  pruebas y en los parámetros de los callbacks.

## Lo que tu opinión previa tiene que confirmar

1. **Dónde vive la elección dentro del borrador guardado**, y que sobrevive a que la sesión del agente
   se guarde y se lea de la base.
2. **Si un borrador nuevo conserva la elección** anterior o vuelve al valor por defecto (punto 1).
3. **Que la elección viaja solo si el borrador la tiene.**
4. **Qué pruebas existentes del agente cambian**: las de la confirmación al crear y las del resumen. Si
   cambia alguna, dilo con el porqué.
5. Los nombres que propones.

## Pruebas y verificación

- **El borrador**: con portales disponibles, el resumen y la elección inicial; con enlace, la nota; sin
  disponibles y en modo demo, sin línea ni elección.
- **Modificar**: la lista nueva reemplaza; vacía, «ninguno»; un portal no disponible no cambia nada y
  devuelve los disponibles; Computrabajo con enlace pide avisar.
- **Crear**: con elección la manda; sin ella no; el rechazo por portal no disponible conserva el
  borrador y devuelve el texto.
- **Control negativo** en las nuevas: invierte la expectativa, comprueba que falla, bórralo.
- `npx jest --clearCache`, `npm run build` y `npm test`, **una vez**, frente a la línea base.
- **Sin pruebas a mano**: el agente no está en uso y el simulador no llega a su línea (usuario, en
  ofertas sin ATS). Queda sin ver cómo lo redacta el modelo.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados.
2. Después: qué cambió y el resultado real de la verificación, frente a la línea base.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
