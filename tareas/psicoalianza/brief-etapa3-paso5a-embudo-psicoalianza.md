# Brief · Etapa 3, paso 5a — el embudo le pasa a la invitación lo que PsicoAlianza exige

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en los
otros `.md`.** Toca **los dos repositorios**: backend y portal.

> Escrito el 2026-09-14 con mediciones en producción hechas ese día —tipos de documento guardados,
> forma de los documentos, personas sin documento en la etapa— y con las cinco puertas del arranque
> leídas en el código. **Donde dice «medido» o «leído», lo está**; lo que no, se dice.
>
> **Incorpora la opinión previa del ejecutor del mismo día**: la rama del fallo del plazo, los cuatro
> tipos del camino, la limpieza como función propia y el fallo latente que el cambio arregla de paso.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal.
2. `../../CLAUDE.md` y `../../../../esscoti-backend/CLAUDE.md`.
3. `integrate-psicoalianza.md` — la bitácora. Importan **12, 33, 39 (con su ampliación del
   2026-09-14), 40 y 45**, la fila A14 de *Falta de PsicoAlianza*, *Opinión previa del paso 3* y
   *Paso 3*.
4. `flujo-actual-etapa-psicometrica.md` — **§2 entero** y **§8**. Este paso los cambia.
5. `psicoalianza-api.md` — el catálogo de `tipo_documento_id`.
6. En el backend: el arranque de la etapa en el orquestador y su captura de errores, el adaptador de
   PsicoAlianza del paso 3, el tipo de la invitación del puerto, el enum de motivos de descarte, y
   **`psychometric-start-through-port.spec.ts`, que es el patrón de las pruebas del arranque**.
7. En el portal: todo lo que hoy nombra `psychometric_missing_email` o *Psicométrica — sin correo*
   (ver alcance 5).

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. **Este paso toca el
embudo y lleva el tratamiento completo**: tantas rondas como hagan falta.

## El caso

**Laura** termina sus preguntas por WhatsApp en una oferta de una empresa con PsicoAlianza. El
adaptador del paso 3 sabe invitarla, pero el embudo **no le pasa ni su documento ni el plazo**. Hoy,
si se encendiera PsicoAlianza, Laura saldría descartada tras tres intentos por falta de plazo, y si
no, descartada como «sin correo» por falta de documento, aunque tenga correo.

Este paso hace que el embudo pase esos datos, que el adaptador traduzca el tipo de documento, y que
el reclutador vea «sin documento» cuando es eso lo que faltó.

**Nada llega todavía a una persona con PsicoAlianza**: el resolvedor que elige proveedor es el paso
4, y no se enciende antes de este. **Pero el arranque es el mismo que hoy invita con EvaluaTest en
producción**, así que la pregunta que manda en este paso es: **¿EvaluaTest sigue exactamente igual?**

## Piezas compartidas con EvaluaTest

| Pieza | Qué se le hace | Qué pasa si sale mal |
| --- | --- | --- |
| **El arranque de la etapa** | Pasa tres datos más a la invitación y **calcula el plazo antes de invitar** | Es el camino de todas las invitaciones de hoy. Un error aquí rompe la etapa en producción |
| **El tipo de la invitación del puerto** | Gana `documentType`, texto **opcional** | Obligatorio, dejaría de compilar lo que no lo pasa |
| **La captura de *falta un dato*** | Elige el motivo según el campo que falta | Si se equivoca, un candidato de EvaluaTest sin correo saldría con otro motivo |
| **El enum de motivos** | Uno nuevo | Solo se añade |

## Alcance exacto

### 1 · El arranque pasa documento, tipo y plazo

En la única llamada a la invitación del puerto se añaden:

- **El documento** del candidato, tal cual está guardado, con su nulo si no tiene.
- **El tipo de documento**, tal cual está guardado, con su nulo.
- **El plazo**, el mismo que se le anuncia en el mensaje de WhatsApp y con el que el cron descarta.

🔴 **El plazo se calcula ANTES de invitar**, una sola vez, y ese mismo valor va a la invitación y al
mensaje. Hoy se calcula **después** de invitar y de guardar. Moverlo es lo que garantiza que el plazo
que PsicoAlianza fija y el que se anuncia **no puedan diferir**. La rama demo también usa ese valor
para su mensaje: tiene que seguir teniéndolo.

**Los tipos del candidato por el camino ganan el documento y el tipo**: son **cuatro** —el arranque,
la reanudación de la etapa, la reanudación general y el reenvío del paso pendiente— (opinión previa),
para que el campo esté declarado en toda la cadena.
**Leído el 2026-09-14: las cinco puertas cargan al candidato entero**, sin proyección —el bombeo al
entrar y al retomar, el reintento manual, el reintento del cron y el botón «Continuar proceso», que
llega por la búsqueda por teléfono y en todas sus ramas devuelve el documento completo—. Las tres
consultas del orquestador que traen solo nombre, correo y teléfono son avisos al reclutador y no
llegan al arranque. ⚠️ **Esto se comprobó leyendo cada carga, no con una búsqueda**: si al leer el
código aparece otra puerta, dilo antes de empezar.

### 2 · El tipo de la invitación del puerto

Gana **`documentType`, texto opcional**, al lado del documento y del plazo que ya tiene. El adaptador
de EvaluaTest **lo ignora**, como ya ignora el documento y el plazo.

### 3 · El adaptador de PsicoAlianza traduce el tipo y protege el documento (decisión 45)

**El tipo de documento**, sin distinguir mayúsculas y quitando espacios:

| Lo que llega | Se manda |
| --- | --- |
| Vacío o nulo | **CC (`1`)** — decisión 12 |
| `CC` | `1` |
| `TI` | `2` |
| `PA` | `3` |
| `CE` | `4` |
| `PEP` | `6` |
| `PT` (nuestro Permiso por Protección Temporal, que PsicoAlianza no tiene) | **OTRO (`5`)** |
| 🔴 Cualquier otro texto | **OTRO (`5`)**, nunca CC: no se afirma lo que no se sabe |

**Medido el 2026-09-14 en producción**: de 8.272 candidatos, 4.747 tienen el tipo vacío y 3.525
tienen CC. **Ningún otro valor.** Hoy todo sale como CC; la tabla es para lo que llegue mañana.

**El documento, antes de consultarlo, invitarlo y buscarlo en el tablero:**

1. **Se le quitan espacios, puntos, comas y guiones** —como ya hace la carga masiva de candidatos—.
   Decidido por el usuario **como protección**: **medido, hoy no hay ningún documento con esos
   separadores**. Solo al mandarlo: **lo guardado no se toca**. Y la búsqueda en el tablero compara
   **los dos lados** limpios igual.
2. 🔴 **Si después de limpiarlo no queda ningún dígito, cuenta como sin documento**: *falta un dato del
   candidato*, nombrando el documento, sin tocar al proveedor. Decidido por el usuario. «Ningún
   dígito» es literal: ningún carácter del 0 al 9; «DEM123» **pasa**. La expresión de limpieza es la
   de la carga masiva, **como función propia del adaptador**: unificar las copias que ya existen es
   otro cambio. **Medido**: hay
   unos once candidatos con un nombre de ciudad en el campo del documento, y con PsicoAlianza se
   registraría a esa persona con «Bogotá» como CC en la cuenta del cliente.

⚠️ **Lo que esta guarda NO hace**: corregir un documento mal tecleado. Eso sigue siendo el riesgo
aceptado de la decisión B1. Solo evita mandar algo que ni siquiera tiene un número.

⚠️ **Un pasaporte con guiones pierde los guiones.** Se acepta: hoy no hay ninguno, y un pasaporte
sale como PA solo si alguien lo guarda con ese tipo.

**Medido también**: 1.389 documentos llevan letras, pero **1.368 son un lote de agosto de 2026 que
empieza por «DEM»**, sin portal de origen; ninguno con letras está en la etapa psicométrica.

### 4 · El motivo propio: sin documento

- En el enum de motivos, **`psychometric_missing_document`**, al lado de `psychometric_missing_email`,
  **sin línea de comentario**: la regla de la casa es ninguno nuevo en código, y el porqué está en la
  decisión 45 y en la traducción del portal.
- 🔴 **La captura del arranque elige el motivo por el campo del error**: correo → el de correo,
  documento → el de documento. **Mismo trato que el correo**: sin mensaje al candidato y sin escribirle
  nada más (decisión 33). Y que el día que el error gane un tercer campo, **no compile** en vez de
  caer en uno de los dos.
- Las métricas del backend **no necesitan nada**: su unificación convierte motivos viejos en nuevos, y
  este no tiene versión vieja (leído).

### 5 · El portal: el texto y el grupo propio

Hay que añadir el motivo **en los mismos sitios donde hoy está el de correo**, leídos el 2026-09-14:

| Dónde | Qué |
| --- | --- |
| La tabla de etiquetas de motivos | La entrada del motivo nuevo |
| Las traducciones del motivo, **español e inglés** | El texto: no tiene documento de identidad para enviarle la prueba psicométrica |
| El visor del embudo: **la función que agrupa** | `psychometric_missing_document` → **«Psicométrica — sin documento»** |
| El visor: **el color, la categoría, el orden y la clave de traducción** del grupo | Cuatro entradas, junto a las de «sin correo» |
| Las traducciones del grupo, **español e inglés** | Etiqueta y descripción, junto a las de «sin correo» |

**Grupo propio, decidido por el usuario**: meterlo en «sin correo» diría lo que no es, y en «no
completó», que no hizo algo que nunca se le mandó.

## Los casos, persona por persona

**Con EvaluaTest, nada cambia. Es la prueba más importante del paso.**

| Laura, con EvaluaTest | Hoy | Después |
| --- | --- | --- |
| Correo y datos completos | Invitada | **Igual** |
| Sin correo | Descartada con `psychometric_missing_email` | **Igual** |
| Sin documento, o con «Bogotá» | Invitada | **Igual**: EvaluaTest no mira el documento |
| Empresa sin conexión | Se salta la etapa | **Igual** |
| Oferta demo | No invita, mensaje con el plazo | **Igual**, con el mismo plazo |
| Oferta sin nombre de vacante | Error permanente | **Igual** |
| Falla la lectura del plazo | Ya estaba invitada y guardada: queda con identificador, **sin mensaje ni enlace, y el cron no la reinvita**. Un fallo latente (decisión 45) | Falla **antes** de invitar y cae en la captura genérica: **pasajero** — aviso de respaldo, sin identificador, y el cron reintenta a los cinco minutos. Confirmado por el ejecutor en la opinión previa, con su prueba |

**Con PsicoAlianza** (no llega a nadie hasta el paso 4, pero se prueba):

| Laura, con PsicoAlianza | Qué pasa |
| --- | --- |
| Todo en orden | Invitada con su documento limpio, su tipo traducido y el plazo |
| Sin documento | Descartada con `psychometric_missing_document`, sin mensaje |
| Documento sin ningún dígito | Igual que sin documento |
| Sin correo y sin documento | `psychometric_missing_email`: el correo se comprueba primero, como en el paso 3 |
| Documento con puntos | Se manda sin puntos; lo guardado no cambia |
| Tipo vacío / CE / PT / texto raro | CC / 4 / OTRO / OTRO |
| Plazo con decimales | Error permanente (paso 3) |

## 🔴 Dónde se para — qué NO se hace

- **No se elige proveedor** ni se toca el resolvedor: paso 4.
- **No se toca el texto de WhatsApp**, aunque sus instrucciones sean de EvaluaTest: paso 4.
- **No se guarda ni se valida la conexión de PsicoAlianza**, ni se rechazan plazos con decimales en la
  configuración de la empresa: paso 5b.
- **No se toca el adaptador de EvaluaTest.**
- **No se escribe el documento limpio en el candidato**: la limpieza es solo para PsicoAlianza.
- **No se añade el documento a la consulta de resultados.**
- **No se toca `psicoalianza-api.md`**: si algo del contrato resulta falso, se dice en el reporte.

## 🔴 Las trampas

**1. Mover el cálculo del plazo cambia el orden de una lectura a la base.** Hoy la lectura de la
empresa para el plazo va después de invitar y guardar. Al subirla, **un fallo de esa lectura cae en
la captura genérica antes de invitar: pasajero**, con el aviso de respaldo y el reintento del cron.
Confirmado en la opinión previa; va con su prueba. Las dos lecturas de la empresa que quedan seguidas
al principio —la del modo demo y la del plazo— **no se unifican**: fusionarlas tocaría la rama demo.

**2. El tipo del candidato del arranque es estrecho a propósito**, y el compilador **no avisa** si
una puerta pasa un objeto sin documento: el documento es opcional. Por eso la lectura de las cinco
puertas del alcance 1, y por eso una prueba del arranque tiene que **comprobar que el documento y el
tipo llegan a la invitación**, no solo que se llama.

**3. La limpieza del documento tiene que aplicarse a los dos lados** al buscar en el tablero. Si solo
se limpia el nuestro y PsicoAlianza guardó uno con puntos, la persona no aparece y es el error
permanente del paso 3: tres intentos y descarte.

**4. Un motivo nuevo sin su traducción no falla**: al reclutador le sale el código crudo y el visor lo
cuenta como «otros». Son **dos idiomas y cinco sitios del visor**.

**5. Moverlo todo antes de invitar no puede tocar la rama demo**, que no invita pero sí manda el
mensaje con el plazo (flujo §7, punto 1).

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **La invitación de EvaluaTest, el mensaje de WhatsApp y el descarte sin correo, idénticos** | Es lo que corre en producción |
| **El modo demo** | Enseña el producto a clientes |
| **El token del puerto, apuntando a EvaluaTest** | Paso 4 |
| **Los motivos que ya existen** | El portal y las métricas los entienden para siempre |
| **Compilación, pruebas y tipos del portal en verde** | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se incumplen:

- 🔴 **No correr el lint ni ningún formateador**, en ninguno de los dos repositorios.
- **Comentarios: ninguno nuevo en archivos de código.** En los `.spec`, la prosa del caso sí.
- **Identificadores en inglés**, también en los `.spec` y en los parámetros de callbacks. ⚠️ **No se
  traducen** los códigos de motivo, los nombres de campo de PsicoAlianza ni las etiquetas visibles.
- **La solución más pequeña que resuelve el caso.**
- **No commitear.** Todo al índice, en los dos repositorios.
- **Documentación en el mismo diff**: `flujo-actual-etapa-psicometrica.md` — §2 (lo que se pasa a la
  invitación, el plazo antes de invitar, el descarte por documento) y §8 (el grupo nuevo). La
  bitácora la actualiza el planificador. `before-deploy.md` no cambia: el motivo no se alcanza hasta el
  paso 4, y el orden backend-portal ya está en la lista.

## Pruebas

**Backend, arranque** (patrón: `psychometric-start-through-port.spec.ts`):

- 🔴 **No regresión de EvaluaTest**: con una empresa de EvaluaTest, la invitación, lo que se guarda y
  el mensaje **son los mismos que antes**, ahora con documento, tipo y plazo en la llamada.
- **La invitación recibe el documento, el tipo y el plazo del candidato**, y **el plazo es el mismo
  valor que el mensaje anuncia**.
- **Un candidato sin documento ni tipo** llega a la invitación con nulos, no con texto inventado.
- **Falta el correo** → `psychometric_missing_email`; **falta el documento** →
  `psychometric_missing_document`; los dos **sin mensaje**.
- **Una oferta demo** sigue sin invitar y su mensaje sigue llevando el plazo.
- **Un fallo al leer el plazo** toma la rama que diga la opinión previa, y no invita.

**Backend, adaptador de PsicoAlianza**:

- **Cada fila de la tabla de tipos**, incluidos vacío, minúsculas con espacios, `PT` y un texto
  inventado.
- **Un documento con puntos, espacios y guiones** se consulta, se invita y se busca **limpio**, y se
  encuentra aunque el tablero lo tenga con puntos.
- **Un documento sin dígitos** → *falta un dato* nombrando el documento, **sin tocar al proveedor**.

**Backend, EvaluaTest**: **el tipo de documento le es indiferente**, como el plazo.

**Portal**: los tipos compilan; el motivo nuevo **tiene texto en los dos idiomas** y **cae en su
grupo**, no en «otros».

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo, y borrarlo después,
limpiando la caché.

## Verificación

Una vez sobre el conjunto: en el backend, `npm run build` y `npm test`; en el portal, `npm run
typecheck`. El resultado real, en el reporte.

## Qué entregar

1. **Qué cambió** en cada repositorio y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que EvaluaTest no cambió**: invitación, mensaje y descarte sin correo.
5. **La prueba del fallo al leer el plazo**: no invita, avisa con el respaldo y queda esperando.
6. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos en código.
7. **El documento del flujo actualizado.**
8. **Un mensaje de commit por repositorio.**
