# Planning · crear ofertas sin ATS configurado

Para **quien escribe el brief de este frente** y llega sin contexto. Dice **cómo funciona hoy**, **dónde
está cada pieza** y **qué hay que comprobar antes de que alguien toque código**. El qué se pide está en
`requisitos.md`.

## Antes de nada

1. `../CLAUDE.md` — el proyecto: los dos repositorios, el vocabulario (empresa, oferta, candidato,
   portales de empleo, robots), la verificación y la deuda conocida.
2. `../psicoalianza/arranque-del-ejecutor.md` — cómo se trabaja aquí: los dos papeles, la opinión previa
   antes de tocar código, y lo que ya salió mal. Se escribió para otro frente, pero las reglas son de la
   casa.
3. `../../esscoti-backend/CLAUDE.md` — credenciales y datos de producción.

**El cambio en sí es de una línea; el riesgo está en lo que viene después.** Quitar la validación es
trivial. Lo que no es trivial es que, a partir de ahí, **existirán ofertas sin ninguna plataforma**, un
caso que hoy el sistema nunca ve.

## Cómo funciona hoy

Una empresa sin ningún portal de empleo habilitado entra al listado de ofertas y ve **los botones de crear
oferta, crear con IA y copiar oferta apagados**, con un aviso al pasar el ratón: que configure al menos un
portal en Mi Compañía. Si intentara crearla por la API, el backend la rechaza con el mismo motivo.

Al crear una oferta, el sistema le adjunta **una entrada por cada portal habilitado de la empresa**, en
estado pendiente de publicar. Esas entradas son las que después usan los robots para publicar y para
extraer candidatos, y las que alimentan los informes por plataforma.

⚠️ **Hay una contradicción ya escrita en el portal**: el formulario de creación muestra un aviso que dice
que, sin plataformas, «la oferta se guardará pero no podrá publicarse». Ese aviso hoy no se puede ver
nunca, porque el botón está apagado y el backend rechaza. Conviene aprovecharlo: es casi el aviso que pide
el requisito.

⚠️ **Dos modos se saltan la validación**: el modo demo y el modo de simulación de portales. Es decir, **el
sistema ya crea ofertas sin plataformas en esos dos modos**, y conviene mirar cómo se comportan, porque
son la mejor pista de qué pasará cuando sea normal.

⚠️ **No hay integración con LinkedIn ni con ninguna red social en el código.** Los portales soportados son
tres: Computrabajo, elempleo y Pandapé. Si el requisito cuenta con LinkedIn como canal, es un frente
aparte que todavía no existe; si lo que se quiere decir es «publicar a mano en redes», entonces no es un
canal del sistema y conviene no nombrarlo así en la interfaz.

## Dónde está cada pieza

### Backend (`../../esscoti-backend`)

| Qué | Dónde | Para qué importa |
| --- | --- | --- |
| **La validación que hay que quitar** | `src/offers/offers.service.ts`, en la creación de la oferta: si no queda ninguna plataforma habilitada, lanza «No hay plataformas ATS habilitadas» | Es el cambio central |
| Las plataformas que se adjuntan a la oferta | Justo encima, donde se arma una entrada por cada credencial habilitada de la empresa | Con cero plataformas, la oferta nace con la lista vacía |
| Las excepciones que ya existen | El modo demo y el de simulación de portales, en ese mismo punto | Prueban que el caso «oferta sin plataformas» ya ocurre hoy |
| Los portales soportados | `src/offers/enums/offer-ats-platform.enum.ts` | Computrabajo, elempleo y Pandapé |
| La oferta guardada | `src/offers/schemas/offer.schema.ts` (lista de plataformas de la oferta, y el subconjunto que no se va a publicar con su motivo) | El campo ya admite lista vacía |
| Publicación y extracción | `src/offers/bot-scheduler.service.ts` | 🔴 Recorre las plataformas de cada oferta: hay que comprobar que con cero no haga nada raro ni deje avisos falsos |
| Informes por plataforma | `src/metrics/metrics.service.ts` | 🔴 Comprobar que una oferta sin plataformas no rompa ni distorsione los indicadores |
| Carga masiva | `src/offers/bulk-candidates/bulk-candidates.service.ts` | Canal siempre disponible; **hay que confirmar que no exige plataformas** |
| Carga individual | La alta manual de candidato, en `src/offers/offers.controller.ts` y su servicio | Canal siempre disponible; mismo chequeo |
| El recorrido del candidato | `src/offers/pipeline/pipeline-orchestrator.service.ts` | Usa la plataforma de origen del candidato en varios puntos; con carga manual ya vive sin ella, conviene confirmarlo |

### Portal (`../../esscoti-frontend`)

| Qué | Dónde |
| --- | --- |
| **Los botones apagados y sus avisos** (crear, crear con IA, copiar) | `app/routes/offers.tsx` |
| **El aviso del formulario** que ya existe y casi sirve | `app/components/offer-dialog.tsx` |
| El valor por defecto de las plataformas del formulario | `app/lib/offer-form.ts` — 🔴 hoy arranca con Computrabajo puesto |
| Los campos del formulario de oferta | `app/components/offer-form-fields.tsx` |
| Carga masiva y carga individual | `app/components/bulk-candidates-dialog.tsx` y el alta manual del detalle de la oferta |
| Los textos | `app/i18n/locales/es.ts` |

## Lo que hay que comprobar antes de escribir el brief

Son preguntas al código, no opiniones. **Una búsqueda de texto demuestra que algo existe, nunca que no
existe**: hay que abrir cada camino.

1. 🔴 **Qué hace la publicación con una oferta sin plataformas.** ¿Se salta la oferta en silencio, o deja
   un aviso de «publicación perdida» al reclutador? Un aviso falso cada día es peor que el bloqueo actual.
2. 🔴 **Qué hace la extracción de candidatos.** Misma pregunta: si el cron marca la oferta como fallida o
   la cuenta como pendiente, hay que cortarlo antes.
3. 🔴 **Qué pasa con el cierre de la oferta y el tope de entrada.** Una oferta que solo se abastece a mano
   tiene que poder cerrarse y respetar su tope igual que las demás.
4. **Qué enseña la analítica** de una oferta sin plataformas, sobre todo el indicador de calidad por
   plataforma.
5. **Confirmar que los dos canales manuales no dependen de las plataformas** en ningún punto: ni al cargar
   el archivo, ni al dar de alta a una persona, ni al arrancar su conversación.
6. ~~Qué significa «deshabilitar todos los canales de publicación de la oferta».~~ **Resuelto el
   2026-09-23**: era elegir canales por oferta, y pasó a su propia tarea, `../canales-de-publicacion/`.
   Aquí solo queda que no se bloquee cuando la empresa no tiene ningún canal.
7. **Si el valor por defecto del formulario tiene que cambiar**, porque hoy trae Computrabajo puesto de
   entrada.
8. **Qué dice el aviso nuevo.** El requisito pide advertir que los candidatos se cargan a mano. Hay que
   escribir esa frase y que la apruebe quien corresponda.

## Coordinación con Elvis: LinkedIn

**LinkedIn lo integra Elvis en otra tarea**, y las dos se cruzan en un punto: la comprobación de «esta
empresa no tiene ningún canal habilitado», que es la que decide si se avisa de que los candidatos hay que
cargarlos a mano.

🔴 **Hay que reunirse con él antes de cerrar este frente**, y la reunión tiene que terminar con **una
decisión escrita: dónde vive LinkedIn**.

- **Si lo modela como un canal más dentro de la misma lista de credenciales de la empresa** —junto a
  Computrabajo, elempleo y Pandapé—, no hay nada que hacer: la comprobación lo cuenta solo, y una empresa
  que solo tenga LinkedIn no verá el aviso de carga manual, que es lo correcto.
- **Si lo modela aparte** —su propia configuración, su propia colección—, entonces la comprobación se
  queda mirando solo los portales y **hay que sumarlo a mano**. Es un cambio de una línea, y le toca a su
  tarea: esta no deja hueco preparado para algo que todavía no tiene forma.

**Según quién llegue primero:**

- **Si Elvis ya integró LinkedIn** cuando empiece este frente: solo hay que comprobar que la comprobación
  lo incluye, y probarlo con una empresa que solo tenga LinkedIn.
- **Si todavía no lo integró**: se le entrega por escrito qué tiene que cumplir su integración para que
  esto siga funcionando —que LinkedIn cuente como canal habilitado en esa comprobación— y se anota como
  pendiente suyo, no nuestro.

⚠️ **El aviso nuevo habla de «canales de publicación», no de «ATS»**, justamente para que el texto no haya
que cambiarlo cuando entre LinkedIn.

## Cómo se parte el trabajo

Una propuesta, para que el brief la confirme o la cambie:

1. **Backend**: quitar la validación y **arreglar lo que se rompa con cero plataformas** (publicación,
   extracción e informes), con pruebas del caso nuevo.
2. **Portal**: encender los botones, cambiar el aviso del formulario por el que pide el requisito y
   revisar el valor por defecto de las plataformas.
La elección de canales por oferta **no es de esta tarea**: está en `../canales-de-publicacion/`, que
depende de esta porque comparte el caso «oferta sin ninguna plataforma».

El paso 2 sin el 1 deja crear ofertas que el backend sigue rechazando, así que el orden importa.

## Verificación

- **Backend**: `npm run build` y `npm test`, una vez sobre el conjunto del cambio.
- **Portal**: `npm run typecheck`. 🔴 **No tiene pruebas automáticas**, así que el brief de cada paso que lo
  toque trae **la lista de casos que se prueban a mano en local** —qué empresa, qué oferta, qué se espera
  ver—, y el reporte dice el resultado de cada uno. Como mínimo: una empresa sin ningún portal habilitado
  crea una oferta, ve el aviso, carga un candidato a mano y lo ve avanzar.
- 🔴 **No correr el lint del backend**: está definido con corrección automática y reformatea archivos que
  nadie tocó.
