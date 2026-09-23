# Brief · Etapa 3, paso 6.2b — la oferta elige su conexión y habla con su proveedor

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 51** y en las que ella nombra. Toca **solo el portal**. El backend ya está listo desde el 6.2a.

> Escrito el 2026-09-15 leyendo, en el portal, el paso de la prueba del diálogo de crear oferta, la
> sección y el modal de la prueba en la ficha de la oferta, el aviso de estado de la vacante, la
> búsqueda de la conexión del aviso de proveedor, la creación y la copia de ofertas en el listado, el
> tipo de la configuración de la prueba que viene de la IA y el tipo de la oferta; y en el backend,
> las rutas del selector de vacantes, de las pruebas adicionales, del estado de la vacante y del
> guardado de la configuración, los motivos de vacante no usable del adaptador de PsicoAlianza y la
> ficha de la oferta.
>
> **Incorpora la opinión previa del ejecutor del 2026-09-15**, verificada contra el código por el
> planificador: la contradicción de la copia con la conexión ausente, la regla general de cuándo se
> precarga la vacante, la ficha que no se podía reparar, el tipo de la configuración con vacante y
> conexión opcionales resuelto en el listado, el código de perfil como texto vacío, dónde van los textos
> y un caso a mano más. Marcado como «opinión previa» en su sitio.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md`. 🔴 El portal no tiene pruebas automáticas: **este paso se verifica con
   casos a mano, que se añaden a `pruebas-a-mano.md`** (abajo).
2. `../CLAUDE.md`.
3. `integrate-psicoalianza.md` — decisiones **3, 4, 5, 10, 40, 41, 48 y 51** (con sus textos
   aprobados), y en la tabla de la etapa 3 las filas del **6.2a** y del **6.2b**.
4. `flujo-actual-etapa-psicometrica.md` — **§1 puntos 2, 3 y 4** y **§8**. Este paso los cambia.
5. `brief-etapa3-paso6-2a-conexion-de-la-oferta.md` — su **trampa 6**, el caso espejo que este paso
   cierra.
6. En el portal:
   - el componente del aviso de proveedor, con sus dos funciones que buscan la conexión de EvaluaTest;
   - el componente del aviso de estado de la vacante, con su gancho de consulta;
   - el diálogo de crear oferta: el paso 2 (la prueba), su estado, la precarga desde la IA o la copia, la
     validación al pasar de paso y el armado de la configuración al terminar;
   - la ficha de la oferta: el estado de la prueba, la carga de la oferta, la sección *Prueba
     psicométrica* y el modal de configurarla;
   - el listado de ofertas: el envío de la configuración al crear y **la copia de una oferta**;
   - el tipo de la configuración de la IA y el tipo `Offer`;
   - los textos `offers.evaluatestStatus`, `offers.psychometricProvider` y
     `offerDetail.psychologicalExam`, en español e inglés.
7. En el backend, **solo lectura**: las cuatro rutas de la prueba en el controlador de ofertas y el
   guardado de la configuración en el servicio (qué conserva si no llega), y la comprobación de vacante
   del adaptador de PsicoAlianza (sus motivos).

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. **Paso visible, y es el que
activa la prueba en las ofertas de producción**: tratamiento completo.

## El caso

La empresa de **Laura** tiene EvaluaTest y PsicoAlianza conectados desde el 6.1. Hoy, al crear una
oferta, el portal le enseña los controles de la prueba **solo porque tiene EvaluaTest**. Le lista las
vacantes de EvaluaTest, le ofrece sus pruebas adicionales y guarda sin decir conexión, así que la oferta
acaba en EvaluaTest. Si su empresa tuviera **solo** PsicoAlianza, vería *tu empresa no tiene un proveedor
conectado*, que es falso.

Después de este paso, Laura **elige la conexión** de la oferta, ve las vacantes de ese proveedor,
recibe avisos que hablan de ese proveedor, y la oferta se guarda **con esa conexión**.

## Piezas compartidas con EvaluaTest

| Pieza | Qué se le hace | Qué pasa si sale mal |
| --- | --- | --- |
| **La señal de «hay conexión»** | Mira cualquier conexión configurada, no solo EvaluaTest | Decide si la ficha y el diálogo enseñan la prueba. Si falla, una empresa pierde los controles o ve un aviso falso |
| **El paso de la prueba al crear y el modal de la ficha** | Selector de conexión, vacantes y avisos por proveedor | Es como se activa la prueba en todas las ofertas de producción |
| **El guardado de la configuración** | Manda siempre la conexión | Sin ella, el backend usa la congelada o la regla (6.2a) |
| **La copia de una oferta** | Copia también su conexión | Sin ella, una copia de PsicoAlianza acabaría en EvaluaTest |

## Las conexiones que cuentan

En todo este paso, **«las conexiones de la empresa» son las configuradas**: las que la lista marca como
`configured`. Una entrada incompleta no se ofrece ni cuenta, igual que en *Mi compañía* (6.1).

## Alcance exacto

### 1 · La señal de «hay conexión»

- **La empresa tiene prueba** si tiene **al menos una conexión configurada**, sea del proveedor que sea.
  Sustituye a la señal de hoy, que solo mira EvaluaTest, **en el diálogo de crear y en la ficha**.
- **Las dos funciones del componente del aviso que buscan EvaluaTest no se tocan**. Se añade lo más
  pequeño que responda «hay alguna configurada» y «las configuradas», y quienes hoy usan la de
  EvaluaTest pasan a esto. Si alguna de las dos queda sin uso, **se quita en este diff**: no se deja
  una limpieza pendiente.
- **El aviso de oferta que perdió el proveedor**, en la ficha, con la prueba activa (opinión previa):

  | Lo que pasa | Qué ve el reclutador |
  | --- | --- |
  | La empresa **no tiene ninguna** conexión configurada | El aviso de hoy, *la prueba está activada, pero tu empresa ya no tiene un proveedor conectado*, **en lugar de** los controles, como hoy |
  | La oferta tiene una conexión congelada que **no está entre las configuradas**, y la empresa **tiene alguna** | ⚠️ **Un aviso nuevo junto a los controles, no en su lugar**, y el modal de configurar abre **sin conexión elegida si hay dos, con esa si hay una, y siempre sin vacante** (opinión previa), para elegir vacante, cambiar de conexión o desactivar la prueba. Texto **aprobado por el usuario el 2026-09-15** (decisión 51): *«Esta oferta tiene la prueba psicométrica activada, pero la conexión que usaba ya no está en tu empresa. La etapa se está omitiendo: configura otra conexión o desactiva la prueba.»* |
  | Cualquier otro caso | Los controles, sin aviso |

  🔴 **Sin esto la oferta queda atascada**: el aviso de hoy sustituye al interruptor y a *Configurar*, y
  con ellos al modal, que es donde está *Desactivar*. Y el 6.2a rechaza guardar sin conexión cuando la
  congelada ya no está. **Que la etapa se omite es verdad**: el arranque trata la congelada ausente como
  *sin conexión* (flujo, §2). Sin prueba activa y sin ninguna configurada, el aviso informativo de hoy.
  **Los demás textos de los avisos no cambian.**

### 2 · La conexión de la oferta: el selector

| Conexiones configuradas | Qué ve el reclutador | Qué conexión se usa |
| --- | --- | --- |
| **Ninguna** | El aviso de hoy, sin controles | — |
| **Una** | **Sin selector**, igual que hoy (decisión 3) | Esa, **y se manda siempre** |
| **Dos** | **Un selector** encima de la vacante, con el nombre y el proveedor de cada conexión | La elegida |

**Qué viene elegido al abrir** (decisión 51). Con una sola configurada no hay selector y la conexión es
esa, pero **la regla de la vacante de abajo aplica igual**:

| Cómo se abre | Elegida al abrir |
| --- | --- |
| **Crear oferta desde cero** | **Ninguna.** La vacante, el puntaje y las pruebas adicionales no se enseñan hasta elegir |
| **Crear desde un borrador de la IA** con prueba sugerida | **La conexión de EvaluaTest**, con la vacante sugerida: la IA solo sugiere vacantes de EvaluaTest |
| **Copiar una oferta** con conexión congelada **configurada** | **Su conexión congelada**, con su vacante |
| **Copiar una oferta** con conexión congelada que **ya no está** | **Ninguna** (con una sola configurada, esa) y **sin vacante** (opinión previa) |
| **Copiar una oferta** sin conexión congelada (de antes de la migración o creada desde administración) | **La de EvaluaTest** con su vacante, si EvaluaTest está configurada: vacío es EvaluaTest (15). Si no lo está: ninguna (con una sola, esa) y **sin vacante** |
| **La ficha de una oferta** con conexión congelada o vacante guardada, **esté la prueba activa o desactivada** | **La misma regla que la copia** (opinión previa): desactivar conserva la vacante y la conexión, y al volver a *Configurar* aparecen como hoy, tenga la empresa una conexión o dos |
| **La ficha de una oferta que nunca tuvo prueba** | Ninguna |

- 🔴 **Regla general de la vacante** (opinión previa): **la vacante guardada solo se precarga si la
  conexión elegida al abrir es la de la oferta**, es decir, la congelada, o EvaluaTest cuando la oferta no
  tiene congelada. En cualquier otro caso se abre **sin vacante**, porque su número es de otro proveedor o
  de uno que ya no se sabe cuál es (48). **El puntaje sí se conserva.** Caso: una oferta de antes de la
  migración, en una empresa que ya solo tiene PsicoAlianza, abriría con PsicoAlianza y el número de
  EvaluaTest; el aviso lo consultaría y el guardado lo comprobaría en PsicoAlianza.
- **Crear, con la prueba activada y dos conexiones, no deja pasar de paso sin elegir conexión**, con un
  mensaje en la línea de los de hoy: *Selecciona el proveedor de la prueba psicométrica para continuar, o
  desactiva este paso.*
- 🔴 **Cambiar de conexión borra la vacante elegida, sus pruebas adicionales y su aviso**, y **vuelve a
  pedir la lista de vacantes** de la nueva (decisión 51). Los números de vacante no se comparten entre
  proveedores.
- **Una oferta activa puede cambiar de conexión** desde el modal de la ficha (decisión 51). No hay aviso
  especial: quien ya está en la prueba se sigue consultando donde fue invitado (48).

### 3 · Hablar con el proveedor de la conexión elegida

| Qué | Con EvaluaTest | Con PsicoAlianza |
| --- | --- | --- |
| **Lista de vacantes** | La ruta de hoy, **con la conexión elegida en la consulta** | La misma |
| **Estado de la vacante** (el aviso) | Con la conexión elegida en la consulta; textos de hoy | Con la conexión; **textos de PsicoAlianza** (alcance 4) |
| **Pruebas adicionales** | Como hoy | 🔴 **No se piden ni se enseñan** (decisión 4) |
| **Guardar** (al crear y en el modal) | Manda la conexión, el código de perfil y las pruebas adicionales elegidas | Manda la conexión, **el código de perfil como texto vacío, no nulo,** y **la lista de pruebas adicionales vacía** |

- **La conexión se manda siempre** que se guarda con la prueba activa, **también con una sola conexión**.
  Desactivar la prueba sigue mandando solo que está desactivada.
- **La ficha solo pide las pruebas adicionales al cargar si la conexión congelada es de EvaluaTest**, o
  si no hay congelada y la empresa tiene EvaluaTest configurado.
- Una vacante de PsicoAlianza no trae código ni ruta del árbol: la etiqueta de la opción es solo su
  nombre. La forma de mostrarla hoy ya lo aguanta.
- **Cierra el caso espejo** de la trampa 6 del 6.2a: el modal de la ficha de una oferta de PsicoAlianza
  lista y comprueba vacantes de PsicoAlianza.

### 4 · El aviso de estado de la vacante, por proveedor

El componente recibe la conexión elegida (para la consulta) y su proveedor (para los textos). **Con
EvaluaTest, exactamente lo de hoy.** Con PsicoAlianza, los textos aprobados de la decisión 51:

| Lo que responde la ruta | Texto |
| --- | --- |
| Mientras llega | «Verificando la vacante en PsicoAlianza…» |
| No usable, completada | «Esta vacante está completada en PsicoAlianza y no sirve para invitar candidatos. Elige otra vacante.» |
| No usable, suspendida | «Esta vacante está suspendida en PsicoAlianza y no sirve para invitar candidatos. Elige otra vacante o reactívala en PsicoAlianza.» |
| No usable, archivada | «Esta vacante está archivada en PsicoAlianza. Elige otra vacante.» |
| No usable, sin pruebas | «Esta vacante no tiene pruebas configuradas en PsicoAlianza: el candidato abriría el enlace sin nada que responder. Elige otra vacante o configúrale pruebas en PsicoAlianza.» |
| Sin determinar, no encontrada | «No encontramos esta vacante en la cuenta de PsicoAlianza conectada. Elige otra vacante.» |
| Sin determinar por cualquier otro motivo, o la petición falla | «No se pudo verificar si esta vacante sigue activa en PsicoAlianza. Puede que esté bien; vuelve a intentarlo en un momento.» |
| Usable | Nada, como hoy |

Los motivos, leídos del adaptador de PsicoAlianza el 2026-09-15: `process_completed`,
`process_suspended`, `process_archived` y `no_tests` con estado no usable; `not_found`,
`undetermined_status` y `lookup_failed` sin determinar. **Un motivo que no esté en la tabla usa el texto
genérico de su estado**: aparecerán más (A11).

**Dónde van los textos** (opinión previa): los del aviso de la vacante, **en claves de idioma**, en español
tal como están y en inglés con la traducción del ejecutor, como el aviso de hoy. **El selector y el mensaje
de *selecciona el proveedor*, escritos directamente en español**, como sus vecinos del paso 2 del diálogo,
que hoy no usan claves. El aviso nuevo de la conexión que ya no está (alcance 1), en claves, junto a los
avisos de proveedor.

- 🔴 **La consulta tiene que volver a lanzarse si cambia la conexión**, no solo si cambia la vacante. Si
  no, al cambiar de conexión con la misma vacante numérica se vería el estado del proveedor anterior.
  La guarda de hoy contra respuestas viejas se conserva.

### 5 · Crear y copiar desde el listado

- **La configuración de la prueba que viaja entre el listado y el diálogo se amplía de forma aditiva**
  (opinión previa): **vacante y conexión, opcionales**. Hoy la vacante es un número obligatorio, la
  precarga solo activa la prueba si la trae, y el tipo lo comparte la IA: *copia con puntaje y sin vacante*
  no cabría.
- 🔴 **La conexión se decide en el listado, no en el diálogo** (opinión previa). El listado tiene la
  empresa, y es por donde entran la copia y el borrador de la IA. Aplica las reglas del alcance 2 y le
  pasa al diálogo **la conexión ya decidida o ninguna**, y la vacante solo si corresponde. El diálogo no
  interpreta la ausencia del campo: si tuviera que distinguir *sin campo* (regla de EvaluaTest), *nulo*
  (ninguna) y *con valor* (esa), repetiría la trampa de *ausente no es nulo* del correo de pruebas (32-b).
- El listado manda la conexión al guardar la configuración de la oferta recién creada.
- **El tipo de la oferta del portal gana la conexión congelada** de su configuración de la prueba. La
  ficha de la oferta se sirve leída entera de la base, así que ya llega: confirmado leyendo el backend
  por el planificador y por el ejecutor. Verlo en vivo queda dentro del caso a mano 4.
- **El borrador de la IA no cambia**: llega sin conexión, y el listado elige EvaluaTest (alcance 2).

## Los casos, persona por persona

**Con una sola conexión de EvaluaTest, nada cambia a la vista. Todo lo de producción está aquí:**

| Laura, solo con EvaluaTest | Hoy | Después |
| --- | --- | --- |
| Crea una oferta con prueba | Sin selector, vacantes y pruebas de EvaluaTest | **Igual**, y además manda la conexión |
| Edita la prueba desde la ficha | Igual | **Igual**, y manda la conexión |
| Copia una oferta con prueba | Copia vacante, puntaje y pruebas | **Igual**, más la conexión |
| Crea desde la IA | Vacante sugerida | **Igual** |
| La vacante se desactivó en EvaluaTest | Aviso de EvaluaTest | **Igual** |
| Oferta de antes de la migración, sin conexión congelada | Controles normales | **Igual** |

**Con PsicoAlianza, o con las dos:**

| Laura | Qué pasa |
| --- | --- |
| Solo PsicoAlianza, crea una oferta | Sin selector; vacantes de PsicoAlianza; **sin pruebas adicionales**; se guarda con PsicoAlianza, código y pruebas vacíos |
| Solo PsicoAlianza, abre una oferta | Controles de la prueba, **no** *tu empresa no tiene proveedor* |
| Las dos, crea desde cero y activa la prueba | Selector sin elegir; no ve vacantes hasta elegir; no pasa de paso sin elegir |
| Las dos, crea desde la IA | EvaluaTest elegida con la vacante sugerida |
| Las dos, elige EvaluaTest, luego cambia a PsicoAlianza | Se borran la vacante y las pruebas; se listan vacantes de PsicoAlianza |
| Las dos, abre una oferta de PsicoAlianza y cambia el puntaje | PsicoAlianza elegida; se guarda con PsicoAlianza |
| Las dos, pasa una oferta activa de EvaluaTest a PsicoAlianza | Elige PsicoAlianza y otra vacante; se guarda; los que estaban en prueba siguen en EvaluaTest |
| Copia una oferta de PsicoAlianza | La copia viene con PsicoAlianza y su vacante |
| Copia una oferta cuya conexión ya no está | La copia viene sin conexión (con una sola configurada, esa) y sin vacante |
| Solo PsicoAlianza, abre una oferta de antes de la migración, sin conexión congelada | PsicoAlianza, **sin vacante** y con su puntaje |
| Vacante de PsicoAlianza completada, suspendida, archivada, sin pruebas o no encontrada | Su texto de la tabla del alcance 4 |
| Oferta activa congelada en una conexión que ya no está, **empresa sin ninguna conexión** | El aviso de hoy, en lugar de los controles |
| Oferta activa congelada en una conexión que ya no está, **empresa con PsicoAlianza** | El aviso nuevo **junto a los controles**; *Configurar* abre con PsicoAlianza, que es la única, y sin vacante (con dos conexiones, sin ninguna elegida); elige una vacante y guarda, o desactiva |
| Desactiva la prueba de una oferta de PsicoAlianza y la reactiva una semana después | *Configurar* abre con PsicoAlianza y la vacante de antes, con una conexión o con dos, como hoy |

## 🔴 Dónde se para — qué NO se hace

- **Nada del backend.** Si algo del portal no se puede hacer sin tocarlo, se para y se dice.
- **No se tocan *Mi compañía* ni la etiqueta de sesión** (6.1).
- **No se tocan la IA ni el agente de WhatsApp**: siguen sugiriendo solo EvaluaTest (decisión 51).
- **No se renombran** el componente del aviso de la vacante, sus textos existentes, las rutas ni la
  configuración de la oferta, aunque se llamen como EvaluaTest.
- **No cambian los textos de EvaluaTest** del aviso de la vacante ni los de los avisos de proveedor que ya
  existen. El único texto nuevo de esos avisos es el de la conexión que ya no está (alcance 1).
- **No se añade aviso al cambiar de conexión** una oferta activa.
- **El modo demo no se toca.**

## 🔴 Las trampas

**1. La lista de vacantes está cacheada.** Las dos pantallas solo la piden si todavía no la tienen. Sin
vaciarla al cambiar de conexión, Laura elige PsicoAlianza y **sigue viendo las vacantes de EvaluaTest**;
elige una, y el guardado la comprueba en PsicoAlianza con un número de EvaluaTest. Es el riesgo de
*otro cargo* de la 48, desde la pantalla.

**2. Pedir pruebas adicionales con una vacante de PsicoAlianza** pregunta a EvaluaTest por ese número y
enseña las casillas de otro cargo (decisión 51, punto 2). La condición es el **proveedor de la conexión
elegida**, no «la empresa tiene EvaluaTest».

**3. El guardado conserva lo que no llega.** Si con PsicoAlianza no se mandan vacíos el código de perfil y
las pruebas adicionales, una oferta que viene de EvaluaTest se queda con los suyos (decisión 51, punto 4).
🔴 **Y el vacío tiene que ser explícito** (opinión previa): el backend conserva el código de perfil si
llega **nulo o no llega**, así que va como **texto vacío**; la lista vacía de pruebas adicionales sí se
pisa. Hoy, además, el código se toma de la vacante elegida, y una de PsicoAlianza no lo trae: sin esto ni
siquiera se mandaría.

**3b. La vacante precargada es de la conexión de la oferta** (opinión previa). Precargarla con otra
conexión elegida manda un número de un proveedor a otro. Es la regla general del alcance 2.

**4. Una sola conexión no es «no mandar conexión».** Con una sola, se manda igual. Así el guardado no
depende de la regla de la empresa, y una entrada incompleta de otro proveedor no cambia nada.

**5. El aviso de la vacante se lanza por vacante.** Sin la conexión en sus dependencias, un cambio de
conexión con el mismo número de vacante enseña el estado viejo.

**6. La copia desde el listado pide la oferta entera** antes de precargar. La conexión viene en esa
oferta, no en la fila resumida del listado.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **Crear y editar la prueba con una sola conexión de EvaluaTest** | Es lo que corre en producción |
| **Los textos de EvaluaTest** del aviso de la vacante y de los avisos de proveedor | |
| **Desactivar la prueba** desde la ficha | |
| **El interruptor de la etapa** en la ficha, con su condición de hoy salvo la señal | |
| **La comprobación de tipos en verde** | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`: sin lint ni formateador, **sin comentarios nuevos en código**,
identificadores en inglés —también los parámetros de las funciones flecha y las claves de texto
nuevas—, y los valores `evaluatest`, `psicoalianza` y los motivos de la ruta son contrato. La solución
más pequeña, sin commitear y todo al índice. Respetar los finales de línea de cada archivo.

**Documentación en el mismo diff:**
- `flujo-actual-etapa-psicometrica.md`: **§1 punto 2** (qué ve el reclutador según sus conexiones, el
  selector, las pruebas adicionales solo con EvaluaTest), **punto 3** (el portal ya manda la conexión
  siempre; quitar el aviso del caso espejo, que queda cerrado), **punto 4** (el aviso de oferta que
  perdió el proveedor mira la conexión congelada) y **§8** (lo que ve el reclutador en la ficha).
- `../entorno-local.md`: la sección de *una oferta con PsicoAlianza, a mano* pasa a decir que **se elige
  desde el portal**, y que escribirla a mano sigue sirviendo.
- `pruebas-a-mano.md`: **una sección nueva del paso 6.2b** con los casos de abajo, en el orden en que se
  hacen seguidos, y **el caso 15 del 6.1** sustituido por ellos, como ese caso ya anuncia.
- `before-deploy.md` no cambia.

## Pruebas

**Comprobación de tipos del portal**, y **casos a mano**, que el usuario corre con la rama entera. Se
escriben en `pruebas-a-mano.md` con lo que se prepara, lo que se hace y lo que se tiene que ver. Como
mínimo:

1. Empresa **solo con EvaluaTest**: crear una oferta con prueba (sin selector, pruebas adicionales,
   guarda); abrirla y cambiar el puntaje (sigue igual).
2. Empresa **solo con PsicoAlianza**: crear una oferta con prueba (sin selector, sin pruebas
   adicionales, vacantes de PsicoAlianza); abrirla (controles, no *sin proveedor*).
3. Empresa **con las dos**: crear desde cero con la prueba activada e intentar pasar de paso sin elegir
   (mensaje); elegir EvaluaTest y una vacante con pruebas adicionales; cambiar a PsicoAlianza (se
   borran vacante y pruebas; lista de PsicoAlianza); guardar.
4. La oferta del caso 3: abrirla (PsicoAlianza elegida), cambiar el puntaje y guardar; comprobar **en la
   base** que la conexión congelada sigue siendo la de PsicoAlianza, con el código de perfil y las pruebas
   adicionales vacíos. La consulta la pide el planificador al usuario.
5. Pasar una oferta activa de EvaluaTest a PsicoAlianza desde la ficha.
6. Copiar desde el listado una oferta de PsicoAlianza: la copia viene con PsicoAlianza y su vacante.
7. Crear desde la IA en la empresa con las dos: EvaluaTest elegida con la vacante sugerida.
8. Una vacante de PsicoAlianza en cada estado que se pueda preparar (completada, suspendida, sin
   pruebas, un número inventado): su texto.
9. El aviso de la vacante al cambiar de conexión con el mismo número de vacante: se vuelve a consultar.
10. Una oferta activa cuya conexión congelada no está, en una empresa **sin ninguna** conexión: el aviso de
    hoy en lugar de los controles.
11. **Reparar desde la ficha** (opinión previa) una oferta activa cuya conexión congelada no está, en una
    empresa **con PsicoAlianza como única conexión**: el aviso nuevo junto a los controles; *Configurar*
    abre con PsicoAlianza, sin selector y sin vacante; elegir una vacante, guardar, y comprobar que el
    aviso desaparece. Repetir desactivando la prueba en vez de guardar. Si se prepara con las dos
    conexiones, *Configurar* abre sin ninguna elegida.
13. **Desactivar y reactivar** una oferta de PsicoAlianza en la empresa con las dos: al volver a
    *Configurar*, PsicoAlianza y la vacante de antes vienen elegidas.
12. Una oferta de antes de la migración, sin conexión congelada, en una empresa que **solo** tiene
    PsicoAlianza: abre con PsicoAlianza, **sin vacante** y con su puntaje.

⚠️ **Nada de esto toca a una persona real**: no hay invitaciones. Pero los casos 1, 3, 5 y 8 consultan
cuentas reales de EvaluaTest y PsicoAlianza, en solo lectura. Y **no hay cuenta real de EvaluaTest**: los
casos que la necesitan se anotan como *no se pueden correr sin cuenta*, igual que en el 6.1.

## Verificación

Una vez sobre el conjunto: `npm run typecheck` en el portal. **Los casos a mano no se corren en este
paso**: quedan escritos en `pruebas-a-mano.md` para correrlos con la rama entera antes de desplegar.

## Revisión del diff (2026-09-15) — dos correcciones antes de cerrar

El diff cumple el brief y la comprobación de tipos pasa. El texto de vacante no usable por un motivo que
no está en la tabla, que propuso el ejecutor, **queda aprobado por el usuario** (decisión 51). Faltan dos
cosas:

**1 · Una frase del flujo.** En §1 punto 2, el renglón *Copiar una oferta, o abrir la ficha…* termina con
*Lo decide el listado antes de abrir el diálogo*. Solo es verdad para la copia (y para el borrador de la
IA): la ficha decide la conexión ella misma al cargar la oferta. Hay que decir las dos cosas.

**2 · La copia y el borrador de la IA no pueden decidir la conexión sin la empresa cargada.** El listado
carga la empresa una vez al abrirse, sin esperar, y si esa carga falla la deja vacía para siempre. Copiar
una oferta o recibir un borrador de la IA antes de que llegue, o después de un fallo, decide la conexión
con una empresa sin conexiones: la copia de una oferta de EvaluaTest abre **sin vacante**. Así que:
- **Antes de decidir la conexión** en la copia y en el borrador de la IA, si la empresa no está cargada,
  **se carga en ese momento** y se espera.
- **Si esa carga falla**, no se abre el diálogo y se enseña el error del listado, como ya hace la copia
  cuando no puede leer la oferta: *No fue posible copiar la oferta.* En el borrador de la IA, el mismo
  aviso con el texto que ya use el listado para un fallo al crear con IA; si no hay ninguno, dilo antes de
  inventar uno.
- Nada más cambia: con la empresa cargada, todo sigue como está en el diff.

**Hecho en la segunda entrega**: la frase del flujo y la copia desde el listado. Queda el borrador de la
IA, con lo decidido por el usuario el 2026-09-15 (opción A, sin texto nuevo):
- **El diálogo de crear con IA espera a que el listado prepare el borrador.** Hoy pide el borrador y se lo
  pasa al listado sin esperar. Pasa a esperar esa preparación, de modo que un fallo en ella llegue al
  mismo tratamiento de error que ya tiene el diálogo.
- **El listado, al preparar el borrador, espera a tener los datos de la empresa** igual que la copia,
  **siempre, traiga o no el borrador una prueba sugerida**: si ya están los usa, y si no los pide. Si esa carga falla, el error sale **dentro del diálogo de la IA**,
  con su mensaje de hoy, y el diálogo **queda abierto con lo que escribió el reclutador** para reintentar.
- Cuando todo va bien, nada cambia: el diálogo se cierra y se abre el de crear, como hoy. **Ningún texto
  nuevo.**
- Caso a mano en `pruebas-a-mano.md`, sección del 6.2b: bloquear la petición de la empresa del listado,
  recargar, crear con IA y generar. Sale el error dentro del diálogo de la IA, con la descripción
  todavía escrita. Sin cuenta real de EvaluaTest, la IA no sugiere vacante, pero el fallo de la carga se
  ve igual.

Caso a mano de la copia en `pruebas-a-mano.md`, sección del 6.2b: con las herramientas del navegador,
**bloquear la petición de la empresa del listado**, recargar y copiar una oferta con prueba. Tiene que
salir el error, no un diálogo con la prueba sin vacante.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que crear y editar la prueba con una sola conexión de EvaluaTest se ve y guarda
   igual que hoy**, más la conexión en el cuerpo.
5. **Qué funciones del aviso de proveedor quedaron sin uso y se quitaron**, o por qué no.
6. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos en código, **y la
   lista de los identificadores y claves de texto nuevos**, parámetros de funciones flecha incluidos.
7. **Los documentos actualizados**, con los casos a mano escritos.
8. **Un mensaje de commit por repositorio.**
