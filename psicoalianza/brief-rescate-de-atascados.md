# Brief · El rescate de los candidatos atascados

Cambio de comportamiento, fuera de la numeración de los pasos: saca gente del proceso, así
que va en su propio cambio (decisión 39).

**Este documento dice qué hacer y qué no. El *porqué* está en los otros `.md`.**

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto.
3. `integrate-psicoalianza.md` — la bitácora. Importan **35 y 39**, y el registro del paso 5.
4. El cron de resultados, y en concreto **el bloque que reintenta el arranque** cuando al
   candidato le falta el identificador del proveedor.

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio. Si algo
de aquí no cuadra con el código, gana el código y hay que decirlo antes de empezar.

## El caso, con una persona

**Sofía** entró a la etapa psicométrica hace tres días, en una oferta a la que le falta el
nombre de la vacante guardado. Nunca se la pudo invitar, así que quedó **esperando un
resultado externo sin identificador del proveedor**.

Cada cinco minutos el cron la ve, reintenta el arranque, y desde el paso 5 ese reintento
falla con el error de fallo permanente: no hay nada que reintentar, el dato que falta es
nuestro. El cron lo registra, lo cuenta como error y **la deja donde estaba**.

🔴 **Y ahí se queda, para siempre.** El bloque del reintento termina en un retorno
incondicional y la comprobación del plazo está **debajo**, así que Sofía nunca llega a ella:
no la descarta el vencimiento, ni ningún otro barrido —el de conversaciones sin respuesta
solo mira a quien espera respuesta del candidato, y el de flujos atascados solo mira el
estado de arranque—. **No recibe nada nunca y no sale del proceso nunca.** Lo único que la
saca hoy es cancelar la oferta entera.

⚠️ **Y no está quieta: ocupa una plaza.** El estado en el que quedó cuenta como candidato en
vuelo, así que reserva cupo y mantiene ocupado su teléfono de pruebas. Una oferta con la
vacante sin nombre va acumulando gente que nunca avanza y plazas que nunca se liberan.

El paso 5 arregló que esto le pase a alguien nuevo. **Esto saca a quien ya está dentro.**

## El objetivo

Que el cron, cuando el reintento del arranque falle **de forma permanente**, saque a esa
persona del proceso en vez de dejarla esperando algo que no existe.

## Alcance exacto — qué se hace

1. **En el bloque del reintento, distinguir el fallo permanente del resto.** Se reconoce
   por el tipo del error, el mismo que estrenó el paso 5 — **nunca por su texto**.
2. **Ante el permanente, descartar** con el motivo que ya existe para un arranque de etapa
   que falla, el mismo que usa la casa en cualquier otra etapa. **No hay motivo de rechazo
   nuevo, así que el portal no se toca** — ya lo traduce en español y en inglés, comprobado.
3. **Ante cualquier otro fallo, todo sigue igual**: se registra, se cuenta como error y el
   candidato se queda esperando, porque una caída pasajera sí se arregla reintentando.

## 🔴 Dónde se para — qué NO se hace

- **No se toca el plazo de vencimiento** ni su mensaje.
- **No se avisa al candidato.** Es lo mismo que el paso 5 decidió para este fallo, y lo que
  ya les pasa a los candidatos de cualquier otra etapa que falla al arrancar. Escribirle a
  Sofía ahora sería inventar un mensaje para un caso que el equipo del embudo no diseñó.
- **No se toca nada más del cron**: ni la consulta, ni el emparejamiento, ni el veredicto.
- **No se renombra ningún campo ni motivo.**
- **No se arregla la oferta.** Que a esa vacante le falte el nombre sigue siendo un problema
  de configuración; esto solo evita que la espera se cobre en personas.

## Lo que hay que preservar entero

| Qué | Por qué existe |
| --- | --- |
| **El descarte archiva la etapa donde cayó el candidato** | El portal usa esa etapa; solo deduce por el motivo en registros viejos. Si no se archiva, Sofía aparece descartada en una etapa que sí superó |
| **El fallo pasajero sigue reintentándose** | Es el caso frecuente y el que sí se arregla solo |
| **El contador de errores del ciclo sigue contando el permanente** | Hace visible que una oferta está rota. ⚠️ Pero **deja de ser una señal permanente**: hoy grita cada cinco minutos porque los atascados siguen ahí; después gritará en el ciclo en que se los lleva y se callará. Lo cubre la alerta por correo que dispara cada candidato nuevo que entre a esa etapa |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador.** El diff debe contener **solo** lo que este
  brief pide, y aquí eso son muy pocas líneas.
- **Comentarios: ninguno nuevo en archivos de código**, y los que ya están en el cron no se
  tocan.
- **Los identificadores van en inglés**, incluidos los de los `.spec`.
- **La solución más pequeña que resuelve el caso.**
- **No commitear.** Los archivos nuevos se añaden al índice, con `add` y no solo marcados.

## Pruebas

- **Un candidato cuyo reintento falla de forma permanente queda descartado**, con el motivo
  de arranque fallido, y **no se le manda ningún mensaje**.
- **Un candidato cuyo reintento falla de forma pasajera sigue esperando**, como hoy.
- **Un candidato cuyo reintento funciona queda invitado**, que es el camino normal y no debe
  moverse.

⚠️ Una prueba que pasa a la primera merece desconfianza: comprobar que muerde con un control
negativo, y borrarlo después, limpiando la caché.

## Verificación

Una vez sobre el conjunto del cambio:

- Backend: `npm run build` y `npm test`.

El resultado va en el reporte. Si falla, el paso no está terminado.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el diff no trae cambios de formato** ni toca el cron fuera del
   bloque del reintento.
5. **Confirmación de que el candidato descartado archiva la etapa psicométrica**, no otra.

## Para el despliegue, no para el código

🔴 **Estas personas no iban a salir del proceso.** Iban a quedarse dentro para siempre. Así
que el número de abajo no es "los mismos de siempre, antes": es **cuánta gente sale por esta
decisión**, y por eso conviene mirarlo con calma antes de soltarlo.

```js
db.offers.aggregate([
  // Mismo filtro que el cron: todo menos cancelada. Una oferta cerrada o
  // expirada sigue teniendo candidatos vivos, y ahí también hay atascados.
  { $match: { status: { $ne: "cancelled" } } },
  { $unwind: "$candidates" },
  { $match: {
      "candidates.stage.name": "psychological_exam",
      "candidates.flowState.status": "awaiting_external",
      "candidates.flowState.psychometricCandidateId": null,
      "candidates.flowState.evaluatestCandidateId": null
  } },
  { $count: "atascados" }
])
```

**Si el número es alto, mirar primero por qué**: puede que lo que falle no sea el nombre de
la vacante sino algo pasajero que lleva días.

⚠️ **Ese número suma dos poblaciones y solo una se rescata.** Si el documento de la persona
no se puede cargar, el reintento ni siquiera se intenta: no hay llamada, no hay excepción y
no hay descarte. Esa gente está atascada igual, pero por otra causa —que la persona ya no
exista es otra decisión, y no es la de este brief— y va a seguir dentro después de este
cambio. Leer el número sabiendo que las cuenta juntas.
