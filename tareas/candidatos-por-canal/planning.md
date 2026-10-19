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

## 🔴 Actualizado el 2026-10-19: el código de hoy (gana sobre las secciones de abajo)

Las secciones de abajo se escribieron el 2026-09-23, **antes** de que Elvis añadiera la tabla por canal de
entrada (`054a480`, 2026-09-30). Leído en `develop` (backend `740f478`, portal `986bead`). Qué queda contra
la aceptación: tabla en `requisitos.md`.

**Backend** (`src/metrics/metrics.service.ts`, en el cálculo del panel global):

- La respuesta trae **`channels`**: una fila por canal con candidatos, viables y tasa. Cada candidato se
  cuenta por el **origen guardado en su participación en esa oferta**: si no es portal, va a la fila de su
  origen (`manual`, `bulk`, `public_link`); si es portal, se reparte por **los portales de la ficha de la
  persona**, que es justo el doble conteo descrito más abajo, en *Cómo funciona hoy*.
- 🔑 **El cruce por oferta está a medio camino**: el cálculo ya le pega a cada candidato las plataformas de
  su oferta, pero no las usa para el canal. La ficha de la persona guarda cada portal con el identificador
  de la vacante en ese portal, y la oferta también; cruzándolas por los dos se sabe **qué portal trajo a esa
  persona a esa oferta**, también para los registros viejos. Hay que decidir qué hacer si el cruce da dos.
- **LinkedIn ya tiene dónde mirarse.** Sus candidatos entran con origen `public_link` y, aparte, un
  **detalle de origen** (`sourceChannel`: `linkedin` o `manual`, el enlace compartido a mano). La tabla hoy
  no lo usa, así que todo cae en una sola fila de enlace público. Separarlo no necesita a Elvis: el dato ya
  existe.
- Sigue saliendo el campo viejo **`atsPlatforms`**, marcado como obsoleto, para no romper un portal
  desplegado sin `channels`. Decidir si se retira aquí o se deja.
- **Los ceros**: hoy solo salen canales con algún candidato. Hace falta una lista de canales que se
  muestran siempre (pregunta 6, más abajo).
- **Los filtros** se aplican igual que al resto del panel; el rango de fechas mira la creación de la oferta
  (pregunta 3).

**Portal** (`app/routes/analytics.tsx` y `app/i18n/locales/es.ts` y `en.ts`, bajo `analytics.channels`):

- La tabla usa `channels`, con el campo viejo de respaldo. Título: **«Calidad por canal de entrada»**.
- Las etiquetas traducidas son solo alta manual, carga masiva y «ATS sin plataforma identificada». El resto
  sale del nombre crudo del canal: los portales se leen bien, pero **el enlace público sale como «Public
  link»**, sin traducir.

**Coordinación:** la tabla es de Elvis. No hay nada que preguntarle para hacerlo, pero sí conviene
avisarle de que se toca su código y por qué (el doble conteo por persona).

**«Canales de publicación» sigue abierta** (paso 7). No toca la analítica, pero sí la creación de la
oferta y sus portales. Rama aparte, y fusionar `develop` con cuidado.

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
