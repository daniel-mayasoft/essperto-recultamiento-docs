# Brief · Etapa 3, paso 12 — la etapa psicométrica del embudo en su propia carpeta

Para quien ejecuta este paso. **Es un paso mecánico: mueve archivos y saca una pieza del orquestador, sin
cambiar ningún comportamiento.** Según `arranque-del-ejecutor.md`, lleva brief corto y una sola ronda: das
tu opinión, el planificador contesta, y se arranca. Si aparece algo grande, se para. Solo backend.

> Escrito el 2026-09-22 comprobando en el código quién importa cada archivo que se mueve, dónde viven los
> identificadores de los botones de las plantillas, qué ramas vivas tocan estos archivos y que ningún spec
> que se mueve sustituye dobles por ruta (`jest.mock`).

## Rama y orden

`feat/psychometric-followups`, **encima del commit del paso 11 con su arreglo**. Si el paso 11 no está
commiteado, dilo y espera: mezclar los dos hace irrevisables los dos. Va en **su propio commit** y se
despliega con los pasos 10 y 11.

## Qué se hace

### 1 · Una carpeta nueva, `src/offers/pipeline/psychometric-stage/`

Para lo que hace **el embudo** en la etapa psicométrica. No `psychometric`: ya existe
`src/offers/psychometrics/`, la capa de proveedores, y dos nombres casi iguales invitan a equivocarse.

Se mueven **con `git mv`**, sin renombrar ningún archivo:

| Qué | Archivos |
| --- | --- |
| Piezas de la etapa | `psychometric-flow-state.util.ts`, `psychometric-offer-config.util.ts` y su spec, `psychometric-result.util.ts`, `psychometric-invite-message.util.ts`, `psychometric-invite-alert.service.ts` y su spec, `psychometric-link-delivery.service.ts` y su spec |
| Pruebas del embudo que son de esta etapa | `psychometric-start-through-port.spec.ts`, `psychometric-poll-through-port.spec.ts`, `psychometric-free-text-link-delivery.spec.ts` |

### 2 · Lo que se queda donde está

| Qué | Por qué |
| --- | --- |
| El orquestador entero, con el arranque, el reenvío y el cron | Sacarlos es otro cambio, grande y con riesgo |
| `whatsapp-window.ts` y su spec, incluida la de conservar la hora al entrar a la etapa | Es de todas las etapas |
| `evaluatest.client.ts` | Lo usan también la IA de ofertas y la sincronización de perfiles |
| `demo-mode-evaluatest-mock.spec.ts` | La demo es del embudo entero, y tiene commits de otra persona: moverla complica cambios suyos pendientes |
| ~~`psychometric-invite-message.util.ts`~~ | ~~Se quedaba por el conflicto con la rama de Elvis.~~ **Corregido por el usuario el 2026-09-22, en la opinión previa: se mueve** con las demás piezas (tabla de arriba). La rama de Elvis ya está fusionada y su texto vive en ese archivo; no queda conflicto que evitar |
| `src/offers/psychometrics/`, la capa de proveedores | Sin cambios |

### 3 · Los botones de las plantillas salen del orquestador a la raíz del embudo

Los identificadores de los dos botones —continuar (`resume_flow`) y retirarse (`withdraw_process`)— con sus
títulos de respaldo (`continuar proceso`, `ya no me interesa`) viven hoy en el orquestador. Pasan a **un
archivo propio en `src/offers/pipeline/`**, no en la carpeta nueva: el enrutado los usa en todas las
etapas. **Los comentarios largos que los acompañan se mueven enteros**: documentan trampas (por qué se
reconoce también el título, por qué existe el botón de retirarse).

### 4 · La plantilla de etapa pendiente sale del orquestador, a la raíz del embudo

Los componentes de `pending_process_reminder` —las tres variables en orden y los dos botones con sus
identificadores y posiciones— se arman hoy dentro del orquestador. Pasan al **mismo archivo de la raíz
del punto 3**, o a uno junto a él, como una función **sin dependencias** que recibe nombre, vacante y
empresa y devuelve los componentes. **No va a la carpeta nueva**: la plantilla se hizo genérica a
propósito («tienes una etapa pendiente», decisión 59) para servir a otras etapas. El orquestador conserva
el envío —lee el nombre de la plantilla de la configuración y llama al cliente de WhatsApp con esos
componentes—, «Candidato» de respaldo y sin reintento, **exactamente como hoy**.

### 5 · Las rutas de importación

Comprobado el 2026-09-22 quién importa cada archivo que se mueve: el orquestador, el módulo de ofertas, el
servicio de entrega y el spec del texto libre. Dentro de la carpeta nueva los archivos se importan entre
sí. Un error de ruta falla ruidoso en la compilación. **Busca además** cualquier importación que no haya
salido en esa comprobación antes de dar el paso por hecho.

## 🔴 Dónde se para — qué NO se hace

- **Ningún cambio de comportamiento.** Ni un texto, ni una regla, ni el orden de nada.
- **No se renombra ningún archivo, clase, función ni constante.** Solo cambian de sitio.
- **No se toca el texto del mensaje con el enlace**: su archivo se mueve, pero no cambia una letra.
- **No se reformatea** nada: sin lint ni formateador. `git mv` conserva el historial; que el diff muestre
  renombres, no borrados y altas.

## La rama de Elvis

~~`fix/mensaje-prueba-psicometrica`, de otra persona, cambia el mensaje con el enlace **dentro del
orquestador**… Por eso **ese archivo no se mueve**.~~ **Resuelto el 2026-09-22**: la rama se fusionó y su
texto se llevó al archivo del mensaje (fila 10b de `before-deploy.md`, resuelta). Por eso el archivo **sí
se mueve** (decisión del usuario en la opinión previa).

## Opinión previa del ejecutor (2026-09-22), verificada e incorporada

Llegó sin numeración (cita «el punto 5», que es el de mover el archivo del mensaje). Lo decidido:

| Punto | Decidido |
| --- | --- |
| Los dos commits del usuario después de la fusión («Busca» en el texto y sus dos pruebas) | Correcto no contarlos como parte del paso |
| Importaciones, rutas en las pruebas, botones y documentación | Coinciden con lo comprobado al escribir el brief. Ningún documento vivo nombra estas rutas: no se toca documentación salvo la tabla de la etapa 3 |
| La fila 10b de antes de desplegar | **Ya estaba resuelta** en el disco y commiteada; lo único viejo era la mención a «Búscate», corregida |
| **Mover el archivo del mensaje** | **Se mueve** (decisión del usuario) |
| Nombres | `whatsapp-template-buttons.ts` en la raíz del embudo, con los cuatro valores y sus comentarios enteros, y la función `buildPendingProcessTemplateComponents`. Aceptados |
| La línea base | **141 suites y 1.478 pruebas (1.469 pasan, 9 omitidas)**, medida por el planificador con la caché limpia tras la fusión y el arreglo. El final da lo mismo más la prueba nueva |

**Se puede empezar.**

## Pruebas

- Las pruebas **no cambian ninguna afirmación**. Las que se mueven, se mueven enteras.
- **Una prueba nueva** para la función de los componentes de la plantilla: las tres variables en orden y
  los dos botones con sus identificadores y posiciones. Las pruebas del arranque que ya afirman el envío
  de la plantilla siguen pasando sin cambios; si alguna cambia, decirlo.
- Control negativo en la prueba nueva.

## Verificación

`npx jest --clearCache`, `npm run build` y `npm test`, una vez sobre el conjunto. **Mismo número de pruebas
que tras el paso 11 más la nueva.** Si baja, decir cuáles y por qué.

**Documentación en el mismo diff:** solo los documentos vivos que nombran rutas de estos archivos —
`../CLAUDE.md` y `flujo-actual-etapa-psicometrica.md`, si las nombran—. La bitácora y los briefs cerrados
no se tocan.

## Qué entregar

1. Qué se movió y qué se verificó, con el resultado real.
2. La lista de archivos movidos, y cómo se llama el archivo de la raíz del embudo.
3. Confirmación de que ninguna afirmación cambió, de que `git` ve los movimientos como renombres, y de que
   el diff no trae cambios de formato ni comentarios nuevos.
4. Un mensaje de commit para el backend.
