# Bitácora · la causal del rechazo final

**La fuente única de la verdad de este frente.** Aquí están las decisiones numeradas, lo que el
código dice y los documentos no, lo que queda fuera, el avance y lo que hay que hacer antes de
desplegar. Los briefs apuntan aquí por número; no repiten las decisiones.

Qué se pide y el alcance acordado con la dirección: `requisitos.md`. Cómo funciona hoy y dónde
está cada pieza: `planning.md` (con las correcciones de la sección *Lo que dice el código*, más
abajo, que ganan sobre él).

## Vocabulario de este frente

- **Rechazo final** — lo que el reclutador hace con «Marcar como rechazado» sobre un candidato
  desbloqueado. En el código es el **desenlace de contratación** con valor rechazado. El requisito
  lo llama «descarte tras la entrevista», pero no hay garantía de entrevista (ver *Lo que dice el
  código*, punto C).
- **Descarte** — lo que hace el sistema en el embudo automático. No es de este frente.
- **Causal** — el motivo elegido de la lista fija al hacer un rechazo final.
- **Detalle** — el texto libre que acompaña a la causal. Es la observación que hoy existe.
- **Participación** — el registro de un candidato dentro de una oferta. La causal se guarda ahí.

## Decisiones

1. **La lista es fija, está en el código del backend y es igual para todas las empresas.** Ninguna
   empresa la configura ni la amplía.
2. **Los valores guardados son códigos en inglés, en minúsculas y con guion bajo**, con el mismo
   formato que los motivos del descarte automático. Son un contrato con los datos ya guardados:
   **no se renombran nunca**. Lo que ve el reclutador son etiquetas de los textos del portal, en
   español y en inglés, y esas sí se pueden cambiar.

   | Etiqueta | Código guardado |
   | --- | --- |
   | No se presentó a la entrevista | `no_show` |
   | Desistió del proceso | `withdrew` |
   | No cumple el perfil técnico | `technical_profile_mismatch` |
   | No cumple competencias blandas | `soft_skills_mismatch` |
   | Presentación personal inadecuada | `inappropriate_appearance` |
   | Conducta inapropiada | `inappropriate_conduct` |
   | Expectativa salarial fuera de rango | `salary_expectation_mismatch` |
   | Disponibilidad incompatible | `availability_mismatch` |
   | Se seleccionó a otro candidato | `other_candidate_selected` |
   | Otro | `other` |

   El selector del portal las muestra en este orden.
3. **Nombres en el código.** El campo nuevo de la participación es `hiringOutcomeReason`, en la
   familia de los que ya existen (`hiringOutcome`, `hiringOutcomeNote`, `hiringOutcomeAt`,
   `hiringOutcomeBy`). La lista es su propio enum, `HiringRejectionReason`. No se reusa
   `RejectionReason`, que es el del embudo automático y significa otra cosa.
4. **La causal es solo del rechazo.** Un «contratado» no la lleva, y si la trae, el backend lo
   rechaza.
5. **La causal es obligatoria al rechazar.** Sin causal, o con un valor que no está en la lista,
   el backend no guarda el rechazo.
6. **El detalle deja de ser obligatorio, salvo con «Otro».** Es un cambio visible sobre un flujo
   en producción, asumido a propósito. Un detalle que solo tiene espacios cuenta como vacío, igual
   que hoy.
7. **Toda esa validación va en el servicio, no en el DTO** (el objeto que declara qué acepta la
   API). Motivo: *Lo que dice el código*, punto A.
8. **Los rechazos anteriores al cambio no reciben causal.** El campo nace vacío y nadie lo
   rellena: no hay migración. En la analítica forman el grupo «sin causal». En las fichas se ven
   como hoy, solo con el texto, sin etiqueta de «sin causal».
9. **La auditoría guarda la causal** junto a la observación, en la entrada del rechazo.
10. **La decisión sigue siendo definitiva.** Una causal equivocada no se puede corregir, y se
    queda mal contada en la analítica. Asumido. Si algún día hace falta corregirla, es un frente
    aparte: botón, permiso y auditoría propios.
11. **La causal se ve en las dos pantallas que hoy muestran la razón del rechazo**: la ficha del
    candidato dentro de la oferta y la página Candidatos. Primero la causal y, debajo, el detalle
    si lo hay.
12. **La analítica suma un bloque, «Motivos de rechazo final»** (en inglés, *Final rejection
    reasons*), **solo en el panel global.** El detalle de cada oferta no lo lleva: para ver una
    oferta, se elige en el filtro de Ofertas.
13. **El bloque cuenta los rechazos finales por causal, más el grupo «sin causal».** Solo cuenta:
    el detalle no aparece en la analítica.
14. **El bloque sigue las reglas del resto del panel, sin excepciones**: el filtro de fechas mira
    cuándo se creó la oferta, no cuándo se tomó la decisión; sin estado elegido, las ofertas
    canceladas no suman; con el estado «Cancelada», sí.
15. **El error del backend cuando falta la causal le dice a la persona qué hacer**: «Selecciona
    una causal de rechazo. Si no ves el selector, recarga la página.» Es lo único que lee quien
    tenga abierta una pestaña del portal anterior al despliegue (*Antes de desplegar*).
16. **Las dos listas de motivos viven en una carpeta propia, `rejection`, dentro de los enums del
    módulo de ofertas**: la del embudo automático, que se mueve sin renombrarse, y la nueva de
    causales. Siguen siendo cosas distintas; la carpeta solo las agrupa.
17. **El desenlace de contratación sale del servicio de ofertas a un servicio propio,
    `HiringOutcomeService`**, con todas sus reglas —las de hoy y las nuevas—. El método conserva
    su nombre. **Lo llama el controlador directamente**; el servicio de ofertas no lo reenvía. El
    servicio nuevo lee los identificadores con su propia función, como ya hace el de candidatos.
    El resto del servicio de ofertas no se refactoriza en este frente.
18. **Mover y cambiar no van en el mismo diff.** La decisión 16 y la 17 son el paso 1a, mecánico y
    con el mismo comportamiento; la causal es el paso 1b, encima.
19. **Regla del boy scout, solo para lo mecánico.** En los archivos que un paso ya toca, se deja
    mejor lo que es importación y exportación: importaciones sin usar, rutas que el propio
    movimiento cambia. Nada de nombres, lógica, comentarios ni formato, y ningún archivo entra al
    diff solo por esto.

## Lo que dice el código y los documentos no

Comprobado leyendo el código de `develop` el 2026-09-23, y revisado el 2026-09-24 contra lo que
entró después (tope y cobro de candidatos procesados): no toca la zona de este frente salvo en C y
E.

- **A. La validación del DTO no se aplica.** La validación global del backend está comentada en
  el arranque, y el endpoint del desenlace no declara ninguna propia. Por eso hoy no rige ni el
  tope de 1000 caracteres de la observación ni la lista de desenlaces válidos: la única regla que
  funciona es la escrita a mano en el servicio. Una causal validada solo con decoradores compila,
  pasa las pruebas y no impide nada. Comprobado buscando en todo el backend dónde se registra la
  validación: solo aparece en ese bloque comentado. Una búsqueda así no cubre una validación
  armada de otra forma, pero el endpoint recibe el cuerpo sin ninguna.
- **B. El comentario del campo guardado miente.** Dice que el desenlace se puede sobrescribir y
  que la corrección queda en la auditoría. El servicio lo impide. El paso 1 lo corrige, igual que
  el que dice que la observación es obligatoria al rechazar.
- **C. Rechazar no implica haber entrevistado.** Se puede decidir sobre cualquier candidato
  desbloqueado. En las empresas que pagan por plaza, eso es el ganador de una plaza, el revelado
  del grupo o el añadido a mano. En las que pagan por candidato procesado, es el que ya costó algo
  —se indexó su hoja de vida o se le escribió— o el añadido a mano, así que se puede rechazar a
  alguien que va a mitad del embudo. De ahí el título del bloque (decisión 12). Corregido el
  2026-09-24: el criterio del modelo por procesados cambió en `develop` ese día; antes todo
  candidato de ese modelo estaba desbloqueado.
- **D. El mapa del portal de `planning.md` está incompleto.** La razón del rechazo se ve también
  en la página Candidatos, que se alimenta del servicio de candidatos del backend. Ese servicio no
  es «el detalle del candidato» de la oferta: la ficha de la oferta lee la participación
  directamente de la oferta. Los textos existen en español y en inglés. Comprobado el 2026-09-24:
  el detalle de la oferta entrega cada participación entera (solo oculta los datos personales de
  los bloqueados), así que el campo nuevo llega a esa ficha sin tocar el endpoint. La página
  Candidatos arma su respuesta campo por campo, y ahí sí hay que añadirlo.
- **E. Las pruebas del backend viven en una carpeta `test/` dentro de cada módulo** desde el
  2026-09-24. La del desenlace de contratación está en la del módulo de ofertas, y la de la
  analítica en la de métricas. Las pruebas nuevas van ahí.

## Fuera del alcance, a sabiendas

- **Corregir una decisión ya tomada** (decisión 10).
- **La causal en el detalle de cada oferta de la analítica** (decisión 12).
- **Hacer que el DTO valide de verdad**, incluido el tope de 1000 caracteres. Encender la
  validación global afecta a toda la API.
- **Elegir una oferta cancelada en el filtro de Ofertas** con el estado en «Todos» no la suma a
  las cifras: hay que elegir también el estado «Cancelada». Es el comportamiento actual de todo el
  panel, y el bloque nuevo lo hereda.
- **El aviso de la ventana de rechazo dice que el candidato «ya ocupa una plaza facturada»**, y
  eso no es cierto para uno revelado del grupo o añadido a mano. No es de este frente.

## Preguntas abiertas

Ninguna.

## Pasos

Rama `feat/hiring-rejection-reason`, desde `develop`, en los dos repositorios.

| Paso | Qué | Repositorio | Estado |
| --- | --- | --- | --- |
| 1a | Mover la lista de motivos a su carpeta y sacar el desenlace a su servicio, sin cambiar nada | backend | Revisado y aprobado; pendiente de commit |
| 1b | Guardar la causal: lista, campo, validación, auditoría y la página Candidatos | backend | Pendiente |
| 2 | Selector en la ventana de rechazo, detalle opcional y la causal en las dos fichas | portal | Pendiente |
| 3 | Bloque «Motivos de rechazo final» en el panel global | backend y portal | Pendiente |

## Registro de avance

- **2026-09-23** — Cerradas las decisiones 1 a 14 con el usuario. Sin brief escrito todavía.
- **2026-09-24** — Revisada la bitácora. Corregido *Antes de desplegar*: el orden «portal primero»
  no era seguro. `planning.md` y `requisitos.md` actualizados para apuntar aquí. Listo para el brief
  del paso 1.
- **2026-09-24** — Revisado lo que entró en `develop` (tope y cobro de candidatos procesados):
  corregido el punto C, añadido el E y la decisión 15, y *Antes de desplegar* cuenta con las
  pestañas que quedan abiertas.
- **2026-09-24** — Decisiones 16 a 19: carpeta de motivos, servicio propio del desenlace, el paso 1
  partido en 1a (mecánico) y 1b (la causal), y la regla del boy scout para lo mecánico. Escrito el
  brief del paso 1a.
- **2026-09-24** — Opinión previa del paso 1a contestada. **Pendiente para el paso 1b**: quitar el
  comentario de encabezado del método del desenlace, que el 1a mueve tal cual y que es falso (dice que
  no llama al servicio de planes, y lo llama); y pasar al inglés los nombres de la prueba del desenlace.
- **2026-09-24** — Paso 1a revisado y aprobado: método idéntico, renombre al 100 %, 152 suites y
  1.575 pruebas como la línea base, y arranque en local sin errores de dependencias. El ejecutor vio
  tres métodos privados sin uso —`computeViableCount` y `ensureTenantExists` en el servicio de
  ofertas, `normalizeName` en el orquestador— y no los tocó, porque la regla del boy scout cubre solo
  importaciones. Quedan para un inventario aparte, fuera de este frente.

## Antes de desplegar

- 🔴 **Backend y portal se despliegan a la vez, en la misma ventana. No hay orden seguro**
  (corregido el 2026-09-24):
  - **Backend primero**: el portal viejo manda rechazos sin causal y **todos fallan** (decisión 5).
  - **Portal primero**: el backend viejo sigue exigiendo el detalle, así que **los rechazos sin
    detalle fallan**; y los que llevan detalle se guardan **sin la causal que eligió el
    reclutador**, porque el backend viejo ignora el campo que no conoce (punto A). Ese segundo
    efecto no falla a la vista: esos rechazos quedan para siempre en el grupo «sin causal».

  El despliegue es de noche, pero **una pestaña del portal que quedó abierta sigue con el código
  viejo hasta que se recarga**: el portal no se renderiza en el servidor ni se recarga solo. Quien
  rechace desde esa pestaña recibe el error del backend, que el portal muestra tal cual en la
  ventana de rechazo; por eso ese mensaje le dice que recargue (decisión 15). Se asume.
  **No se relaja la decisión 5** para
  cubrir la ventana: un backend que acepte rechazos sin causal, aunque sea unos días, deja entrar
  justo los datos que esta tarea existe para evitar.
- **No hay migración**: los rechazos anteriores se quedan sin causal a propósito (decisión 8).
