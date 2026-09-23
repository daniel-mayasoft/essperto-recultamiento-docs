# Planning · paso de canales de publicación al crear la oferta

Para **quien escribe el brief de este frente** y llega sin contexto. Dice **cómo funciona hoy**, **dónde
está cada pieza** y **qué hay que decidir antes de que alguien toque código**. El qué se pide está en
`requisitos.md`.

## Antes de nada

1. `../../CLAUDE.md` — el proyecto: los dos repositorios, el vocabulario, la verificación y la deuda
   conocida.
2. `../psicoalianza/arranque-del-ejecutor.md` — cómo se trabaja aquí: los dos papeles, la opinión previa
   antes de tocar código, y lo que ya salió mal. Las reglas son de la casa.
3. `../ofertas-sin-ats/planning.md` — la tarea hermana. Comparte el caso «oferta sin ninguna plataforma» y
   la coordinación con Elvis por LinkedIn.

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
| Los portales soportados | `src/offers/enums/offer-ats-platform.enum.ts` | Computrabajo, elempleo y Pandapé. **LinkedIn no existe todavía** |
| La configuración de la empresa | `src/offers/schemas/tenant.schema.ts` (credenciales de cada portal y si están habilitadas) | De aquí salen los valores por defecto del paso y qué canales aparecen deshabilitados |
| Extracción de candidatos e informes | `src/offers/bot-scheduler.service.ts` y `src/metrics/metrics.service.ts` | Recorren la lista de la oferta, así que **ya respetan la elección** en cuanto esa lista sea la correcta |

⚠️ **Falso amigo en el esquema**: la oferta tiene un campo `publishers`. **No son los canales de
publicación**: es el informe de los portales internos de difusión de Pandapé. No confundirlos.

### Portal (`../../../../esscoti-frontend`)

| Qué | Dónde |
| --- | --- |
| **El asistente de creación y sus pasos** | `app/components/offer-dialog.tsx` |
| El valor por defecto de los canales del formulario | `app/lib/offer-form.ts` — 🔴 hoy arranca con Computrabajo puesto, sin mirar la empresa |
| Los datos de la empresa que ya llegan al asistente | El diálogo recibe la empresa, con sus credenciales y si están habilitadas |
| Los tres caminos que abren el asistente | `app/routes/offers.tsx`: crear, crear con IA y copiar oferta. Según lo leído los tres acaban en el mismo asistente; **confirmarlo** |
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
