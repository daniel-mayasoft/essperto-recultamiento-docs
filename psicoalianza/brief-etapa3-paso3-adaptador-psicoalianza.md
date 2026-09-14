# Brief · Etapa 3, paso 3 — el adaptador de PsicoAlianza

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en los
otros `.md`.** Toca solo el backend.

> Este paso se escribe **después de preguntarle a PsicoAlianza de verdad**: la tanda de
> comprobaciones del 2026-09-14 (bitácora, *Tanda de comprobaciones para el paso 3*) contestó con
> mediciones casi todo lo que antes eran suposiciones. **Donde este brief dice «medido», está
> medido**; donde dice «sin ver», nadie lo ha visto.
>
> **Contrastado contra el código el 2026-09-14, por el planificador, antes de entregarlo.** Dos
> puntos de la versión anterior no se podían implementar con lo que el código da —emparejar
> resultados por documento y distinguir una vacante completada de una suspendida— y se corrigieron;
> lo que cambió está marcado como «corregido el 2026-09-14» en su sitio, y el detalle en la bitácora,
> *Contraste del brief contra el código*.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto, y `../../esscoti-backend/CLAUDE.md` — las credenciales nunca en el
   código.
3. `integrate-psicoalianza.md` — la bitácora. Importan **12, 15, 22, 27, 29, 33, 35, 36, 37, 39 y
   44**, la sección *Tanda de comprobaciones para el paso 3* entera, y *Falta de PsicoAlianza*.
4. `psicoalianza-api.md` — el contrato observado. **Si discrepa con este brief, gana el contrato** —
   salvo donde aquí se diga «medido el 2026-09-14», que es más nuevo que él.
5. `flujo-actual-etapa-psicometrica.md` — qué le pasa hoy a una persona en la etapa.
6. En el backend: **el adaptador de EvaluaTest, que es el patrón exacto a seguir**, el puerto con sus
   tipos, los tres errores propios de la capa, y el cliente de PsicoAlianza del paso 2.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio.

## El caso

**Laura** termina sus preguntas por WhatsApp en una oferta de una empresa que usa PsicoAlianza. El
embudo pide "invita a Laura" y, dos días después, "¿cómo le fue?". Quien traduce esas dos frases al
idioma de PsicoAlianza —y de vuelta— es este adaptador.

El embudo no se entera de nada: sigue hablando el idioma neutro que ya habla con EvaluaTest.

**Nada lo llama todavía.** El resolvedor que elige proveedor es el paso 4. Aditivo: brief corto, una
ronda.

🔴 **Pero «aditivo» no quiere decir «no toca nada existente»: hay dos piezas compartidas con
EvaluaTest**, que es la etapa que hoy corre en producción (corregido el 2026-09-14: la versión
anterior contaba una).

| Pieza compartida | Qué se le hace | Qué pasa si sale mal |
| --- | --- | --- |
| **El tipo de la invitación del puerto** | Se le añade **un campo opcional**, el plazo (punto 6) | Si se declara **obligatorio**, deja de compilar el embudo, que hoy no lo pasa — y este paso deja de ser aditivo y arrastra al paso 4 |
| **El error *falta un dato del candidato*** | Su campo solo admite hoy «correo»; se **amplía** para poder decir «documento» (punto 5) | Nada, si solo se amplía: el embudo lo reconoce por el tipo, no por el campo. ⚠️ Y ese embudo lo convierte **siempre** en *sin correo* — con un documento ausente diría lo que no es. No es de este paso: lo hereda el 5 |

Todo lo demás son archivos nuevos que nadie importa, **más una petición nueva en el cliente del
paso 2** (punto 3) y la corrección de cómo codifica los participantes (punto 5), que no tocan a
EvaluaTest. Por eso hay una prueba dedicada a que la invitación de EvaluaTest siga comportándose
igual con el campo nuevo delante.

## Cómo tiene que quedar

Implementa **el mismo puerto** que el adaptador de EvaluaTest, sin añadirle métodos ni cambiarle la
forma. Por dentro usa el cliente del paso 2 y la lectura única de conexiones; por fuera es
indistinguible de cualquier otro proveedor.

## Alcance exacto

1. **El adaptador**, en la carpeta del paso 2, junto al cliente. Implementa las cinco operaciones del
   puerto. **No se registra en el token del puerto**: ese token sigue apuntando a EvaluaTest hasta el
   paso 4.

2. **Listar vacantes.** Del cliente, solo las activas. Identificador y nombre; en la bolsa opaca, lo
   que el portal pueda necesitar después (el estado y las pruebas embebidas). Es el mismo patrón que
   EvaluaTest con su árbol (decisión 29).

3. **Comprobar si una vacante sirve.** Por el estado del proceso, **medido el 2026-09-14**: hay tres
   valores vivos y el contrato solo tenía dos.

   🔴 **Corregido el 2026-09-14 contra el código: la única petición de vacantes del cliente del paso
   2 trae solo las activas** —filtra por estado—, así que con ella una vacante completada o suspendida
   **no aparece** y no se distingue de una que no existe. **Este paso añade al cliente una petición
   hermana sin el filtro de estado**, medida en el contrato: omitir el tamaño de página trae todas
   las vacantes de la cuenta en una sola respuesta, archivadas incluidas. El adaptador busca ahí la
   vacante por su identificador:

   | Lo que encuentra | Qué devuelve |
   | --- | --- |
   | No está en la lista | **Indeterminado** |
   | Está, pero archivada (`activo` en falso) | **No usable**, con su motivo |
   | Estado Activo (2) | **Usable** |
   | Estado Completado (3) | **No usable**, con su motivo |
   | Estado Suspendido (5) | **No usable**, con su motivo |
   | 🔴 Cualquier otro estado | **Indeterminado**, nunca usable |

   Lo último es lo que importa: aparecerán más estados, y tratar «lo que no conozco» como usable deja
   invitar a una vacante muerta. El listado del punto 2 sigue usando la petición de activas.

4. **Validar la conexión: no llama a nadie** (decisión 44). Da por buena la conexión que tenga correo
   y contraseña. **No hace login**, porque hacerlo aquí exigiría acuñar una sesión y un fallo del
   captcha acusaría a las credenciales de estar mal. La comprobación de verdad y lo que ve el
   reclutador son del paso 5.

   **Y el correo de pruebas de la empresa no existe para este adaptador** (decidido el 2026-09-14;
   la bitácora lo dejaba «para el paso 3»). La lectura única entrega ese correo para cualquier
   proveedor, pero es el desvío de QA de EvaluaTest y en PsicoAlianza no sirve —un correo es de una
   sola persona en toda la plataforma—. **Este adaptador no lo lee en ninguna operación.**

5. **Invitar, en cuatro pasos** (decisión 27), y en este orden:

   1. **Consultar el correo del documento.** Si PsicoAlianza ya conoce ese documento, **se invita con
      el correo que ella devuelve, no con el nuestro** — medido: es el único que la persona recibe, y
      mandar otro le ensucia la ficha con una dirección que el reclutador del cliente verá y que no
      sirve para nada.
   2. **Invitar**, con nuestro plazo (punto 6).
   3. 🔴 **Buscar a la persona en el tablero por documento**, para quedarse con el identificador que
      PsicoAlianza le da. **No es opcional**: la invitación responde que agregó a alguien **aunque no
      lo haya agregado** (medido reinvitando), así que su respuesta no prueba nada.
   4. **Pedir el enlace personal** con ese identificador, una sola vez, y devolverlo.

   🔴 **Antes de tocar la invitación, mira el contrato: el payload real del portal se capturó el
   2026-09-14 y desmiente cómo la armó el paso 2.** Los participantes viajan en **un solo campo con
   el JSON dentro**, con las siete claves —las cuatro de teléfono en nulo— y el tipo de documento
   como texto, no como campos sueltos con índice. **Se alinea con la forma del portal** y se corrige
   el cliente del paso 2 en este mismo diff: el paso 2 dejó esa codificación aislada en una sola
   función justo para esto. Que la forma actual funcione hoy no la salva: depende de que su backend
   siga aceptando las dos. **Se vuelve a comprobar invitando de verdad, solo al documento y al correo
   del usuario** (decidido por el usuario el 2026-09-14), como en la tanda: nunca a otra persona.

   **El tipo de documento va siempre como CC** en este paso (constante, en un solo sitio). La
   decisión 12 —el del candidato, CC solo por defecto— no cabe aquí: el contrato del puerto no trae
   el tipo y nuestro tipo es texto libre. El catálogo de PsicoAlianza ya está medido (A14, y en el
   contrato), pero traducir nuestro texto a su número cae en el paso 5.

   ✅ **El título y el cuerpo del correo que PsicoAlianza le manda al candidato: los de su propio
   portal, tal cual** (decidido por el usuario el 2026-09-14; están en el contrato). Fijos para
   todas las empresas, en un solo sitio del adaptador, sin configurar. No se inventa texto —en la
   tanda del 14 se mandó uno inventado y le llegó a una persona— y no se intenta apagar ese correo:
   el botón «Comenzar» y el enlace de WhatsApp llevan a la misma pantalla de tareas pendientes, **y
   pedir el enlace por la API no invalida el botón del correo** (confirmado por el usuario el
   2026-09-14). Los dos canales se refuerzan, no chocan.

   **Antes de tocar al proveedor**, y con el mismo orden que el adaptador de EvaluaTest: la conexión
   —si falta, *sin conexión*—, el nombre de la vacante —si falta, **el error permanente** (decisiones
   35 y 39)—, y los datos del candidato. PsicoAlianza exige **correo y documento**: si falta
   cualquiera de los dos, *falta un dato del candidato*, nombrando cuál — para eso se amplía el
   campo del error (tabla de piezas compartidas).

   ⚠️ **El documento todavía no llega**: el arranque no lo pasa (comprobado en la etapa 1). Eso se
   arregla en el paso 5; aquí solo hay que aceptarlo del contrato y fallar limpio si no viene.

   🔴 **Lo que falla a mitad de los cuatro pasos es pasajero, salvo lo ya dicho.** *Sesión caducada*
   —también *sin sesión*— se deja salir como error normal: el cron reintenta cada cinco minutos y,
   cuando exista el acuñador, se resuelve solo. **No es permanente** aunque hoy reintentar no la
   arregle: la decisión 39 reserva ese tipo al nombre de vacante ausente, y marcar la sesión como
   permanente descartaría gente real en tres intentos. Reinvitar en el reintento es inofensivo
   (trampa 7).

6. **El plazo viaja en la invitación**, y es un campo nuevo del contrato del puerto.

   PsicoAlianza fija la ventana de la prueba al invitar, y nosotros tenemos la nuestra —la que se le
   anuncia al candidato y con la que el cron lo descarta—. Si no coinciden, o la persona encuentra la
   puerta cerrada antes de tiempo, o la descartamos cuando todavía podía presentarla. **Medido el
   2026-09-14: PsicoAlianza respeta al día el plazo que se le manda.**

   🔴 **El campo es opcional en el tipo, pero obligatorio para este adaptador.** Opcional para que el
   embudo, que hoy no lo pasa, siga compilando y este paso siga siendo aditivo. Y si no viene, el
   adaptador **aborta con el error permanente** en vez de dejar que PsicoAlianza use su valor por
   defecto: lo contrario desalinearía los dos relojes **en silencio**, que es el peor de los dos
   fallos. El adaptador de EvaluaTest **lo ignora**: allá no hay ventana que fijar.

7. **Consultar resultados**, en lote por vacante (decisión 22). Trae el tablero una vez y empareja.

   🔴 **El emparejamiento es por el identificador de PsicoAlianza, y solo por él** (corregido el
   2026-09-14 contra el código; la versión anterior decía «por documento»). **Nunca por correo**
   (medido): en PsicoAlianza una misma persona tiene **dos correos distintos** —el del registro y el
   de la última invitación— y no coinciden, así que el correo no es una llave. **Y por documento no se
   puede**: lo que el cron manda por candidato es nuestra referencia, el identificador del proveedor y
   los dos correos; el documento no viaja. No hace falta: el identificador es la llave global que
   PsicoAlianza le da a la persona, la invitación lo obtuvo buscándola en el tablero por documento, y
   el cron solo consulta a quien ya lo tiene — a quien no, lo reinvita. Los dos correos del pedido
   **se ignoran**.

   **Traducir las agendas a un estado neutro es el corazón de este paso.** PsicoAlianza da un
   veredicto **por prueba** y el puerto espera uno **por persona**:

   | Lo que trae el tablero | Estado neutro | Puntaje |
   | --- | --- | --- |
   | No aparece esa persona | *no aparece* | — |
   | **Todas** sus pruebas finalizadas | *terminado* | El índice de talento |
   | Alguna sin terminar — agendada o vencida | *sigue en ello* | — |
   | Aparece **sin ninguna agenda**, o con una en un estado que no se conoce | *sigue en ello* | — |
   | La petición falló o la sesión no sirve | *no se pudo consultar*, **para todos los pedidos** | — |

   **Este adaptador nunca devuelve *rechazado por el proveedor***: PsicoAlianza no descarta a nadie
   por su cuenta —su veredicto se guarda y no decide (punto 8)—. Y un estado de agenda que no sea
   agendada, finalizada o vencida —el 2, que nadie ha visto— cuenta como *sin terminar*, por la misma
   regla que la vacante: lo desconocido nunca aprueba ni descarta.

   **Por qué una prueba vencida cuenta como *sigue en ello* y no como rechazo** (decisión del usuario,
   2026-09-14): PsicoAlianza no la ha rechazado, simplemente no la hizo. Dejarla así hace que la saque
   **nuestro** vencimiento, con el mensaje que ya existe y que dice la verdad — no llegó su resultado
   a tiempo. Y como los dos plazos coinciden (punto 6), cuando allá vence la agenda, aquí está
   venciendo el plazo.

   🔴 **Terminado sin nota no es terminado.** Si una persona aparece con todo finalizado pero el
   puntaje es el centinela de *sin nota*, se devuelve *sigue en ello*, **nunca terminado sin
   puntaje**: el embudo convierte un puntaje ausente en cero y un cero reprueba (decisión 37). No se
   ha visto ocurrir; la guarda es barata y el fallo sería invisible.

   **En la bolsa del proveedor** van el veredicto de PsicoAlianza y su texto, y el resultado por
   prueba. Se guardan porque el día que se quiera comparar su criterio con el nuestro, el dato tiene
   que estar; **no deciden nada** (ver el punto siguiente).

8. **Quién aprueba: nuestro puntaje mínimo, como con EvaluaTest.** El adaptador entrega el índice de
   talento como puntaje y la regla del embudo no cambia. El veredicto propio de PsicoAlianza se
   guarda y no decide.

   ⚠️ **Y por eso el adaptador no lo interpreta**, pero conviene saber lo medido: su veredicto usa
   `1` para *no recomendado* y `3` para *recomendado*, **el `2` no se ha visto nunca**, y el contrato
   solo conocía el 3. Si algún día se usa para decidir, **tratar «lo que no sea 3» como reprobado
   descartaría gente por un valor que nadie ha visto.**

## 🔴 Dónde se para — qué NO se hace

- **No se registra el adaptador en el puerto**, ni se elige proveedor por conexión. Es el paso 4.
- **No se toca el embudo, ni el cron, ni EvaluaTest, ni el portal.**
- **No se toca la sesión**: ni acuñarla, ni Chrome, ni proxy. El adaptador usa el cliente y ya.
- **No se implementa el estado de sesión** que verá el reclutador: es del paso 5 (decisión 44).
- **No se hace que el arranque pase el documento**: paso 5.
- **No se manda el tipo de documento real ni se mide su catálogo**: siempre CC. Paso 5.
- **No se añade el documento a la consulta de resultados** del puerto: el identificador basta.
- **No se toca el texto de WhatsApp** que hoy manda el embudo, aunque sus instrucciones sean de
  EvaluaTest («Aplicar ahora», «regístrate»): es del embudo, y lo hereda el paso 4/5.
- **Nada de pruebas adicionales** al estilo EvaluaTest: son exclusivas de aquel proveedor
  (decisión 4).
- **No se toca `psicoalianza-api.md`**: si algo del contrato resulta falso, se dice en el reporte.

## 🔴 Las trampas, todas medidas el 2026-09-14

**1. La invitación miente.** Responde que agregó a una persona aunque ya estuviera. Solo el tablero
dice la verdad.

**2. El contador de participantes del listado no coincide con el tablero.** Una vacante que decía
cero tenía uno dentro. No usarlo para nada.

**3. Hay dos correos por persona y ninguno sirve de llave.** El de la consulta por documento es el
que recibe los avisos; el de la ficha es el último que se mandó. Al invitar se busca por documento;
al consultar resultados, por el identificador.

**4. La etapa del candidato no avanza.** Se queda en *En pruebas* aunque la prueba esté finalizada y
no recomendada. **El veredicto no está ahí**, está en la agenda.

**5. El puntaje llega como texto con decimales**, y el centinela de *sin nota* es un número negativo.
Convertirlo a número sin mirar el centinela produce una nota negativa que reprueba.

**6. La ficha del participante trae datos personales que nosotros nunca mandamos** —nombre, fecha de
nacimiento, dirección, teléfonos—, porque la persona ya existía allá. **No volcarla al registro**: es
la deuda conocida del proyecto con los clientes externos, y aquí se estrena limpio.

**7. Reinvitar es inofensivo**: no duplica y **no le escribe al candidato** —tres invitaciones, un
solo correo—. El reintento del cron es seguro.

**8. Con la sesión manual encendida, el almacén entrega sesión sin mirar si la empresa tiene
conexión** (leído del código el 2026-09-14). Por eso la comprobación de conexión del adaptador va
primero en cada operación y no es redundante con el cliente: sin ella, en local una empresa sin
conexión de PsicoAlianza hablaría igual con la plataforma. Y una prueba que simule el almacén sin
simular la lectura única no la detecta.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **EvaluaTest, intacto** | Es toda la etapa psicométrica que hoy corre en producción |
| **El puerto y su token, apuntando a EvaluaTest** | Elegir proveedor es el paso 4 |
| **El contrato del puerto**, salvo el campo del plazo, que es opcional, y el campo del error *falta un dato*, que se amplía | Romperlo obligaría a tocar el embudo y este paso dejaría de ser aditivo |
| **Las demás peticiones del cliente del paso 2**: solo cambia la codificación de los participantes y se añade el listado sin filtro | El resto está medido contra la plataforma real |
| **Compilación y pruebas en verde** | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido aquí:

- 🔴 **No correr el lint ni ningún formateador.**
- **Comentarios: ninguno nuevo en archivos de código.** En los `.spec`, la prosa que explica el caso
  sí es bienvenida.
- **Identificadores en inglés**, también en los `.spec` y en los parámetros de callbacks. ⚠️ **No se
  traducen** los nombres de campo de PsicoAlianza ni el identificador del proveedor: son contrato con
  datos externos.
- **La solución más pequeña que resuelve el caso.**
- **No commitear.** Los archivos nuevos, al índice.
- **Documentación en el mismo diff:** ninguna. **El flujo de la etapa no cambia**, porque nada llama
  a esto todavía; decirlo en el reporte. La bitácora la actualiza el planificador.

## Pruebas

Con el cliente simulado —dobles, no peticiones—, como la prueba de paridad de EvaluaTest:

- **Invitar hace los cuatro pasos en orden**, y usa **el correo que devuelve la consulta** cuando el
  documento ya existe, no el que le pasaron.
- **Invitar manda nuestro plazo**, y **aborta con el error permanente si no se lo dieron**.
- **Invitar manda el título y el cuerpo del portal**, y el tipo de documento **CC**.
- **Sin conexión**, **sin nombre de vacante**, **sin correo** y **sin documento**: cada uno con su
  error propio, **sin tocar al proveedor**, y en ese orden. El de correo y el de documento **nombran
  el campo que falta**.
- **Sin conexión se aborta aunque el almacén tenga sesión** (trampa 8).
- **Sesión caducada a mitad de la invitación** → sale como error normal, **no** como permanente.
- **Si la persona no aparece en el tablero tras invitar**, la invitación falla en vez de devolver un
  identificador inventado.
- **Los estados neutros**, uno por prueba: todas finalizadas, alguna agendada, **alguna vencida**,
  **sin agendas**, **una agenda en un estado desconocido**, y no aparece. Ninguna devuelve
  *rechazado por el proveedor*.
- **Terminado con el centinela de *sin nota*** → *sigue en ello*, **nunca terminado**.
- **Una petición que falla** → *no se pudo consultar* **para todos los candidatos pedidos**, no solo
  para uno.
- **El emparejamiento va por el identificador** aunque ninguno de los dos correos del pedido
  coincida con el del tablero; y **no empareja por correo** aunque coincida y el identificador no.
- **La vacante**: activa usable; completada, suspendida y **archivada** no usables; **un estado
  inventado, indeterminado**; **una que no está en la lista, indeterminada**. Y la comprobación usa
  **el listado sin filtro**, no el de activas.
- **Validar la conexión no llama al cliente.**
- **El correo de pruebas de la empresa no se lee**: una conexión que lo trae se comporta igual que
  una que no.
- **El veredicto de PsicoAlianza viaja en la bolsa** y no decide el estado.
- **Listar vacantes** devuelve identificador y nombre, y lo propio del proveedor **en la bolsa**, sin
  filtrarlo por el camino.
- **El cuerpo de la invitación del cliente** lleva los participantes como **un solo campo con el
  JSON**, con las siete claves y el tipo como texto (la prueba que ya existe cambia con él).
- 🔴 **No regresión de EvaluaTest**, en las dos piezas compartidas: su invitación se comporta
  **igual que antes** con el campo del plazo añadido al contrato — lo ignora, y una invitación sin
  plazo le sigue funcionando—, y su error de *sin correo* sigue nombrando «correo».

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo, y borrarlo después,
limpiando la caché.

## Verificación

Una vez sobre el conjunto: `npm run build` y `npm test` en el backend. El resultado real, en el
reporte.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que EvaluaTest no cambió** y de que el token del puerto sigue apuntando a él.
5. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos en código.
6. **Qué encontraste del contrato que no cuadra** con lo escrito, si algo.
7. **La invitación real de comprobación**: a qué documento, qué respondió PsicoAlianza con el cuerpo
   nuevo, y que la persona apareció en el tablero. Sin eso, el cambio de codificación no está
   verificado.
8. **En tres líneas, qué falta para que un candidato real pase por PsicoAlianza de punta a punta.**
   Es lo que va a decidir el orden de los pasos 4 y 5.
9. **Un mensaje de commit.**
