# Brief · Paso 4 de la etapa 1 — la consulta de resultados entra al puerto

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está
en los otros `.md`** — no se repite aquí, porque dos copias de la misma decisión se
desincronizan y nadie lo nota.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto.
3. `integrate-psicoalianza.md` — la bitácora, fuente única. Importan las decisiones **4,
   15, 22, 29 y 32**, y el registro de los pasos 1 a 3.
4. `psicoalianza-api.md` — cómo entrega resultados el segundo proveedor. Es lo que evita
   calcar el contrato del primero.
5. El código del paso anterior —la invitación en el puerto y su adaptador—, que tiene la
   misma forma que esto y cuya operación es la pareja de esta.

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio. Si algo
de aquí no cuadra con el código, gana el código y hay que decirlo antes de empezar.

## El objetivo

Añadir al puerto **la consulta de resultados**, e implementarla para EvaluaTest. Es la
pareja de la invitación: una mueve a la persona, la otra averigua cómo le fue.

**Nada la llama todavía.** El cron sigue consultando por su cuenta, exactamente como hoy.
Aditivo a propósito, igual que el paso 3.

## 🔴 Se consulta en lote, nunca de a un candidato

La operación **recibe la vacante y la lista de candidatos que se están esperando**, y
devuelve un resultado por cada uno (decisión 22). No existe una versión "dame el resultado
de esta persona".

No es un capricho de eficiencia: **EvaluaTest solo sabe responder por vacante**. Devuelve
el tablero completo con todos los candidatos de esa vacante — los de esta oferta y los de
cualquier otra que use la misma—. Pedirlos de a uno significaría traer el tablero entero
por persona. PsicoAlianza responde igual, por proceso.

## Alcance exacto — qué se hace

1. **Añadir la consulta de resultados al puerto**, en lote.
2. **Implementarla en el adaptador de EvaluaTest**, envolviendo lo que el cliente ya sabe
   hacer. Sin reescribir el cliente.
3. **El emparejamiento vive dentro del adaptador.** Quien llama entrega la lista de a
   quién espera y recibe el resultado de cada uno; no ve el tablero crudo ni empareja
   nada. Cómo se empareja es específico de cada proveedor — ver la trampa de abajo.

## 🔴 Dónde se para — qué NO se hace

- **No se toca el cron ni ninguna otra parte del orquestador.** Sigue consultando por su
  cuenta, como hoy.
- **No se mueve el veredicto.** Quién aprueba y quién no se decide hoy en el embudo, con
  el puntaje mínimo y las pruebas adicionales que tiene configuradas la oferta. **Eso se
  queda donde está.** La operación informa; no juzga.
- **Las pruebas adicionales no entran al puerto** (decisión 4). Son exclusivas de
  EvaluaTest y su consulta se queda donde está, en el cliente, llamada desde el embudo.
  Tampoco se mueven al adaptador en este paso.
- **No se toca el modo demo** ni la selección de proveedor. Van en el paso siguiente.
- **No se renombra ningún campo guardado, método público ni ruta.**
- **No se toca el plazo de vencimiento.** Lo calcula el embudo con la configuración de la
  empresa; no es asunto del proveedor.

## 🔴 La trampa que hay que preservar: se empareja por dos llaves, no por una

Hoy el cron construye **dos índices** del tablero, por correo y por identificador de
candidato del proveedor, y usa el segundo como respaldo.

**El respaldo no es decorativo.** EvaluaTest a veces registra al candidato con el correo
alterado —le antepone un prefijo cuando ya existe esa dirección—, y entonces el
emparejamiento por correo falla para una persona que sí hizo la prueba. Sin el respaldo
por identificador, ese candidato **nunca se empareja**, se queda esperando y acaba
descartado por vencimiento. Nadie ve un error.

Y el correo con el que se busca **no es siempre el del candidato**: si quedó registrado
con otro —desvío de pruebas de QA— es ese el que vale. Por eso la invitación lo devuelve
(ver 32-d): es la llave.

**Las dos llaves entran en la operación**, por candidato, y el adaptador decide cómo usar
cada una. En PsicoAlianza el emparejamiento es por documento y por su identificador; el
correo no juega. Un contrato que solo lleve correo nace calcado del primer proveedor.

## 🔴 "No pude preguntar" no es "todavía no hay resultado"

**Este es el fallo silencioso más caro del paso.** Cuando la petición del tablero falla
—HTTP de error, respuesta que no es JSON— el cliente **no lanza: devuelve una lista
vacía** y solo deja un aviso en el registro.

Con la lista vacía, todos los candidatos quedan "sin coincidencia" y el sistema los trata
como *aún no terminaron*. Se siguen esperando, que es lo correcto para una pasada… **pero
el reloj del vencimiento no se detiene**. El cron corre cada 5 minutos; si el proveedor
está caído más días que el plazo configurado, esos candidatos **se descartan por
vencimiento sin que nadie haya conseguido preguntar nunca**. El candidato recibe un
mensaje diciendo que no llegó su resultado a tiempo, y en realidad nunca se preguntó.

🔴 **Y hay un segundo camino, con otra consecuencia.** Si falla la autenticación o se cae
la red, el cliente **sí revienta**. Hoy el cron atrapa esa excepción por oferta y **se
salta la oferta entera** sin tocar a ningún candidato. Los dos son "no pude preguntar",
pero se comportan distinto: con la lista vacía se guarda la marca de última consulta de
cada candidato; con la excepción no se guarda nada.

**La operación reduce los dos a uno**: atrapa también la excepción y devuelve a **todos**
los candidatos pedidos como *no se pudo consultar*. Quien recablee ve un solo camino en
vez de descubrir el segundo en producción.

⚠️ **Pero no se traga el motivo.** Una caída del proveedor tiene que seguir viéndose en
el registro, con su causa. Convertir una excepción en un estado silencioso sería peor que
lo de hoy.

**Resumiendo, la operación tiene que distinguir "no se pudo consultar" de "consulté y no
hay nada".** Es la misma lección que el tercer estado de la comprobación de vacante en el
paso 2: dos cosas distintas que colapsadas mandan a alguien a la decisión equivocada.

⚠️ Este paso **no arregla el vencimiento** —eso es del embudo y va en el recableado—.
Aquí solo hay que **hacer visible la diferencia en el contrato**, para que quien recablee
pueda actuar sobre ella en vez de descubrirla tarde.

## La forma de la operación

**Recibe**: la vacante, la referencia de la empresa, y la lista de candidatos que se
esperan. De cada uno:

| Dato | Nota |
| --- | --- |
| Nuestra referencia | Para devolver el resultado atado a quién es |
| Su identificador en el proveedor | 🔴 **Obligatorio.** Un candidato sin él no está inscrito, y hoy el cron lo detecta antes de mirar el tablero y reintenta la inscripción. Dejarlo opcional invita a que el recableado mande gente que todavía no existe en el proveedor |
| **Los dos correos**: el de registro y el del candidato | 🔴 **Son dos, no uno.** El de registro se guarda **solo si difiere** del real, así que en producción normal está en **nulo** y eso significa *empareja por el verdadero* (decisión 32-d). Con un solo campo la regla no se puede expresar. **La regla vive en el adaptador**: el de registro manda cuando existe. Así el segundo proveedor, que no empareja por correo, puede ignorar los dos |

**Devuelve**, por cada candidato pedido, un estado neutro más lo que haga falta para
decidir:

| Estado | Qué significa | Quién lo produce hoy |
| --- | --- | --- |
| Terminado | Hay resultado que leer | EvaluaTest: su código de "evaluado" |
| Rechazado por el proveedor | El proveedor lo descartó por su cuenta | EvaluaTest: su código de "descartado" |
| En curso | Está en el tablero y sigue en ello | Cualquier otro código |
| Sin noticias | Se consultó bien y esa persona no aparece todavía | Ningún código: no está en el tablero |
| No se pudo consultar | La petición falló — ver arriba | La lista vacía del cliente |

Más tres cosas por resultado:

- 🔴 **El identificador con el que se le encontró.** No es el mismo dato que el de la
  entrada: el respaldo por identificador existe justamente porque el tablero a veces
  discrepa del que teníamos guardado, y hoy el embudo usa **el del tablero** para pedir
  las pruebas adicionales. Si no vuelve, quien recablee usará el guardado sin enterarse
  del cambio.
- **El puntaje, y solo en el estado terminado.** En el resto no viaja. Es lo que hace hoy
  el embudo, que solo lo lee cuando el candidato está evaluado.
- Una **bolsa de datos propios del proveedor** (decisiones 15 y 29) con lo que el embudo
  guarda hoy: el código de estado del proveedor y lo que haga falta para el registro.

⚠️ **Lo que este paso no puede arreglar:** el cliente ya convierte un puntaje ausente en
**cero** al leer el tablero, y este paso no lo toca. Un candidato terminado al que el
proveedor no le mande nota seguirá leyéndose como cero y reprobando. Es de hoy, no lo
introduce este paso, y el arreglo pasa por el cliente (decisión 37).

### 🔴 Dos supuestos que NO se pueden dar por buenos

**El puntaje puede no existir, y ausente no es cero.** En PsicoAlianza el valor `-2.0`
significa *sin puntaje todavía*, no una nota malísima. Si el contrato entrega un número a
secas, ese centinela se convierte en un cero y el candidato queda reprobado por debajo del
mínimo sin haber hecho nada. El puntaje tiene que poder faltar.

**El estado del candidato no siempre está donde parece.** En PsicoAlianza la etapa del
candidato se queda en "En pruebas" aunque ya haya terminado y esté recomendado: **el
veredicto vive en sus pruebas citadas, no en su etapa**. Un contrato que se dibuje desde
"el estado del candidato" de EvaluaTest obliga al segundo proveedor a inventarse uno.

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador, y si el editor formatea al guardar, se
  apaga.** El diff debe contener **solo** lo que este brief pide.
- **Comentarios: ninguno nuevo en archivos de código.** Lo que haya que explicar va a este
  brief o a la prosa de los `.spec`.
- **Los identificadores van en inglés**, sin excepción, incluidos los de los `.spec` y los
  parámetros de callbacks.
- **La solución más pequeña que resuelve el caso.**
- **No commitear.** Los archivos nuevos se añaden al índice.

## Pruebas

La prueba de paridad de la capa es la red de seguridad. **Este paso no debería romperle
nada**: es aditivo y no cambia ninguna operación existente. Si algo de lo que ya estaba se
pone en rojo, el cambio se salió del alcance.

Lo nuevo que hay que cubrir, y son justo las trampas de arriba:

- **Un candidato al que EvaluaTest le alteró el correo se empareja igual**, por su
  identificador. Es el que hoy se perdería en silencio.
- **El correo de registro manda sobre el del candidato** cuando difieren, y **cuando
  viene en nulo se empareja por el del candidato**, que es el caso normal en producción.
- **Una consulta que falla no se lee como "nadie ha terminado"**: los candidatos salen
  como *no se pudo consultar*, no como *sin noticias*. **Los dos caminos**: el de la lista
  vacía y el de la excepción.
- **Un candidato que no está en el tablero sale como sin noticias**, que es distinto de lo
  anterior y es un caso normal.
- **Terminado, rechazado por el proveedor y en curso** salen bien de sus códigos.
- **El puntaje solo viaja en el estado terminado**, y en el resto no llega.

⚠️ Una prueba que pasa a la primera merece desconfianza: comprobar que muerde con un
control negativo, y borrarlo después (ver el arranque).

## Verificación

Una vez sobre el conjunto del cambio, no archivo por archivo:

- Backend: `npm run build` y `npm test`.

El resultado va en el reporte. Si falla, el paso no está terminado.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.** Es lo más importante del
   reporte.
4. **Confirmación de que el diff no trae cambios de formato** en código ajeno a la tarea.
5. **Confirmación de que el cron sigue intacto** y de que nada llama todavía a la
   operación nueva.
6. **Cómo quedó representado "no se pudo consultar"** en el contrato, en una línea. Es lo
   que el recableado va a necesitar y lo único de este paso que no falla ruidoso.
