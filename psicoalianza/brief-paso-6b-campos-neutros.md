# Brief · Paso 6b de la etapa 1 — los campos del candidato dejan de llamarse EvaluaTest

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está
en los otros `.md`** — no se repite aquí, porque dos copias de la misma decisión se
desincronizan y nadie lo nota.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto.
3. `integrate-psicoalianza.md` — la bitácora, fuente única. Importan **6, 15, 29, 37, 38 y
   39**, y el registro de los pasos 5 y 6a.
4. Los seis campos en el esquema de la oferta, con sus comentarios: explican para qué sirve
   cada uno, y dos de ellos guardan una trampa averiguada en producción.

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio. Si algo
de aquí no cuadra con el código, gana el código y hay que decirlo antes de empezar.

## El objetivo

Que lo que se guarda de cada candidato en la etapa psicométrica **deje de llevar el nombre
del proveedor** (decisión 15): un núcleo neutro más una bolsa con lo que sea propio de
EvaluaTest.

Al terminar, **nadie ve nada distinto**. Ni el candidato, ni el reclutador, ni el portal —
que no lee ninguno de estos campos, comprobado.

## 🔴 La trampa que ordena todo el paso: el candidato a mitad de prueba

El día del despliegue hay gente **en mitad de su prueba**, con los campos viejos escritos y
los nuevos vacíos.

Si al leer solo se mira el campo nuevo, esa persona aparece **sin identificador del
proveedor**, y eso el cron lo interpreta como *el registro falló*: la vuelve a inscribir y
**la invita por segunda vez**. Recibe dos veces la misma prueba y su proceso se reinicia en
EvaluaTest.

**Por eso la regla es: al leer se mira el nuevo y, si está vacío, el viejo. Al escribir,
siempre el nuevo.** Sin migración: la compatibilidad caduca sola, porque nadie puede estar
a mitad de prueba más que el plazo configurado.

## 🔴 La segunda trampa: la bolsa tiene dos escritores, y uno pisa al otro

**Es la que rompe en silencio y la que ordena cómo se escribe.**

Los tres datos que van a la bolsa no se escriben en el mismo momento. El **correo de
registro** lo escribe la invitación, una sola vez. El **código de estado** y el **resultado
por prueba** los escribe el cron, en cada pasada. Hoy son tres campos separados y no se
estorban; dentro de una sola bolsa, **si el cron guarda la bolsa entera con lo suyo, borra
el correo de registro** — que no es informativo: es la llave con la que se localiza a esa
persona.

⚠️ **Y el respaldo no lo rescata.** A quien se invite después del despliegue no se le
escribe nunca el campo viejo, así que no hay a qué caer: la primera pasada del cron le borra
la llave, la siguiente lo busca por su correo real, no lo encuentra —está registrado con el
del desvío de pruebas— y esa persona espera hasta que **el plazo la descarta** diciéndole
que su resultado no llegó a tiempo. Sin un solo error en el registro. Afecta a las empresas
con correo de pruebas configurado, que son justo donde se prueba antes de soltar algo.

**Las dos mitades de la regla, que van juntas:**

1. **La bolsa se escribe siempre completa a partir de la que ya estaba**, nunca se
   reemplaza. **Ese empalme vive en un solo sitio** que usan los dos escritores — repetirlo
   a mano en dos lugares es volver a abrir la puerta.
2. **Se construye una bolsa nueva y se asigna entera.** El campo se declara como objeto
   libre, así que **mutarla por dentro no se guarda** y se pierde sin avisar.

## Cuánto es, de verdad: solo dos campos se leen

Levantado del código el 2026-09-10. Importa porque decide dónde hace falta la regla de
compatibilidad y dónde no:

| Campo de hoy | Dónde va | Se lee |
| --- | --- | --- |
| Identificador del candidato | núcleo neutro | 🔴 **Sí, en cuatro sitios** — dos de ellos dentro del cron |
| Correo de registro | **bolsa** del proveedor | 🔴 **Sí, en uno** |
| Puntaje | núcleo neutro | No: solo se escribe |
| Último código de estado del proveedor | **bolsa** del proveedor | No: solo se escribe |
| Última consulta | núcleo neutro | No: solo se escribe |
| Resultado por prueba adicional | **bolsa** del proveedor | No: solo se escribe |

**La regla de leer-el-nuevo-y-si-no-el-viejo solo hace falta en esos cinco sitios.** En los
cuatro campos que nadie lee no hay nada que resolver al leer.

🔴 **Las dos lecturas del cron tienen que compartir el respaldo, y la segunda es la que hay
que blindar.** Una decide a quién se le pregunta; la otra decide **si se reintenta el
arranque**. Si el respaldo se pone solo en la primera, el candidato en vuelo entra en la
consulta y **acto seguido lo reinvitan** — que es exactamente el desastre que este paso
existe para evitar.

⚠️ **Consecuencia que hay que asumir y decir:** para un candidato que ya estaba en vuelo,
esos cuatro campos dejan de actualizarse en su sitio viejo y empiezan a escribirse en el
nuevo, así que su rastro queda partido en dos. **Nadie lo lee**, ni aquí ni en el portal, así
que no rompe nada — pero quien mire la base a mano tiene que saberlo.

## Alcance exacto — qué se hace

1. **Los cinco campos neutros y la bolsa**, con los nombres de la decisión 15.
2. **Al escribir, siempre el nuevo.** En los dos sitios que escriben: el arranque de la
   etapa y el cron.
3. **Al leer, el nuevo y si está vacío el viejo**, en los cinco sitios de la tabla.
4. **El estado neutro se guarda donde hoy se guarda el código del proveedor** — o sea, solo
   cuando hay coincidencia. El código numérico sigue guardándose, pero dentro de la bolsa.
   Con eso **muere la fuga del paso 6a**: el cron deja de abrir la bolsa para sacarlo.
5. **Se escribe a qué proveedor fue invitado el candidato** (decisión 6). Hoy solo hay uno,
   así que el valor es siempre el mismo y **nadie lo lee todavía**; se escribe para que el
   día que haya dos, el cron pregunte al del momento de la invitación y no al que hoy diga
   la oferta.

## 🔴 Dónde se para — qué NO se hace

- 🔴 **No se borran los campos viejos del esquema.** Hay que poder seguir leyéndolos. Su
  limpieza es otro cambio, cuando la compatibilidad haya caducado.
- 🔴 **No se escribe el campo viejo.** Nada de escribir los dos "por si acaso": eso es
  justamente lo que la decisión 15 descarta.
- **No se migra nada.** Ni script, ni proceso de arranque que rellene.
- **No se toca el veredicto, ni el plazo, ni los motivos de rechazo** (esos son el paso 7).
- **El condicional del modo demo se conserva** (decisión 38). Lo que sí cambia es que
  escribe los campos nuevos, como todos.
- **No se arregla la decisión 37** —el puntaje ausente que se lee como cero—: sigue con su
  cero de respaldo, tal como quedó en el 6a.
- **No se unifican las dos reglas de credenciales** que conviven en el cron desde el 6a.

## Lo que hay que preservar entero

Está levantado del código. Perder cualquiera rompe en silencio:

| Qué | Por qué existe |
| --- | --- |
| **El correo de registro se guarda solo si difiere del real**, y vacío significa *empareja por el verdadero* | Es la llave con la que se localiza al candidato (32-d). Al mudarlo a la bolsa, **vacío tiene que seguir significando lo mismo** |
| **El identificador del modo demo es determinístico y siempre positivo** | El cron trata el cero y el vacío como *el registro falló, reintenta* — con un cero, al candidato demo se le invita otra vez |
| **El estado se guarda solo cuando hay coincidencia** | Hoy es así. Guardarlo también para *no aparece* o *no se pudo consultar* cambiaría lo que hay en la base sin que nadie lo haya pedido |
| **La compatibilidad se aplica también al modo demo** | Un candidato demo en vuelo tiene los campos viejos igual que uno real |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador**, y si el editor formatea al guardar, se
  apaga. El diff debe contener **solo** lo que este brief pide.
- **Comentarios: ninguno nuevo en archivos de código.** ⚠️ **Los comentarios de los campos
  viejos en el esquema no se borran**: describen trampas de producción y esos campos siguen
  vivos. Los campos nuevos se documentan en la prosa de sus `.spec`.
- **Los identificadores van en inglés**, incluidos los de los `.spec` y los parámetros de
  callbacks.
- **La solución más pequeña que resuelve el caso.** Nada de reorganizar de paso.
- **No commitear.** Los archivos nuevos se añaden al índice, y con `add`, no solo marcados.

## Pruebas

🔴 **La prueba que importa es la del candidato en vuelo.** Si se rompe, alguien recibe su
prueba dos veces y nadie se entera hasta que esa persona escribe.

Lo nuevo que hay que cubrir, y es exactamente lo que dice el alcance:

- **Un candidato con solo los campos viejos se encuentra igual**: no se le vuelve a
  inscribir ni a invitar, y entra en la consulta de resultados con su identificador.
- **Un candidato con los campos nuevos manda sobre los viejos** si por lo que sea tuviera
  los dos.
- **Al escribir solo se escribe el nuevo**, y el viejo se queda como estaba.
- **El correo de registro viaja en la bolsa**, y **vacío sigue significando empareja por el
  correo real** — con el viejo y con el nuevo.
- **Una oferta demo escribe los campos nuevos** y su identificador sigue siendo positivo.
- 🔴 **El cron no borra el correo de registro al guardar lo suyo.** Es la prueba de la
  segunda trampa: invitar, pasar el cron, y comprobar que la llave sigue ahí.

💡 **Hay cuatro pruebas que afirman sobre los nombres viejos**, incluida la red de seguridad
del ciclo mixto. Hay que tocarlas, así que el diff se verá más grande de lo que este brief
sugiere. A favor: sus montajes ya arman candidatos con los campos viejos escritos, así que
**dejar uno tal cual convierte esa prueba en el caso del candidato en vuelo casi gratis** —
y es mejor prueba que una escrita a propósito, porque nadie la ajustó para que pasara.

⚠️ Una prueba que pasa a la primera merece desconfianza: comprobar que muerde con un
control negativo, y borrarlo después, limpiando la caché.

## Verificación

Una vez sobre el conjunto del cambio, no archivo por archivo:

- Backend: `npm run build` y `npm test`.

El resultado va en el reporte. Si falla, el paso no está terminado.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.** Es lo más importante.
4. **Confirmación de que el diff no trae cambios de formato** ni reorganizaciones que nadie
   pidió, y de que no se borró ningún comentario del esquema.
5. **Confirmación de que ningún campo viejo se escribe ya**, y de que los cinco sitios de
   lectura tienen su respaldo.
6. 🔴 **Cómo quedó el empalme de la bolsa**, en una línea: dónde vive y quién lo usa. Es lo
   único de este paso que, si se rompe, no deja rastro en el registro.

⚠️ **Un candidato "a medias" casi no existe hoy**: el identificador y el correo de registro
se escriben en el mismo guardado, así que lo corriente en producción es identificador sí y
correo de registro vacío — y eso no es estar a medias, es el caso normal, que la regla de
compatibilidad resuelve porque vacío significa lo mismo en los dos sitios. **El estado a
medias de verdad lo crearía este mismo paso**, con el pisado de la bolsa.

**Menor, para que no se redescubra:** el campo viejo del correo de registro recorta espacios
a nivel de esquema y dentro de la bolsa no hay esquema que lo haga. No cambia nada porque el
adaptador normaliza al emparejar, pero el valor guardado deja de venir recortado.
