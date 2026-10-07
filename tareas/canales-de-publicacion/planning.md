# Planning · paso de canales de publicación al crear la oferta

Para **quien escribe el brief de este frente** y llega sin contexto. Dice **cómo funciona hoy**, **dónde
está cada pieza** y **qué hay que decidir antes de que alguien toque código**. El qué se pide está en
`requisitos.md`.

## Antes de nada

1. `../../CLAUDE.md` — el proyecto: los dos repositorios, el vocabulario, la verificación y la deuda
   conocida.
2. `../psicoalianza/arranque-del-ejecutor.md` — cómo se trabaja aquí: los dos papeles, la opinión previa
   antes de tocar código, y lo que ya salió mal. Las reglas son de la casa.
3. `../ofertas-sin-ats/bitacora.md` — **la tarea hermana, ya cerrada (2026-10-07)**. Lee sobre todo sus
   decisiones 6, 11 y 14, su sección *Lo que dice el código* (puntos C, D, E y L) y *Fuera del alcance*:
   varias cosas se dejaron allí a propósito para esta tarea.

## 🔴 Actualizado el 2026-10-07: lo que cambió desde que se escribió este documento

Este planning se escribió el 2026-09-23. Desde entonces se cerró «Ofertas sin ATS» y entró trabajo de
otros en `develop`. **Lo de esta sección gana sobre lo que digan las secciones de abajo.**

- **Las ofertas sin ninguna plataforma ya existen y no rompen nada.** Publicación, extracción, cierre,
  tope y analítica las tratan bien (bitácora de ofertas sin ATS, puntos E a G). Con esta tarea, una oferta
  creada **con todo desmarcado** es ese mismo caso: no hay que prepararlo.
- **Ya hay una sola pregunta, `hasPublicationChannels`**, que decide si una oferta «tiene canales de
  publicación» (decisión 14 de ofertas sin ATS). Hoy responde: algún portal en la oferta, **o el formulario
  público encendido en la empresa**. La usan el agente de WhatsApp y el aviso del formulario. **Esta tarea
  la cambia en ese único sitio** para que cuente los canales elegidos para la oferta. Se hizo una sola a
  propósito para eso.
- **El formulario público de postulación cuenta como canal.** Se enciende por empresa en Mi Compañía, y
  cada oferta tiene «Compartir», con enlace y QR. Hay que decidir si aparece en el paso nuevo como un canal
  más que se puede desmarcar por oferta, o si sigue siendo de la empresa.
- **LinkedIn ya existe** (rama de captación por redes de Elvis, en `develop` desde el 2026-10-01), y está
  **modelado aparte de los portales**: una cuenta social vinculada a la empresa, no una credencial más. Se
  publica **a mano, desde la ficha de cada oferta, no al crearla**, el panel está **escondido** porque la
  publicación en redes está aplazada, y el backend no deja publicar en LinkedIn si el formulario público
  no está abierto. Sus candidatos entran por el enlace público, con LinkedIn como detalle de origen. Es
  decir: **se dio el caso «entra aparte»** de la sección de Elvis, más abajo.
- **El Computrabajo «preseleccionado» del formulario no es una elección de portal** (punto C de ofertas
  sin ATS): es la fila vacía del identificador de una oferta ya publicada, y el backend la ignora. La fila
  del portal de abajo que dice lo contrario **está mal**.
- **El formulario de creación tiene cinco entradas, no tres** (punto D de ofertas sin ATS): crear, crear
  con IA, copiar, el botón del listado vacío y la dirección con el parámetro de abrir la IA. El paso nuevo
  tiene que salir en todas.
- **Se dejaron para esta tarea**, a propósito:
  - **El interruptor «Portales de empleo» de Mi Compañía**, que todavía dice «Obligatorio» y no guarda
    nada. Hay una idea de diseño en la bitácora de ofertas sin ATS (*Fuera del alcance*): todo o nada como
    dato propio de la empresa, sin reescribir los interruptores de cada portal, solo para ofertas nuevas, y
    contado también por `hasPublicationChannels` y por el aviso.
  - **Elegir canales al crear la oferta por WhatsApp.** El usuario cree que el agente debería ofrecerlo. Si
    entra, se vuelve a tocar la decisión 11 de ofertas sin ATS: el texto del agente habla en condicional
    precisamente porque hoy no sabe si la oferta tendrá canales.
  - **Las ofertas creadas sin portal no ganan uno después** (decisión 6 y punto I de ofertas sin ATS). Esta
    tarea solo actúa al crear; no lo resuelve para las ya creadas.
- 🔴 **La publicación en Computrabajo cambió dos veces esta semana**: Elvis el 2026-10-05 (una oferta
  «lista para publicar» ya no se guarda como publicada) y Henry el 2026-10-06 (hotfix, que además tocó los
  estados de publicación). Las tres funciones de publicación siguen existiendo con el mismo nombre, pero
  **hay que releer su lógica y sus estados contra `develop` antes de escribir el brief**: el mapa de abajo
  es anterior.

**Esto no es solo un paso más en el formulario: cambia dónde se publica cada oferta.** El formulario es
la parte visible; el cambio de fondo es que la publicación deje de mirar la configuración de la empresa y
empiece a respetar lo elegido para cada oferta.

## Cómo funciona hoy

Los canales se configuran **una sola vez, en Mi Compañía**: la empresa guarda las credenciales de cada
portal y puede habilitarlas o deshabilitarlas.

Al crear una oferta pasan dos cosas, y ninguna le pregunta nada al responsable:

1. **La oferta se guarda con una entrada por cada portal habilitado en la empresa**, en estado pendiente
   de publicar. Esa lista es la que después usan la extracción de candidatos y los informes.
2. **Justo después se lanza la publicación en los tres portales, uno tras otro**, y **cada uno decide si
   publica mirando la configuración de la empresa** —si tiene credenciales y si están habilitadas—, **no la
   lista de la oferta**.

🔴 **Esto es lo importante**: aunque se guardara en la oferta una lista más corta, hoy se publicaría igual
en todos los portales habilitados de la empresa. **Guardar la elección no basta: la publicación tiene que
leerla.**

El asistente de creación tiene hoy **seis pasos**: datos de la oferta, preguntas de filtro, prueba
psicométrica, verificación de requisitos, documentos y agendamiento de la entrevista. El paso nuevo sería
el séptimo.

## Dónde está cada pieza

### Backend (`../../../../esscoti-backend`)

| Qué | Dónde | Para qué importa |
| --- | --- | --- |
| **La lista de canales de la oferta al crearla** | `src/offers/offers.service.ts`, en la creación: arma una entrada por cada credencial habilitada de la empresa | Tiene que pasar a armarse con **los canales elegidos**, comprobando que cada uno esté configurado y habilitado en la empresa |
| Lo que acepta la API al crear | `src/offers/dto/create-offer.dto.ts` | **Ya acepta una lista de canales**, pero hoy solo se usa en modo de simulación de portales para identificadores de prueba. Hay que decidir si se reutiliza o se añade un campo propio |
| **La publicación tras crear** | En la misma creación, al final: llama a la publicación de Computrabajo, elempleo y Pandapé | 🔴 Cada una de esas tres decide por la empresa, no por la oferta |
| Las tres publicaciones | `scheduleComputrabajoCreateOfferViaOrchestrator`, `scheduleElEmpleoCreateOfferViaOrchestrator` y `schedulePandapeCreateOfferViaOrchestrator`, en el mismo servicio | **Aquí va la comprobación nueva**: si la oferta no eligió ese canal, no se publica |
| Otros caminos que publican | En el mismo servicio: la republicación y el reintento de publicaciones fallidas llaman a esas mismas tres | 🔴 Tienen que respetar también la elección de la oferta, o un reintento publicaría donde no se eligió |
| Los portales soportados | `src/offers/enums/offer-ats-platform.enum.ts` | Computrabajo, elempleo y Pandapé. **LinkedIn no está aquí**: existe desde el 2026-10-01, pero aparte (ver la sección actualizada, arriba) |
| La configuración de la empresa | `src/offers/schemas/tenant.schema.ts` (credenciales de cada portal y si están habilitadas) | De aquí salen los valores por defecto del paso y qué canales aparecen deshabilitados |
| Extracción de candidatos e informes | `src/offers/bot-scheduler.service.ts` y `src/metrics/metrics.service.ts` | Recorren la lista de la oferta, así que **ya respetan la elección** en cuanto esa lista sea la correcta |

⚠️ **Falso amigo en el esquema**: la oferta tiene un campo `publishers`. **No son los canales de
publicación**: es el informe de los portales internos de difusión de Pandapé. No confundirlos.

### Portal (`../../../../esscoti-frontend`)

| Qué | Dónde |
| --- | --- |
| **El asistente de creación y sus pasos** | `app/components/offer-dialog.tsx` |
| El valor por defecto de los canales del formulario | `app/lib/offer-form.ts` — ~~hoy arranca con Computrabajo puesto~~ **Corregido el 2026-10-07**: esa fila no es una elección de portal (punto C de ofertas sin ATS). Hoy el formulario no tiene ningún valor de canales |
| Los datos de la empresa que ya llegan al asistente | El diálogo recibe la empresa, con sus credenciales y si están habilitadas |
| Los caminos que abren el asistente | `app/routes/offers.tsx`. **Son cinco**, confirmado en ofertas sin ATS (punto D): crear, crear con IA, copiar, el botón del listado vacío y la dirección con el parámetro de abrir la IA. Los cinco acaban en el mismo asistente |
| Los textos | `app/i18n/locales/es.ts`, bajo `offers.createDialog` |

## Lo que hay que decidir antes de escribir el brief

1. 🔴 **Que la publicación respete la elección de la oferta**, en los tres portales y en los tres caminos
   que publican: al crear, al republicar y al reintentar. Sin esto, el paso nuevo es decorativo.
2. 🔴 **Qué pasa con las ofertas que ya existen.** Hoy su lista de canales es la de la empresa en el
   momento de crearlas. Si la publicación pasa a leer la lista de la oferta, las viejas siguen igual,
   pero hay que comprobar que ninguna quedó con la lista vacía por el modo demo o el de simulación.
3. **Qué se muestra por cada canal**:
   - configurado y habilitado en la empresa → marcado por defecto, se puede desmarcar;
   - configurado pero deshabilitado en la empresa → ¿desmarcado y se puede marcar, o deshabilitado? El
     requisito solo habla de «no configurado»;
   - no configurado → deshabilitado, con el aviso de que hay que configurarlo en Mi Compañía.
4. **Si se puede editar después.** El requisito habla de la creación. Cambiar los canales de una oferta ya
   publicada significa despublicar o publicar a posteriori, que es otro trabajo. Recomendación: solo en la
   creación, y dejarlo escrito.
5. **LinkedIn.** Depende de Elvis (ver abajo).
6. **Al copiar una oferta**, ¿se proponen los canales de la oferta original o los de la empresa?
   Recomendación: los de la empresa, que es lo que dice el requisito.

## Coordinación con Elvis: LinkedIn

> **Actualizado el 2026-10-07: ya se sabe dónde vive LinkedIn** —aparte, como cuenta social de la
> empresa, y con publicación manual desde la ficha y aplazada—. La reunión ya no tiene que decidir eso.
> Lo que queda por hablar con Elvis: **si el paso nuevo muestra LinkedIn como casilla** al crear, aunque
> hoy no se publique al crear; y, si se marca, **qué pasa**: publicar al crear (hoy no existe), dejarlo
> preparado para publicar desde la ficha, o no mostrarlo hasta que la publicación en redes deje de estar
> aplazada. Lo de abajo queda como registro.

Es el mismo punto que en `../ofertas-sin-ats/planning.md`, con más peso aquí: **este paso tiene que
mostrar LinkedIn como un canal más**.

- **Si LinkedIn entra como un canal más en la misma configuración de la empresa**, el paso lo muestra solo
  y la regla «publicar solo en lo elegido» tiene que cubrirlo en su publicación.
- **Si entra aparte**, el paso tiene que leerlo de otro sitio y su publicación tiene que respetar la
  elección de la oferta. Eso lo hace su tarea, con la regla que esta deje escrita.

🔴 **Una sola reunión con Elvis para las dos tareas**, antes de cerrar cualquiera de ellas, y que termine
con la decisión escrita de dónde vive LinkedIn.

## Cómo se parte el trabajo

Una propuesta, para que el brief la confirme o la cambie:

1. **Backend**: la oferta guarda los canales elegidos (validando que estén configurados y habilitados en
   la empresa), y **las tres publicaciones y sus reintentos respetan esa elección**. Con pruebas de cada
   camino.

   **Decidido el 2026-09-23: se hace a través de un único punto de decisión.** Hoy la creación, la
   republicación y el reintento llaman cada uno a los tres portales en fila. En vez de copiar la
   comprobación «¿se eligió este canal?» en cada portal, se añade **una sola función que recorre los
   canales elegidos de la oferta y llama a la publicación de cada uno**, y los tres caminos pasan a usarla.
   La forma en que publica cada portal **no se toca**. Cuando entre LinkedIn, se añade ahí.

   ⚠️ **No es la capa completa de portales** —como la de la prueba psicométrica, con adaptadores,
   extracción, archivado y credenciales desde un solo sitio—. Esa queda fuera: es un cambio grande sobre la
   entrada del embudo, y compensa cuando un cuarto canal necesite lo mismo que los tres de hoy.
2. **Portal**: el paso nuevo al final del asistente, con los valores por defecto de la empresa, los
   canales no configurados deshabilitados, y el valor por defecto del formulario corregido.

El paso 2 sin el 1 muestra una elección que después se ignora, así que el orden importa.

## Verificación

- **Backend**: `npm run build` y `npm test`, una vez sobre el conjunto del cambio.
- **Portal**: `npm run typecheck`. 🔴 **No tiene pruebas automáticas**, así que el brief trae **la lista de
  casos que se prueban a mano en local**. Como mínimo: una empresa con dos portales habilitados crea una
  oferta desmarcando uno y **comprueba que solo se publica en el otro**; una empresa con un portal sin
  configurar lo ve deshabilitado con su aviso; y una oferta creada con todo desmarcado no se publica en
  ningún sitio.
- 🔴 **No correr el lint del backend**: está definido con corrección automática y reformatea archivos que
  nadie tocó.
