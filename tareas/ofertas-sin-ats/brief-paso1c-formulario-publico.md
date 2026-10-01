# Brief · Paso 1c — el formulario público cuenta como canal

Para quien ejecuta este paso. Cambia una condición en dos mensajes del agente de WhatsApp que ya
existen. No toca el embudo ni escribe a ningún candidato: **brief corto y una sola ronda**. Solo
backend, en un **commit nuevo** encima del paso 1.

Antes de empezar, lee en la bitácora **el punto L y las decisiones 5, 8, 9, 12 y 14**. El paso 1
(`brief-paso1-backend.md`) es el precedente: este paso cambia la condición que él introdujo.

## Rama

`feat/offers-without-ats`, con `develop` ya fusionado (`569d7a5`), limpia. **Reinstala las
dependencias** (`npm ci`): la fusión trae librerías nuevas y sin ellas no compila. Línea base, medida
por el planificador con la caché limpia: **175 suites y 1.742 pruebas que pasan, 9 omitidas**.

## Qué le pasa a una persona

| | Hoy (paso 1) | Después |
| --- | --- | --- |
| Laura, sin portales y con el formulario apagado, crea una oferta por WhatsApp | «No se publicará en ningún canal; los candidatos se cargan a mano» | Igual |
| Sofía, sin portales y con el formulario encendido en Mi Compañía, crea una oferta por WhatsApp | Lo mismo que Laura. Falso: puede compartir el enlace y los candidatos se registran solos | Lo de siempre: el sistema ya comenzó a buscar candidatos |
| Laura pregunta por su oferta, que no tiene candidatos | «No tiene canales de publicación; los candidatos no llegan solos» | Igual |
| Sofía pregunta por su oferta, que no tiene candidatos | Lo mismo que Laura | Lo de siempre: está publicada y aún no hay postulantes |
| Pedro, con Computrabajo | Lo de siempre | Igual, y sin leer la empresa |
| Una demo | Lo de siempre (decisión 8) | Igual |

## Qué se hace

### 1 · Una sola pregunta: «¿esta oferta tiene canales de publicación?» (decisión 14)

Un método del servicio de ofertas que responde **sí** si la oferta tiene alguna plataforma, o si la
empresa tiene encendido el formulario público (el campo de la empresa que se enciende en Mi
Compañía). **Si la oferta tiene alguna plataforma, no lee la empresa.** Si leerla falla, responde
**no** y lo deja en el log (decisión 14, mismo criterio que la 9).

- Mira **el campo de la empresa**, no el estado del enlace de la oferta que calcula el servicio del
  formulario público: ese estado mezcla también el cupo de la oferta, y aquí la pregunta es si la
  empresa tiene el canal, no si hoy cabe alguien más.
- **LinkedIn no se cuenta aparte** (punto L).
- El nombre del método, en inglés y en la línea de los que ya hay. Lo propones en la opinión previa.

### 2 · Los dos puntos del agente la usan

- **Al crear la oferta**: la condición «la oferta nace sin plataformas» del paso 1 pasa a ser «la
  oferta no tiene canales». La excepción del modo demo (decisión 8) y su lectura no cambian, y solo
  se consulta el modo demo cuando la respuesta es «no tiene canales».
- **Al consultar una oferta sin candidatos**: la misma sustitución.

**Los textos no cambian.**

## 🔴 Dónde se para

- **Ni textos ni portal.** El aviso del formulario del portal es el paso 2.
- **Nada del formulario público ni de LinkedIn**: solo se lee el campo de la empresa.
- **El resto del agente no se toca**: ni Maya, ni la API del agente, ni el resumen de varias ofertas.
- Sin comentarios en el código, sin formateador, sin lint. Identificadores en inglés, también en
  las pruebas y en los parámetros de los callbacks.

## Pruebas y verificación

- **El método**: con plataforma → sí, sin leer la empresa; sin plataformas y con el formulario
  encendido → sí; sin plataformas y apagado → no; sin plataformas y la lectura falla → no, con el
  aviso en el log.
- **El agente**: el caso de Sofía al crear y al consultar → el texto de siempre. Las pruebas del
  paso 1 se adaptan a la pregunta nueva **sin perder ninguno de sus casos**.
- **Control negativo** en las nuevas: invierte la expectativa, comprueba que falla, bórralo.
- `npx jest --clearCache`, `npm run build` y `npm test`, **una vez**, frente a la línea base.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados.
2. Después: qué cambió y el resultado real de la verificación, frente a la línea base.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
