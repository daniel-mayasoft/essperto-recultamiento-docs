# Planning · candidatos por canal en analítica

Para **quien escribe el brief de este frente** y llega sin contexto. Dice **cómo funciona hoy**, **dónde
está cada pieza** y **qué hay que decidir antes de que alguien toque código**. El qué se pide está en
`requisitos.md`.

## Antes de nada

1. `../../CLAUDE.md` — el proyecto, el vocabulario, la verificación y la deuda conocida.
2. `../psicoalianza/arranque-del-ejecutor.md` — cómo se trabaja aquí. Las reglas son de la casa.
3. `../canales-de-publicacion/planning.md` y `../ofertas-sin-ats/planning.md` — las tareas hermanas, y la
   coordinación con Elvis por LinkedIn, que también afecta a esta.

Es un cambio **de lectura**: no toca el embudo ni lo que le pasa a nadie. Pero **cambia cifras que alguien
ya está mirando**, y eso hay que decirlo al entregarlo.

## Cómo funciona hoy

La pantalla de analítica tiene una tabla por portal de empleo: cuántos candidatos trajo cada uno, cuántos
llegaron a ser viables y el porcentaje.

Para saber de qué portal vino cada candidato, la métrica mira **la ficha de la persona**, no su
participación en la oferta. Eso tiene dos consecuencias que hoy ya están en las cifras:

1. 🔴 **Las cargas manuales no aparecen en ningún lado.** Una persona cargada a mano o por el Excel no
   tiene portal en su ficha, así que no suma en ninguna fila.
2. 🔴 **Una persona puede sumar en un portal por culpa de otra oferta.** La ficha acumula todos los portales
   por los que alguna vez llegó, en cualquier oferta. Si Ana aplicó a la oferta A por Computrabajo y a la
   oferta B por elempleo, en la analítica de la oferta B cuenta en los dos.

**Desde el 2026-09-21 existe un dato mejor**: cada participación guarda **por dónde entró esa persona a esa
oferta** —portal, alta individual o carga masiva—. Las participaciones anteriores a esa fecha no lo tienen
y se leen como «portal», que es lo único que podían ser. **Pero ese dato no dice qué portal**: solo que fue
un portal.

**La regla del «primer registro» ya se cumple sola.** Una persona solo puede tener una participación por
oferta: si llega por un segundo canal, el sistema la reconoce y no crea otra. Así que el origen guardado es
siempre el del primero.

## Dónde está cada pieza

### Backend (`../../../../esscoti-backend`)

| Qué | Dónde | Para qué importa |
| --- | --- | --- |
| **La métrica actual** | `src/metrics/metrics.service.ts`: la lectura de la ficha de cada candidato y la tabla por plataforma, en la analítica global | Es lo que se reemplaza |
| Los filtros | En el mismo archivo: empresa, estado, rango de fechas y subconjunto de ofertas | ⚠️ El rango de fechas filtra por **la fecha de creación de la oferta**, no por la fecha en que llegó cada candidato |
| **El origen por participación** | `src/offers/enums/candidate-source.enum.ts` y el campo de origen en la participación, en `src/offers/schemas/offer.schema.ts` | Portal, alta individual o carga masiva. **No distingue qué portal ni tiene LinkedIn** |
| Quién escribe el origen | `src/offers/offers.service.ts` (llegada desde un portal y alta individual) y `src/offers/bulk-candidates/bulk-candidates.service.ts` (carga masiva) | Los tres caminos de entrada |
| Los portales de la oferta y de la persona | La lista de plataformas de la oferta (`offer.schema.ts`) y la de la ficha de la persona (`candidate.schema.ts`), cada una con plataforma e identificador de la vacante en ese portal | Cruzándolas se puede saber **qué portal trajo a esa persona a esa oferta** |

### Portal (`../../../../esscoti-frontend`)

| Qué | Dónde |
| --- | --- |
| La tabla actual por portal | `app/routes/analytics.tsx` |
| Los textos | `app/i18n/locales/es.ts`, bajo `analytics.ats` |

## Lo que hay que decidir antes de escribir el brief

1. 🔴 **Cómo saber qué portal trajo a cada persona a cada oferta.** Dos opciones:
   - **Añadir el portal al origen de la participación** a partir de ahora. Es lo limpio, pero las
     participaciones anteriores no lo tienen.
   - **Deducirlo al calcular**, cruzando la lista de plataformas de la oferta con la de la ficha de la
     persona por el identificador de la vacante. Sirve también para lo viejo.

   Recomendación: **guardarlo a partir de ahora y deducirlo para lo anterior**. Hay que resolver qué pasa
   si el cruce da dos portales para la misma oferta.
2. 🔴 **Las cifras van a cambiar**, y a la baja en los portales: se corrige el doble conteo por otras
   ofertas y se separan las cargas manuales. Hay que avisarlo a quien use la pantalla, o parecerá que los
   portales empezaron a traer menos gente.
3. **Qué significa «en el periodo».** Hoy el rango de fechas filtra ofertas por su fecha de creación. Si
   el requisito quiere «candidatos que llegaron en el periodo», es otro filtro: fecha de llegada de cada
   participación.
4. **Qué columnas se conservan.** La tabla actual también muestra viables y porcentaje de viables por
   portal. Recomendación: conservarlas para todos los canales, porque comparar la calidad de lo cargado a
   mano con la de los portales es justo lo interesante.
5. **LinkedIn.** Hoy no existe. El canal tiene que salir en cero hasta que se integre, y su integración
   tiene que **guardar LinkedIn como origen** de la participación para que aquí se cuente. Se suma a la
   misma reunión con Elvis de las otras dos tareas.
6. **La lista de canales que se muestran en cero**: todos los portales que soporta el sistema, o solo los
   configurados en la empresa. Recomendación: los configurados más las dos cargas manuales, que están
   siempre disponibles.

## Coordinación con Elvis: LinkedIn

La misma reunión de las otras dos tareas, con un punto más: **cuando LinkedIn traiga a una persona, su
participación tiene que guardar LinkedIn como origen**. Si no, esta métrica no puede contarlo.

## Cómo se parte el trabajo

1. **Backend**: el portal concreto en el origen de la participación a partir de ahora, la deducción para
   lo anterior, y la métrica nueva con todos los canales, los ceros y los filtros existentes. Con pruebas
   de los casos: carga manual, carga masiva, persona en dos ofertas por dos portales, y participación
   antigua sin origen.
2. **Portal**: la tabla renombrada con los canales nuevos y sus textos.

## Verificación

- **Backend**: `npm run build` y `npm test`, una vez sobre el conjunto del cambio.
- **Portal**: `npm run typecheck`. 🔴 **No tiene pruebas automáticas**, así que el brief trae los casos a
  mano en local. Como mínimo: una oferta con candidatos de un portal, uno cargado a mano y otro por Excel
  muestra los tres en su fila; un canal sin candidatos sale en cero; y los filtros de oferta y fechas
  cambian las cifras como se espera.
- 🔴 **No correr el lint del backend**.
