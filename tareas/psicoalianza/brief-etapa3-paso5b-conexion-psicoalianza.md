# Brief · Etapa 3, paso 5b — el backend guarda, valida y consulta la conexión de PsicoAlianza

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en los
otros `.md`.** Toca **solo el backend**. El portal no cambia: es el paso 6.

> Escrito el 2026-09-14 leyendo la ruta que guarda la conexión, la que la valida, el esquema de la
> conexión, el formulario del portal y la prueba que cubre el guardado. Las tres decisiones de producto
> las tomó el usuario ese día (decisión 46).
>
> **Incorpora la opinión previa del ejecutor del mismo día**, verificada contra el código: las
> comprobaciones explícitas en vez del DTO, el tercer valor de la comprobación de sesión del cliente,
> la ruta de estado como método propio del adaptador, los nombres que se conservan, el orden de la
> guarda del plazo y cómo se reconstruye la conexión. Marcado como «opinión previa» en su sitio.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md`.
2. `../CLAUDE.md` y `../../esscoti-backend/CLAUDE.md`.
3. `integrate-psicoalianza.md` — la bitácora. Importan **2, 3, 40, 41, 44 y 46**, la pregunta abierta
   **B3**, y en *Lo que la lista de herencia no tenía* el punto «al guardar la conexión desde el portal
   hay que conservar la sesión».
4. `flujo-actual-etapa-psicometrica.md` — **§1** entero. Este paso lo cambia.
5. En el backend: el servicio de empresas —la función que aplica el bloque de credenciales a la lista,
   `create`, `update` y lo que se sirve al portal—, el controlador de empresas —la ruta que valida y las
   rutas de *Mi compañía*—, el DTO del bloque de credenciales, el esquema de la conexión con su campo
   de sesión, el almacén de sesión y el cliente de PsicoAlianza del paso 2 (su comprobación de sesión
   viva), el adaptador de PsicoAlianza del paso 3 (su validación), y
   **`tenants-service-psychometric-connections.spec.ts`, que es el patrón de las pruebas del guardado**.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. **Este paso toca la ruta
que hoy guarda la conexión de EvaluaTest en producción**: tratamiento completo.

## El caso

La empresa de **Laura** quiere usar PsicoAlianza. Hoy no puede: la ruta de *Mi compañía* solo sabe
guardar EvaluaTest, la validación hace login en EvaluaTest, y nadie puede preguntar si la sesión de
PsicoAlianza está viva. Este paso da al backend esas tres cosas. **La pantalla que las usa es del paso
6**: hasta entonces, en local la conexión se sigue insertando a mano (decisión 46).

## Piezas compartidas con EvaluaTest

| Pieza | Qué se le hace | Qué pasa si sale mal |
| --- | --- | --- |
| **La función que aplica el bloque de credenciales a la lista** | Trabaja **por proveedor** y conserva lo que la conexión ya tenía | Es la que guarda EvaluaTest en producción. Si se equivoca de conexión o pierde un campo, una empresa pierde su prueba psicométrica en silencio (decisión 40) |
| **El DTO del bloque de credenciales** | Gana `provider`, **opcional, EvaluaTest por defecto** | Si fuera obligatorio, el portal de hoy no podría guardar |
| **La ruta de validación** | Gana el mismo campo, con la misma regla | Igual |
| **`create` y `update` de la empresa** | La guarda del plazo (alcance 4) | Si se aplica a EvaluaTest, rechaza lo que hoy se acepta |

## Alcance exacto

### 1 · Guardar la conexión por proveedor

- **El DTO del bloque de credenciales gana `provider`**, texto opcional. Vacío o ausente →
  **EvaluaTest**: lo que el portal manda hoy sigue funcionando exactamente igual. Solo se aceptan los
  dos identificadores que la lectura única conoce; otro valor, rechazo con mensaje propio. 🔴 **Ese
  rechazo es una comprobación explícita** —en el servicio para el guardado y en el controlador para la
  validación—, no un decorador del DTO: **el validador global de este backend está apagado a
  propósito** (opinión previa, comprobado en el arranque) y ningún decorador rechaza nada.
- **El bloque conserva su nombre** (`evaluatestCredentials`) aunque lleve `provider: 'psicoalianza'`,
  y **la ruta de validación conserva la suya** aunque diga «evaluatest» en la dirección: los dos son
  contrato con el portal de hoy. Es feo y es lo más pequeño; **el paso 6 decide si renombra**.
- **La regla de tres casos se aplica por proveedor**, sobre la conexión de *ese* proveedor: correo y
  contraseña vacíos → se quita **esa** conexión; correo con contraseña vacía → se conserva la
  contraseña guardada; lo demás → se crea o se actualiza. **Las demás conexiones de la lista no se
  tocan.**
- 🔴 **Al reconstruir, se parte de la conexión existente y se pisan solo los campos que llegan.** Hoy
  la función arma un objeto nuevo con los cuatro campos que conoce y **descarta el resto**: con
  PsicoAlianza, renombrar la conexión tiraría la sesión acuñada y el acuñador gastaría un login. Se
  parte de la conexión entera, se copia su bolsa de credenciales y se pisan **solo correo y
  contraseña** —y el identificador de empresa solo con EvaluaTest, con la regla de hoy: el que llega,
  si no el guardado—. La sesión y cualquier otro campo de la bolsa sobreviven. **Para EvaluaTest el
  resultado es byte a byte el de hoy**, y las pruebas existentes lo comprueban sin tocarlas.
- **La función que aplica el bloque cambia de nombre**, de EvaluaTest a *credenciales psicométricas*:
  es privada del servicio, ninguna prueba la nombra, y va a trabajar por proveedor (opinión previa;
  aceptado como la excepción a «sin renombrar», porque no toca a nadie más).
- **El nombre por defecto es el del proveedor**: «EvaluaTest» o «PsicoAlianza», según la etiqueta que
  ya tiene la lectura única.
- **El identificador de empresa solo aplica a EvaluaTest.** Con PsicoAlianza no se guarda aunque
  llegue: su credencial son correo y contraseña (tabla de campos obligatorios de la lectura única).
- ✅ **Conviven las dos conexiones** (decisión 46): guardar PsicoAlianza en una empresa con EvaluaTest
  **no quita** la de EvaluaTest. Cada oferta sigue usando la conexión con la que se activó; cuál usan
  las nuevas es del selector del paso 6.

### 2 · Validar por proveedor

- **La ruta de validación gana `provider`**, con la misma regla por defecto.
- Con **EvaluaTest**, igual que hoy: login por el puerto, y devuelve si es válida y el identificador de
  empresa.
- Con **PsicoAlianza**, usa **el adaptador de PsicoAlianza directamente** —sin pasar por el puerto,
  cuyo token sigue apuntando a EvaluaTest— y su validación **no llama a nadie** (decisión 44): válida
  si trae correo y contraseña, y **sin identificador de empresa**. ⚠️ **Es una llamada fija a un
  adaptador**, como las que quedan de EvaluaTest; el paso 4 la recablea por el resolvedor. Queda en el
  reporte.

### 3 · Preguntar si la sesión de PsicoAlianza está viva

Una ruta nueva bajo *Mi compañía*, para la conexión de PsicoAlianza de la empresa del usuario, con el
permiso de **leer** la empresa (no el de editarla: solo consulta). **Siempre responde 200 con
`{ status }`**, uno de cuatro estados, en menos de un segundo, **sin acuñar nada**.

**Dónde vive** (opinión previa): en **un método propio del adaptador de PsicoAlianza, fuera del
puerto**, como el enlace de respaldo de EvaluaTest. Resuelve la conexión por la lectura única —sin
conexión → `no_connection`, que cubre la trampa 4 aunque el interruptor manual esté encendido— y
después pregunta al cliente. El controlador inyecta el adaptador directamente, igual que para validar:
**dos llamadas fijas al adaptador desde el controlador**, las dos anotadas en el reporte para que el
paso 4 las recablee.

🔴 **La comprobación de sesión del cliente gana un tercer valor** (opinión previa, aceptado): hoy
responde *muerta* tanto sin sesión como con sesión caducada, y la ruta necesita separarlas. Es **una
línea del cliente y una afirmación de su prueba del paso 2**: la pieza que ya contesta esa pregunta,
que hoy nadie más consume. La alternativa —que el adaptador pregunte primero al almacén— repartía la
distinción en dos sitios y leía la empresa dos veces.

| Lo que hay | Respuesta |
| --- | --- |
| Hay sesión y PsicoAlianza responde que sirve | **`connected`** |
| No hay sesión guardada (ni pegada en local) | **`no_session`** |
| Hay sesión y ya no sirve | **`expired`** |
| La empresa no tiene conexión de PsicoAlianza | **`no_connection`** |

✅ **Comprueba de verdad** (decisión 46): usa la comprobación de sesión viva del cliente del paso 2, que
hace una petición barata a PsicoAlianza y **no lanza**. Leer solo la fecha de «visto vivo» diría
«conectado» con una sesión ya muerta. ⚠️ Con el interruptor de la sesión manual encendido, el almacén
entrega la sesión pegada aunque la empresa no tenga conexión (trampa 8 del paso 3): por eso **primero
se resuelve la conexión** por la lectura única, y solo entonces se pregunta al cliente.

**Lo que esta ruta no hace**: acuñar, ni disparar al acuñador. El botón «conectar» de la decisión 44
llega con el 2c.

### 4 · Plazo sin decimales con PsicoAlianza

En `create` y en `update` de la empresa: si el plazo de la prueba trae decimales **y** la empresa tiene
—o va a tener en esa misma petición— conexión de PsicoAlianza, **se rechaza** con un mensaje propio:
*con PsicoAlianza el plazo va en días enteros*. Con EvaluaTest se sigue aceptando. Es la mitad de
producto de la guarda del adaptador (paso 3); la variable de entorno no se valida aquí.

**En qué orden** (opinión previa): primero se aplica el bloque de credenciales si viene, y el plazo se
comprueba **contra la lista resultante**. Así «crear con PsicoAlianza y 1,5 días» se rechaza y «quitar
PsicoAlianza y poner 1,5 días en la misma petición» se acepta, sin reglas aparte. **Cuenta como «tiene
PsicoAlianza» que exista la entrada en la lista, aunque esté incompleta.** En `update`, solo cuando
llega un plazo con decimales y no llega bloque, hace falta una lectura extra de las conexiones; con
plazo nulo, ausente o entero no hay lectura ni guarda.

**Medido el 2026-09-14 en producción**: ninguna empresa tiene plazo propio; nadie se ve afectado.

### 5 · Lo que se sirve al portal

La lista de conexiones ya sale con `id`, `name`, `provider` y `configured` para cualquier proveedor.
**No cambia.** El bloque derivado de EvaluaTest tampoco.

## Los casos, persona por persona

**Con EvaluaTest, nada cambia:**

| El reclutador, con EvaluaTest | Hoy | Después |
| --- | --- | --- |
| Guarda nombre, correo y contraseña | Valida con login, guarda con identificador | **Igual** |
| Renombra, retecleando la contraseña | Guarda | **Igual** |
| Correo con contraseña vacía | Conserva la guardada | **Igual** |
| Correo y contraseña vacíos | Quita la conexión | **Igual** |
| El portal de hoy, sin `provider` | — | **EvaluaTest** |
| Pone 1,5 días de plazo | Se acepta | **Igual** |
| Crea la empresa con el bloque | Nace con la conexión | **Igual** |

**Con PsicoAlianza** (solo alcanzable insertando a mano o con el portal del paso 6):

| El reclutador, con PsicoAlianza | Qué pasa |
| --- | --- |
| Guarda nombre, correo y contraseña | Válida sin login; cifrada; **sin identificador**; la de EvaluaTest, si existe, **sigue** |
| Renombra | **Conserva la sesión** y la contraseña; cambia solo el nombre |
| Correo con contraseña vacía | Conserva la guardada |
| Correo y contraseña vacíos | Se quita la conexión con su sesión; la de EvaluaTest sigue |
| Manda un identificador de empresa | Se ignora |
| Pregunta por la sesión | `connected` / `no_session` / `expired` / `no_connection` según la tabla |
| Pone 1,5 días de plazo | **Rechazado** |
| `provider` desconocido | Rechazado |

## 🔴 Dónde se para — qué NO se hace

- **No se toca el portal**: paso 6. Ni el selector, ni el modal, ni la etiqueta de estado.
- **No se elige proveedor** para las operaciones del embudo: paso 4.
- **No se acuña ninguna sesión** ni se dispara nada: 2c.
- **No se toca cómo el almacén guarda las cookies**: es el cambio propio de la cookie (decisión 47,
  cuando exista), que va después de este paso. El tercer valor de la comprobación de sesión del
  cliente **no** es eso: no toca el almacén.
- **No se renombra la ruta de validación ni el bloque del DTO**: paso 6.
- **No se valida la variable de entorno del plazo.**
- **No se quita ninguna conexión al guardar otra.**
- **No se toca `psicoalianza-api.md`.**

## 🔴 Las trampas

**1. La función que reconstruye la conexión pierde campos.** Es la trampa 5b del paso 2, y este paso
es donde se paga. Con PsicoAlianza, un renombre sin conservar `session` tira la sesión acuñada **sin
ningún error**: la pantalla del paso 6 diría «sin sesión» y el acuñador gastaría un login. La prueba
tiene que renombrar una conexión **con sesión** y comprobar que la sesión sigue.

**2. El guardado de *Mi compañía* reescribe la lista entera**, y el almacén de sesión escribe solo el
campo de sesión de una conexión (paso 2). Este paso **no cambia** ese reparto: lee la lista, reconstruye
la del proveedor pedido y escribe la lista. La carrera con el acuñador sigue siendo la que el 2c tiene
que tener en cuenta; aquí basta con no empeorarla.

**3. `provider` por defecto es EvaluaTest, no «el que haya».** Con una empresa que solo tiene
PsicoAlianza, un bloque sin `provider` **crea una conexión de EvaluaTest**, no toca la de PsicoAlianza.
Es lo correcto: el portal de hoy solo sabe de EvaluaTest, y adivinar rompería el contrato con él.

**4. La sesión manual engaña a la ruta de estado.** Con el interruptor encendido, el almacén entrega
sesión para cualquier empresa. Sin resolver antes la conexión, una empresa sin PsicoAlianza saldría
«conectada». Y la prueba que simule el almacén sin la lectura única no lo detecta.

**5. La guarda del plazo tiene que mirar la conexión que se está guardando en la misma petición**, no
solo la que ya existe: crear la empresa con PsicoAlianza y 1,5 días en un solo envío también se rechaza.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **El guardado de EvaluaTest, idéntico**: los tres casos, el nombre, el identificador | Es lo que corre en producción |
| **La validación de EvaluaTest, idéntica** | Idem |
| **El token del puerto, apuntando a EvaluaTest** | Paso 4 |
| **Lo que se sirve al portal** | El portal de hoy lo lee |
| **Compilación y pruebas en verde** | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`: sin lint ni formateador, sin comentarios nuevos en código,
identificadores en inglés —los valores `evaluatest` y `psicoalianza` y los estados de la ruta son
contrato—, la solución más pequeña, sin commitear y todo al índice.

**Documentación en el mismo diff**: `flujo-actual-etapa-psicometrica.md`, **§1** —guardar por
proveedor, conservar la sesión, la validación sin login de PsicoAlianza, la ruta de estado y la guarda
del plazo—. `../entorno-local.md`: la sección de insertar la conexión a mano **sigue valiendo** hasta
el paso 6; una frase diciendo que la ruta ya existe. `before-deploy.md` no cambia.

## Pruebas

**Guardado** (patrón: `tenants-service-psychometric-connections.spec.ts`):

- 🔴 **No regresión de EvaluaTest**: cada prueba que ya existe sigue pasando **sin cambios**, y un bloque
  sin `provider` se comporta igual que antes.
- **Guardar PsicoAlianza** en una empresa con EvaluaTest: quedan las dos, la de EvaluaTest **idéntica**.
- **Renombrar PsicoAlianza conserva la sesión** y la contraseña.
- **Quitar PsicoAlianza** deja la de EvaluaTest.
- **El identificador de empresa no se guarda** con PsicoAlianza.
- **`provider` desconocido** se rechaza.
- **Crear la empresa con el bloque de PsicoAlianza** nace con esa conexión.

**Validación**: con PsicoAlianza **no se llama a ningún cliente**, y devuelve válida con correo y
contraseña e inválida sin uno de los dos; con EvaluaTest, igual que hoy.

**Estado de sesión**: los cuatro estados, uno por prueba; **la empresa sin conexión sale
`no_connection` aunque el almacén tenga sesión** (trampa 4); **no se escribe nada** salvo lo que el
cliente ya escribe (visto vivo). Y en el cliente: **sin sesión responde el tercer valor, no *muerta***,
con la afirmación del paso 2 corregida.

**Proveedor desconocido**: rechazado en el guardado **y** en la validación, con prueba en cada uno,
porque no hay validador global que lo haga.

**Plazo**: 1,5 días con PsicoAlianza se rechaza en `update` y en `create`, también cuando la conexión
llega en la misma petición; 1,5 días con EvaluaTest se acepta; 2 días con PsicoAlianza se acepta.

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo, y borrarlo después,
limpiando la caché.

## Verificación

Una vez sobre el conjunto: `npm run build` y `npm test` en el backend.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el guardado y la validación de EvaluaTest no cambiaron**, y de que las pruebas
   que ya existían pasan sin tocarlas.
5. **Las rutas nuevas o cambiadas**, con su forma, para el brief del paso 6 — y **las dos llamadas
   fijas al adaptador** desde el controlador, para el paso 4.
6. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos en código.
7. **Los documentos actualizados.**
8. **Un mensaje de commit.**
