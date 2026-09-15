# Brief · Etapa 3, paso 4a — el resolvedor: quién habla con qué proveedor

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 48** y en las que ella nombra. Toca **solo el backend**.

> Escrito el 2026-09-14 leyendo los tres consumidores del token del puerto, las tres llamadas fijas a
> EvaluaTest, cómo el cron agrupa a los candidatos y cómo el guardado de la oferta congela la conexión.
> Es **el paso más delicado de la etapa**: cambia quién decide con qué proveedor se habla en el
> arranque, en el cron y al guardar la oferta, que hoy corren en producción con EvaluaTest.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md`.
2. `../CLAUDE.md` y `../../esscoti-backend/CLAUDE.md`.
3. `integrate-psicoalianza.md` — decisiones **2, 3, 5, 6, 15, 38, 40, 41, 46 y 48**, la pregunta
   abierta B3, y *Abierto, para cuando exista el resolvedor*.
4. `flujo-actual-etapa-psicometrica.md` — **entero**. Este paso lo cambia en §1, §2, §3, §4, §5 y §7.
5. En el backend: el token del puerto y quién lo inyecta (servicio de ofertas, orquestador y
   controlador de empresas); el módulo de ofertas, donde se cablea; los dos adaptadores; la lectura
   única de conexiones; el guardado de la configuración de la prueba en el servicio de ofertas y su
   ayudante de lectura; el arranque de la etapa y el cron de resultados en el orquestador; los
   ayudantes de lectura del candidato (identificador, correo de registro); y **los tres `.spec` del
   arranque, del cron y del modo demo**, que son la red de seguridad de la etapa.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. **Tratamiento completo**:
tantas rondas como hagan falta.

## El caso

**Laura** termina WhatsApp en una oferta de una empresa que conectó PsicoAlianza. Hoy el backend la
invitaría a **EvaluaTest** igual, porque el token del puerto apunta siempre allí y el guardado de la
oferta busca siempre la conexión de EvaluaTest. Este paso pone en medio **un resolvedor**: dada la
empresa y, si hay, la conexión de la oferta o el proveedor del candidato, devuelve el adaptador que
toca. Nada fuera de él sabe que existe PsicoAlianza.

**Con esto una persona real puede pasar por PsicoAlianza de punta a punta en local**, con la conexión
insertada a mano y la conexión escrita a mano en la oferta. Lo que ve el reclutador y el texto de
WhatsApp por proveedor son del 6 y del 4b.

## Piezas compartidas — aquí todo es compartido

| Pieza | Qué se le hace | Qué pasa si sale mal |
| --- | --- | --- |
| **El arranque de la etapa** | Pide el adaptador al resolvedor y escribe el proveedor que resolvió | Es el camino de todas las invitaciones de hoy |
| **El cron de resultados** | Agrupa a los pendientes por proveedor y pide el adaptador por grupo | Es lo que aprueba y descarta a todo el mundo |
| **El guardado de la configuración de la prueba** | Congela la conexión que mande el portal, o la que diga la regla | Si congela mal, la oferta invita al proveedor equivocado |
| **El token del puerto** | Deja de ser «el proveedor»; quien lo usaba pide al resolvedor | Un consumidor olvidado sigue hablando siempre con EvaluaTest |
| **El modo demo** | **Nada**: no pasa por el resolvedor | Sus pruebas son la red de seguridad de la etapa |

## Alcance exacto

### 1 · El resolvedor

Un servicio nuevo en la capa psicométrica, con **una sola regla** (decisión 48), en este orden:

| Con qué llega | Qué devuelve |
| --- | --- |
| **Un proveedor** (el guardado en el candidato) | El adaptador de ese proveedor. Vacío → EvaluaTest (15) |
| **Una conexión de la oferta** | El adaptador del proveedor de esa conexión, leído de la lista de la empresa. Si la conexión ya no está en la lista → *sin conexión* |
| **Solo la empresa** | Una conexión → esa; ninguna → *sin conexión* (40); **dos → EvaluaTest** |

Conoce los dos adaptadores por inyección y **no llama a ningún proveedor**: solo lee la lista de
conexiones de la empresa por la lectura única (una lectura, no una por adaptador). Devuelve **el
adaptador y el proveedor resuelto**, porque el arranque tiene que escribir el segundo.

🔴 **«Dos → EvaluaTest» es una decisión de producto, no un valor por defecto de conveniencia.** Está
razonada en la 48: conectar PsicoAlianza no puede descartar gente en ofertas que nadie tocó. No se
cambia por un error en este paso.

### 2 · Guardar la configuración de la prueba

La ruta que activa la prueba **acepta una conexión opcional** en el cuerpo. Con ella, congela esa —si
es de la empresa; si no, rechazo con mensaje propio—; sin ella, la que diga la regla por empresa. Ya
**no** busca siempre la de EvaluaTest. La comprobación de la vacante se hace **por el adaptador de
esa conexión**, y con *sin conexión* sigue rechazando con «conéctalo en Mi compañía» (40). Apagar la
prueba sigue sin exigir conexión.

El portal de hoy no manda conexión: **todo sigue igual que hoy** para él mientras la empresa tenga una
sola, o dos con EvaluaTest entre ellas.

### 3 · El arranque

Antes de invitar, pide el adaptador al resolvedor con **la conexión de la oferta** y, si no la tiene,
con la empresa (el aviso en el registro de hoy se conserva). Invita por ese adaptador. **Escribe en el
candidato el proveedor que resolvió**, no siempre `evaluatest`. Todo lo demás del arranque —plazo antes
de invitar, documento y tipo, la captura de errores, el mensaje— **no cambia**.

⚠️ **El enlace de respaldo cuando falla el arranque sigue siendo la llamada fija a EvaluaTest**, pero
**solo si el proveedor resuelto es EvaluaTest**; con PsicoAlianza no hay respaldo y el mensaje dice
que llegará por correo, que es verdad. Recablearla del todo es del 4b; aquí solo la condición.

### 4 · El cron

Para cada oferta, **agrupa a los pendientes con identificador por el proveedor guardado en el
candidato** (vacío → EvaluaTest) y hace **una llamada al adaptador por grupo**. Quien fue invitado en
EvaluaTest se consulta en EvaluaTest aunque la empresa haya conectado PsicoAlianza después (6). El
reintento de quien no tiene identificador vuelve a pasar por el arranque, que resuelve solo.

⚠️ **Las pruebas adicionales del veredicto siguen siendo la llamada fija a EvaluaTest**, y se añade la
condición **proveedor del candidato = EvaluaTest** a las que ya tiene (oferta con pruebas, no demo,
identificador presente). Recablearla es del 4b.

### 5 · El selector de vacantes y el estado de la vacante del portal

Las dos rutas piden el adaptador al resolvedor **por empresa** (el portal de hoy no manda conexión) y,
cuando el cuerpo o la consulta traiga una conexión, por ella. El paso 6 la mandará. Las **pruebas de la
vacante** siguen siendo de EvaluaTest y no cambian (4).

### 6 · El token del puerto

**Se retira como «el proveedor»**: los tres que lo inyectan pasan a pedir al resolvedor. La validación
y el estado de sesión del 5b **se quedan como están** (por proveedor, con el adaptador de PsicoAlianza
inyectado): recablearlas es del 4b. Si retirar el token exige tocar el cableado del módulo, se hace;
si conviene dejarlo apuntando a EvaluaTest sin que nadie lo use, se dice en la opinión previa.

### 7 · El documento del flujo

Se actualiza en el mismo diff: §1 (qué conexión congela la oferta), §2 (quién resuelve al invitar y qué
proveedor se escribe), §3 y §4 (el cron por proveedor), §5 (la condición de las pruebas adicionales) y
§7 (la demo no pasa por el resolvedor).

## Los casos, persona por persona

**Con EvaluaTest, nada cambia. Cada fila con su prueba.**

| Laura, con EvaluaTest | Hoy | Después |
| --- | --- | --- |
| Oferta con la conexión congelada (las migradas) | Invita en EvaluaTest | **Igual**, y el proveedor escrito es `evaluatest` |
| Oferta sin conexión, empresa con solo EvaluaTest | Invita con aviso en el registro | **Igual** |
| Oferta sin conexión, empresa con **las dos** | Invita en EvaluaTest | **Igual** (48) |
| Empresa sin conexión | Se salta la etapa | **Igual** |
| Falla el arranque | Enlace de respaldo de EvaluaTest | **Igual** |
| Cron, todos de EvaluaTest | Una llamada por oferta | **Igual**: un solo grupo |
| Candidatos en vuelo sin proveedor escrito | Se consultan | **Igual**: vacío es EvaluaTest |
| Pruebas adicionales | Se consultan | **Igual** |
| Guardar la oferta con el portal de hoy | Congela EvaluaTest | **Igual**, por la regla |
| Demo | Ni un cambio | **Igual**: las pruebas del demo no se tocan |

**Con PsicoAlianza** (conexión insertada a mano, y escrita a mano en la oferta):

| Laura, con PsicoAlianza | Qué pasa |
| --- | --- |
| Guardar la oferta mandando la conexión de PsicoAlianza | La congela y comprueba la vacante allí |
| Guardar mandando una conexión que no es de la empresa | Rechazo con mensaje propio |
| Arranque | Los cuatro pasos; `psicoalianza` en el candidato; el mensaje de hoy con el enlace personal (el texto por proveedor es del 4b) |
| Falla el arranque | Sin enlace de respaldo: «recibirás un correo» |
| Cron | Tablero de PsicoAlianza por identificador; sin pruebas adicionales |
| La oferta tiene gente invitada en EvaluaTest y la empresa cambia la oferta a PsicoAlianza | Dos grupos en el cron: cada uno donde fue invitado. Los nuevos, a PsicoAlianza |
| La conexión congelada se borró de la empresa | *Sin conexión*: la etapa se salta, con el aviso (40) |

## 🔴 Dónde se para — qué NO se hace

- **No se toca el portal**: el selector es del 6.
- **No se cambia el texto de WhatsApp** ni el correo que se enseña: 4b.
- **No se recablean del todo** el enlace de respaldo, las pruebas adicionales ni las dos llamadas del
  5b: aquí solo las condiciones que evitan llamar a EvaluaTest por una persona de PsicoAlianza. 4b.
- **No se toca el modo demo** ni ninguna de sus pruebas.
- **No se cambia el contrato del puerto** ni los adaptadores.
- **No se migra nada**: las ofertas sin conexión las cubre la regla.

## 🔴 Las trampas

**1. El quinto punto del modo demo** (decisión 38): la consulta de pruebas adicionales es una
condición aparte, dentro del veredicto, después del emparejamiento. Al añadir la condición del
proveedor **no se puede tocar la de la demo**: una oferta demo tiene que seguir saltándosela.

**2. El cron y la oferta con dos proveedores.** Si se agrupa mal, un candidato de EvaluaTest se busca
en el tablero de PsicoAlianza: sale *no aparece* y sigue esperando **hasta que el plazo lo descarta**,
sin ningún error. La prueba de los dos grupos tiene que comprobar **a quién se pregunta qué**.

**3. Una sola lectura de la empresa por resolución.** El resolvedor lee la lista de conexiones; cada
adaptador vuelve a leerla al resolver su credencial. Es una lectura más por invitación, aceptable; **no
se optimiza** en este paso.

**4. Retirar el token del puerto puede dejar un inyector sin proveedor** y Nest se niega a arrancar.
Está la prueba de cableado del paso 2 como patrón; ampliarla al resolvedor.

**5. El proveedor escrito en el candidato es dato**: `evaluatest` o `psicoalianza`, los mismos valores
de la lectura única. Cualquier otro texto dejaría al candidato sin cron que lo consulte.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **Todas las pruebas del arranque, del cron y del modo demo que ya existen, sin tocarlas** | Son la etapa en producción |
| **El contrato del puerto y los dos adaptadores** | |
| **El guardado de la oferta con el portal de hoy** | |
| **Compilación y pruebas en verde** | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`: sin lint ni formateador, sin comentarios nuevos en código,
identificadores en inglés —los identificadores de proveedor son contrato—, la solución más pequeña,
sin commitear y todo al índice.

## Pruebas

- **El resolvedor**: cada fila de su tabla, incluidas *dos → EvaluaTest*, *conexión que ya no está*,
  y *proveedor vacío → EvaluaTest*; **no llama a ningún proveedor**.
- **Arranque**: con la conexión de PsicoAlianza en la oferta invita por su adaptador y escribe
  `psicoalianza`; con la de EvaluaTest, igual que hoy y escribe `evaluatest`; sin conexión y empresa
  con las dos, EvaluaTest; el enlace de respaldo **no** se pide con PsicoAlianza.
- **Cron**: una oferta con candidatos de los dos proveedores hace **dos** llamadas, cada una con los
  suyos; candidatos sin proveedor escrito van con EvaluaTest; las pruebas adicionales **no** se piden
  para un candidato de PsicoAlianza.
- **Guardado de la oferta**: con conexión, la congela y comprueba por su adaptador; con una ajena,
  rechaza; sin ella, la regla.
- **Cableado**: Nest construye el resolvedor con los dos adaptadores, y los tres consumidores lo
  reciben.
- 🔴 **Ninguna prueba existente cambia.** Si una tiene que cambiar, se dice en la opinión previa y por
  qué.

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo, y borrarlo después,
limpiando la caché.

## Verificación

Una vez sobre el conjunto: `npm run build` y `npm test` en el backend.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que ninguna prueba existente cambió**, o cuáles y por qué.
5. **Qué pasó con el token del puerto.**
6. **Las llamadas fijas que quedan**, con su condición, para el 4b.
7. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos en código.
8. **El documento del flujo actualizado.**
9. **Cómo se prueba en local de punta a punta con PsicoAlianza**: qué hay que escribir a mano en la
   oferta.
10. **Un mensaje de commit.**
