# Brief · Paso 1a — los motivos a su carpeta y el desenlace a su servicio

Para quien ejecuta este paso. **Es un paso mecánico: mueve un archivo y saca un método del servicio de
ofertas a un servicio propio, sin cambiar ningún comportamiento.** Según
`../psicoalianza/arranque-del-ejecutor.md`, lleva brief corto y una sola ronda: das tu opinión, el
planificador contesta, y se arranca. Si aparece algo grande, se para. Solo backend.

Antes de empezar, lee `../../CLAUDE.md`, el arranque del ejecutor y **`bitacora.md`**, que es la fuente
única de la verdad de este frente. Este paso ejecuta sus **decisiones 16 a 19**. `planning.md` es el
mapa del código.

> Escrito el 2026-09-24 comprobando en `develop`, ya al día con el remoto: quién importa el archivo de
> motivos, quién llama al método del desenlace, cómo construyen sus pruebas el servicio y el controlador, y
> que ninguna prueba sustituye estos archivos por ruta (`jest.mock`). La búsqueda fue por el nombre del
> archivo y del método en todo `src/`; no cubre una importación armada con una ruta dinámica, que en este
> proyecto no se usa.

## Rama y orden

`feat/hiring-rejection-reason`, **nueva, desde `develop`**, solo en el backend. Antes de crearla, trae
los cambios del remoto y comprueba que el árbol está limpio. Este paso va en **su propio commit**; el
paso 1b, la causal, va encima y en otro.

## Qué se hace

### 1 · La lista de motivos del embudo, a su carpeta (decisión 16)

Se crea `src/offers/enums/rejection/` y se mueve ahí **con `git mv`** `rejection-reason.enum.ts`, **sin
renombrarlo y sin cambiar una letra**. La carpeta recibe en el paso 1b la lista de causales; en este paso
solo lleva ese archivo.

Lo importan **nueve archivos**, comprobado el 2026-09-24:

| Tipo | Archivos |
| --- | --- |
| Código | `src/metrics/metrics.service.ts`, `src/offers/blacklist/blacklist-evaluation.ts`, `src/offers/pipeline/pipeline-orchestrator.service.ts` |
| Pruebas | `src/offers/pipeline/test/`: `despacho-por-etapa`, `evaluatest-reminders-and-timeout-message`, `evaluatest-timeout-full-lifecycle.integration` y `stalled-active-flows`; y `src/offers/pipeline/psychometric-stage/test/`: `psychometric-poll-through-port` y `psychometric-start-through-port` |

Se corrige la ruta **editando cada archivo**. 🔴 **Nada de buscar y reemplazar global.**

### 2 · El desenlace de contratación, a su servicio (decisión 17)

Un archivo nuevo, `src/offers/hiring-outcome.service.ts`, junto a `offer-intake.service.ts`, que es el
precedente de un servicio sacado del de ofertas. Dentro, la clase `HiringOutcomeService`.

| Qué | Cómo |
| --- | --- |
| **El método** | `setCandidateHiringOutcome` sale **entero** de `offers.service.ts` —su comentario de encabezado incluido, tal cual— y **conserva el nombre, la firma y el tipo que devuelve** |
| **Sus dependencias** | El modelo de ofertas y el servicio de planes del tenant, con **los mismos nombres de propiedad que tienen hoy** en el servicio de ofertas (`offerModel` y `tenantPlan`), y un `Logger` propio. Las funciones de visibilidad y de auditoría ya están en archivos propios: se importan desde ahí |
| **La lectura de identificadores** | El método usa hoy dos funciones privadas del servicio de ofertas que convierten el id de la oferta y el del candidato, con sus mensajes de error. **El servicio nuevo lleva sus propias copias, con los mismos mensajes**, como ya hace el servicio de candidatos. Las del servicio de ofertas se quedan: tienen 29 usos más |
| **El controlador** | Recibe `HiringOutcomeService` en el constructor, y el endpoint del desenlace **lo llama directamente**. Permisos, decoradores de la documentación y parámetros, sin cambios |
| **El servicio de ofertas** | Pierde el método. **No lo reenvía**: no queda ningún método puente |
| **El módulo** | `HiringOutcomeService` se registra como proveedor del módulo de ofertas. No se exporta: nadie de fuera lo usa |

⚠️ **Lo único que cambia de verdad**: los registros del log de este método salen con el contexto del
servicio nuevo en vez de `OffersService`. El texto del mensaje no cambia. Se asume.

### 3 · La prueba del desenlace

`src/offers/test/set-candidate-hiring-outcome.spec.ts` construye hoy el servicio de ofertas sin su
constructor y le pone a mano el modelo y el servicio de planes. **Pasa a construir `HiringOutcomeService`
del mismo modo.** Como las propiedades se llaman igual, el cambio debería ser la importación y la clase.
**Ninguna expectativa cambia.** Si hace falta cambiar una, para y dilo: significa que el comportamiento
no se conservó.

La prueba del controlador que ya existe (`subir-el-tope-despierta-la-cola`) construye el controlador sin
su constructor, así que la dependencia nueva no la afecta.

### 4 · Regla del boy scout (decisión 19)

**Solo en los archivos que este paso ya toca, y solo lo mecánico:** importaciones que quedan sin usar
—las que deja el método al irse del servicio de ofertas, y las que ya estaban sin usar—. Nada de nombres,
lógica, orden, comentarios ni formato, y **ningún archivo entra al diff solo por esto**. Lista en el
reporte qué quitaste y de qué archivo.

## 🔴 Dónde se para — qué NO se hace

- **Ningún cambio de comportamiento.** Ni un mensaje de error, ni una regla, ni el orden de las
  comprobaciones.
- **Nada de la causal**: ni la lista nueva, ni el campo, ni la validación nueva. Es el paso 1b.
- **No se tocan los comentarios del esquema del desenlace**, aunque uno de ellos nombra
  `OffersService.setCandidateHiringOutcome` y dice algo falso: los corrige el paso 1b (punto B de la
  bitácora). Moverlo aquí mezcla los dos pasos.
- **No se renombra ningún archivo, clase, función ni constante**, salvo lo que el propio movimiento
  crea.
- **No se refactoriza nada más del servicio de ofertas.** Ni sus otras validaciones ni sus lectores de
  identificadores.
- **No se reformatea**: sin lint ni formateador. Si el editor formatea al guardar, apágalo. `git mv`
  conserva el historial; el diff tiene que mostrar el archivo de motivos como renombre, no como
  borrado y alta.
- **No se añaden comentarios** en el código.

## Pruebas

- **Ninguna afirmación cambia.** Las pruebas que solo cambian una ruta de importación, cambian solo eso.
- **No hay prueba nueva**: el comportamiento es el mismo y ya lo cubre la del desenlace.
- **Control negativo sobre la prueba del desenlace**: invierte una expectativa —por ejemplo, que el
  rechazo sin observación sí se guarda—, comprueba que falla contra el servicio nuevo y deshazlo. Así se
  demuestra que la prueba ejercita el servicio nuevo y no otra cosa.

## Verificación

`npx jest --clearCache`, `npm run build` y `npm test`, **una vez sobre el conjunto del cambio**.

**Línea base**, medida por el planificador en `develop` con la caché limpia el 2026-09-24:
**152 suites y 1.575 pruebas (1.566 pasan, 9 omitidas)**. El resultado final tiene que dar
**exactamente lo mismo**: ni una prueba más ni una menos. Si cambia, di cuáles y por qué. El aviso de
que un proceso de Jest no terminó limpio ya sale en `develop`: no es de este paso.

🔴 No correr `npm run lint`.

**Documentación en el mismo diff**, en el repositorio de documentación: las filas de `planning.md` que
nombran dónde vive el método del desenlace y dónde va la lista nueva. La bitácora y este brief no se
tocan.

## Qué entregar

1. Qué se movió y qué se verificó, con el resultado real y el número de pruebas.
2. Confirmación de que **ninguna expectativa cambió**, de que `git` ve el archivo de motivos como
   renombre, y de que el diff no trae cambios de formato ni comentarios nuevos.
3. Las importaciones que quitaste por la regla del boy scout, archivo por archivo.
4. **Qué decisiones tomaste que no estaban en el brief.**
5. Los archivos nuevos **añadidos al índice**, y que el índice y el árbol de trabajo coinciden.
6. Un mensaje de commit para el backend y otro para el repositorio de documentación.
