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
| Piezas de la etapa | `psychometric-flow-state.util.ts`, `psychometric-offer-config.util.ts` y su spec, `psychometric-result.util.ts`, `psychometric-invite-alert.service.ts` y su spec, `psychometric-link-delivery.service.ts` y su spec |
| Pruebas del embudo que son de esta etapa | `psychometric-start-through-port.spec.ts`, `psychometric-poll-through-port.spec.ts`, `psychometric-free-text-link-delivery.spec.ts` |

### 2 · Lo que se queda donde está

| Qué | Por qué |
| --- | --- |
| El orquestador entero, con el arranque, el reenvío y el cron | Sacarlos es otro cambio, grande y con riesgo |
| `whatsapp-window.ts` y su spec, incluida la de conservar la hora al entrar a la etapa | Es de todas las etapas |
| `evaluatest.client.ts` | Lo usan también la IA de ofertas y la sincronización de perfiles |
| `demo-mode-evaluatest-mock.spec.ts` | La demo es del embudo entero, y tiene commits de otra persona: moverla complica cambios suyos pendientes |
| 🔴 **`psychometric-invite-message.util.ts`**, el texto del mensaje con el enlace | **Decidido por el usuario el 2026-09-22.** Otra persona tiene una rama que cambia ese texto (ver *La rama de Elvis*). El conflicto existe igual, porque el paso 11 ya sacó el texto del orquestador; pero con el archivo al lado del orquestador, quien fusione lo encuentra enseguida. Los archivos de la carpeta nueva que lo usan (el servicio de entrega y el spec del texto libre) lo importan desde la raíz del embudo |
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
- **No se toca el mensaje con el enlace** (ver *La rama de Elvis*, abajo).
- **No se reformatea** nada: sin lint ni formateador. `git mv` conserva el historial; que el diff muestre
  renombres, no borrados y altas.

## La rama de Elvis

`fix/mensaje-prueba-psicometrica`, de otra persona, cambia el mensaje con el enlace **dentro del
orquestador**, en el texto que el paso 11 sacó a `psychometric-invite-message.util.ts`. Por eso **ese
archivo no se mueve** y **no se toca aquí** (decisión del usuario). Queda anotado en `before-deploy.md`
(fila 10b) para quien fusione.

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
