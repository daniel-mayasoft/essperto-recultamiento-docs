# Brief · Paso 1b — la causal del rechazo final, en el backend

Para quien ejecuta este paso. **Toca el embudo**: cambia lo que pasa cuando un reclutador rechaza a un
candidato en producción, y lo que queda guardado para siempre en la participación. Según
`../psicoalianza/arranque-del-ejecutor.md`, lleva **el tratamiento completo**: das tu opinión, el
planificador contesta, y se repite hasta que no quede nada abierto. Solo backend.

Antes de empezar, lee `../../CLAUDE.md`, el arranque del ejecutor y **`bitacora.md`**, la fuente única
de la verdad de este frente: **decisiones 1 a 15** y los puntos **A a G** de *Lo que dice el código*.
Este brief apunta a ellos por número y no los repite. `planning.md` es el mapa del código.

> Escrito el 2026-09-24 sobre `9cb754a` (la rama con `develop` fusionado), leyendo el servicio del
> desenlace, su prueba, el DTO, el controlador, el esquema de la participación, el servicio de la página
> Candidatos y la pestaña de auditoría del portal.

## Rama y orden

`feat/hiring-rejection-reason`, encima de `9cb754a`. Comprueba antes que el árbol está limpio y que la
rama no va por detrás del remoto. **Su propio commit.** 🔴 **Sin PR a `develop`**: nada del frente entra
ahí hasta terminarlo (bitácora, *Antes de desplegar*).

## Qué le pasa a una persona

Hoy Marta no puede rechazar a Ana sin escribir un texto. Después de este paso, el backend le pide una
causal de la lista y el texto pasa a ser opcional, salvo con «Otro». **El portal todavía no manda la
causal**: hasta el paso 2, en local, todo rechazo desde el portal falla con el mensaje de la decisión
15. Es lo esperado, y la razón por la que la rama no se fusiona sola.

## Qué se hace

### 1 · La lista de causales

Un archivo nuevo, `hiring-rejection-reason.enum.ts`, en `src/offers/enums/rejection/`, junto al de los
motivos del embudo (decisión 16). Dentro, el enum `HiringRejectionReason` (decisión 3) con los **diez
códigos de la decisión 2, en ese orden y escritos exactamente así**. Los nombres de los miembros, en
mayúsculas como en el enum vecino (`NO_SHOW = 'no_show'`). Sin comentarios.

### 2 · El campo en la participación

En el esquema de la participación (`offer.schema.ts`), junto a los otros campos del desenlace, un campo
`hiringOutcomeReason`: texto, **restringido a los valores del enum** y **nulo por defecto**. Es la
misma forma que el campo `hiringOutcome` que tiene al lado.

**El nulo pasa la restricción**: comprobado por el ejecutor en Mongoose 9.5, que acepta el nulo y la
ausencia del campo antes de mirar la lista, y con precedente en el mismo esquema (el género, entre
otros). Aun así se prueba con el esquema real (ver *Pruebas*), porque ninguna prueba actual lo usa y
un fallo aquí bloquearía el guardado de las ofertas (punto G).

**Los comentarios falsos del esquema** (punto B): se borran **enteros** el bloque de `hiringOutcome`
—además de lo de «sobrescribible», dice que aplica solo a quien ocupa una plaza y que la plaza se
facturó al pasar a VIABLE, y las dos cosas ya no son ciertas; lo cierto está en el punto F— y el de una
línea de `hiringOutcomeNote`. No se tocan otros comentarios del archivo.

### 3 · Lo que acepta la API

En el DTO del desenlace, un campo opcional `reason`, junto a `note` (la API recibe `note` y guarda
`hiringOutcomeNote`; con la causal, lo mismo). Se declara con los decoradores del mismo estilo que sus
vecinos, **sabiendo que no validan nada** (punto A), y **con el tipo del enum nuevo**, no como texto:
así, cruzar la causal con la observación no compila. La descripción de `note` pasa a decir que es
opcional y obligatoria con la causal «Otro». La del desenlace deja de decir «status VIABLE»: basta con
que el candidato esté desbloqueado.

En el controlador, el endpoint pasa `dto.reason` al servicio. En la documentación de la API se
actualizan la descripción del error 400, que hoy dice que falla por falta de observación, y el resumen
del endpoint, que habla de un candidato «que ocupa una plaza».

### 4 · La regla, en el servicio del desenlace (decisiones 4 a 7)

Dentro de `setCandidateHiringOutcome`, en `HiringOutcomeService`. El método recibe la causal como
parámetro nuevo, **después del desenlace y antes de la observación**, con el tipo del enum más el
indefinido. Las comprobaciones nuevas **sustituyen a la de la observación obligatoria** y van en su
mismo sitio, antes de leer la oferta:

| Caso | Respuesta | Mensaje exacto |
| --- | --- | --- |
| Desenlace que no es contratado ni rechazado (decisión 20) | 400 | «El desenlace debe ser contratado o rechazado.» |
| Contratado con causal (con valor; el nulo cuenta como sin causal) | 400 | «La causal solo aplica al rechazo.» |
| Rechazo sin causal | 400 | «Selecciona una causal de rechazo. Si no ves el selector, recarga la página.» (decisión 15) |
| Rechazo con una causal que no está en la lista | 400 | «La causal de rechazo no es válida.» |
| Rechazo con «Otro» y sin detalle, o con solo espacios | 400 | «Describe el motivo cuando la causal es «Otro».» |

**Qué cuenta como «sin causal»**: la que no viene y la que viene nula. **Cualquier otro valor fuera de
la lista es «no válida»**, incluida la cadena vacía, y sin recortar espacios: un código con espacios no
es un código.

Lo que ya existe no cambia: que la oferta y el candidato existan, que esté desbloqueado y que la decisión
no se haya tomado antes. **El orden relativo tampoco**: las reglas de entrada van antes de leer la
oferta, como hoy.

**Qué se guarda**: en un rechazo, la causal y la observación sin los espacios de los extremos (nula si
queda vacía). En un contratado, las dos nulas. La fecha y quién decidió, como hoy. **La respuesta de la
API no cambia**: el portal vuelve a cargar la oferta tras guardar.

**La auditoría** (decisión 9): la entrada del rechazo lleva la causal junto a la observación, con la
clave `reason`. Si la observación es nula, se guarda nula igual que hoy; la pestaña de auditoría del
portal ya oculta los valores nulos. El contratado no lleva ninguna de las dos, como hoy.

**El comentario de encabezado del método se borra entero.** Es falso (dice que no llama al servicio de
planes) y lo que tenía de cierto ya está en la bitácora, punto F y decisión 10.

### 5 · La página Candidatos

En el servicio de candidatos, el tipo `RevealedCandidateProcess` y la función que lo arma,
`buildRevealedProcess`, suman `hiringOutcomeReason`, junto a la observación y nulo si no existe, con
el tipo del enum más el nulo. **La
ficha de la oferta no se toca**: recibe la participación entera (punto D).

### 6 · La prueba del desenlace, en inglés

`src/offers/test/set-candidate-hiring-outcome.spec.ts` se reescribe para la regla nueva y **sus
identificadores pasan al inglés** (pendiente anotado en la bitácora): las funciones auxiliares, sus
parámetros —también los de los callbacks— y las variables. Los `describe`, los `it` y los comentarios
siguen en español. **Renombrar editando, nunca con buscar y reemplazar.**

## 🔴 Dónde se para — qué NO se hace

- **Nada del portal ni de la analítica.** Son los pasos 2 y 3.
- **No se enciende la validación global** ni se hace que el DTO valide (punto A). El tope de 1000
  caracteres sigue sin regir.
- **No se toca la regla de la decisión definitiva** ni la de desbloqueo (decisión 10).
- **No se migra nada**: los rechazos anteriores quedan sin causal (decisión 8).
- **No se renombran identificadores en español fuera de la prueba del desenlace.** En la prueba de la
  página Candidatos, lo nuevo va en inglés y lo existente se queda.
- **Boy scout** (decisión 19): solo importaciones sin usar en los archivos que el paso ya toca.
- **No se añaden comentarios** en el código. El contexto está en la bitácora y en la prosa de las
  pruebas.
- **Sin lint ni formateador.**
- **Sin PR a `develop`.**

## Opinión previa del ejecutor (2026-09-24), verificada e incorporada

El cuerpo del brief ya está corregido con lo decidido; esta tabla es el registro.

| Punto | Decidido |
| --- | --- |
| 1 · El desenlace tampoco se valida: «pendiente» pasa, deja fecha y autor y audita un rechazo que no existió; un valor inventado da 500 | **Entra en el paso** (decisión 20): fila nueva en la tabla y caso 9 de las pruebas. Es el bloque que el paso reescribe y la decisión 7 dice que toda la validación va en el servicio |
| 2 · Qué cuenta como «sin causal» | **Aceptado tal cual**: ausente o nula es «sin causal»; cualquier otro valor fuera de la lista, cadena vacía incluida y sin recortar, es «no válida»; el contratado con causal nula no falla |
| 3 · Causal y observación se pueden cruzar por posición | **Aceptado**: la causal lleva el tipo del enum en el DTO y en el servicio |
| 4 · El nulo en el esquema, comprobado en Mongoose 9.5, con precedente del género | Comprobado también por el planificador (acepta el nulo y el indefinido antes de mirar la lista). La prueba del esquema se mantiene |
| 5 · Mongoose valida al guardar solo lo modificado | Correcto, y el punto G de la bitácora queda precisado. La conclusión no cambia: 33 sitios del código marcan la lista entera de participaciones como modificada |
| 6 · La prueba del esquema mira solo el campo nuevo | **Aceptado** |
| 7 · El guardado contra Mongo real no se puede hacer ni hace falta | **Aceptado**: se quita; queda el arranque |
| 8 · Borrar solo una frase deja el bloque del esquema falso | **Aceptado**: se borran enteros. También se corrige el «status VIABLE» de la descripción del desenlace en el DTO; y el planificador añade el resumen del endpoint, que dice lo mismo |
| 9 · La pestaña de auditoría del portal va a mostrar el código, no la etiqueta | **Para el paso 2**, anotado en la bitácora |
| 10 · El tipo de la causal en la respuesta de la página Candidatos | **Aceptado**: el enum más el nulo |

**Se puede empezar**, después de medir otra vez la línea base.

## Pruebas

En `src/offers/test/` (punto E). Prosa del caso de negocio en los `it` y en los comentarios de la
prueba, que es su sitio.

**La prueba del desenlace** conserva todos los casos actuales —ajustados a la causal donde rechazan— y
suma:

1. Rechazo sin causal, y con la causal nula: 400 con el mensaje exacto de la decisión 15, y la oferta
   ni se lee.
2. Rechazo con un código que no está en la lista, y con la cadena vacía: 400.
3. Contratado con causal: 400; el contratado sin causal y con la causal nula sigue funcionando.
4. «Otro» sin detalle, y «Otro» con solo espacios: 400.
5. «Otro» con detalle: se guarda la causal y el detalle.
6. Rechazo con causal y sin detalle: se guarda, con la observación nula. **Es el cambio visible de la
   decisión 6**; el caso de hoy «400 si se rechaza sin observación» deja de existir y su sitio lo ocupa
   este.
7. La auditoría del rechazo lleva `reason` y `note`; la del contratado, ninguna.
8. El contratado deja la causal nula.
9. Desenlace «pendiente» y desenlace inventado: 400, sin leer la oferta ni escribir auditoría
   (decisión 20).

**Una prueba nueva del esquema** (punto G), con el esquema real de la participación y **sin base de
datos** (validación síncrona de Mongoose), **mirando solo el error del campo nuevo**, no la validez del
documento entero, que puede fallar por otros campos obligatorios: sin error con la causal nula, **sin
error sin el campo** (una participación antigua), sin error con un código válido y **con error con uno
que no está en la lista**.

**La prueba de la página Candidatos** (`search-revealed-candidates.spec.ts`): un proceso rechazado con
causal la devuelve; uno antiguo sin el campo la devuelve nula.

**Control negativo** en las tres: invierte una expectativa de cada una, comprueba que falla y deshazlo.

## Verificación

`npx jest --clearCache`, `npm run build` y `npm test`, **una vez sobre el conjunto del cambio**.

**Línea base** tras la fusión de `develop` (bitácora, registro del 2026-09-24): **152 suites y 1.574
pruebas (1.565 pasan, 9 omitidas)**. El final son esas más las nuevas, menos la que desaparece (el caso
del punto 6). Da el número exacto y cuenta de dónde sale cada diferencia.

**Arranque del backend en local**, como en el paso 1a, para comprobar que levanta. No hay guardado
contra Mongo real: la base local no tiene ofertas, y la restricción la aplica Mongoose antes de
escribir, por el mismo código que ejercita la prueba del esquema.

🔴 No correr `npm run lint`.

**Documentación**: este paso no cambia el mapa de `planning.md`. La bitácora la actualiza el
planificador.

## Qué entregar

1. Qué cambió y qué se verificó, con el resultado real y el número exacto de pruebas.
2. **Confirmación explícita** de que el nulo y la ausencia del campo pasan la validación del esquema,
   con el nombre de la prueba que lo demuestra.
3. Los mensajes de error, copiados del código, para compararlos con la tabla.
4. La lista de identificadores de la prueba del desenlace que pasaron al inglés, con su nombre anterior.
   Y la lista de identificadores nuevos de todos los archivos tocados, **mirada abriendo cada archivo**,
   no el diff.
5. **Qué decisiones tomaste que no estaban en el brief.**
6. Los archivos nuevos **añadidos al índice**, y que el índice y el árbol coinciden.
7. Un mensaje de commit para el backend.
