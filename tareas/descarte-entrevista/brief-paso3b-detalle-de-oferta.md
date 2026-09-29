# Brief · Paso 3b — «Motivos de rechazo final» en la vista de cada oferta, y el mensaje de la tabla

Para quien ejecuta este paso. Dos cambios pequeños en la analítica, que no tocan el embudo ni escriben a
nadie: **brief corto y una sola ronda**. Backend y portal.

Antes de empezar, lee la bitácora: **decisiones 12, 13, 25 y 26**. El paso 3 (`brief-paso3-analitica.md`)
es el precedente: este paso reutiliza lo que hizo.

## Rama y orden

El frente ya está en `develop` (backend #95, portal #66). Este paso va en **una rama nueva desde
`develop`**, `feat/offer-detail-final-rejections`, en los dos repositorios. Trae `develop` al día antes
de crearla. **Sin PR a `develop` hasta revisar el diff.** Pasa a `main` junto con el resto del frente.

## Qué le pasa a quien mira la analítica

| | Hoy | Después |
| --- | --- | --- |
| Pasa el ratón por una fila de la tabla de ofertas | El aviso «clic para ver el detalle» sale a la izquierda, fuera de la pantalla | Sale arriba de la fila, visible |
| Abre la vista de una oferta | Ve el embudo y «Descartados por etapa», con los motivos del agente, pero no los rechazos de Marta | Además ve «Motivos de rechazo final» de esa oferta, igual que en el panel |

## Qué se hace

### 1 · El mensaje de la tabla (decisión 26), portal, en su propio commit

En la tabla de ofertas de la pantalla de analítica, el aviso de cada fila pasa de `placement="left"` a
arriba. Nada más de la tabla cambia.

### 2 · El bloque en el detalle de la oferta (decisión 25)

**Backend**: la respuesta del detalle de una oferta suma `finalRejections`, **con la misma función que
ya lo calcula para el panel**, sobre las participaciones de esa oferta. Misma forma: total y causales,
con «sin causal» como causal nula, de más a menos. Comprueba que la consulta del detalle trae el
desenlace y la causal de cada participación; si selecciona campos, añádelos.

**Portal**: en la vista de la oferta, la misma tarjeta que en el panel, con el mismo título, el total, las
etiquetas de las causales y «Sin causal». **No se extrae un componente compartido**: son dos usos, y la
regla de la casa es no abstraer para dos. Se escribe la tarjeta en la vista de la oferta siguiendo la
del panel. No se crean textos nuevos: son los del paso 3.

## Opinión previa del ejecutor (2026-09-29), verificada e incorporada

| Punto | Decidido |
| --- | --- |
| Ramas desde `develop` al día (backend `d978a00`, portal `02d0d3d`); línea base 161 suites y 1.651 pruebas | Correcto |
| La consulta del detalle ya trae desenlace y causal; `finalRejections` se llama con las participaciones de la oferta | Correcto: no se toca la consulta ni se reimplementa nada |
| El detalle no filtra por estado de la oferta: si está cancelada, el bloque la cuenta | **Aceptado**: es una sola oferta elegida a propósito, y el embudo y «Descartados por etapa» de esa vista ya se comportan así |
| La tarjeta va después de «Descartados por etapa», a lo ancho, copiando la tabla del panel | **Aceptado** |
| El aviso de la tabla pasa a `placement="top"`, en su propio commit | Correcto |
| Los dos casos a mano, en una sección del paso 3b | Correcto |

**Se puede empezar.**

## 🔴 Dónde se para

- **Nada más de la analítica**: ni el embudo, ni la exclusión del paso 3, ni otras tarjetas.
- **La contratación no se toca.**
- Sin comentarios en el código, sin formateador, sin lint.

## Pruebas y verificación

- **Backend**: una prueba del detalle de la oferta con un rechazo con causal, uno sin causal y un
  contratado: el bloque cuenta los dos rechazos y no al contratado. Control negativo.
  `npx jest --clearCache`, `npm run build` y `npm test`, una vez. La línea base es la de `develop` al
  crear la rama: mídela antes de tocar nada.
- **Portal**: `npm run typecheck`.
- **A mano**, en el servidor de pruebas, se añaden dos casos a `pruebas-a-mano.md`, en una sección del
  paso 3b: el aviso de la fila sale visible, y la vista de la oferta 2 muestra «Motivos de rechazo final»
  con la causal del Luis rechazado a mitad del proceso.

## Qué entregar

1. Qué cambió y el resultado real de la verificación, en los dos repositorios.
2. Qué decisiones tomaste que no estaban en el brief.
3. Todo en el índice, índice y árbol coincidiendo.
4. Un mensaje de commit por repositorio; en el portal, dos: el del aviso y el de la tarjeta.
