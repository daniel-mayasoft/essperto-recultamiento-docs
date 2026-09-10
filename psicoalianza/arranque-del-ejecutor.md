# Arranque · para quien ejecuta un paso de la integración de PsicoAlianza

Este documento no dice qué hacer —eso lo dice el brief del paso—, sino **cómo se trabaja
en este frente y qué ya salió mal**. Se lee una vez, al empezar.

## Los dos papeles

Hay un **planificador**, que escribe los briefs y revisa el diff, y un **ejecutor**, que
es quien lee esto. El ejecutor no hereda contexto: llega a cada paso con lo que esté
escrito, y nada más.

🔴 **Antes de tocar código, el ejecutor da su opinión del plan.** No es un trámite. Todos
los briefs lo piden y es **el único punto donde alguien puede frenar un error antes de
que llegue a producción**. Tres ejemplos reales de lo que salió de ahí, y los tres iban
camino de producción:

- Un brief describía al revés cómo funciona el desvío de correos de pruebas: decía que
  sin el campo el desvío no funcionaba, cuando es al contrario.
- Un brief decía que la invitación de EvaluaTest son tres pasos. Son cuatro: el cuarto
  es un respaldo por correo que rescata al candidato al que la invitación normal no
  encuentra. Sin él, algunas personas se quedan sin su prueba y nada falla.
- Un brief daba por hecho que el enlace del candidato salía de la invitación. Sale de
  otro sitio, con configuración propia.

**Si algo del brief no cuadra con el código, gana el código.** Dilo antes de empezar, con
el árbol de trabajo limpio, no a mitad del cambio.

## Qué leer, y en qué orden

1. `../CLAUDE.md` — el proyecto: repositorios, verificación, vocabulario, deuda conocida.
2. `integrate-psicoalianza.md` — **la bitácora, que es la fuente única de la verdad.**
   Tiene las decisiones numeradas, las preguntas abiertas y el registro de avance. Si el
   brief y la bitácora se contradicen, avisa: alguien tiene que arreglar uno de los dos.
3. `psicoalianza-api.md` — el contrato observado del segundo proveedor. Sirve para no
   dibujar contratos calcados del primero.
4. El brief del paso, que dice qué se hace y dónde se para.

Los briefs **apuntan** a la bitácora, nunca la repiten: dos copias de una decisión se
desincronizan y nadie lo nota. Si ves una decisión explicada entera dentro de un brief,
probablemente sobra ahí.

## Cómo es un paso

- **Uno por brief, con línea de parada explícita.** El brief dice qué NO se hace. Esa
  lista es tan vinculante como el alcance.
- **Cada paso preserva el comportamiento.** Lo que cambia lo que ve una persona va en su
  propio cambio, nunca dentro de un paso que promete ser invisible.
- **La solución más pequeña que resuelve el caso.** Nada de refactorizar de paso.
- **No se commitea.** El árbol se deja como está para que se revise el diff. El mensaje
  de commit se entrega en el reporte y lo aplica quien corresponda.

## Lo que ya salió mal aquí

Cinco cosas, todas ocurridas en este frente:

🔴 **Un formateador reformateó archivos que nadie tocó.** Entraron ~190 líneas de ruido
en dos archivos y desaparecieron comentarios. No rompió nada, pero el diff dejó de ser
revisable y `git blame` sobre esas líneas ahora apunta al commit equivocado. **No correr
el lint ni ningún formateador. Si el editor formatea al guardar, apagarlo.**

🔴 **Una prueba nueva quedó sin rastrear** y estuvo a punto de no revisarse, porque
"revisa el diff" no la incluía. **Los archivos nuevos se añaden al índice.**

🔴 **Un archivo temporal de prueba dejó rastro.** Si creas uno para tantear, **bórralo y
limpia la caché de Jest** antes de reportar, o la verificación puede fallar en frío para
quien venga después.

🔴 **El árbol de trabajo difería de lo preparado**, así que un commit directo habría
guardado una versión distinta de la revisada. Comprueba los dos antes de reportar.

🔴 **Dos pasos estuvieron a punto de mezclarse en un solo diff.** Si el paso anterior
sigue sin commitear, dilo y espera: mezclarlos hace irrevisables los dos.

Y una que no llegó a pasar porque se paró a tiempo: **`git checkout`, `restore`,
`reset --hard` y `clean` no son herramientas de recuperación, son de destrucción.** En
este frente hubo una propuesta de "restaurar desde el índice" que habría borrado
ediciones deliberadas del usuario. No se corren sin avisar.

## Verificación

La del proyecto, corrida **una vez sobre el conjunto del cambio**, no archivo por
archivo. El resultado real va en el reporte. Si falla, el paso no está terminado.

⚠️ **Una prueba que pasa a la primera merece desconfianza.** La costumbre de la casa es
comprobar que muerde: escribir un control negativo con las expectativas invertidas,
verificar que falla, y borrarlo. Sin eso, un archivo de pruebas verde no dice nada.

## Qué entregar al terminar

Un reporte **corto**:

1. Qué cambió y qué se verificó, con el resultado real.
2. Qué quedó fuera y por qué.
3. **Qué decisiones se tomaron que no estaban en el brief.** Es lo más importante: es lo
   que se pierde entre sesiones y lo que sale caro descubrir después leyendo el diff.
4. Lo que el brief pida confirmar explícitamente, que suele ser lo que falla en silencio.

## Lo que no se puede suponer

- **Que el nombre en inglés de algo es el correcto.** Hay falsos amigos heredados en el
  código. Reusa el término que el proyecto ya usa, salvo que sea uno de esos.
- **Que un campo opcional siempre viene.** Varias trampas de este frente son campos que
  nacen en nulo y hacen que el sistema invente un valor.
- **Que "no falla" significa "está bien".** Casi todo lo que se rompió aquí seguía
  compilando, pasando las pruebas y devolviendo 200.
