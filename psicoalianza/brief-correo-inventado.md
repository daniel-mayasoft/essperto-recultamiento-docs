# Brief · Sin correo no hay prueba: se quita el correo inventado (decisión 33)

Cambio de comportamiento, fuera de la numeración de los pasos: saca gente del proceso, así
que va en su propio cambio. **Toca los dos repositorios**, porque un motivo de rechazo nuevo
es contrato con el portal.

**Este documento dice qué hacer y qué no. El *porqué* está en los otros `.md`.**

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto. Mira la verificación de **cada** repositorio.
3. `flujo-actual-etapa-psicometrica.md` — cómo funciona hoy la etapa. Importan §2 y §8.
4. `integrate-psicoalianza.md` — la bitácora. Importan **31, 32-e y 33**, la cabecera del
   enum de motivos que cita la 16, y las mediciones del 2026-09-12 para la 33.
5. El arranque de la etapa, hasta la llamada a la invitación, y el enum de motivos.

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio en los dos
repositorios. Si algo de aquí no cuadra con el código, gana el código y hay que decirlo.

## El caso, con una persona

**Julián** se postuló desde un portal de empleo que no publica el correo. Contestó la última
pregunta por WhatsApp y no recibió nada más: el siguiente mensaje habría sido la invitación a
la prueba. (Solo quien no tuvo preguntas —oferta sin preguntas o con el paso apagado— recibe
antes un «en breve te enviaremos tu prueba psicométrica».)

Hoy, al arrancar la etapa, como Julián no tiene correo el sistema **le inventa uno** con
nuestro dominio y su identificador, y con ese lo registra e invita en EvaluaTest. Julián
recibe el enlace por WhatsApp y puede hacer la prueba; el correo de EvaluaTest se pierde en
una dirección que no existe.

Después de este cambio, Julián **sale del proceso al llegar a la etapa**, con un motivo de
rechazo propio que el reclutador lee en el portal. No se le inventa nada ni se le pregunta
nada (decisión 31).

**Medido el 2026-09-12:** una persona de cada ~190 que llegan a la etapa no tiene correo, y
de las diez históricas nueve son de una cuenta de pruebas. **Nadie está hoy a mitad de prueba
con correo inventado**, así que no hay transición que cuidar.

## Alcance exacto — backend

1. **Qué datos exige el proveedor lo sabe el adaptador, así que la comprobación va ahí.** El
   correo de la invitación del puerto **pasa a poder faltar** (nulo o en blanco). El adaptador
   de EvaluaTest, **después de resolver la credencial y de comprobar el nombre de la
   vacante**, y antes de tocar al proveedor, lanza un **error de tipo propio** —*falta un dato
   del candidato*, con el nombre del dato dentro— si no hay correo. Ese orden es el que
   resuelve el caso de la empresa sin conexión: aprueba antes de mirar el correo, porque no
   hay prueba que perder (decisión 40). El nombre de la vacante va antes porque es un error
   de configuración y merece la alerta del fallo permanente.
2. **Sin correo** es correo nulo **o en blanco**: hoy el inventado solo cubre el nulo, y una
   cadena vacía iría tal cual al proveedor. Medido: no hay ninguna en la base, pero la regla
   cubre las dos.
3. **El arranque, ante ese error, descarta** con el motivo nuevo, en el mismo bloque de
   captura donde atrapa *sin conexión* y antes del registro de error con pila. Así las cinco
   puertas lo tratan igual y el demo no pasa por aquí: fabrica lo suyo sin correo.
4. **Motivo de rechazo nuevo**: `psychometric_missing_email`, fijo, en el bloque de la etapa
   del enum, al lado del vencimiento y del descarte del proveedor. Es un dato que falta, no un
   resultado: no lleva puntaje ni nombre dentro. Cuando PsicoAlianza exija el documento,
   tendrá el suyo.
5. **Desaparece el correo inventado.** El arranque pasa el correo del candidato tal cual, con
   su nulo.
6. **Sin mensaje al candidato.** Es el mismo trato que el fallo permanente (decisión 39):
   inventar un mensaje para este caso sería tocar la conversación (decisión 31). ⚠️ Julián se
   queda en silencio; es lo aceptado a sabiendas y se dice en el reporte.

## Alcance exacto — portal

Lo que la cabecera del enum exige al añadir un motivo, más el visor que esa cabecera no
nombra (decisión 16):

7. **El traductor** gana la entrada del motivo nuevo, con textos en español e inglés bajo
   `rejection.*`: *«No tiene correo electrónico para enviarle la prueba psicométrica»* /
   *«No email address to send the psychometric test to»*.
8. **El visor del embudo** le da **grupo propio**, *Psicométrica — sin correo*: meterlo en
   *no completó* le diría al reclutador que la persona no hizo algo que nunca se le mandó.
   Son las cinco entradas del visor (color, categoría, orden, clave y normalización) más
   etiqueta y descripción en los dos idiomas. La comprobación va **delante** de las
   heredadas, como en el paso 7.
9. **La tabla de deducción de etapa no se toca** (decisión 17): los registros nuevos traen su
   etapa.

## 🔴 Dónde se para — qué NO se hace

- **No se le pregunta el correo al candidato** ni se añade paso alguno a la conversación
  (decisión 31).
- **No se toca el documento** ni ningún otro dato obligatorio: eso es de la etapa 3, cuando
  PsicoAlianza lo exija.
- **No se cambia nada más del contrato del puerto** que el correo de la invitación, que pasa
  a poder faltar. La consulta de resultados no se toca.
- **No se toca el demo.**
- **No se cambia ningún motivo existente** ni las métricas: cuentan el código literal y el
  nuevo cae en su propia fila, como cualquier otro.
- **No se toca el mensaje previo** de «en breve te enviaremos tu prueba».

## 🔴 Las trampas

**1. El descarte tiene que archivar la etapa psicométrica.** El descarte de la casa lo hace;
usar el mismo que usan el vencimiento y el descarte del proveedor. Si no, Julián aparece
descartado en una etapa que sí superó.

**2. Las cinco puertas del arranque llegan aquí.** El descarte va en el bloque de captura del
arranque, así que el reintento del cron, el retomar del bombeo, el reintento manual y el
botón «Continuar proceso» descartan igual. Dos consecuencias que constan: el reintento manual
del administrador responde «reintentado» mientras el candidato queda descartado —igual que
hoy responde así cuando la empresa sin conexión lo aprueba—, y el botón «Continuar proceso»
descarta sin decir nada. Con la medición en cero en vuelo no hay nadie a quien le pase por el
reintento, pero la regla vale para las cinco.

**3. La red de seguridad del camino real pasa hoy gracias al correo inventado.** El montaje
del ciclo mixto le da al candidato correo nulo, y la prueba «camino real: sigue registrando —
sin regresión» se sostiene sobre el correo inventado. **No se le da la vuelta**: se le da
correo al candidato de ese montaje, por parámetro, para que siga afirmando que se registra; el
descarte se escribe como caso aparte; y el mismo montaje sigue sirviendo al caso demo sin
correo.

## Lo que hay que preservar entero

| Qué | Por qué existe |
| --- | --- |
| **El candidato con correo se invita exactamente igual** | Es el 99,5% de la gente; la red de seguridad del paso 5 tiene que seguir verde |
| **El correo de registro se guarda solo si difiere del real** (32-d) | No cambia; se menciona porque el correo real deja de poder ser inventado |
| **El orden dentro del adaptador: credencial → nombre de la vacante → datos del candidato** | La empresa sin conexión aprueba la etapa (decisión 40) aunque el candidato no tenga correo, y la vacante sin nombre sigue disparando la alerta del fallo permanente |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador en ninguno de los dos repositorios.**
- **Comentarios: ninguno nuevo en archivos de código.** El de la cabecera del enum no se toca.
- **Los identificadores van en inglés**, incluidos los de los `.spec`.
- **La solución más pequeña que resuelve el caso.**
- **No commitear.** Los archivos nuevos se añaden al índice, con `add`.
- 🔴 **`flujo-actual-etapa-psicometrica.md` se actualiza en este mismo diff**: §2 (el correo
  ya no se inventa; el adaptador comprueba credencial, nombre y datos del candidato, y el
  arranque descarta), §8 (el motivo nuevo y su grupo) y §9 (la fila de la 33 sale).

## Pruebas

**Backend**

- **El adaptador lanza *falta un dato* sin correo**, nulo o en blanco, **antes de tocar al
  cliente**, y con la credencial y el nombre de la vacante ya comprobados.
- **Un candidato sin correo queda descartado** con el motivo nuevo, con la etapa psicométrica
  archivada y **sin mensaje**.
- **Un candidato con correo se invita igual que hoy** — el ciclo mixto, con correo en el
  montaje.
- **Una oferta demo con candidato sin correo sigue fabricando lo suyo.**
- **La empresa sin conexión aprueba la etapa aunque el candidato no tenga correo.**

**Portal**

No tiene pruebas. En el reporte va la fila del motivo nuevo: el texto del traductor en los
dos idiomas, y el grupo del visor con su posición respecto a los otros dos psicométricos.

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo, y borrarlo después,
limpiando la caché.

## Verificación

Una vez sobre el conjunto del cambio:

- Backend: `npm run build` y `npm test`.
- Frontend: `npm run typecheck`.

El resultado de los dos va en el reporte. Si alguno falla, el cambio no está terminado.

## Qué entregar

1. **Qué cambió** y **qué se verificó** en cada repositorio, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos.
5. **Confirmación de que ya no existe ningún correo inventado** en el código, con cómo se
   buscó.
6. **La fila del motivo nuevo en el portal.**
7. **Un mensaje de commit por repositorio.** Orden de despliegue: **portal antes que backend,
   o a la vez** — el backend escribe un código que solo el portal nuevo traduce.
