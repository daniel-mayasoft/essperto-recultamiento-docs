# Brief · Sin conexión propia no hay prueba psicométrica (decisiones 34 y 40)

Cambio de comportamiento, fuera de la numeración de los pasos. **Toca los dos repositorios.**

**Este documento dice qué hacer y qué no. El *porqué* está en los otros `.md`.**

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto. Mira la verificación de **cada** repositorio.
3. `flujo-actual-etapa-psicometrica.md` — cómo funciona hoy la etapa. Importan §1, §2, §5 y §9.
4. `integrate-psicoalianza.md` — la bitácora. Importan **34 y 40 enteras** (la 40 tiene lo
   levantado del código el 2026-09-11 y el 2026-09-12), más 21, 30 y B8, y la entrada del
   paso 3.
5. El cliente de EvaluaTest entero, y las dos lecturas de credenciales: la del adaptador y
   la del embudo.

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio en los dos
repositorios. Si algo de aquí no cuadra con el código, gana el código y hay que decirlo.

## El caso, con una persona

**Transportes Andina** nunca guardó credenciales de EvaluaTest. Hoy, si una de sus ofertas
tiene la prueba activa —solo puede pasar desde administración—, el sistema invita a sus
candidatos **con la cuenta de EvaluaTest del entorno**, compartida: sus documentos y
resultados quedan en una cuenta ajena, y quien use esa cuenta ve candidatos que no son suyos.

Después de este cambio, esa oferta **se salta la etapa**: el candidato sigue su proceso sin
prueba, como si la oferta no la tuviera, y el reclutador ve en el portal que su empresa no
tiene proveedor conectado. Nadie se queda parado ni se descarta.

**Medido:** una sola empresa está en el caso, y es una cuenta de pruebas (decisión 34). No hay
nadie esperando resultado en una empresa sin credenciales (mediciones del 2026-09-12).

## El objetivo

1. **El cliente de EvaluaTest deja de tener cuenta del entorno.** Sin credenciales, falla; no
   entra con la cuenta de nadie.
2. **Una sola regla de lectura de credenciales en la etapa psicométrica**, la del adaptador:
   correo, contraseña e identificador de empresa, los tres. Desaparece la lectura laxa del
   embudo. ⚠️ La creación con IA y la sincronización del índice tienen su propia copia de la
   regla estricta y no usan la cuenta compartida: **no se tocan**; se unifican en el brief 8,
   cuando cambia la forma de las credenciales.
3. **Sin conexión, la etapa se salta y se avisa** (decisión 40).

## Alcance exacto — backend

1. **Cliente.** Se quitan las tres variables del entorno (correo, contraseña, identificador)
   del cliente y del esquema de entorno, con el aviso de arranque que las acompaña y el getter
   del identificador del entorno, que queda muerto. **El parámetro de credenciales pasa a
   obligatorio** en los métodos del cliente que las usan, para que lo garantice el compilador:
   los tres llamadores —adaptador, creación con IA, sincronización del índice— ya pasan
   credenciales completas. **Se quedan** el correo de pruebas, el plazo y la base del enlace:
   no son la cuenta compartida.
2. **Adaptador.** Cuando la empresa no tiene las tres cosas —o no llega empresa: sin empresa
   no hay conexión—, `resolveCredential` **lanza un error de tipo propio** —*sin conexión*, al
   lado del error permanente del paso 5— en vez de devolver nada. Se lleva consigo el aviso de credenciales incompletas: su texto dice que se
   usará la cuenta global, y deja de ser cierto. Lo que decía ese aviso (qué campos hay y
   cuáles faltan) va en el mensaje del error.
3. **La lectura laxa del embudo desaparece.** Los dos sitios que la usan pasan por el
   adaptador:
   - **Las pruebas adicionales del veredicto**: un método propio del adaptador —como ya lo es
     el de las pruebas de la vacante (decisión 4)— que recibe el identificador del candidato
     en el proveedor, la vacante, las pruebas seleccionadas y la empresa, y devuelve por prueba
     el tipo que ya existe en el cliente (identificador, nombre, encontrada, aprobada). La
     regla *no encontrada = no aprobada* se queda en el embudo. El cron deja de resolver
     credenciales por oferta. Si el adaptador lanza *sin conexión* ahí, lo atrapa el atrapado
     por candidato y cuenta como error, igual que cualquier excepción hoy.
   - **El enlace de respaldo de la rama de error del arranque**: un método propio del
     adaptador que **recibe el código de evaluación guardado en la oferta, opcional**: con él
     arma el enlace sin llamar a nadie; sin él lo resuelve por el cliente. Devuelve enlace o
     ninguno. ⚠️ El atajo del código guardado importa: en esa rama el proveedor acaba de
     fallar, y sin él la segunda llamada probablemente falle también y el candidato pierda el
     enlace que hoy sí recibe.

   Para eso el embudo inyecta el adaptador, igual que ya hace el servicio de ofertas.
   Al terminar, **el embudo no toca el cliente de EvaluaTest en la etapa psicométrica**; la
   única llamada que le queda es la del correo de pruebas en el agendamiento, que no es de
   esta etapa y no se toca.
4. **El arranque, ante el error *sin conexión*: aprueba la etapa y sigue** — el mismo camino
   que *oferta sin prueba configurada* (§2 del flujo). Se comprueba **al principio del bloque
   de captura**, antes del registro de error con pila: es configuración esperable y va como
   aviso con la empresa y la oferta. **Nada se escribe en el candidato antes**: el adaptador
   resuelve la credencial antes de cualquier otra cosa, así que la excepción sale con el
   candidato intacto. ⚠️ Por ese mismo bloque entran el reintento del cron y el retomar del
   bombeo: un candidato aparcado sin identificador cuya empresa no tenga conexión **se aprueba
   en el próximo reintento**. Es coherente con la 40 y va al flujo actual, §4.
5. **La ruta que guarda la configuración de la oferta** rechaza activar la prueba sin
   conexión. No hace falta una operación nueva ni una segunda lectura de credenciales: la
   comprobación de vacante que ya hace **lanza *sin conexión* antes de tocar al proveedor**,
   y la ruta atrapa ese tipo **antes del atrapado genérico** —que hoy lo convertiría en «no se
   pudo verificar»— y responde con: *«Tu empresa
   no tiene un proveedor de pruebas psicométricas conectado. Conéctalo en Mi compañía antes de
   activar la prueba.»* Sin ella, quitar la cuenta compartida haría que el reclutador leyera
   «no se pudo verificar la vacante, reintenta» — mentira, y reintentaría sin entender.

## Alcance exacto — portal

Los textos están decididos y no se cambian (decisión 40). Dos escenarios; en cada uno, el
enlace a *Mi compañía* solo para quien tiene el permiso de editar la empresa
(`TENANTS_UPDATE`), y a los demás la frase de pedírselo a un administrador.

6. **Escenario 1 — empresa sin proveedor, oferta sin prueba.** Al crear la oferta, el aviso
   que ya existe cambia de texto (hoy habla de "tenant" y de "EvaluaTest") y gana el enlace o
   la frase según el permiso. En el detalle, pestaña Filtros, **la sección aparece** con ese
   mismo aviso en vez de desaparecer, sin el interruptor ni el botón de configurar.
7. **Escenario 2 — oferta con la prueba activa y empresa sin proveedor.** En Filtros, aviso
   propio en tono de advertencia. Es el que hoy no existe y el que más importa: una oferta que
   lleva tiempo dejando pasar gente sin filtro se veía igual que una sin prueba. **Sin
   interruptor ni botón de configurar**, como en el 1: el botón abriría el selector sin
   conexión, y la etapa se salta igual con el interruptor en cualquier posición. ⚠️ Y **no se
   muestra la alerta de estado de la vacante**: consultaría al proveedor sin conexión y diría
   «no se pudo verificar», que es otra mentira.
8. Los textos van a los archivos de idioma, en español y en inglés; la clave actual del aviso
   se reusa o se retira, sin dejar textos huérfanos.

⚠️ El formulario de creación no tiene hoy acceso al permiso del usuario; el detalle sí. Se
trae con el mismo hook de sesión que usa el detalle, sin pasar nada por props.

🔴 **Dos cosas del detalle que hay que mover, o el escenario 2 miente igual:**

- **El orden de carga.** Al abrir una oferta con la prueba activa, el portal pide las pruebas
  de la vacante **antes** de cargar la empresa. En el escenario 2 esa llamada llega al
  adaptador, lanza *sin conexión* y el portal se traga el error: al usuario no le pasa nada,
  pero deja un error en el registro del backend cada vez que alguien abre esa oferta. Esa
  carga pasa detrás de la carga de la empresa y **condicionada a que tenga credenciales**.
- **Mientras la empresa carga, no se decide escenario.** Hoy la sección no aparece con la
  empresa en nulo; con el cambio aparecería un instante el aviso de «sin proveedor» antes de
  cargar. La sección espera a tener el dato.

## 🔴 Dónde se para — qué NO se hace

- **No se toca el modo demo** (decisión 38, y la 40 lo confirma: la demo se queda como está).
  Sus cinco puntos siguen sin llamar a nada. ⚠️ El quinto —el salto de las pruebas adicionales
  en el veredicto— sigue siendo una condición aparte: al mover esa llamada al adaptador, **el
  salto se queda en el embudo**.
- **No se toca la creación desde administración.** Copia la configuración sin comprobar; es
  del equipo interno y queda anotado.
- **No se cambia la forma de las credenciales ni de la configuración de la oferta.** Eso es el
  brief 8.
- **No se toca lo que el cron hace con *no se pudo consultar***. Una empresa sin conexión con
  gente esperando —hoy nadie— cae ahí con el error *sin conexión* en el registro, y el plazo
  corre igual (decisión 36).
- **No se cambia el aterrizaje de Mi compañía**: el enlace va a la página entera.
- **No se toca la validación de la conexión en Mi compañía**: usa lo que se teclea, nunca la
  cuenta compartida.

## 🔴 Las trampas

**1. Credenciales a medias.** La lectura laxa del embudo aceptaba correo y contraseña sin
identificador de empresa y el cliente rellenaba el identificador con el del entorno. Con la
regla del adaptador esa empresa pasa a *sin conexión*. **Medido en cero empresas** (B8), pero
el ejecutor tiene que saber que es un cambio de regla y no solo de sitio.

**2. El demo pasa credenciales vacías a propósito.** En el cron, una oferta demo resuelve
`creds = undefined` y las pruebas adicionales se saltan por la bandera de demo, no por las
credenciales. Al mover esa llamada al adaptador, la bandera tiene que seguir **delante** de la
llamada, o una demo hará una llamada real con un identificador inventado (decisión 38, quinto
punto).

**3. El error *sin conexión* sale de todas las operaciones del adaptador que resuelven
credencial —cinco hoy, siete con las dos de este brief—, y solo el arranque lo convierte en
"aprobar".** En el selector y las pruebas del formulario no llega, porque el portal no muestra
esos controles sin credenciales y, con el orden de carga corregido, tampoco consulta las
pruebas de la vacante; en la ruta de configuración lo intercepta el punto 5; en la consulta del
cron lo atrapa el adaptador y vuelve como *no se pudo consultar*; en las pruebas adicionales lo
cuenta el atrapado por candidato; y la ruta que solo consulta el estado de la vacante lo
devuelve como «desconocido», como cualquier fallo, y se deja así porque el portal no la llama
en el escenario 2. Si el ejecutor ve otro sitio, que lo diga.

**4. Las máquinas de desarrollo.** El entorno local trae la cuenta compartida y quien prueba
contra EvaluaTest la usa sin saberlo. Después de esto, probar en local exige una empresa con
credenciales guardadas. **Avisar al equipo en el reporte.**

**5. Dos archivos de pruebas afirman hoy que el respaldo existe, y uno es la red de
seguridad.** En la prueba de paridad hay una que dice que sin credenciales completas se
resuelve a nada "porque eso activa el respaldo", y un bloque entero sobre el aviso de
credenciales a medias. Pasan a afirmar lo contrario; no se borran, se les da la vuelta.

🔴 **Y la prueba del ciclo mixto se pone en rojo a propósito**, y es la excepción a "si se
pone en rojo, el cambio está mal". Su montaje le da a la empresa real credenciales en nulo y
afirma que el tablero se consulta con credenciales indefinidas, o sea con la cuenta
compartida. Tras el cambio esa empresa cae en *sin conexión* → *no se pudo consultar* → su
candidato no aprueba. El arreglo es **darle credenciales completas a la empresa real del
montaje** y que la afirmación pase a exigir esas credenciales. Lo que la prueba protege —la
real llama al tablero una vez, la demo nunca— no cambia.

## Lo que hay que preservar entero

| Qué | Por qué existe |
| --- | --- |
| **El correo de pruebas de la empresa viaja con nulo cuando la empresa no tiene** (32-b) | Nulo apaga el desvío del entorno; ausente lo enciende. Cambiarlo cambia a quién le llegan los correos en QA |
| **El identificador con el que se piden las pruebas adicionales es el del tablero**, no el guardado | Pueden discrepar (paso 6a) |
| **Una prueba adicional que no se encuentra cuenta como no aprobada** | Es lo que hace hoy; no se arregla aquí |
| **La rama de error del arranque no manda enlace si no hay código**, y el texto del mensaje no cambia (32-c) | El código equivocado servía una página vacía con 200 |
| **La sección de la prueba no se muestra a quien no puede gestionar la oferta** | Hoy está bajo ese permiso; el aviso hereda la misma condición |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador en ninguno de los dos repositorios.**
- **Comentarios: ninguno nuevo en archivos de código.** Los que explican el respaldo por
  entorno —en el cliente, el esquema de entorno y el embudo— **se van con el código que
  explican**, y el reporte dice cuáles.
- **Los identificadores van en inglés**, incluidos los de los `.spec`.
- **La solución más pequeña que resuelve el caso.** Nada de reorganizar el cliente de paso.
- **No commitear.** Los archivos nuevos se añaden al índice, con `add`.
- 🔴 **`flujo-actual-etapa-psicometrica.md` se actualiza en este mismo diff**: §1 (la ruta
  comprueba la conexión), §2 (sin conexión → aprobar), §4 (el reintento aprueba a quien no
  tiene conexión), §5 (pruebas adicionales por el adaptador), la lista de piezas (el cliente
  ya no cae al entorno) y §9.

## Pruebas

**Backend**

- **Sin conexión, el arranque aprueba la etapa** y no escribe nada en el candidato ni le
  escribe por WhatsApp.
- **Con conexión, el arranque invita igual que hoy** (la red de seguridad del paso 5 tiene
  que seguir verde).
- **El ciclo mixto sigue verde con la empresa real con credenciales completas**, y afirma
  que el tablero se consulta con ellas.
- **Credenciales a medias resuelven a *sin conexión***, con el detalle de qué falta en el
  mensaje — sustituye al bloque del aviso.
- **Las pruebas adicionales se piden con la credencial de la empresa** y una oferta demo no
  las pide.
- **La ruta de configuración rechaza activar la prueba sin conexión**, con el texto de arriba,
  y **con conexión sigue comprobando la vacante** como hoy.

**Portal**

No tiene pruebas. En el reporte va una tabla de **seis casos** por lectura: los dos escenarios
× {administrador, miembro, sin permiso de gestionar la oferta}, con lo que se ve en cada uno
al crear y en Filtros.

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo, y borrarlo después,
limpiando la caché.

## Verificación

Una vez sobre el conjunto del cambio:

- Backend: `npm run build` y `npm test`.
- Frontend: `npm run typecheck`.

El resultado de los dos va en el reporte. Si alguno falla, el cambio no está terminado.

## Qué entregar

1. **Qué cambió** y **qué se verificó** en cada repositorio, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el diff no trae cambios de formato**, y **qué comentarios se
   borraron** con el código que explicaban.
5. **Confirmación de que el embudo no llama al cliente de EvaluaTest** en la etapa
   psicométrica, y de que el salto del demo sigue delante de las pruebas adicionales.
6. **La tabla de seis casos del portal.**
7. **Un mensaje de commit por repositorio.**

## Para el despliegue, no para el código

- **Las variables de entorno** de la cuenta compartida se retiran de los entornos
  desplegados y de los archivos locales. Retirarlas de los locales es además parte de la
  rotación pendiente de esa credencial (decisión 21).
- **Orden:** los dos repositorios a la vez o el portal primero — el backend nuevo deja de
  invitar a la empresa sin conexión y solo el portal nuevo lo explica.
- **Avisar al equipo** del cambio de rutina en desarrollo (trampa 4).
