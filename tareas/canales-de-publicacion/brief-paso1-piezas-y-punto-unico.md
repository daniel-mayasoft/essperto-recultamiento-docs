# Brief · Paso 1 — la pieza de cada portal y el punto único

Para quien ejecuta este paso. Reordena **por dónde pasa** la publicación en los portales sin cambiar
**cómo** publica cada uno. Nadie ve nada distinto, salvo en un caso que hoy está mal (ver la tabla).
Toca la entrada del embudo —dónde se publica cada oferta— y aquí un fallo es silencioso: una oferta
que deja de publicarse no avisa a nadie. Por eso lleva **el tratamiento completo**: opinión previa,
tantas rondas como hagan falta. Solo backend.

Antes de empezar, lee en la bitácora (`bitacora.md`, la fuente única de esta tarea) **las decisiones
3, 5, 7 y 12** y **los puntos B, C y G**. El modelo a copiar está en `src/social/`: la interfaz de
publicador y su registro.

## Rama

`feat/publication-channels`, nueva, desde `develop` (backend `d96be7b`). Línea base, medida por el
planificador con la caché limpia: **compila; 192 suites y 2.020 pruebas que pasan, 1 suite y 43
pruebas omitidas**.

## Qué le pasa a una persona

| | Hoy | Después |
| --- | --- | --- |
| Pedro, con Computrabajo y elempleo, crea una oferta | Se publica en los dos | Igual |
| Laura, sin portales, crea una oferta | Ningún robot publica | Igual |
| Una empresa en modo demo crea una oferta | Ningún robot; entra el candidato de prueba | Igual |
| Con el modo de simulación de portales encendido | Las tres publicaciones salen sin despachar nada | Igual |
| Pedro pulsa «Reintentar» en su Computrabajo fallido | Se relanza Computrabajo | Igual |
| El robot de elempleo falla y se reintenta solo | Se relanza elempleo | Igual |
| Una oferta **solo con Pandapé** recibe un aviso de fallo del robot **sin decir el portal** | El reintento automático da por hecho Computrabajo y **lo publica allí**, aunque la oferta no lo tiene (punto B) | No se publica nada; queda un aviso en el log |

La última fila es el único cambio de comportamiento, y es teórico: el robot de Pandapé sí manda el
portal.

## Qué se hace

### 1 · La interfaz de un canal de publicación (decisiones 3 y 12)

Un contrato mínimo: **qué portal es y publicar una oferta** (la oferta, la empresa y el origen
—crear o reintentar—, lo mismo que reciben hoy las tres funciones). **Solo publicar.** «Decir si el
canal está disponible para la empresa», que la decisión 3 también pone en la interfaz, **entra en el
paso 2**, que es el primero que lo usa. Ni extracción, ni archivado, ni credenciales.

### 2 · Una pieza por portal, que envuelve su función de publicación

Computrabajo, elempleo y Pandapé. Cada pieza llama a la función de publicación que ya existe en el
servicio de ofertas. **Esas tres funciones no se tocan: ni una línea dentro de ellas.**

**La negativa (decisión 7):** antes de llamar a su función, la pieza comprueba que su portal esté
**en la lista de plataformas de la oferta**. Si no está, no publica y deja un aviso en el log con la
oferta y el portal. La oferta que recibe la pieza tiene que llevar su lista: en la creación es el
documento recién guardado; en los reintentos, la oferta que ya cargan.

🔴 **Trampa: el registro se arma la primera vez que se usa, y la pieza llama a la función en el
momento de publicar.** (Corregido en la opinión previa: la primera versión decía que la prueba de
reintentos construye el servicio y luego sustituye las funciones.) Esa prueba y otras 35 arman el
servicio **sin ejecutar su constructor**, y sustituyen las tres funciones en la instancia. Un registro
armado en el constructor no existiría en ellas; una pieza que guardara la función original se
saltaría la sustitución.

### 3 · El registro, dentro del servicio de ofertas (decisión 12)

Portal → pieza. Es **el único sitio que sabe qué portales hay implementados**, como en redes
sociales. **Se arma dentro del servicio de ofertas**, no como proveedores aparte: las tres funciones
viven allí y dependen de medio servicio, y sacarlas crearía una dependencia en círculo.

### 4 · El punto único, en la creación (decisión 5)

Sustituye las tres llamadas seguidas que hace hoy la creación: recorre la lista de plataformas de la
oferta y le pide a la pieza de cada portal que publique.

- 🔴 **Mismo orden y misma secuencia que hoy**: Computrabajo, elempleo y Pandapé, cada uno
  esperando al anterior. La lista de la oferta sigue el orden de las credenciales de la empresa, que
  puede ser otro: **el orden lo pone el registro, no la lista**.
- Una entrada de la lista con un portal que el registro no conoce: se salta, con aviso en el log.
- La rama del modo demo no cambia: sigue sin llamar a nada.

⚠️ **Un cambio que no ve nadie, pero que rompe una prueba:** hoy la creación llama a las tres
funciones **siempre**, y cada una sale con su propio aviso si la empresa no tiene ese portal. Con el
punto único, a un portal que no está en la lista **no se le llama**. Los dos casos de
`offer-creation-without-platforms.spec.ts` exigen hoy tres avisos del log («sin credenciales ATS» y
«deshabilitada»); después no habrá ninguno. Esas dos comprobaciones se cambian por **«no se llama a
ninguna función de publicación»**, que es lo que de verdad importa. El resto de los casos queda
igual. Dilo en el reporte. **Lo mismo en `demo-mode-offer-creation.spec.ts`** (visto en la opinión
previa): con el modo demo apagado espera las tres llamadas, y su empresa solo tiene Computrabajo;
pasa a Computrabajo una vez y elempleo y Pandapé ninguna.

### 5 · Los tres reintentos pasan por la pieza

El reintento automático genérico, el automático propio de elempleo y el manual pasan a pedir la
publicación **a la pieza del portal** en vez de llamar a la función directamente. Cómo eligen el
portal no cambia: ni la caída en Computrabajo del genérico ni el error de «plataforma no soportada»
del manual. Con esto, la negativa vale también aquí, que es donde está el hueco del punto B.

## 🔴 Dónde se para

- **Nada del paso 2**: ni campo nuevo en la petición de crear, ni comprobación de lo elegido, ni
  «disponible para la empresa», ni el dato de republicación.
- **La publicación de Pandapé no se toca**, tampoco su línea de republicar (eso es el paso 2).
- **Las herramientas de desarrollo que publican no se tocan** («Crear borrador en Pandapé», las
  pruebas de crear en cada portal). Despachan el robot por su propio camino.
- Ni `hasPublicationChannels`, ni el aviso diario de publicaciones atascadas, ni el portal.
- Sin comentarios en el código, sin formateador, sin lint. Identificadores en inglés, también en
  las pruebas y en los parámetros de los callbacks.

## Lo que tu opinión previa tiene que confirmar

1. **Que no hay otro sitio que llame a las tres funciones de publicación**, aparte de la creación y
   los tres reintentos (punto B: cuatro sitios en total). Di cómo lo buscaste y qué formas de
   llamarlas no cubre esa búsqueda.
2. **Que la negativa no alcanza a ninguna herramienta de desarrollo.** Recorre todos los despachos de
   robots de crear oferta del backend —el planificador cuenta seis: los tres de publicación y tres de
   prueba— y cualquier otro botón que publique, y di por dónde pasa cada uno.
3. **Que en los tres reintentos la oferta que se le pasa a la pieza lleva su lista de plataformas al
   día.** Si alguno trabaja con una copia vieja, dilo.
4. Los nombres que propones, en inglés y en la línea de los de `src/social/`.

## Pruebas y verificación

- **El punto único**: oferta con los tres portales → se publican en el orden Computrabajo, elempleo,
  Pandapé, y cada uno empieza cuando ha terminado el anterior. Lista con Pandapé antes que
  Computrabajo → mismo orden, Computrabajo primero. Lista vacía → ninguna llamada.
- **La negativa**: una pieza con una oferta que no tiene su portal → su función no se llama y queda el
  aviso en el log.
- **El hueco del punto B**: aviso de fallo sin portal para una oferta sin Computrabajo → no se
  despacha nada. Con Computrabajo en la oferta → se relanza como hoy.
- `retry-ats-publication.spec.ts` y las demás pruebas de publicación pasan **sin cambios**. Las únicas
  pruebas existentes que cambian son las dos del punto 4, y solo esas comprobaciones.
- **Control negativo** en las nuevas: invierte la expectativa, comprueba que falla, bórralo.
- `npx jest --clearCache`, `npm run build` y `npm test`, **una vez**, frente a la línea base.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados.
2. Después: qué cambió y el resultado real de la verificación, frente a la línea base.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
