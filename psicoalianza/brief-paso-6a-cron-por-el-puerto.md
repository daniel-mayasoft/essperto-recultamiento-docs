# Brief · Paso 6a de la etapa 1 — el cron pregunta por el puerto

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está
en los otros `.md`** — no se repite aquí, porque dos copias de la misma decisión se
desincronizan y nadie lo nota.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto.
3. `integrate-psicoalianza.md` — la bitácora, fuente única. Importan **22, 36, 38 y 39**,
   y el registro de los pasos 4 y 5.
4. `brief-paso-4-resultados-en-el-puerto.md` — la operación que este paso va a llamar. Se
   escribió hace dos pasos y **nadie la ha llamado todavía**.
5. El cron de resultados entero, de principio a fin, incluida la rama del veredicto.

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio. Si algo
de aquí no cuadra con el código, gana el código y hay que decirlo antes de empezar.

## Por qué este paso va antes que los campos neutros

La hoja de ruta anunciaba un solo paso: el recableado del cron **con** los campos neutros
del candidato. Se parte en dos, y **este va primero**, por un motivo que aparece al leer el
código: uno de los campos neutros es el estado del candidato, y su valor solo existe cuando
el cron consume lo que devuelve el puerto. Al revés, habría que traducir los códigos de
EvaluaTest dentro del cron para guardarlos, y ese código se borraría entero en el paso
siguiente. Primero se cambia de dónde sale el dato; después, dónde se guarda.

## El objetivo

Que el cron **pida los resultados al puerto** en vez de consultar el tablero por su cuenta.
Al terminar, **nadie ve nada distinto**: los mismos candidatos aprueban, los mismos se
descartan y con los mismos motivos, los mismos mensajes salen por WhatsApp y los mismos
campos se guardan con los mismos nombres.

🔴 **Con una excepción, y no es invisible: durante una caída larga del proveedor este paso
descarta gente que hoy no se descartaba.** Está explicada abajo, en *la caída larga*. No se
puede separar en su propio cambio —es consecuencia directa de cambiar de dónde viene el
dato— así que se asume aquí, a sabiendas y escrita.

⚠️ Y hay una diferencia interna menor: cuando la consulta lanza en vez de devolver vacío,
ahora se guarda la marca de última consulta que antes no se guardaba. Ese campo hoy no lo
lee nadie.

Lo que cambia es de dónde viene la información: el emparejamiento y la traducción del
estado dejan de vivir en el embudo.

## Alcance exacto — qué se hace

1. **El cron llama a la consulta de resultados del puerto**, una vez por oferta, con la
   lista de candidatos que espera (decisión 22). ⚠️ **No son todos los pendientes:** la
   operación exige el identificador del proveedor, y quien no lo tiene es justamente el que
   reintenta el arranque antes de mirar nada. Solo van los que ya lo tienen.
2. **Desaparecen del cron los dos índices y el emparejamiento.** Eso vive en el adaptador
   desde el paso 4, con sus dos llaves.
3. **La rama del veredicto pasa a mirar el estado neutro** en vez del código numérico del
   proveedor. La regla no se toca: sigue decidiendo el puntaje mínimo y las pruebas
   adicionales configuradas en la oferta.
4. **La rama del modo demo produce la forma nueva.** Hoy fabrica filas con la forma del
   tablero de EvaluaTest; ahora fabrica resultados con la forma que devuelve el puerto
   (decisión 38). **Se adapta el constructor sintético, no se reescribe.**

   🔴 **Y tiene que devolver el "no aparece", no omitirlo.** Hoy el candidato demo que
   sigue dentro de su retraso simulado simplemente no entra en el arreglo y cae solo en la
   rama de sin coincidencia. Con la forma nueva los resultados van emparejados por nuestra
   referencia, así que omitirlo deja un hueco en vez de un estado. Si se pierde, lo que se
   rompe es la sensación de *está evaluando* en mitad de una demostración en vivo — y se
   rompe hacia el lado que no avisa.

   ⚠️ Su bolsa tiene que traer el código numérico de estado del proveedor, o una oferta
   demo deja de escribir el sexto campo que hoy escribe.

## 🔴 Dónde se para — qué NO se hace

- 🔴 **No se renombra ningún campo guardado.** Los seis siguen con el nombre del proveedor.
  Eso es la decisión 15 y va en el paso 6b.
- 🔴 **No se toca el plazo de vencimiento ni su mensaje.** El plazo es la ventana que el
  candidato tiene para presentar la prueba, no un temporizador nuestro, y lo diseñó otro
  equipo. Ver la nota de abajo sobre *no se pudo consultar*.
- 🔴 **No se rescata a los candidatos atascados.** Ese cambio saca gente del proceso y va
  aparte (decisión 39). ⚠️ La única gente que este paso saca del proceso y hoy no salía es
  la de *la caída larga*, aquí abajo — no hay otra.
- **No se mueve el veredicto** ni se cambia ningún umbral.
- **Las pruebas adicionales se quedan donde están** (decisión 4): las pide el embudo al
  cliente, después del emparejamiento, y una oferta demo se las salta. **Ese salto es el
  quinto punto del modo demo y es el más fácil de perder** — ver la decisión 38.
- **No se toca el arranque de la etapa**, ya recableado en el paso 5.

## 🔴 La trampa principal: los correos hay que tenerlos ANTES de preguntar

Hoy el cron pide el tablero primero y **después**, dentro del bucle, carga el documento de
cada candidato para sacar su correo y emparejarlo.

Con el puerto eso se da la vuelta: **la operación recibe las dos llaves de cada candidato
en la misma llamada**, así que los correos tienen que estar resueltos antes. Hay que cargar
los candidatos de la oferta **por delante**, en un solo golpe, en vez de uno por uno dentro
del bucle.

⚠️ **Cuidado con dos cosas al moverlo:**

- **El correo de emparejamiento no es siempre el del candidato.** Si quedó registrado con
  otro —desvío de pruebas de QA— manda ese (32-d). Los dos viajan por separado y la regla
  vive en el adaptador; el cron solo los entrega.
- **El teléfono y el nombre se siguen usando dentro del bucle**, para los mensajes. Que el
  correo se resuelva antes no significa que todo lo demás tenga que subir con él.

## 🔴 "No se pudo consultar" llega por primera vez a alguien que lo puede leer

El puerto distingue *consulté y esa persona no aparece* de *no pude preguntar* (decisión
36). Es la primera vez que ese estado llega al embudo.

**En este paso no se actúa sobre él**: un candidato en ese estado **sigue esperando,
exactamente como hoy**, y el plazo sigue corriendo igual. Solo hay que dejarlo distinguible
en el registro y en el resumen del ciclo, para que se pueda medir cuánto pasa de verdad
antes de decidir qué hacer.

### 🔴 La caída larga: lo que este paso sí cambia para una persona

Hoy, cuando la petición del tablero **lanza** —credenciales mal puestas, login roto, red
caída—, el cron **abandona la oferta entera antes de entrar al bucle por candidato**. Y en
ese bucle pasan tres cosas, no una: el reintento del arranque de quien no tiene
identificador del proveedor, **el descarte por vencimiento**, y el guardado. O sea que hoy
una caída **congela de rebote** a todos los candidatos de esa oferta: nadie vence mientras
dure.

Con el puerto la excepción se atrapa dentro del adaptador, el cron ya nunca abandona la
oferta y **el bucle corre siempre**. Consecuencia: una empresa cuyo acceso al proveedor
lleve roto más días que el plazo configurado **empieza a descartar candidatos por
vencimiento**, con el mensaje de que no llegó su resultado a tiempo, sin que nadie haya
conseguido preguntar nunca.

**Se asume, y estas son las tres razones:**

1. **Ese congelado no es una salvaguarda, es un accidente**: nadie lo diseñó, sale de
   abandonar la oferta. Y de paso también se salta el reintento del arranque, que sí hace
   falta.
2. **Conservarlo rompería el caso frecuente.** Los dos caminos —lista vacía y excepción—
   son un solo estado desde el paso 4, y no se pueden volver a separar sin tocar el cliente
   (decisión 36). Saltarse la oferta cuando todo vuelve como *no se pudo consultar* haría
   que el camino de la lista vacía **congelara el plazo para siempre** a quien nunca
   presenta la prueba, que es el error espejo y el que la 36 marca como supuesto sin
   verificar.
3. **La política ya está decidida**: ante *no se pudo consultar*, el candidato sigue
   esperando y el plazo no se toca. Este paso la aplica, no la inventa.

**Lo que sí cambia con ella y no se esconde:** en una oferta cuya consulta lanza, ahora
también se reintenta el arranque de quien no tiene identificador del proveedor. Es una
invitación real durante una caída, y **no se puede predecir en una línea cómo acaba**: ese
reintento no pasa por la consulta del tablero, pasa por la invitación. Si lo roto es solo
la consulta —el caso más común— la invitación funciona y esa persona **recibe su prueba**,
que es lo que debía pasar y hoy no pasa. Si lo roto son las credenciales o la red, falla y
se cuenta como error. En los dos casos es mejor que hoy, donde no se intenta siquiera.

⚠️ **El arreglo de fondo sigue siendo del cliente** —distinguir *no pude preguntar* de *no
hay nadie*—, va en su propio cambio y no es este.

Diferencia menor del mismo sitio: hoy la excepción no guarda nada de nadie y la lista vacía
sí guarda la marca de última consulta. Con el puerto se guarda en los dos casos. Ese campo
hoy no lo lee nadie.

## Dos cosas más que este paso arrastra, y se aceptan

- **El cron abre la bolsa del proveedor** para sacar el código numérico de estado y seguir
  guardándolo con su nombre de hoy. Es la misma fuga que el paso 1 reportó en el servicio de
  ofertas, y **muere en el 6b**. No hay alternativa dentro de la línea de parada: dejar de
  escribirlo sería quitar un campo, y eso es del 6b.
- **La consulta pasa a resolver credenciales con la regla estricta**, la del adaptador, que
  exige también el identificador de empresa. El cron usa hoy una más laxa. Es el mismo
  cambio que el paso 5 encendió para la invitación, medido en **cero empresas afectadas**
  (B8). ⚠️ Ojo al efecto lateral: la consulta de pruebas adicionales se queda donde está y
  sigue con la regla laxa, así que **el cron queda con dos reglas de credenciales
  conviviendo** hasta que se unifiquen.

## Lo que hay que preservar entero

Está levantado del código. Perder cualquiera rompe en silencio:

| Qué | Por qué existe |
| --- | --- |
| **Una sola petición por oferta**, no una por candidato | El tablero trae todos los candidatos de la vacante, los de esta oferta y los de cualquier otra que use la misma (decisión 22) |
| **El candidato sin identificador del proveedor reintenta el arranque** antes de mirar nada | Es el rastro de un registro que falló. Se queda como está |
| **La oferta se recarga fresca en cada iteración** del bucle interno | Aprobar a uno guarda el documento y sube su versión; sin recargar, el siguiente `save` revienta |
| **El identificador con el que se pide las pruebas adicionales es el del tablero**, no el guardado | Puede discrepar, y por eso el respaldo por identificador existe. La operación lo devuelve |
| **El puntaje solo se lee cuando el candidato terminó** | En los demás estados no viaja, y un ausente no es un cero (decisión 37) |
| 🔴 **El identificador que vuelve se pasa tal cual, aunque sea cero** | Un cero es lo que manda el tablero cuando no trae identificador, y hoy se usa igual para pedir las interpretaciones. **Tratarlo como ausente cambiaría quién se descarta** — ver abajo |
| **Una oferta demo no hace ninguna llamada real**, ni de credenciales ni de tablero ni de interpretaciones | Son puntos distintos del código, no uno (decisión 38) |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador**, y si el editor formatea al guardar, se
  apaga. El diff debe contener **solo** lo que este brief pide.
- **Comentarios: ninguno nuevo en archivos de código.** ⚠️ **Los que ya están en el cron no
  se tocan**: documentan trampas averiguadas en producción. Si un comentario explica código
  que este paso se lleva, se va con él — y se dice en el reporte cuál y por qué.
- **Los identificadores van en inglés**, incluidos los de los `.spec` y los parámetros de
  callbacks.
- **La solución más pequeña que resuelve el caso.** Nada de reorganizar de paso.
- **No commitear.** Los archivos nuevos se añaden al índice.

## Pruebas

🔴 **La red de seguridad es la prueba del ciclo mixto**: una oferta demo y una real en la
misma pasada, que comprueba que la real llama al tablero exactamente una vez y la demo
nunca lo toca. **Si se pone en rojo, el cambio está mal — no la prueba.** Ojo: como el
camino real ahora pasa por el puerto, esa prueba necesita el mismo montaje que se usó en el
paso 5 — el adaptador de verdad sobre el cliente falso—, no una afirmación más débil.

Lo nuevo que hay que cubrir, y es exactamente lo que dice el alcance:

- **Se pide una sola vez por oferta**, y en esa llamada van **los pendientes que ya tienen
  identificador del proveedor** — el que no lo tiene queda fuera de la llamada y reintenta
  el arranque, como hoy.
- **Los dos correos llegan a la operación**, y el de registro cuando existe.
- **Aprueba, descarta y sigue esperando** según el estado neutro, con los mismos motivos de
  rechazo que hoy.
- **Un candidato que no aparece sigue esperando**, y **uno que no se pudo consultar
  también** — y los dos se distinguen en el registro.
- **La oferta demo resuelve sin llamar a nada**, y sigue aprobando por la misma regla real.

⚠️ Una prueba que pasa a la primera merece desconfianza: comprobar que muerde con un
control negativo, y borrarlo después, limpiando la caché.

## Verificación

Una vez sobre el conjunto del cambio, no archivo por archivo:

- Backend: `npm run build` y `npm test`.

El resultado va en el reporte. Si falla, el paso no está terminado.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.** Es lo más importante.
4. **Confirmación de que el diff no trae cambios de formato** ni reorganizaciones que nadie
   pidió, y **qué comentarios se borraron**, si alguno, con su motivo.
5. **Confirmación de que los seis campos guardados siguen llamándose igual** y de que el
   plazo no se tocó.
6. 🔴 **Qué pasa hoy con un candidato en "no se pudo consultar"**, en una línea: es el
   estado nuevo y el único cuyo comportamiento no se ve en ninguna prueba de negocio.
