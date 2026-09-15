# Brief · Etapa 3, paso 6.1 — Mi compañía: una fila por proveedor, la etiqueta de sesión y el plazo

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 50** y en las que ella nombra. Toca **el portal** y, con un cambio aditivo, **el backend**.

> Escrito el 2026-09-14 leyendo la página de *Mi compañía* del portal —la sección de la conexión, su
> modal, el guardado de la pestaña de desarrollo y el de los interruptores del flujo—, el aviso de
> proveedor, el tipo de la empresa en el portal, el controlador y el servicio de empresas del backend,
> la validación por proveedor, la ruta del estado de sesión y la prueba que fija lo que se sirve al
> portal. Las decisiones de producto las tomó el usuario ese día (decisión 50).
>
> **Incorpora la opinión previa del ejecutor del mismo día**, verificada contra el código por el
> planificador: el tercer sitio que manda el cuerpo general del guardado (el modal de los portales de
> empleo), el correo obligatorio con PsicoAlianza, que el campo del plazo solo aparece con `mode=dev`,
> el plazo tecleado que viaja con un interruptor, el correo de una conexión incompleta de EvaluaTest y
> las respuestas desordenadas de la etiqueta. Marcado como «opinión previa» en su sitio.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md`. 🔴 **Ojo a lo nuevo de *Verificación***: el portal no tiene pruebas
   automáticas, y este paso se verifica con los casos a mano de abajo.
2. `../CLAUDE.md` y `../../esscoti-backend/CLAUDE.md`.
3. `integrate-psicoalianza.md` — decisiones **2, 3, 40, 41, 44 (con su corrección), 46 y 50**.
4. `flujo-actual-etapa-psicometrica.md` — **§1** entero, y en §2 *Si el arranque falla*. Este paso
   cambia §1.
5. En el portal: la página de *Mi compañía* —la sección de la prueba psicométrica dentro de la pestaña
   del flujo, el modal de la conexión con su función de guardar, la pestaña de desarrollo con el campo
   del plazo, la función que arma el cuerpo del guardado general y las tres que lo mandan (guardar esa
   pestaña, los interruptores de etapa y el modal de credenciales de un portal de empleo)—, el componente del aviso de proveedor con sus dos funciones
   que buscan la conexión de EvaluaTest, el tipo `Tenant`, el cliente de la API (cómo expone el mensaje
   y el código de un rechazo) y los textos en español e inglés de `tenants.filters.psychometricConnection`
   y de `tenants.test.timingConfig`.
6. En el backend: en el servicio de empresas, la función que añade las credenciales a lo que se sirve;
   la ruta de validación y la del estado de sesión en el controlador de empresas; y
   **`tenants-service-psychometric-connections.spec.ts`**, la prueba *la lista sale sin credenciales*.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. **Paso visible y que toca el
guardado de la conexión de EvaluaTest en producción**: tratamiento completo.

## El caso

La empresa de **Laura** quiere usar PsicoAlianza. Hoy, en *Mi compañía*, ve una sola línea
—«Conexión de pruebas psicométricas — EvaluaTest Medicall (EvaluaTest) — correo»— y un modal que solo
sabe guardar EvaluaTest. Aunque alguien le insertara la conexión de PsicoAlianza a mano, no la vería.
Y si la pusiera en ese modal, el portal comprobaría el usuario y la contraseña en EvaluaTest.

Después de este paso, Laura ve **una fila por proveedor**, conecta PsicoAlianza desde su fila, y ve si
la sesión está viva. **Las ofertas no cambian en este paso**: son del 6.2.

## Piezas compartidas con EvaluaTest

| Pieza | Qué se le hace | Qué pasa si sale mal |
| --- | --- | --- |
| **El modal de la conexión** | Trabaja para el proveedor de la fila que lo abrió | Es el que guarda EvaluaTest en producción. Si manda mal el proveedor, crea una conexión de EvaluaTest con los datos de PsicoAlianza, **sin error** |
| **Lo que el backend sirve de la empresa** | La lista de conexiones gana el correo | Lo leen *Mi compañía*, las ofertas y el listado interno de empresas |
| **Los interruptores de etapa del flujo** | Enseñan el mensaje del backend cuando rechaza | Hoy guardan en cada pulsación; no puede cambiar qué mandan |
| **El guardado de la pestaña de desarrollo** | Igual, y el plazo solo en días enteros con PsicoAlianza | Sin PsicoAlianza tiene que seguir aceptando medios días |

## Alcance exacto

### 1 · Backend: la lista servida gana el correo

En la función del servicio de empresas que prepara lo que se sirve, **cada conexión de la lista sale
también con su correo** (nulo si no tiene), junto a `id`, `name`, `provider` y `configured`. Nada más:
**la contraseña no sale**, el bloque derivado de EvaluaTest **no cambia**, y guardar tampoco.

⚠️ **Es la única afirmación existente que cambia**: la prueba *la lista sale sin credenciales* compara la
lista exacta, así que sus dos objetos esperados **ganan** el correo. No se quita nada de lo que ya
comprueba: la comprobación de que no aparece la contraseña cifrada se queda tal cual. El reporte dice
qué líneas cambiaron.

### 2 · Una fila por proveedor

En la sección de la prueba psicométrica de la pestaña del flujo, **dos filas siempre**, EvaluaTest y
PsicoAlianza, en ese orden, bajo el título de hoy:

| Estado de la conexión de ese proveedor | Qué dice la fila | Botón |
| --- | --- | --- |
| Existe y está configurada | «nombre (proveedor) — correo», igual que la línea de hoy | Editar conexión |
| Existe pero incompleta, o no existe | «Proveedor — sin conectar» | Conectar |

Cada botón abre el modal **fijado a ese proveedor**. Sin selector en el modal (decisión 50).

- **El correo de la fila y el del modal salen del correo de esa conexión en la lista** (alcance 1), no
  del bloque derivado de EvaluaTest. Con eso *Mi compañía* **deja de leer ese bloque**. Es lo que la
  tabla de pasos llama «los lectores de la 41».
- La búsqueda de la conexión de EvaluaTest del componente del aviso de proveedor **sigue existiendo y
  sin cambios**: la usan las ofertas (6.2). Para buscar la de un proveedor, lo más pequeño que sirva, **sin
  tocar las dos funciones que ya existen**.
- **No hay «desconectar»**, igual que hoy.

### 3 · El modal, por proveedor

El mismo modal —nombre, correo y contraseña, **contraseña siempre vacía y obligatoria**— con el
proveedor de la fila:

- **Al abrir**: el nombre de la conexión de ese proveedor si existe, aunque esté incompleta, y si no, el
  del proveedor («EvaluaTest» o «PsicoAlianza»). El correo, el de esa conexión o vacío. ⚠️ **Con
  EvaluaTest cambia un caso, aceptado** (opinión previa): una conexión incompleta abre hoy el modal con
  el correo vacío, porque el bloque derivado solo existe con contraseña guardada; ahora lo abre con su
  correo. Es a mejor, y en producción había cero conexiones incompletas (medido para la decisión 34).
- **Al guardar, manda el proveedor en las dos peticiones**: en la validación y en el bloque del guardado.
  Con EvaluaTest también, aunque para el backend dé igual mandarlo que no (decisión 46).
- **Con EvaluaTest, todo lo demás igual que hoy**: si la validación dice inválida, el mensaje de
  credenciales incorrectas; si no trae identificador de empresa, el de *no se pudo identificar tu
  empresa*; y se guarda con ese identificador.
- 🔴 **Con PsicoAlianza, la validación no trae identificador de empresa y no lo exige**: es válida si hay
  correo y contraseña (decisión 44). Se guarda **sin** identificador. Inválida → el mismo mensaje de hoy.
- 🔴 **Con PsicoAlianza, el correo es obligatorio en el formulario** (opinión previa). Hoy el modal solo
  exige nombre y contraseña, y la validación de PsicoAlianza da inválida **únicamente** si falta el
  correo: sin esto, un correo vacío enseñaría «correo o contraseña incorrectos» sin haber comprobado
  ninguno de los dos, que es lo que la decisión 44 quería evitar. **Con EvaluaTest, el correo sigue sin
  ser obligatorio**, como hoy.
- Al guardar bien, la fila se actualiza con la empresa que devuelve el guardado, como hoy, y **se
  vuelve a pedir el estado de la sesión** (alcance 4).
- El título del modal nombra el proveedor.

### 4 · La etiqueta del estado de sesión, solo en la fila de PsicoAlianza

**Solo cuando la conexión de PsicoAlianza existe y está configurada**, la fila pide el estado a la ruta
del backend al cargar la página y después de guardar el modal. **No se pide en ningún otro caso**, y en
la fila de EvaluaTest nunca.

| Lo que responde | Qué ve el reclutador |
| --- | --- |
| Mientras llega | Un indicador de carga |
| `connected` | **Conectado** |
| `no_session` o `expired` | **«Sin conexión — las invitaciones a PsicoAlianza no están saliendo y quienes ya están en la prueba pueden descartarse por vencimiento. Avisa a soporte.»** (texto aprobado por el usuario, decisión 50) |
| `no_connection` | Nada: la fila ya dice *sin conectar*. Solo se alcanza si la conexión cambió entre la carga y la consulta |
| **La petición falla** | «No se pudo comprobar la sesión». **No** «sin conexión», que no se sabe |

**Solo cuenta la última respuesta pedida** (opinión previa): la etiqueta se pide al cargar y otra vez al
guardar el modal, y si la primera llega después de la segunda, la pisaría. Una respuesta que ya no es la
última pedida se descarta. Sin capa nueva.

🔴 **No dice que la etapa se omite**: no se omite (corrección de la 44). **No hay botón de conectar**:
llega con el 2c. La etiqueta dice *conectado*, nunca *credenciales válidas* (44).

### 5 · El plazo de la prueba

El campo vive en la pestaña de desarrollo de *Mi compañía*, que **solo aparece añadiendo `mode=dev` a la
dirección de la página** (opinión previa): un reclutador normal no lo ve nunca. Cuenta como **«la empresa tiene
PsicoAlianza»** que exista la entrada en la lista, **completa o no**: es la misma regla que la guarda
del backend.

- **Con PsicoAlianza**, el campo solo acepta días enteros: el paso del control numérico es 1, y guardar
  la pestaña con decimales **no manda nada** y enseña *con PsicoAlianza el plazo de la prueba psicométrica
  va en días enteros*. **Sin PsicoAlianza, igual que hoy**, con sus medios días.
- **El texto del campo deja de nombrar a EvaluaTest**, en español y en inglés. Se cambia el **texto**,
  no la clave.
- 🔴 **Cuando el backend rechaza el guardado con un 400, se enseña su mensaje** en vez de *error al
  actualizar*, **en las tres funciones que mandan el cuerpo general**: guardar la pestaña de desarrollo,
  los interruptores de etapa del flujo y **guardar el modal de credenciales de un portal de empleo**
  (Computrabajo, elempleo, Pandapé; opinión previa). Cualquier otro fallo, el mensaje genérico de hoy.
  Hay una cuarta función que arma ese cuerpo y **no la llama nadie**: no se toca. El interruptor de cada
  portal de empleo manda solo sus credenciales y no se ve afectado. **Desde esos tres guardados, el único
  400 alcanzable es el del plazo** (opinión previa, verificado): el de proveedor desconocido necesita el
  bloque de la conexión, que no mandan; el de identificador mal formado sale de la sesión autenticada; y
  el NIT duplicado es un 409, que sigue con el mensaje genérico.

### 6 · Textos

En español y en inglés: el nombre del proveedor PsicoAlianza junto al de EvaluaTest, *sin conectar*,
*conectar*, los tres textos de la etiqueta y el mensaje del plazo. **Claves nuevas en inglés**; los
textos que ve el usuario, en su idioma. Ningún texto existente cambia salvo el del campo del plazo, y
**se quita el que este paso deja sin uso**: *sin proveedor conectado*, en español y en inglés, que solo
usaba la línea de antes (buscado en todo el portal en la revisión del diff, 2026-09-14). Dejarlo sería
una limpieza pendiente.

## Los casos, persona por persona

**Con EvaluaTest, nada cambia salvo la fila nueva de debajo:**

| El reclutador, con EvaluaTest | Hoy | Después |
| --- | --- | --- |
| Abre *Mi compañía* con EvaluaTest conectado | Una línea con nombre, proveedor y correo | **La misma línea**, más la fila «PsicoAlianza — sin conectar» |
| Guarda nombre, correo y contraseña buenos | Valida contra EvaluaTest y guarda con identificador | **Igual** |
| Credenciales malas | «Correo o contraseña incorrectos» | **Igual** |
| Renombra | Vuelve a teclear la contraseña | **Igual** |
| Pone 1,5 días de plazo | Se guarda | **Igual** |
| Pulsa un interruptor de etapa | Guarda | **Igual** |

**Con PsicoAlianza:**

| El reclutador | Qué pasa |
| --- | --- |
| Pulsa *Conectar* en la fila de PsicoAlianza | El modal con «PsicoAlianza» de nombre y el correo vacío |
| Guarda correo y contraseña | Sin entrar en PsicoAlianza; se guarda sin identificador; **la fila de EvaluaTest no cambia** |
| Guarda con la contraseña vacía | El formulario la exige, como hoy |
| Guarda con el correo vacío | **El formulario lo exige**, sin llamar a la validación (con EvaluaTest, como hoy) |
| La empresa tenía 1,5 días guardados, conecta PsicoAlianza y cambia su contraseña de Computrabajo | El backend rechaza y **se ve su mensaje** |
| Abre la página con PsicoAlianza conectado y la sesión viva | Carga, luego **Conectado** |
| Sin sesión, o con la sesión caducada | El texto de *Sin conexión* aprobado |
| La consulta del estado falla | «No se pudo comprobar la sesión» |
| Renombra | Vuelve a teclear la contraseña; la sesión guardada se conserva (lo garantiza el backend desde el 5b) |
| Pone 1,5 días de plazo | No se manda; el mensaje de días enteros |
| La empresa tenía 1,5 días guardados, conecta PsicoAlianza y pulsa un interruptor | El backend rechaza y **se ve su mensaje**, no *error al actualizar* |
| La empresa solo tiene PsicoAlianza y abre una oferta | ⚠️ Sigue viendo *no tienes proveedor*. **Es lo esperado hasta el 6.2**, no un fallo de este paso |

## 🔴 Dónde se para — qué NO se hace

- **Nada de las ofertas**: ni la señal de «hay conexión», ni el selector, ni la conexión mandada al
  guardar, ni las pruebas adicionales, ni los textos de vacante no usable. Todo eso es el 6.2.
- **No se tocan las dos funciones del componente del aviso** que buscan la conexión de EvaluaTest.
- **No hay botón de conectar ni nada que acuñe**: 2c.
- **No se renombran** el bloque del guardado ni la ruta de validación que se llaman como EvaluaTest, ni
  las claves de texto existentes, ni los nombres del modal que ya existen (decisión 50 y la fila de la
  tabla).
- **No hay «desconectar».**
- **No se toca el guardado de la conexión en el backend** ni su validación: solo lo que se sirve.
- **No se valida el plazo en ningún otro sitio** que la pestaña de desarrollo.

## 🔴 Las trampas

**1. Un bloque sin proveedor es EvaluaTest** (trampa 3 del 5b). Si el modal de PsicoAlianza olvida
mandar el proveedor en la validación, sale «credenciales incorrectas», porque comprueba en EvaluaTest.
Si lo olvida en el guardado, **crea o pisa la conexión de EvaluaTest** con el correo de PsicoAlianza, sin
error. El caso a mano 3 lo comprueba mirando las dos filas.

**2. El modal de hoy exige identificador de empresa** después de validar. Con PsicoAlianza nunca llega:
sin separar esa comprobación por proveedor, conectar PsicoAlianza siempre falla con *no se pudo
identificar tu empresa*.

**3. Tres guardados mandan el cuerpo entero**, plazo incluido: los interruptores del flujo en cada
pulsación, la pestaña de desarrollo y el modal de credenciales de un portal de empleo. Por eso el mensaje
del 400 va en los tres y no solo en la pestaña. Caso: Laura tiene 1,5 días guardados, conecta
PsicoAlianza y cambia su contraseña de Computrabajo; sin esto, ve «error al actualizar» sin saber que es
el plazo.

⚠️ **Y lo tecleado viaja aunque no se haya guardado. Aceptado, no se arregla aquí** (opinión previa):
con PsicoAlianza, alguien escribe 1,5 en la pestaña de desarrollo, el portal no lo manda y avisa; luego
pulsa un interruptor del flujo, el 1,5 sigue en el formulario compartido, viaja, y el backend lo rechaza
con su mensaje. No es silencioso, y hoy, sin PsicoAlianza, lo tecleado sin guardar ya se guarda de rebote
al pulsar un interruptor.

**4. La ruta del estado con una conexión incompleta responde `no_connection`.** Por eso la etiqueta solo
se pide con la conexión configurada. Si se pidiera siempre, una fila incompleta enseñaría una etiqueta que
contradice su propio *sin conectar*.

**5. Con la sesión manual encendida en local**, el almacén entrega la sesión pegada a cualquier empresa
con conexión. En local, *Conectado* dice que la sesión pegada sirve, no que la empresa haya acuñado nada.
No es un fallo del paso. Es lo que hay que saber para leer el caso a mano 4.

**6. El correo sale también por las demás rutas que sirven la empresa**: *Mi compañía*, crear, actualizar,
el logo, el listado interno y la búsqueda por NIT (opinión previa). ✅ **La búsqueda por NIT no tiene
llamadores**, confirmado el 2026-09-14 por el ejecutor y el planificador. Se buscó en todo el backend,
fuera de las pruebas, el nombre del servicio de empresas y no solo el del método. Solo aparece donde se
registra el módulo, en el controlador, que no la usa, y en tres comentarios. Por ahí el correo no sale.
Es el correo de la cuenta del proveedor, que con EvaluaTest ya sale por el bloque derivado. **No es una
contraseña**, y la comprobación de que la contraseña cifrada no sale se queda.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **El guardado y la validación de EvaluaTest desde el modal**, con sus mensajes | Es lo que corre en producción |
| **Las ofertas**, que siguen mirando solo EvaluaTest | 6.2 |
| **El bloque derivado de EvaluaTest** en lo que se sirve | Lo lee el portal de las ofertas |
| **Los medios días del plazo sin PsicoAlianza** | Se aceptan hoy |
| **Todas las pruebas del backend**, con la única afirmación ampliada del alcance 1 | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`: sin lint ni formateador, **sin comentarios nuevos en código**,
identificadores en inglés —también los parámetros de las funciones flecha y las claves de texto
nuevas—, y los valores `evaluatest`, `psicoalianza` y los estados de la ruta son contrato. La solución
más pequeña, sin commitear y todo al índice, **en los dos repositorios**. Los archivos que se tocan usan
finales de línea CRLF, y se respetan (opinión previa).

**Documentación en el mismo diff:**
- `flujo-actual-etapa-psicometrica.md`, **§1 punto 1**: qué ve hoy el reclutador en *Mi compañía*, las
  dos filas, el modal por proveedor, la etiqueta y el plazo, **diciendo que el campo del plazo solo
  aparece con `mode=dev`**. Y en el bloque *El backend ya guarda, valida
  y consulta la conexión de PsicoAlianza; el portal todavía no la manda*, que **el portal ya la manda**.
- `../entorno-local.md`: la sección de la conexión de PsicoAlianza a mano pasa a decir que **se conecta
  desde *Mi compañía***, donde la contraseña la cifra el backend al guardar, y que insertarla en la base
  sigue sirviendo si hace falta, cifrando la contraseña a mano como hasta ahora. La sección de la oferta
  a mano **no cambia**: es del 6.2.
- `before-deploy.md` no cambia.

## Pruebas

**Backend**: la afirmación ampliada del alcance 1, y una prueba nueva con **una conexión de PsicoAlianza
sin correo**, que sale con el correo nulo. Control negativo sobre la ampliada: sin el correo en lo servido,
falla. Borrarlo después y limpiar la caché de Jest.

**Portal: casos a mano en local**, con el backend y el portal levantados (`../entorno-local.md`), una
empresa propia y la sesión de PsicoAlianza pegada. **El reporte dice el resultado de cada uno.**

| # | Cómo se prepara | Qué se hace | Qué se tiene que ver |
| --- | --- | --- | --- |
| 1 | Empresa sin ninguna conexión | Abrir *Mi compañía* | Dos filas *sin conectar*, sin etiqueta |
| 2 | La misma. ⚠️ Hace un login real contra EvaluaTest con credenciales inventadas: ✅ **autorizado por el usuario el 2026-09-14**. Un solo intento, con un correo que no sea de nadie | *Conectar* en EvaluaTest con credenciales inventadas | «Correo o contraseña incorrectos», igual que hoy, y la fila sigue *sin conectar* |
| 3 | La misma | *Conectar* en PsicoAlianza con correo y contraseña | Se guarda; la fila dice «PsicoAlianza (PsicoAlianza) — correo»; **la fila de EvaluaTest sigue *sin conectar*** (trampa 1). En la base, la lista tiene una entrada de PsicoAlianza y ninguna de EvaluaTest |
| 4 | Interruptor de la sesión manual encendido, sesión válida pegada | Recargar | Carga y luego *Conectado* |
| 5 | Interruptor apagado, sin sesión guardada en la conexión | Recargar | El texto de *Sin conexión* aprobado |
| 6 | Interruptor encendido, cookie pegada inventada | Recargar | El texto de *Sin conexión* aprobado |
| 7 | Conexión de PsicoAlianza guardada; en las herramientas del navegador, **bloquear solo la petición del estado de sesión** (apagar el backend no sirve: falla también la carga de la página) | Recargar | «No se pudo comprobar la sesión», nunca *Sin conexión* |
| 8 | Conexión de PsicoAlianza guardada | *Editar conexión*: cambiar solo el nombre, reteclear la contraseña | La fila cambia el nombre; la etiqueta se vuelve a pedir |
| 9 | Pestaña de desarrollo (**`mode=dev` en la dirección**), con PsicoAlianza | Plazo 1,5 y guardar | No se guarda; mensaje de días enteros |
| 10 | La misma | Plazo 2 y guardar | Se guarda |
| 11 | **Otra empresa sin PsicoAlianza**, pestaña de desarrollo (`mode=dev`) | Plazo 1,5 y guardar | Se guarda, igual que hoy |
| 12 | Empresa sin PsicoAlianza con 1,5 guardado desde la pestaña de desarrollo (`mode=dev`); después conectar PsicoAlianza; recargar | Pulsar un interruptor de etapa del flujo | **El mensaje del backend**, no *error al actualizar* |
| 13 | Empresa solo con PsicoAlianza | Abrir una oferta | Sigue viendo *no tienes proveedor* (6.2): confirma que las ofertas no cambiaron |
| 14 | Conexión de PsicoAlianza por conectar | *Conectar* con la contraseña y **el correo vacío** | El formulario exige el correo; no sale «correo o contraseña incorrectos» |
| 15 | La del caso 12 | Guardar las credenciales de un portal de empleo | **El mensaje del backend**, no *error al actualizar* |

Si hay cuenta real de EvaluaTest, además: guardarla y comprobar que la fila sale igual que hoy y que la
de PsicoAlianza no cambió. **Si no la hay, decirlo en el reporte**, no darlo por comprobado.

## Verificación

Una vez sobre el conjunto:
- **Backend**: `npm run build` y `npm test`, con la caché de Jest limpia.
- **Portal**: `npm run typecheck`, **y los quince casos a mano**.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real, **caso a mano por caso a mano**.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **La afirmación de la prueba existente que se amplió**, con sus líneas, y confirmación de que no se
   quitó ninguna.
5. **Confirmación de que el modal de EvaluaTest guarda y valida igual que hoy**, y de que las ofertas no
   se tocaron.
6. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos en código, en los dos
   repositorios, **y la lista de los identificadores nuevos**, parámetros de funciones flecha incluidos.
7. **Los documentos actualizados.**
8. **Un mensaje de commit por repositorio.**
