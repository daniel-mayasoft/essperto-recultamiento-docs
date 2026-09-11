# Brief · Paso 5 de la etapa 1 — el arranque de la etapa pasa por el puerto

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está
en los otros `.md`** — no se repite aquí, porque dos copias de la misma decisión se
desincronizan y nadie lo nota.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto.
3. `integrate-psicoalianza.md` — la bitácora, fuente única. Importan **32 entera**, **35**
   y **38**, más 21, 31 y 33, y el registro de los pasos 1 a 4.
4. El código del arranque de la etapa, entero, incluido su bloque de captura de errores.
   **No basta con el camino feliz**: la mitad de lo que hay que preservar está en el otro.

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio. Si algo
de aquí no cuadra con el código, gana el código y hay que decirlo antes de empezar.

## 🔴 Este paso es distinto de los cuatro anteriores

Los pasos 1 a 4 fueron aditivos: añadían y no rompían nada porque nadie los llamaba. **Este
recablea el sitio donde se invita a una persona real.** Si algo se rompe, se rompe para
candidatos de verdad, en mitad de su proceso.

Al terminar, **todo se comporta igual que hoy salvo en un caso, y ese caso es a
propósito.**

🔴 **La excepción, dicha claro:** hoy una oferta **sin nombre de vacante guardado sí
invita** al candidato, con un nombre de cargo escrito a mano hace años — que es justo lo
que la decisión 35 quiso matar. Después de este paso esa persona **no se invita y sale del
proceso**. Es un cambio de destino para alguien real, no un recableado transparente, y hay
que desplegarlo sabiéndolo.

⚠️ **Antes de desplegar, medirlo**, con el mismo criterio con el que se midió el respaldo
por entorno (decisión 34): **cuántas ofertas activas tienen la prueba psicométrica
encendida y el nombre de la vacante en nulo**. Si son cero, esto es teórico y sale gratis.
Si no, hay gente que deja de recibir su prueba el día del despliegue. **La medición no
bloquea escribir el código** —el cambio es correcto en los dos casos—, decide si el
despliegue va tranquilo o con aviso.

En todo lo demás: ni un mensaje distinto, ni un campo guardado distinto, ni un orden
distinto.

## El objetivo

Que el arranque de la etapa **invite a través del puerto** en vez de hacer a mano los
cuatro pasos de EvaluaTest. La operación ya existe desde el paso 3 y nadie la llama.

## Alcance exacto — qué se hace

1. **La rama real del arranque llama a la operación de invitación del puerto.** Desaparecen
   de ahí las llamadas sueltas al cliente: resolver el código, registrar, invitar y el
   respaldo por correo ya viven dentro del adaptador (32-a).
2. **El enlace sale de lo que devuelve la operación**, en vez de volver a armarse ahí.
3. **Lo que se guarda del candidato no cambia**: el identificador del proveedor y el correo
   de registro se siguen guardando con las reglas de hoy.
4. **Distinguir el fallo que no se va a arreglar solo del que sí** — ver la trampa
   principal, que es la razón por la que este paso existe ahora y no antes.

## 🔴 Dónde se para — qué NO se hace

- **No se toca el cron de resultados.** Sigue consultando por su cuenta. Va en el paso 6.
- 🔴 **El condicional del modo demo se conserva tal cual** (decisión 38). Son **cinco**
  puntos y este paso toca dos de ellos —la invitación y el temporizador—: se quedan donde
  están y hacen lo mismo.
- **No se renombra ningún campo guardado.** Siguen con el nombre del proveedor; eso es la
  decisión 15 y va después.
- **No se quita el correo inventado** al candidato sin correo (decisión 33: cambia
  comportamiento y va en su propio cambio). La operación sigue recibiendo siempre un correo.
- **No se toca el respaldo por entorno** (decisión 34, también aparte).
- **No se toca ninguna ruta ni el servicio de ofertas.**

## 🔴 La trampa principal: un fallo permanente disfrazado de transitorio

Hoy, cuando el arranque falla, el bloque de captura hace tres cosas: avisa al candidato
—solo la primera vez, para no repetirle el mensaje—, lo deja **esperando resultado
externo** y guarda. Después, el cron ve que no tiene identificador del proveedor y
**reintenta el arranque entero** en cada pasada.

Eso está bien pensado para un fallo pasajero: la red se cae, se reintenta, sale.

⚠️ **Pero desde el paso 3 hay un fallo que nunca se va a arreglar solo.** Si la oferta no
tiene guardado el nombre de la vacante, la operación aborta a propósito (decisión 35), y
va a abortar igual en todos los reintentos. El candidato queda dando vueltas cada cinco
minutos durante días hasta que **el plazo lo descarta**, y recibe un mensaje diciendo que
no llegó su resultado a tiempo. Nunca hubo resultado que esperar.

La decisión 35 ya lo anticipó: *cambiaríamos un correo confuso por un candidato colgado,
que es peor*. **Este es el paso donde eso se resuelve, y es lo que hay que resolver bien.**

**Cómo se resuelve, y ya está decidido:** no hace falta inventar nada, porque la casa ya
tiene el mecanismo. Cuando **cualquier otra etapa** revienta al arrancar, el bucle que la
activa manda un correo de alerta, devuelve al candidato a la cola, lo reintenta un número
acotado de veces y al llegar al tope lo descarta con el motivo de *fallo al arrancar*. La
etapa psicométrica nunca llega ahí **porque se traga su propia excepción** y aparca al
candidato a esperar un resultado externo. Ese es el origen del problema, no el reintento
del cron.

**Lo que se hace:** los abortos deliberados del adaptador llevan **un tipo de error propio**
—no un texto reconocible, que funciona hasta que alguien reescribe un mensaje— y el
arranque, ante ese tipo, **deja salir la excepción** al mecanismo que ya existe en vez de
aparcar al candidato. Con eso nunca entra en la espera externa, nunca recibe el mensaje de
*no llegó tu resultado a tiempo*, el reintento queda acotado en vez de durar días, y llega
el correo de alerta que ese camino ya manda. Sin motivo de rechazo nuevo: no toca el portal
ni choca con la renumeración de motivos del paso 7.

**Lo aceptado a sabiendas:** esa persona queda descartada **sin recibir ningún mensaje**.
Es lo que ya les pasa a los candidatos de cualquier otra etapa que falla al arrancar, así
que es coherente con la casa.

### 🔴 Solo UNO de los dos abortos es permanente

Es el punto donde es fácil equivocarse y el error sale caro.

- **Vacante sin nombre: permanente.** El dato es nuestro y está guardado; reintentar no lo
  arregla. **Lleva el tipo propio.**
- **Sin código de evaluación: NO es permanente.** La consulta que lo trae **devuelve lo
  mismo cuando el código no existe que cuando el endpoint falla** — un 500 pasajero da
  exactamente el mismo resultado que una vacante sin código.

⚠️ Si ese aborto llevara el tipo permanente, **una caída del proveedor descartaría
candidatos reales en tres intentos**. Se queda como está: excepción normal, y el camino de
hoy lo reintenta.

Es la misma distinción que la comprobación de vacante hace a propósito —ahí sí se separa
*no sirve* de *no se pudo averiguar*, con reintento incluido—, y que este camino no hace.

## 🔴 El enlace se arma hoy en dos sitios, con reglas distintas

No es un detalle de estilo: son dos ramas que se comportan distinto y hay que saber cuál se
está tocando.

- **En el camino feliz** se arma con el código que se acaba de resolver, y **no hay rama de
  "sin enlace"**: el mensaje siempre lo incluye.
- **En el de error** se vuelve a resolver el código, y si esa vez no se puede, **no se manda
  enlace y el mensaje cambia** — es la regla de la decisión 32-c, que existe porque el
  código equivocado servía una pantalla vacía respondiendo que todo estaba bien.

Al pasar a usar el enlace que devuelve la operación, **hay que cubrir el caso sin enlace**.
Hoy el camino feliz tiene ahí una rama muerta: pregunta si hay enlace, pero el valor nunca
puede faltar. Al entregarle un nulo esa rama cobra vida, y el mensaje se queda **sin enlace
pero con las instrucciones numeradas diciendo "abre el enlace"** — peor que una dirección
rota, porque parece que el mensaje se cortó a mitad.

**No se escribe un texto nuevo:** se reusa el que ya existe en la rama de error para
exactamente ese caso, el que dice que el enlace llega por correo. Con EvaluaTest no ocurre
—la operación aborta antes si no hay código—, pero el contrato lo permite y otro proveedor
puede no dar enlace.

## Lo demás que hay que preservar entero

Está levantado del código. Perder cualquiera de estos rompe en silencio:

| Qué | Por qué existe |
| --- | --- |
| **El correo de registro se guarda solo si difiere del real**, y queda en nulo si coincide | Nulo significa *empareja por el correo verdadero*. Es la llave con la que el cron lo encuentra (32-d) |
| **El guardado es con reintento**, nunca un guardado crudo | Varios candidatos de la misma oferta terminan a la vez y guardan el mismo documento. Con un guardado crudo la excepción sube sin persistir el estado y el candidato se queda parado donde ningún barrido lo recoge. **Visto en producción: cuatro candidatos parados hasta 9,6 días** |
| **El plazo que se le promete al candidato** sale del mismo resolutor que usa el descarte | Antes cada uno lo calculaba por su lado y se anunciaba un plazo y se aplicaba otro |
| **El mensaje enmascara el correo del candidato**, el suyo real — no el de registro | Es lo que la persona reconoce. El de registro puede ser uno de pruebas |
| **En el bloque de error no se repite el aviso** si ya estaba esperando resultado | Es la guarda contra repetirle el mensaje en cada reintento del cron |
| **Si la oferta no tiene la etapa configurada, se aprueba automático** y no se hace nada más | Es lo primero que ocurre, antes de todo lo demás |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador, y si el editor formatea al guardar, se
  apaga.** El diff debe contener **solo** lo que este brief pide.
- **Comentarios: ninguno nuevo en archivos de código.** Lo que haya que explicar va a este
  brief o a la prosa de los `.spec`. ⚠️ **Los comentarios que ya están en el arranque no se
  tocan**: documentan trampas averiguadas en producción, no lógica de negocio.
- 🔴 **Nada de reorganizar de paso.** Si crees que algo hay que mover, dilo en la opinión
  previa y que se decida; no entre en el diff sin avisar.
- **Los identificadores van en inglés**, sin excepción, incluidos los de los `.spec` y los
  parámetros de callbacks.
- **La solución más pequeña que resuelve el caso.**
- **No commitear.** Los archivos nuevos se añaden al índice.

## Pruebas

🔴 **Aquí sí hay red de seguridad de verdad, y es la primera vez que importa.** Las dos
pruebas del modo demo son las que avisan si se rompe EvaluaTest: una comprueba que con el
modo demo apagado **se sigue registrando de verdad**, y la otra corre una oferta demo y una
real en el mismo ciclo. **Si alguna se pone en rojo, el cambio está mal — no la prueba.**

Lo nuevo que hay que cubrir:

- **El arranque invita a través del puerto** y guarda el identificador que devuelve.
- **El correo de registro se guarda solo si difiere**, y queda en nulo si coincide.
- **Una oferta demo no llama al puerto** y sigue fabricando lo suyo.
- **El fallo permanente no deja al candidato esperando** algo que no va a llegar, y **el
  transitorio sí se reintenta** como hoy.
- **Un enlace ausente no produce una dirección rota** en el mensaje.

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
   pidió, y de que no se borró ningún comentario del arranque.
5. **Confirmación de que las dos pruebas del modo demo siguen verdes**, nombrándolas.
6. 🔴 **Cómo quedó resuelto el fallo permanente**, con su justificación: qué lo distingue
   del transitorio y qué le pasa a ese candidato. Es la decisión de este paso.
7. **Qué hace el camino feliz si la operación no devuelve enlace.**
