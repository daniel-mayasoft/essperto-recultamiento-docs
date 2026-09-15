# Brief · Etapa 3, paso 6.2a — la oferta conserva su conexión al guardar, y la IA no copia vacantes ajenas

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 51.** Toca **solo el backend**. El portal es el 6.2b.

> Escrito el 2026-09-14 leyendo el guardado de la configuración de la prueba en el servicio de ofertas,
> el resolvedor, las dos llamadas del agente de WhatsApp a ese guardado, el servicio de la IA que redacta
> ofertas (cómo encuentra la oferta que copia, cómo arma el borrador base y cómo sanea el borrador) y la
> prueba de paridad que cubre el guardado.
>
> **Incorpora la opinión previa del ejecutor del 2026-09-15**, verificada contra el código por el
> planificador: el mensaje de la congelada ausente cuando la empresa no tiene conexiones, la prueba de la
> trampa 1 arreglada por su dato y no por su afirmación, la lectura de conexiones dentro del modo copia,
> la explicación corregida del saneado, la prueba de *desde cero* sustituida por la revisión, y el caso
> espejo que queda en local hasta el 6.2b. Marcado como «opinión previa» en su sitio.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md`.
2. `../CLAUDE.md` y `../../esscoti-backend/CLAUDE.md`.
3. `integrate-psicoalianza.md` — decisiones **5, 15, 40, 41, 48 y 51**, y en la tabla de la etapa 3 la
   fila del **4a** con su riesgo residual aceptado.
4. `flujo-actual-etapa-psicometrica.md` — **§1 punto 3**. Este paso lo cambia.
5. En el backend:
   - el servicio de ofertas: **el guardado de la configuración de la prueba** entero;
   - el resolvedor: **resolver por empresa con una conexión opcional**;
   - el agente de WhatsApp: las dos llamadas a ese guardado, al crear una oferta desde un borrador y al
     editar la prueba de una oferta. **Solo lectura**: no se tocan, y el arreglo las cubre;
   - el servicio de la IA que redacta ofertas: dónde se buscan las ofertas parecidas y se leen enteras de
     la base, la elección de la oferta a copiar, **la función que convierte la oferta copiada en el
     borrador base**, el modo copia, y **el saneado del borrador** (en especial el bloque que siempre deja
     una vacante de EvaluaTest cuando la empresa tiene EvaluaTest);
   - **`evaluatest-psychometric-parity.spec.ts`**, los dos bloques del guardado, y las pruebas de
     `src/offers/ai/` para elegir el patrón de la prueba nueva de la IA.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. **Toca el guardado que corre
en producción con EvaluaTest**: tratamiento completo.

## El caso

La empresa de **Laura** tiene EvaluaTest y PsicoAlianza. Su oferta de *Operario de producción* está
congelada en PsicoAlianza con la vacante 1135. Laura le pide al agente de WhatsApp que suba el puntaje
mínimo a 70. Hoy, el guardado no recibe conexión, resuelve por la empresa, elige EvaluaTest y comprueba la
vacante 1135 **en EvaluaTest**. Lo normal es que falle. Pero si en EvaluaTest existe una vacante 1135, **la
oferta queda en EvaluaTest apuntando a otro cargo, sin error**. Lo mismo pasa hoy desde el modal de la
ficha de la oferta del portal.

Después de este paso, la oferta **conserva PsicoAlianza** y la vacante se comprueba donde está.

## Piezas compartidas

| Pieza | Qué se le hace | Qué pasa si sale mal |
| --- | --- | --- |
| **El guardado de la configuración de la prueba** | Sin conexión en el cuerpo, usa la congelada en la oferta antes que la regla de la empresa | Lo usan el portal al crear y al editar la prueba, y el agente de WhatsApp al crear y al editar. Si se equivoca de conexión, la oferta invita al proveedor equivocado |
| **La IA, en modo copia** | Solo toma la vacante de la oferta copiada si esa oferta es de EvaluaTest | Es lo que el portal y el agente de WhatsApp usan para redactar ofertas |

## Alcance exacto

### 1 · El guardado conserva la conexión congelada

Solo cambia **qué conexión se usa cuando se activa la prueba con una vacante**, que es el único momento en
que hoy se resuelve. El orden pasa a ser:

| Qué hay | Con qué conexión se resuelve |
| --- | --- |
| **El cuerpo trae conexión** | Esa. Si no es de la empresa, el rechazo de hoy, *la conexión de pruebas psicométricas indicada no es de tu empresa*. **Sin cambios** |
| **El cuerpo no trae, y la oferta tiene una congelada que sigue en la empresa** | **La congelada**. Hoy: la regla de la empresa |
| **El cuerpo no trae, la congelada ya no está, y la empresa tiene alguna conexión** | 🔴 **Rechazo con mensaje propio**: *La conexión de pruebas psicométricas de esta oferta ya no está en tu empresa. Elige una conexión y vuelve a guardar.* Hoy: la regla de la empresa, en silencio |
| **El cuerpo no trae, la congelada ya no está, y la empresa no tiene ninguna conexión** | **El rechazo de hoy**, *conéctalo en Mi compañía antes de activar la prueba*, que es verdad: no hay conexión que elegir (opinión previa) |
| **Ni el cuerpo ni la oferta traen conexión** (ofertas de antes de la migración, o creadas desde administración) | La regla de la empresa: una → esa; dos → EvaluaTest; ninguna → *conéctalo en Mi compañía*. **Sin cambios** |

- **Desactivar la prueba no cambia**: sigue sin exigir conexión y conserva la congelada.
- 🔴 **El rechazo de la congelada ausente va antes de comprobar la vacante** y **no toca al proveedor**.
  Con conexiones en la empresa, no puede caer en el mensaje de *tu empresa no tiene un proveedor
  conectado*, que mentiría. Sin ninguna, es ese mensaje, y el nuevo sería el que mintiera. Hoy nadie ve el texto: el modal del portal enseña su error genérico,
  y el agente de WhatsApp el suyo. Existe para el registro y para el 6.2b.
- **Nada más del guardado cambia**: la comprobación de la vacante, sus mensajes por proveedor, el código
  de evaluación, cómo se conservan el nombre, el código de perfil, el puntaje, las pruebas adicionales y la
  bolsa del proveedor. Que el código de perfil y las pruebas adicionales viejas se conserven al pasar a
  PsicoAlianza lo arregla el portal del 6.2b mandándolos vacíos (decisión 51), no este paso.

**En producción no cambia nada, y así se razona:** la migración de la decisión 41 congeló en cada oferta
activa **la única conexión de EvaluaTest de su empresa**, y con una sola conexión la regla elige esa
misma. Resolver por la congelada da la misma conexión. La única diferencia está en una oferta cuya
conexión se borró y se recreó a mano: hoy re-congela en silencio y después de este paso se rechaza. Es el
riesgo del 4a, que hoy no se alcanza. **Esto sale de leer la migración y la regla, no de medir la base**:
si quieres confirmarlo, dilo en la opinión previa y se pide la consulta al usuario.

### 2 · La IA en modo copia solo toma la vacante de una oferta de EvaluaTest

La función que convierte la oferta copiada en el borrador base toma hoy la vacante de su configuración de
la prueba, sea del proveedor que sea. Pasa a tomarla **solo si esa oferta es de EvaluaTest**:

| La conexión congelada en la oferta copiada | ¿Se toma la vacante? |
| --- | --- |
| Vacía (oferta de antes de la migración) | **Sí**: vacío es EvaluaTest, la misma regla que el proveedor del candidato (15) |
| Una conexión de EvaluaTest de la empresa | **Sí** |
| Una conexión de PsicoAlianza de la empresa | **No**: la vacante base queda vacía |
| Una conexión que ya no está en la empresa | **No**: no se sabe de qué proveedor era (48) |
| No se pudo leer la lista de conexiones | **No**, con un aviso en el registro, **sin romper el borrador** |

- **Dónde** (opinión previa): las conexiones se leen **dentro de la función del modo copia**, que decide
  ahí si la oferta copiada es de EvaluaTest y vacía la vacante base si no lo es. La función que convierte
  la oferta en borrador base **no se vuelve asíncrona**. La del modo copia no recibe hoy la empresa: se le
  pasa (es privada y tiene una sola llamada). Así el modo desde cero **no puede llegar a esa lectura, por
  estructura**, y no lee nada nuevo.
- ⚠️ **Lo que pasa después, y es lo esperado** (explicación corregida en la opinión previa): en modo copia
  **el modelo no recibe la lista de vacantes de EvaluaTest**, solo la oferta base y lo que escribió el
  reclutador. Con la vacante base vacía, el modelo devuelve nulo o un número que no casa, y el saneado
  pone **la primera de la lista de vacantes de EvaluaTest parecidas al cargo**: hasta ocho del índice de
  vacantes, o, si ese índice no encuentra ninguna, hasta cuarenta filtradas de la lista completa. Así,
  copiar una oferta de PsicoAlianza da la vacante de EvaluaTest más parecida, no el número de PsicoAlianza.
  Vacante y proveedor quedan coherentes, y el reclutador podrá cambiar de conexión en el 6.2b. **El saneado
  no se toca.**
- **Hoy el riesgo es más estrecho que el caso de arriba, pero existe**: el número de PsicoAlianza solo
  acaba sugerido si coincide con una de esas vacantes parecidas. Y lo mismo vale hoy para una oferta de
  EvaluaTest copiada, cuya vacante solo se conserva si está en esa lista: **eso es previo al paso y queda
  fuera**.

## Los casos, persona por persona

**El guardado. Con EvaluaTest y una conexión, nada cambia. Cada fila con su prueba:**

| Laura | Hoy | Después |
| --- | --- | --- |
| Oferta congelada en EvaluaTest, única conexión; cambia el puntaje sin mandar conexión | EvaluaTest | **Igual** |
| Oferta congelada en PsicoAlianza, empresa con las dos; cambia el puntaje sin mandar conexión | **EvaluaTest**, comprobando la vacante allí | **PsicoAlianza**, comprobando allí |
| Oferta congelada en EvaluaTest, empresa con las dos; sin mandar conexión | EvaluaTest | **Igual** |
| Manda la conexión de PsicoAlianza en una oferta congelada en EvaluaTest | PsicoAlianza | **Igual** (el 6.2b lo usa para cambiar de proveedor) |
| Manda una conexión que no es de la empresa | Rechazo | **Igual** |
| La congelada ya no está, la empresa tiene alguna conexión; sin mandar conexión | Re-congela por la regla, en silencio | **Rechazo con el mensaje nuevo, sin tocar al proveedor** |
| La congelada ya no está y la empresa no tiene ninguna conexión; sin mandar conexión | *Conéctalo en Mi compañía* | **Igual**, sin tocar al proveedor |
| La congelada ya no está; manda una conexión de la empresa | Esa | **Igual** |
| Oferta sin congelada, empresa con las dos | EvaluaTest | **Igual** |
| Oferta sin congelada, empresa sin conexiones | *Conéctalo en Mi compañía* | **Igual** |
| Desactiva la prueba | Conserva la congelada | **Igual** |

**La IA en modo copia:**

| La oferta copiada | Hoy | Después |
| --- | --- | --- |
| De EvaluaTest | Toma su vacante | **Igual** |
| Sin conexión congelada | Toma su vacante | **Igual** |
| De PsicoAlianza | Toma su número; si existe en EvaluaTest, sugiere ese cargo | **No lo toma**; el saneado sugiere la de EvaluaTest más parecida |
| Con una conexión que ya no está | Toma su número | **No lo toma** |
| Borrador desde cero | Vacante de EvaluaTest más parecida | **Igual**, sin leer conexiones |

## 🔴 Dónde se para — qué NO se hace

- **No se toca el portal**: es el 6.2b.
- **No se toca el agente de WhatsApp**: el arreglo del guardado lo cubre.
- **No se toca el resolvedor**: el guardado le pasa la conexión que corresponde.
- **No se toca el saneado del borrador de la IA**, ni su modo desde cero, ni sus textos para el modelo.
- **No se hace que la IA o el agente sugieran vacantes de PsicoAlianza** (decisión 51, fuera a sabiendas).
- **No se tocan las rutas del selector de vacantes, del estado de la vacante ni de las pruebas
  adicionales.**
- **No se limpian** el código de perfil ni las pruebas adicionales al guardar: lo hace el portal del 6.2b.

## 🔴 Las trampas

**1. Una prueba existente tiene mal un dato.** *Al cambiar el puntaje conserva la conexión y la bolsa del
proveedor* congela una conexión que **no está en la empresa de la prueba**, guarda sin conexión y espera
**la de la empresa**. Con este paso ese dato la convierte en el caso *la congelada ya no está*, y se
rechazaría. **Se arregla el dato, no la afirmación** (opinión previa): la oferta congela la conexión que
sí está en la empresa. Su título y sus tres afirmaciones quedan intactos. **Ninguna afirmación existente
cambia**, y el reporte dice qué línea de datos cambió. El precio, aceptado: con una sola conexión esa
prueba no distingue el antes del después; eso lo distinguen las nuevas de *congelada en PsicoAlianza con
las dos* y de *congelada ausente*.

**2. El mensaje de *sin proveedor conectado* es tentador.** El resolvedor ya lanza *sin conexión* cuando
la congelada no está. Dejar que ese error caiga en el tratamiento de hoy daría *tu empresa no tiene un
proveedor de pruebas psicométricas conectado*, falso si la empresa tiene conexiones. Por eso se comprueba
antes, contra la lista de conexiones que el guardado ya lee cuando el cuerpo trae conexión.

**3. No leer la empresa dos veces sin necesidad.** El guardado ya lee la lista de conexiones cuando el
cuerpo trae conexión, y el resolvedor la vuelve a leer. Con la congelada pasa lo mismo. **Es aceptable**,
como en el 4a: no se optimiza en este paso.

**4. La IA copia ofertas leídas enteras de la base, no del índice.** El índice solo sirve para encontrar
las ofertas parecidas. Con sus identificadores, el servicio lee los documentos completos de la base, con
la configuración de la prueba y la conexión congelada. Buscar la configuración en el índice lleva a pensar
que no hay nada que arreglar.

**5. La lista de conexiones de la IA puede fallar.** Un borrador no puede romperse porque no se pudo leer
la empresa: se sigue sin vacante base y se avisa en el registro. Sin empresa no se llega: el borrador
rechaza antes (opinión previa), así que el fallo solo puede venir de la base.

**6. El caso espejo, que queda en local hasta el 6.2b. Anotado, no se arregla aquí** (opinión previa):
una oferta congelada en PsicoAlianza que alguien edita desde la ficha y a la que le elige otra vacante.
El selector lista las de EvaluaTest, porque el portal todavía no manda conexión, y el guardado comprobará
ese número **en PsicoAlianza**. Solo se alcanza en local: en producción no hay ofertas en PsicoAlianza y
la rama se despliega entera. Lo cierra el 6.2b, que manda la conexión al listar y al guardar.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **El guardado con una sola conexión de EvaluaTest** | Es todo lo que corre en producción |
| **Los mensajes de la vacante no usable y de no verificada**, por proveedor | 4a |
| **Todas las demás afirmaciones de la prueba de paridad** | Son la etapa en producción |
| **El borrador desde cero de la IA** | |
| **Compilación y pruebas en verde** | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`: sin lint ni formateador, **sin comentarios nuevos en código**,
identificadores en inglés —también los parámetros de las funciones flecha—, el mensaje nuevo en español
y los identificadores de proveedor como contrato. La solución más pequeña, sin commitear y todo al índice.
Respetar los finales de línea de cada archivo.

**Documentación en el mismo diff:** `flujo-actual-etapa-psicometrica.md`, **§1 punto 3**: con qué conexión
se congela al guardar (la del cuerpo, la congelada, la regla) y el rechazo de la congelada ausente. La
IA no aparece en el flujo: no se añade. `before-deploy.md` no cambia.

## Pruebas

**Guardado** (en la prueba de paridad, con la empresa y el resolvedor reales sobre el modelo falso, como
las de hoy):
- Congelada en PsicoAlianza, empresa con las dos, sin conexión en el cuerpo → **conserva PsicoAlianza** y
  comprueba la vacante **solo** por su adaptador.
- Congelada en EvaluaTest, empresa con las dos, sin conexión en el cuerpo → EvaluaTest.
- 🔴 Congelada ausente con alguna conexión en la empresa, sin conexión en el cuerpo → **rechazo con el
  mensaje nuevo** y **ningún adaptador llamado**.
- Congelada ausente y empresa sin conexiones, sin conexión en el cuerpo → **el rechazo de hoy**, *conéctalo
  en Mi compañía*, y ningún adaptador llamado.
- Congelada ausente, con una conexión de la empresa en el cuerpo → esa.
- La prueba de la trampa 1, con su dato arreglado y sus afirmaciones intactas.
- Las que ya existen de *sin conexión y con las dos → EvaluaTest* (oferta sin congelada) y de *conexión
  ajena → rechazo* **siguen pasando sin cambios**.

**IA en modo copia** (en el patrón de las pruebas de `src/offers/ai/` que llame a funciones del servicio
sin red; si ninguna sirve, dilo en la opinión previa):
- Oferta copiada de EvaluaTest, sin congelada, de PsicoAlianza y con conexión ausente: la vacante base es la
  de la tabla del alcance 2.
- Fallo al leer las conexiones → vacante base vacía y sin excepción.
- **Sin prueba de *desde cero no lee conexiones*** (opinión previa): montar el borrador entero sin red pide
  unas siete piezas falsas. Con la lectura dentro de la función del modo copia, lo garantiza la
  estructura, y **el planificador lo comprueba al revisar el diff** leyendo que la única llamada a esa
  función está en la rama de copia.

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo en la de *conserva PsicoAlianza*
y en la de *oferta de PsicoAlianza no toma la vacante*. Borrarlo después y limpiar la caché de Jest.

## Verificación

Una vez sobre el conjunto: `npm run build` y `npm test` en el backend, con la caché de Jest limpia.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **La línea de datos que cambió** en la prueba de la trampa 1, y confirmación de que **ninguna afirmación
   existente** cambió ni se quitó.
5. **Confirmación de que el guardado con una sola conexión de EvaluaTest da lo mismo que hoy**, y de que
   el agente de WhatsApp y el portal no se tocaron.
6. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos en código, **y la lista
   de los identificadores nuevos**, parámetros de funciones flecha incluidos.
7. **El documento del flujo actualizado.**
8. **Un mensaje de commit.**
