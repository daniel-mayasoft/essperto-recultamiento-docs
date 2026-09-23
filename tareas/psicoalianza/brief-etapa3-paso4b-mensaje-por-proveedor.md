# Brief · Etapa 3, paso 4b — el mensaje de WhatsApp por proveedor

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en las
decisiones 48 y 49.** Toca solo el backend.

> Escrito el 2026-09-14. **El texto de PsicoAlianza lo aprobó el usuario ese día**: no se reescribe, se
> copia de la decisión 49. Y **el de EvaluaTest no cambia una letra**: es lo que reciben hoy las
> personas en producción.

## Antes de escribir una sola línea

Leer: `arranque-del-ejecutor.md`; la bitácora, **decisiones 27, 48 y 49**; `flujo-actual-etapa-
psicometrica.md` §2, puntos 5 y 6; y en el backend, el arranque de la etapa en el orquestador —el
bloque que arma el mensaje y el correo enmascarado—, lo que devuelve la invitación de cada adaptador
en su bolsa, la validación de la conexión en el controlador de empresas, el resolvedor del 4a, y
`psychometric-start-through-port.spec.ts`.

⚠️ **El 4a tiene que estar commiteado antes de empezar.** Si no lo está, se dice y se espera.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. Toca un texto que recibe una
persona real: **una ronda, y si sale algo se para**.

## El caso

**Laura** acaba de ser invitada en PsicoAlianza. Le llega el WhatsApp de siempre: «abre el enlace y haz
clic en *Aplicar ahora*; si es tu primera vez, regístrate con tu correo», y le enseña nuestro correo
enmascarado. Pero en PsicoAlianza no hay «Aplicar ahora» ni registro —el enlace personal entra directo
a sus pruebas pendientes—, el aviso de PsicoAlianza llegó a **otro** correo, y si tiene dos pruebas y
presenta una, cree que terminó y el vencimiento la descarta.

## Alcance exacto

### 1 · El mensaje, según el proveedor que resolvió el arranque

El arranque ya sabe el proveedor resuelto (4a). El mensaje con enlace se arma según él:

| Parte | EvaluaTest | PsicoAlianza |
| --- | --- | --- |
| Apertura | El siguiente paso es realizar una prueba psicométrica. | **Igual** |
| Enlace | Puedes acceder desde el siguiente enlace: *enlace* | **Igual** (el enlace personal que devolvió la invitación) |
| Correo | También te enviamos la invitación al correo: *enmascarado* 📧 | **Igual**, con el correo de abajo |
| ¿Cómo ingresar? | **Igual** | **Igual** |
| Paso 1 | Abre el enlace y haz clic en "Aplicar ahora". | **Abre el enlace: entrarás directamente a tus pruebas pendientes.** |
| Paso 2 | Si es tu primera vez, regístrate con tu correo electrónico. | **Presenta todas las pruebas que aparezcan en la lista.** |
| Paso 3 | Busca un lugar tranquilo y sin interrupciones para realizar la prueba. | **Igual** |
| Paso 4 | Recuerda que dispones de *plazo* a partir de este momento para completarla. ⏳ | Recuerda que dispones de *plazo* a partir de este momento para **completarlas todas**. ⏳ |
| Cierre | ¡Muchos éxitos! 🚀 | **Igual** |

Los emojis, los saltos de línea y las comillas **son los de hoy**. Con EvaluaTest el mensaje resultante
es **carácter por carácter** el actual. El paso 2 de PsicoAlianza **no nombra ningún botón**: nadie lo
ha confirmado (decisión 49).

**El mensaje sin enlace** («📬 En breve recibirás un correo…») **no cambia**, para ningún proveedor.

**La rama demo** sigue con el texto de EvaluaTest (§7 del flujo). 🔴 **La condición es «el proveedor
resuelto es PsicoAlianza», nunca «no es EvaluaTest»** (opinión previa): en la demo no se resuelve
ningún proveedor, y con la forma negativa recibiría el texto de PsicoAlianza. Cualquier caso sin
proveedor resuelto se queda con el texto de hoy. Lo mismo para el correo enmascarado. El condicional va
en los tres puntos que cambian, dentro del mensaje actual, para que el texto de EvaluaTest no aparezca
en el diff.

### 2 · El correo que se enmascara

- Con **EvaluaTest**: el nuestro, como hoy.
- Con **PsicoAlianza**: **el correo de registro que devuelve la invitación** en su bolsa —el que
  PsicoAlianza ya tenía para ese documento, o el nuestro si no lo conocía (paso 3)—, que es donde llega
  su aviso. Si no viniera, el nuestro.

**Solo cambia lo que se enseña**: lo que se guarda en el candidato como correo de registro sigue con la
regla de hoy.

🔴 **El correo de la bolsa se usa solo con PsicoAlianza** (opinión previa): el adaptador de EvaluaTest
también devuelve uno, y **con el desvío de correos de pruebas activo es la dirección de QA**. Usarlo con
EvaluaTest enseñaría esa dirección en vez de la del candidato, cosa que hoy no pasa. Con su prueba.

### 3 · La validación de la conexión, por el resolvedor

La ruta de validación del controlador de empresas deja de elegir a mano entre los dos adaptadores: pide
al resolvedor **por proveedor** —el que llegue, con la misma comprobación explícita de desconocido del
5b— y valida con ese adaptador. Mismo resultado para los dos. El controlador recibe el resolvedor en
lugar del adaptador de EvaluaTest y **sigue recibiendo el de PsicoAlianza**, que usa el estado de sesión.

⚠️ **Cambian dos montajes de pruebas, no afirmaciones** (opinión previa): el spec del controlador del
5b y la prueba del modal del spec de paridad construyen el controlador a mano; reciben un resolvedor
falso que devuelve los mismos dobles de hoy.

**Lo demás no se recablea** (decisión 48, nota del 4b): el enlace de respaldo y las pruebas adicionales
solo existen con EvaluaTest y ya están condicionados; las pruebas de la vacante son de EvaluaTest; el
estado de sesión solo existe con PsicoAlianza.

### 4 · Documentos

`flujo-actual-etapa-psicometrica.md` §2: el mensaje por proveedor y el correo enmascarado, quitando el
aviso de que las instrucciones engañan con PsicoAlianza que dejó el 4a, y **una línea en el punto 5**:
el correo enmascarado de PsicoAlianza sale de la invitación, no de lo guardado.

## Los casos

| Laura | Qué recibe |
| --- | --- |
| Con EvaluaTest, con enlace | **El mensaje de hoy, carácter por carácter** |
| Con EvaluaTest, sin enlace | El aviso del correo de hoy |
| Con PsicoAlianza, documento nuevo | Mensaje de PsicoAlianza con **nuestro** correo enmascarado (es el que se usó) |
| Con PsicoAlianza, documento que ya existía con otro correo | Mensaje de PsicoAlianza con **el correo de PsicoAlianza** enmascarado |
| Con PsicoAlianza, falla el arranque | El aviso del correo de hoy |
| Demo | El mensaje de EvaluaTest de hoy |

## 🔴 Dónde se para — qué NO se hace

- **No se cambia el texto de EvaluaTest**, ni el del aviso sin enlace, ni ningún otro mensaje.
- **No se nombra ningún botón** de la pantalla de PsicoAlianza.
- **No se cambia lo que se guarda** como correo de registro.
- **No se recablean** el respaldo, las pruebas adicionales, las pruebas de la vacante ni el estado de
  sesión.
- **No se toca el riesgo residual del 4a** (conexión congelada que ya no está): aceptado como está.
- **No se toca el portal.**

## 🔴 Las trampas

**1. Un espacio o un salto de línea de más cambia el mensaje de EvaluaTest** y nadie lo ve. La prueba
compara **el texto completo** con EvaluaTest, no si contiene frases.

**2. El proveedor resuelto no existe si la resolución falló**, pero en ese caso no se llega al mensaje
con enlace: sale el aviso del correo desde la captura. Comprobarlo al leer el arranque.

**3. Una prueba del arranque afirma que el mensaje sin enlace no contiene «Abre el enlace».** El paso 1
de PsicoAlianza empieza igual; esa prueba es de la rama sin enlace y no debe verse afectada.

## Reglas de la casa

Las de `arranque-del-ejecutor.md`: sin lint ni formateador, sin comentarios nuevos en código,
identificadores en inglés —el texto del mensaje es contenido, no se traduce—, la solución más pequeña,
sin commitear y todo al índice.

## Pruebas

- 🔴 **Con EvaluaTest, el mensaje es el de hoy carácter por carácter**, comparado entero.
- **Con PsicoAlianza, el mensaje es el de la decisión 49 carácter por carácter**, comparado entero.
- **Con PsicoAlianza, el correo enmascarado es el de registro devuelto** cuando difiere del nuestro, y
  el nuestro cuando coincide o no viene.
- **La demo sigue con el texto de EvaluaTest.**
- **EvaluaTest con el desvío de correos de pruebas activo** sigue enseñando el correo del candidato, no
  el de QA.
- **El aviso sin enlace no cambia** para ninguno.
- **La validación de la conexión pide al resolvedor por proveedor**, y el proveedor desconocido se
  sigue rechazando sin validar.
- Ninguna afirmación de las pruebas existentes cambia; si una tiene que cambiar, se dice antes.

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo, y borrarlo después,
limpiando la caché.

## Verificación

Una vez sobre el conjunto: `npm run build` y `npm test` en el backend.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Confirmación de que el mensaje de EvaluaTest es idéntico**, con la prueba que lo compara entero.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos en código.
5. **El documento del flujo actualizado.**
6. **Un mensaje de commit.**
