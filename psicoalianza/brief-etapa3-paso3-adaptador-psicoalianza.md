# Brief · Etapa 3, paso 3 — el adaptador de PsicoAlianza

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en los
otros `.md`.** Toca solo el backend.

> Este paso se escribe **después de preguntarle a PsicoAlianza de verdad**: la tanda de
> comprobaciones del 2026-09-14 (bitácora, *Tanda de comprobaciones para el paso 3*) contestó con
> mediciones casi todo lo que antes eran suposiciones. **Donde este brief dice «medido», está
> medido**; donde dice «sin ver», nadie lo ha visto.

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

🔴 **Pero «aditivo» no quiere decir «no toca nada existente»: hay una pieza compartida con
EvaluaTest**, que es la etapa que hoy corre en producción.

| Pieza compartida | Qué se le hace | Qué pasa si sale mal |
| --- | --- | --- |
| **El tipo de la invitación del puerto** | Se le añade **un campo opcional**, el plazo (punto 6) | Si se declara **obligatorio**, deja de compilar el embudo, que hoy no lo pasa — y este paso deja de ser aditivo y arrastra al paso 4 |

Todo lo demás son archivos nuevos que nadie importa. Por eso hay una prueba dedicada a que la
invitación de EvaluaTest siga comportándose igual con el campo nuevo delante.

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

   | Estado | Qué devuelve |
   | --- | --- |
   | Activo | **Usable** |
   | Completado | **No usable**, con su motivo |
   | Suspendido | **No usable**, con su motivo |
   | 🔴 Cualquier otro | **Indeterminado**, nunca usable |

   Lo último es lo que importa: aparecerán más estados, y tratar «lo que no conozco» como usable deja
   invitar a una vacante muerta.

4. **Validar la conexión: no llama a nadie** (decisión 44). Da por buena la conexión que tenga correo
   y contraseña. **No hace login**, porque hacerlo aquí exigiría acuñar una sesión y un fallo del
   captcha acusaría a las credenciales de estar mal. La comprobación de verdad y lo que ve el
   reclutador son del paso 5.

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

   **Antes de tocar al proveedor**, y con el mismo orden que el adaptador de EvaluaTest: la conexión
   —si falta, *sin conexión*—, el nombre de la vacante —si falta, **el error permanente** (decisiones
   35 y 39)—, y los datos del candidato. PsicoAlianza exige **correo y documento**: si falta
   cualquiera de los dos, *falta un dato del candidato*, nombrando cuál.

   ⚠️ **El documento todavía no llega**: el arranque no lo pasa (comprobado en la etapa 1). Eso se
   arregla en el paso 5; aquí solo hay que aceptarlo del contrato y fallar limpio si no viene.

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

   🔴 **El emparejamiento es por documento, no por correo** (medido): en PsicoAlianza una misma
   persona tiene **dos correos distintos** —el del registro y el de la última invitación— y no
   coinciden, así que el correo no es una llave. El identificador del proveedor sirve de respaldo,
   como en EvaluaTest.

   **Traducir las agendas a un estado neutro es el corazón de este paso.** PsicoAlianza da un
   veredicto **por prueba** y el puerto espera uno **por persona**:

   | Lo que trae el tablero | Estado neutro | Puntaje |
   | --- | --- | --- |
   | No aparece esa persona | *no aparece* | — |
   | **Todas** sus pruebas finalizadas | *terminado* | El índice de talento |
   | Alguna sin terminar — agendada o vencida | *sigue en ello* | — |
   | La petición falló o la sesión no sirve | *no se pudo consultar*, **para todos los pedidos** | — |

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
- **Nada de pruebas adicionales** al estilo EvaluaTest: son exclusivas de aquel proveedor
  (decisión 4).
- **No se toca `psicoalianza-api.md`**: si algo del contrato resulta falso, se dice en el reporte.

## 🔴 Las trampas, todas medidas el 2026-09-14

**1. La invitación miente.** Responde que agregó a una persona aunque ya estuviera. Solo el tablero
dice la verdad.

**2. El contador de participantes del listado no coincide con el tablero.** Una vacante que decía
cero tenía uno dentro. No usarlo para nada.

**3. Hay dos correos por persona y ninguno sirve de llave.** El de la consulta por documento es el
que recibe los avisos; el de la ficha es el último que se mandó. Emparejar por documento.

**4. La etapa del candidato no avanza.** Se queda en *En pruebas* aunque la prueba esté finalizada y
no recomendada. **El veredicto no está ahí**, está en la agenda.

**5. El puntaje llega como texto con decimales**, y el centinela de *sin nota* es un número negativo.
Convertirlo a número sin mirar el centinela produce una nota negativa que reprueba.

**6. La ficha del participante trae datos personales que nosotros nunca mandamos** —nombre, fecha de
nacimiento, dirección, teléfonos—, porque la persona ya existía allá. **No volcarla al registro**: es
la deuda conocida del proyecto con los clientes externos, y aquí se estrena limpio.

**7. Reinvitar es inofensivo**: no duplica y **no le escribe al candidato** —tres invitaciones, un
solo correo—. El reintento del cron es seguro.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **EvaluaTest, intacto** | Es toda la etapa psicométrica que hoy corre en producción |
| **El puerto y su token, apuntando a EvaluaTest** | Elegir proveedor es el paso 4 |
| **El contrato del puerto**, salvo el campo del plazo, que es opcional | Romperlo obligaría a tocar el embudo y este paso dejaría de ser aditivo |
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
- **Sin conexión**, **sin nombre de vacante**, **sin correo** y **sin documento**: cada uno con su
  error propio, **sin tocar al proveedor**, y en ese orden.
- **Si la persona no aparece en el tablero tras invitar**, la invitación falla en vez de devolver un
  identificador inventado.
- **Los cuatro estados neutros**, uno por prueba: todas finalizadas, alguna agendada, **alguna
  vencida**, y no aparece.
- **Terminado con el centinela de *sin nota*** → *sigue en ello*, **nunca terminado**.
- **Una petición que falla** → *no se pudo consultar* **para todos los candidatos pedidos**, no solo
  para uno.
- **El emparejamiento va por documento** aunque los correos no coincidan.
- **La vacante**: activa usable; completada y suspendida no usables; **un estado inventado,
  indeterminado**.
- **Validar la conexión no llama al cliente.**
- **El veredicto de PsicoAlianza viaja en la bolsa** y no decide el estado.
- **Listar vacantes** devuelve identificador y nombre, y lo propio del proveedor **en la bolsa**, sin
  filtrarlo por el camino.
- 🔴 **No regresión de EvaluaTest**, que es la única pieza compartida: su invitación se comporta
  **igual que antes** con el campo del plazo añadido al contrato — lo ignora, y una invitación sin
  plazo le sigue funcionando.

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
7. **En tres líneas, qué falta para que un candidato real pase por PsicoAlianza de punta a punta.**
   Es lo que va a decidir el orden de los pasos 4 y 5.
8. **Un mensaje de commit.**
