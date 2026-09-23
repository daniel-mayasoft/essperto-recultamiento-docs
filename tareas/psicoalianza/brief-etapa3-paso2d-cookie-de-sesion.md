# Brief · Etapa 3, paso 2d — el almacén guarda solo la cookie de 5 días

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 47.** Toca solo el backend, y dentro de él **solo el almacén de sesión del paso 2 y su
prueba**.

> Escrito el 2026-09-14 sobre la medición de ese día: la cookie de *permanecer conectado* basta sola
> para un endpoint de datos (contrato, *Sesión y autenticación*), y la cookie corta reemitida no
> invalida la anterior (tanda del paso 3, hallazgo 3).

## Antes de escribir una sola línea

Leer: `arranque-del-ejecutor.md`; la bitácora, **decisiones 42, 43 y 47** y el hallazgo 2 del bloque A
de la *Tanda de comprobaciones para el paso 3*; el contrato, *Sesión y autenticación*; y en el
backend, el almacén de sesión, su prueba, el esquema de la sesión en la conexión, y en el cliente lo
que le pide al almacén (leer la sesión, guardar cookies, marcar visto vivo) y cómo funde las cookies
reemitidas.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. Es un cambio pequeño, pero
**cambia cómo se persiste algo que hoy funciona**: una ronda, y si sale algo grande se para.

## El caso

Cuando exista el acuñador (2c), la sesión de PsicoAlianza de la empresa de **Laura** vivirá en la
base. PsicoAlianza reemite la cookie corta con otro texto en **cada** respuesta, y el almacén de hoy la
guarda cifrada en cada cambio: con el cron cada cinco minutos y las invitaciones, del orden de **mil
escrituras al día** en el documento de la empresa, sin ganar nada. Hoy no se nota porque la sesión
pegada del `.env` vive en memoria.

## Cómo tiene que quedar

| Qué | Hoy | Después |
| --- | --- | --- |
| **Lo que se escribe en la base** | Todas las cookies, en cada cambio | **Solo la cookie de *permanecer conectado*** (`remember_web_<hash>`), y solo cuando **esa** cambia |
| **La cookie corta** (`ats_session`) reemitida | A la base | **A memoria del proceso**, por empresa, mientras dure el proceso |
| **«Visto vivo»** | En la comprobación explícita de sesión **y al guardar cookies** (corregido en la opinión previa: el brief decía solo lo primero, y la bitácora del paso 2 también) | **Igual**: la escritura de la cookie de 5 días lo sigue llevando, y la comprobación explícita queda como está. Así «no se escribe en más sitios que hoy» es literal |
| **La sesión pegada del `.env`** | Memoria, nunca base | **Igual** |
| **El esquema** | Un campo cifrado con las cookies | **Igual**: el mismo campo, con menos dentro |
| **El cliente** | Dice «guarda estas cookies» y «marca visto vivo» | **Igual**: el almacén decide qué va a dónde |

**Cómo se lee la sesión guardada**: lo que hay en la base, y encima, si existe, la copia en memoria
de esa empresa. Una sesión guardada a mano **con las dos cookies** sigue valiendo: la corta guardada se
usa hasta que llegue una nueva, que va a memoria.

🔴 **La copia en memoria recuerda de qué valor guardado nació.** Al leer, si el valor cifrado de la
base **no es el mismo** del que nació la copia —el acuñador guardó una sesión nueva, o alguien quitó la
conexión—, la copia **se descarta** y se parte de lo guardado. Sin esto, una sesión recién acuñada
perdería contra una corta vieja en memoria y el acuñador habría gastado un login para nada.

**Cómo se decide qué escribir** (afinado en la opinión previa): la sesión que el cliente entrega ya
lleva la copia de memoria encima de lo guardado, y esa copia solo difiere de la base en la corta. Así
que basta **comparar la cookie de 5 días del encabezado nuevo con la del encabezado de la sesión**,
sin leer la base: si cambió → a la base, cifrada, y la copia en memoria se rehace desde la tira que
se acaba de escribir; si no → todo a memoria. Se reconoce **por el prefijo** `remember_web_`, porque el
sufijo es un hash que puede cambiar. **Medido**: en las peticiones normales PsicoAlianza reemite
`XSRF-TOKEN` y `ats_session`, nunca la de 5 días; y el cliente ya descarta el token antifalsificación
antes de entregar.

**Qué queda en la base tras una escritura del almacén**: solo la cookie de 5 días. Una sesión
insertada a mano con las dos **no se limpia nunca**: limpiarla sería una escritura que este paso no
pide.

⚠️ **Un caso que consta y no se trata aparte**: una sesión guardada **sin** cookie de 5 días —pegada a
mano solo con la corta—. Hoy la corta reemitida se persistiría; después, va a memoria y un reinicio la
pierde: la petición falla como *sesión caducada*. Es coherente con la decisión 47 —sin la de 5 días no
hay sesión que sobreviva— y el `.env` local pide las dos.

## Los casos

| Situación | Qué pasa |
| --- | --- |
| Petición normal con sesión de la base | Llega una corta nueva → memoria. **Cero escrituras** |
| Reinicio del backend | Memoria vacía → la primera petición va solo con la de 5 días → PsicoAlianza responde con datos y una corta nueva (medido) → memoria |
| Vence la de 5 días | La petición falla como *sesión caducada* → toca acuñar (2c) |
| El acuñador guarda una sesión nueva | La copia en memoria nació de otro valor → se descarta |
| Se quita la conexión | *Sin sesión*, y la copia se descarta |
| Sesión pegada en local | Igual que hoy |
| Sesión guardada a mano con las dos cookies | Vale; la corta guardada se usa hasta la primera reemisión |
| Dos instancias del backend | Cada una con su corta en memoria y la misma de 5 días. Hoy hay una sola (leído del despliegue) |

## 🔴 Dónde se para — qué NO se hace

- **No se acuña nada**: 2c.
- **No se toca el cliente**, ni cómo funde las cookies, ni la comprobación de sesión.
- **No se toca el esquema** de la conexión ni la lectura única.
- **No se toca la ruta de estado del 5b.**
- **No se escribe «visto vivo» en más sitios** que hoy.

## 🔴 Las trampas

**1. El valor cifrado cambia aunque el contenido no**: el cifrado lleva sal e IV aleatorios (confirmado
en la opinión previa). Comparar **re-cifrando** descartaría la copia en cada lectura. **La huella es la
tira cifrada tal como está en la base, sin tocarla**: la copia guarda la tira de la que nació; al leer,
si la tira actual es otra, se descarta; cuando el almacén escribe una cookie de 5 días nueva, rehace la
copia con la tira que acaba de escribir. **Nunca se descifra ni se cifra para comparar.**

**2. Con la sesión pegada, «de qué nació la copia» no aplica**: no hay valor guardado. La rama manual
se queda exactamente como está —**una sola copia global**, no por empresa—, y su prueba también. La
copia por empresa es solo para las sesiones guardadas.

**3. La copia en memoria es por empresa**, no global: dos empresas con PsicoAlianza no se pisan.

**4. Que la corta ya no se persista no puede romper la lectura de una sesión guardada antes de este
cambio** con las dos cookies dentro: se lee tal cual.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **De dónde sale la sesión** (decisión 42): las dos condiciones de la pegada, y si no la guardada | Es lo que hace funcionar el local |
| **La escritura sin reasignar la lista de conexiones** | La carrera con *Mi compañía* |
| **El contrato del almacén con el cliente** | El cliente no cambia |
| **Compilación y pruebas en verde** | |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`: sin lint ni formateador, sin comentarios nuevos en código,
identificadores en inglés —los nombres de las cookies son contrato—, la solución más pequeña, sin
commitear y todo al índice.

**Documentación en el mismo diff**: ninguna. `../../entorno-local.md` no explica qué guarda el campo de
sesión (comprobado en la opinión previa), el flujo de la etapa **no cambia** —nada de esto se ve— y
`before-deploy.md` tampoco. La bitácora la actualiza el planificador.

## Pruebas

De las cuatro pruebas del almacén sobre cómo escribe, cambian las que afirman lo que ya no es:

- «las cookies reemitidas se escriben cifradas» → **una corta reemitida no toca la base y se usa en la
  siguiente lectura**.
- **Una cookie de 5 días distinta sí se escribe**, cifrada, solo en el campo de sesión de esa conexión,
  sin reasignar la lista.
- **Unas cookies iguales no escriben nada** (se conserva).
- **La copia en memoria se descarta cuando la base cambia**: tras «acuñar» (cambiar el valor guardado),
  la lectura devuelve lo nuevo y no la corta vieja.
- **Tras un almacén nuevo (reinicio) se lee solo lo guardado**, sin corta.
- **Dos empresas no comparten la copia.**
- **Lo de la sesión pegada y «visto vivo» sigue igual**, sin tocar sus pruebas.

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo, y borrarlo después,
limpiando la caché.

## Verificación

Una vez sobre el conjunto: `npm run build` y `npm test` en el backend.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Cómo se resolvió la trampa 1** (la huella de la copia).
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el cliente, el esquema y la rama de la sesión pegada no cambiaron.**
5. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos en código.
6. **Un mensaje de commit.**
