# Brief · Paso 6 — Maya pregunta por los canales

Para quien ejecuta este paso. Maya, el recorrido con botones por WhatsApp que crea ofertas, pregunta
dónde publicar antes de mostrar el borrador, y manda la elección al crear. Solo backend. Le escribe a
una persona, así que lleva **una ronda de opinión previa** y los textos van literales.

Antes de empezar, lee en la bitácora **las decisiones 6, 8, 9, 10, 15 y 16**. El código que se usa
lo dejaron los pasos 2 y 5: la elección al crear (`selectedAtsPlatforms`), la disponibilidad de cada
portal y el valor por defecto.

## Rama

**Directamente en `develop`** (usuario), en un commit propio, encima del paso 5. Si el paso 5 no está
commiteado, dilo y espera. Línea base: **compila; 200 suites y 2.069 pruebas que pasan, 1 suite y 43
omitidas**; mídela antes de empezar.

## Qué es Maya hoy

Se activa escribiendo «maya» a la **línea de reclutamiento**. Pregunta cargo, vacantes, ciudad,
salario, modalidad y contrato; muestra un borrador con «Confirmar» y «Cancelar», y crea la oferta
**sin elección**: con el paso 5, el backend aplica el valor por defecto. Su propio código la llama
«prueba de concepto» y **no tiene pruebas automáticas**. Guarda la sesión en memoria, 30 minutos.

## Qué le pasa a una persona

Pedro tiene Computrabajo, elempleo y Pandapé disponibles. Medicall, lo mismo, y además Pandapé ligado
a Computrabajo.

| | Hoy | Después |
| --- | --- | --- |
| Pedro termina el contrato | Le sale el borrador | Le sale la pregunta de los canales; después, el borrador |
| Pedro pulsa «Por defecto» | — | Los tres; el borrador dice «Portales: Computrabajo, elempleo y Pandapé» |
| Medicall pulsa «Por defecto» | — | elempleo y Pandapé; el borrador lo dice, con la nota de que Computrabajo sale a través de Pandapé |
| Pedro pulsa «Elegir» | — | Una pregunta por portal, «Sí» o «No», en orden fijo; luego el borrador |
| Medicall pulsa «Elegir» y llega a Computrabajo | — | La pregunta lleva la nota de que, si también elige Pandapé, se publica dos veces |
| Pedro pulsa «Ninguno» | — | El borrador dice que no se publica en ningún portal y que los candidatos se cargan manualmente |
| Laura, sin ningún portal disponible | Borrador directo | **Igual**: no se pregunta, y la creación va sin elección, como hoy |
| Pedro escribe texto en vez de pulsar un botón | Maya repite la pregunta | Igual en la pregunta nueva |
| Un compañero apaga elempleo antes de que Pedro confirme | — | El backend rechaza (decisión 10); Maya le dice qué portal ya no está disponible y vuelve a la pregunta de los canales, sin perder lo demás |

## Qué se hace

### 1 · La pregunta, entre el contrato y el borrador

- **Qué portales se ofrecen**: los **disponibles** en la empresa (decisión 8), leídos en el momento de
  preguntar, con la misma regla y la misma credencial que el paso 2. Si no hay ninguno, la pregunta no
  sale y la creación va sin elección.
- **«Por defecto»**: el mismo valor por defecto que el paso de canales (decisión 15): todos los
  disponibles, salvo Computrabajo si hay enlace y Pandapé está disponible. El mensaje dice cuáles son.
- **«Elegir»**: una pregunta por portal disponible, en orden fijo —Computrabajo, elempleo, Pandapé—,
  con «Sí» y «No». WhatsApp no deja marcar varias opciones en un mensaje. En Computrabajo, si hay
  enlace y Pandapé está disponible, la pregunta lleva la nota de doble publicación. La nota no depende
  de la respuesta de Pandapé, que se pregunta después.
- **«Ninguno»**: la elección vacía.
- **La elección se manda siempre que se preguntó**, también vacía, como el portal (decisión 9).

🔴 **Dónde mirar qué portales hay.** Maya no lee hoy la empresa. La disponibilidad y el valor por
defecto **ya existen** en el registro de canales (pasos 2 y 5): no los vuelvas a escribir en Maya.
Propón en la opinión previa cómo los obtiene Maya, con la solución más pequeña.

### 2 · El borrador dice los portales

Una línea más en el borrador, con lo elegido.

### 3 · El rechazo por un portal no disponible

Si la creación se rechaza porque un portal elegido ya no está disponible (decisión 10), Maya lo dice
y vuelve a la pregunta de los canales, con la sesión viva. Cualquier otro error, como hoy.

### 4 · Los textos

**Confirmados por el usuario el 2026-10-13; literales.** Maya solo habla en español. Los botones de WhatsApp
admiten 20 caracteres.

| Dónde | Texto |
| --- | --- |
| Pregunta | ¿Dónde publico la oferta?\n\nPor defecto: {portales}. |
| Nota en la pregunta, con enlace | (Computrabajo ya sale a través de Pandapé.) |
| Botones | «Por defecto» / «Elegir» / «Ninguno» |
| Pregunta por portal | ¿Publico en {portal}? |
| Nota en Computrabajo, con enlace | Ya sale en Computrabajo a través de Pandapé. Si también eliges Pandapé, se publica dos veces y gasta créditos de las dos cuentas. |
| Botones por portal | «Sí» / «No» |
| Línea del borrador | • Portales: {portales} |
| Línea del borrador, con enlace y Pandapé elegido | • Portales: {portales} (Computrabajo, a través de Pandapé) |
| Línea del borrador, sin portales | • Portales: ninguno. Los candidatos se cargan manualmente. |
| Rechazo por portal no disponible | {portal} ya no está disponible en tu empresa. Elige de nuevo dónde publicar. |

Los nombres de los portales, como los escribe el portal: Computrabajo, ElEmpleo, Pandapé.

## 🔴 Dónde se para

- **Ni el agente de WhatsApp** (paso 7), **ni el portal**, **ni la creación** del backend.
- **El resto de Maya no cambia**: sus preguntas, su confirmación tras crear y su manera de cancelar.
- **Ni LinkedIn ni el formulario público** en la pregunta.
- Sin comentarios en el código, sin formateador, sin lint. Identificadores en inglés, también en las
  pruebas y en los parámetros de los callbacks.

## Lo que tu opinión previa tiene que confirmar

1. **Cómo obtiene Maya los portales disponibles y el valor por defecto** sin duplicar la regla.
2. **Cómo distingue el rechazo por portal no disponible** de los demás errores sin depender del texto
   del mensaje, si se puede.
3. **Que la elección viaja siempre que se preguntó**, y nunca cuando no se preguntó.
4. **Qué pasa si la sesión caduca a mitad de «Elegir»**: como hoy en cualquier paso.
5. Los nombres que propones.

## Pruebas y verificación

- **Maya no tiene pruebas**: este paso trae las de su parte nueva, con la empresa y WhatsApp
  imitados. Casos: con portales disponibles sale la pregunta; sin ninguno, borrador directo y
  creación sin elección; «Por defecto» con y sin enlace; «Elegir» recorriendo los disponibles, con la
  nota en Computrabajo solo con enlace; «Ninguno» manda la lista vacía; texto en lugar de botón
  repite la pregunta; el rechazo por portal no disponible vuelve a la pregunta.
- **Control negativo** en las nuevas: invierte la expectativa, comprueba que falla, bórralo.
- `npx jest --clearCache`, `npm run build` y `npm test`, **una vez**, frente a la línea base.
- **A mano**, en el servidor de pruebas: Maya entra por la línea de reclutamiento, que el simulador
  sí alcanza. El planificador suma los casos a `pruebas-a-mano.md`.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados.
2. Después: qué cambió y el resultado real de la verificación, frente a la línea base.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
