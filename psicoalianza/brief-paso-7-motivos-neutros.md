# Brief · Paso 7 de la etapa 1 — los motivos de rechazo psicométricos dejan de llamarse EvaluaTest

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está
en los otros `.md`** — no se repite aquí.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto. **Este paso toca los dos repositorios**: mira la
   verificación de cada uno.
3. `integrate-psicoalianza.md` — la bitácora. Importan **13, 16 (con su corrección) y 17**.
4. La cabecera del enum de motivos de rechazo en el backend: dice qué es contrato con el
   portal.

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio en los
dos repositorios. Si algo de aquí no cuadra con el código, gana el código.

## El objetivo

Que los cuatro motivos con los que la etapa psicométrica descarta a alguien **dejen de
llevar el nombre del proveedor** (decisiones 13 y 16), y que el portal y las métricas sigan
entendiendo los viejos **para siempre**.

## 🔴 Este paso cambia algo visible, y es a propósito

**El visor del embudo** —el diagrama de la oferta y sus ventanas de descartados— **hoy no
reconoce ninguno de los cuatro motivos psicométricos**. Los muestra crudos, como su propio
grupo: el reclutador ve literalmente algo como `evaluatest_score_45 (en completed)`, y un
grupo distinto por cada puntaje y por cada nombre de prueba.

Cualquier renombre cambia ese texto y, además, **parte en dos** cada grupo: registros viejos
con un código y nuevos con otro. No hay forma de renombrar sin que el visor cambie.

**Lo que se hace:** el visor agrupa los códigos viejos y los nuevos en **los dos grupos que
ya existen** para esta etapa, con sus textos ya traducidos: *prueba psicométrica — no
completó* (el vencimiento) y *prueba psicométrica — no aprobó* (los otros tres). Es una
mejora, y se declara en vez de esconderse.

**En todo lo demás nadie ve nada distinto**: la ficha de la oferta, la tabla de analítica y
el panel de rechazados pasan por el traductor, que tiene que dar el mismo texto con el
código viejo y con el nuevo.

## Los nombres: solo cambia el prefijo

| Hoy | Nuevo |
| --- | --- |
| `evaluatest_external_timeout` | `psychometric_external_timeout` |
| `evaluatest_discarded` | `psychometric_discarded` |
| `evaluatest_score_<puntaje>` | `psychometric_score_<puntaje>` |
| `evaluatest_exam_<nombre>` | `psychometric_exam_<nombre>` |

⚠️ **La decisión 16 proponía otros dos nombres** (`psychometric_timeout` y
`psychometric_failed_<prueba>`), y está corregida en la bitácora. Cambiar también la palabra
es renombrar por renombrar, y en el caso de la prueba adicional rompe la forma que el
traductor del portal ya sabe desarmar. La regla es una sola y se aplica a los cuatro.

## 🔴 Las trampas

**1. Son valores guardados, y aquí la compatibilidad no caduca nunca.** En el paso 6b bastaba
con leer el campo viejo mientras hubiera candidatos en vuelo. Aquí no: **un candidato
rechazado se queda así en la base para siempre**, y el reclutador lo sigue consultando.
Todo lo que lee motivos tiene que entender el viejo y el nuevo **de forma permanente**. No
se migra nada.

**2. Las métricas cuentan el código literal.** No lo analizan: agrupan por el texto tal
cual. Sin tocarlas, la tabla de motivos más frecuentes y el desglose de rechazos por etapa
mostrarían **el mismo rechazo en dos filas con el mismo texto**. Hay que traducir el código
viejo al nuevo **antes de contar**, en un solo sitio que usen los dos conteos.

**3. El visor no recibe el código solo.** Recibe el código con la etapa pegada detrás —del
estilo `evaluatest_discarded (en completed)`—, y por eso sus comparaciones son de *contiene*.
**Cualquier patrón nuevo tiene que funcionar con ese sufijo**: nada de coincidencia exacta
ni de anclar al final.

🔴 **Y las comprobaciones nuevas van ANTES de las heredadas.** El visor conserva unas
comprobaciones antiguas que buscan las palabras *psicotécnica* o *psicométrica* en el texto y
lo mandan a *no completó*. El código de una prueba adicional lleva su nombre dentro, así que
quien reprueba una prueba llamada "Prueba psicotécnica" **caería en no completó en vez de no
aprobó**. Pasa ya hoy con el código viejo; puestas delante, las comprobaciones nuevas lo
arreglan para los dos.

**4. La tabla de deducción de etapa del portal no se toca.** Tiene escrito que no se amplía:
es un último recurso para registros viejos, y los nuevos traen su etapa real desde el
backend (decisión 17). Añadirle los códigos nuevos sería justo lo que prohíbe.

## Alcance exacto — qué se hace

**Backend**

1. **El enum gana los cuatro motivos nuevos**, con sus prefijos y constructores. **Los dos
   valores fijos viejos se mueven debajo del bloque que ya dice que no se emiten** —el de los
   de oferta cubierta—: así quedan marcados **sin escribir ningún comentario nuevo**. **Los
   constructores de los códigos viejos se quitan**, y los prefijos viejos salen del tipo que
   aceptan los descartes: que nadie pueda volver a escribir un código retirado. Si la
   normalización de las métricas necesita esos prefijos para leer, se leen como constantes.
2. **El cron escribe los nuevos** en sus tres sitios de descarte: vencimiento, descarte del
   proveedor, y puntaje o prueba adicional.
3. **Las métricas traducen viejo a nuevo antes de contar**, desde un solo sitio.

**Frontend**

4. **El traductor entiende los dos.** Los dos códigos fijos nuevos apuntan a **las mismas
   claves de texto** que los viejos; los analizadores del puntaje y de la prueba adicional
   aceptan los dos prefijos. **No hay textos nuevos.**
5. **El visor agrupa viejos y nuevos** en los dos grupos psicométricos que ya existen.

⚠️ **No es una contradicción, aunque lo parezca:** en el visor todos los puntajes y todas las
pruebas quedan en un mismo grupo, porque sus grupos son **por tipo de rechazo**; en las
métricas cada puntaje sigue siendo su propia fila, porque esa tabla es **por código** y eso ya
pasa hoy. Lo único que este paso unifica en métricas es el prefijo.

## 🔴 Dónde se para — qué NO se hace

- **No se migran valores guardados.**
- **No se escriben textos nuevos ni se renombran claves de traducción**: son identificadores
  internos. El texto que ve el reclutador —incluido quitar "IGI"— es la decisión 8, brief 8.
- **No se toca la tabla de deducción de etapa** (trampa 4).
- **No se toca ningún otro motivo de rechazo** fuera de estos cuatro.
- **No se arregla que las métricas separen por valor** de puntaje: ya pasa hoy, y aquí solo
  se unifica el prefijo.
- **No se toca la cabecera del enum.** Su lista de qué hay que actualizar al añadir un motivo
  se queda corta —no nombra el visor—, y eso está anotado en la bitácora, no en un
  comentario.

## Lo que ya está comprobado y no hace falta volver a mirar

**Ninguna lógica de negocio decide nada con estos cuatro motivos.** Se escriben y después solo
se muestran, se cuentan o se guardan. Revisado el 2026-09-11 en los dos repositorios:

- **En el backend nada compara contra ellos**: ni en el código, ni en consultas a la base, ni
  en scripts fuera del código fuente. Sí hay comparaciones contra **otros** motivos concretos
  —oferta cancelada en el servicio de ofertas, sin teléfono en el cron, y en las métricas dos
  grupos fijos para la tasa de respuesta: *nunca se le contactó* (sin teléfono y arranque
  fallido) y *no contestó* (sin respuesta y recordatorios agotados)—, y **ninguna incluye los
  cuatro psicométricos**. Corregido el 2026-09-11: una versión anterior de este brief decía
  que la única era la de oferta cancelada, y era falso.
- **Retomar un candidato rechazado** —reintentar o aprobar— saca la etapa del historial y usa
  el motivo solo para **anotarlo en la auditoría**. Sigue funcionando igual con el código nuevo;
  las anotaciones viejas conservan el viejo.
- **Las herramientas del agente de WhatsApp no leen motivos de rechazo.**
- **La API de candidatos revelados** saca la etapa del historial y devuelve el código tal cual
  para que el portal lo traduzca.
- **En el portal**, la ficha de la oferta, la analítica y el panel de rechazados pasan por el
  traductor; la línea de tiempo de etapas solo mira si hay motivo o no. Los únicos sitios que
  leen el código son el traductor, la tabla de deducción de etapa y el visor del embudo.

## Lo que no se puede comprobar leyendo código

Una ruta del backend devuelve el código de rechazo crudo, para la ficha de candidatos
revelados. El portal lo traduce. **Si algo fuera del portal consume esa ruta, el renombre es
un cambio de contrato con alguien externo.** No encontré ningún otro consumidor, pero eso no
se puede demostrar desde el código: dilo en la opinión previa si sabes o sospechas de uno.

**Lo mismo con cualquier consulta o tablero que viva fuera de los dos repositorios**: informes
hechos a mano contra la base, herramientas de análisis, exportaciones. Si alguno filtra por
`evaluatest_...`, **deja de contar a los rechazados nuevos sin dar ningún error**. Tampoco se
puede ver desde aquí. ⚠️ **Y la normalización de las métricas no los protege**: esos informes
leen la base directamente, donde el código nuevo aparece tal cual.

## Lo que hay que preservar entero

| Qué | Por qué existe |
| --- | --- |
| **Un código viejo se traduce exactamente igual que hoy** en la ficha, la analítica y el panel de rechazados | Son candidatos reales que el reclutador consulta |
| **La etapa donde cayó sale del historial**, no del motivo | Por eso el renombre no mueve la atribución de etapa ni el embudo |
| **El orden de los grupos en el visor** | Los dos grupos psicométricos ya tienen su posición; los códigos solo pasan a caer en ellos |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador en ninguno de los dos repositorios.**
- **Comentarios: ninguno nuevo en archivos de código.**
- **Los identificadores van en inglés**, incluidos los de los `.spec`.
- **La solución más pequeña que resuelve el caso.**
- **No commitear.** Los archivos nuevos se añaden al índice, con `add`.

## Pruebas

**Backend**

- **Los tres descartes del cron escriben los códigos nuevos.** Hoy **una sola prueba** afirma
  sobre dos de ellos —el puntaje y el descarte del proveedor— y hay que actualizarla. **El
  vencimiento y la prueba adicional no tienen hoy ninguna prueba** que mire qué código
  escriben: hacen falta **dos nuevas**. La otra prueba que usa el código viejo del vencimiento
  solo lo pasa como motivo cualquiera al descarte; no afirma qué se escribe.
- **En las métricas, un rechazo viejo y uno nuevo del mismo tipo cuentan como una sola fila**.

**Frontend**

El portal **no tiene pruebas**, solo comprobación de tipos. Por eso en su lugar va una tabla
en el reporte: **los ocho códigos** —los cuatro viejos y los cuatro nuevos, con un puntaje y
un nombre de prueba de ejemplo— con **el texto que da el traductor** y **el grupo en el que
caen en el visor**. **Incluir una prueba adicional llamada "Prueba psicotécnica"**, vieja y
nueva: tiene que caer en *no aprobó*. Es verificación por lectura, y hay que decir que lo es.

⚠️ Una prueba del backend que pasa a la primera merece desconfianza: control negativo, y
borrarlo después, limpiando la caché.

## Verificación

Una vez sobre el conjunto del cambio:

- Backend: `npm run build` y `npm test`.
- Frontend: `npm run typecheck`.

El resultado de los dos va en el reporte. Si alguno falla, el paso no está terminado.

## Qué entregar

1. **Qué cambió** y **qué se verificó** en cada repositorio, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el diff no trae cambios de formato** en ninguno de los dos.
5. **La tabla de los ocho códigos.**
6. **Confirmación de que la tabla de deducción de etapa no se tocó** y de que no se migró
   ningún valor guardado.
7. **Un mensaje de commit por repositorio.** Los dos cambios dependen uno del otro: el backend
   empieza a escribir códigos que solo el portal nuevo entiende, así que **el portal tiene
   que desplegarse antes o a la vez**, nunca después.
