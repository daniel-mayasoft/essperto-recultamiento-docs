# Brief · Paso 2 — la creación respeta lo elegido, y la republicación de Pandapé depende de la empresa

Para quien ejecuta este paso. Hace dos cosas en el backend: la creación de la oferta acepta los
portales elegidos, los comprueba y publica solo en ellos; y la republicación de Pandapé en
Computrabajo deja de ser fija y pasa a depender de un dato de la empresa. Cambia dónde se publica cada
oferta y le cambia el comportamiento a una empresa nueva con Pandapé: **tratamiento completo**. Solo
backend, en un **commit nuevo** encima del paso 1.

Antes de empezar, lee en la bitácora **las decisiones 3, 6, 8, 9, 10 y 12** y **los puntos C, F, G y
H**. El paso 1 (`brief-paso1-piezas-y-punto-unico.md`, commit `4733ddb`) es la base: las piezas, el
registro y la negativa ya existen.

## Rama

`feat/publication-channels`, con el paso 1 commiteado (`4733ddb`), limpia. Línea base, medida por el
planificador con la caché limpia: **compila; 195 suites y 2.030 pruebas que pasan, 1 suite y 43
omitidas**. Si `develop` avanzó, dilo antes de empezar y no lo fusiones.

## Qué le pasa a una persona

Pedro tiene Computrabajo y elempleo encendidos, con usuario y contraseña. Hoy el portal todavía no
manda ninguna elección: eso llega en el paso 3.

| | Hoy | Después |
| --- | --- | --- |
| El portal (todavía sin el paso), el agente de WhatsApp, Maya o el superadmin crean una oferta **sin mandar elección** | Sale con todos los portales encendidos de la empresa | Igual (decisión 9) |
| La petición elige **solo Computrabajo** | No existe | La oferta tiene solo Computrabajo y solo se publica allí |
| La petición manda la elección **vacía** | No existe | La oferta nace sin portales, como la de Laura en ofertas sin ATS |
| La petición elige elempleo, que un compañero acaba de **apagar** | No existe | **No se crea**: error que nombra a elempleo (decisión 10) |
| La petición elige un portal **sin contraseña o sin usuario** | No existe | No se crea, con el mismo tipo de error (decisión 8) |
| Una empresa en **modo demo** manda una elección | — | Se ignora, sin comprobarla: la oferta nace sin portales, como hoy |
| Con el **modo de simulación** de portales, la petición elige Computrabajo | — | La oferta tiene solo Computrabajo, con su identificador de prueba como hoy |
| La empresa que ya usa Pandapé crea una oferta con Pandapé, **con el dato escrito** | Pandapé republica en Computrabajo | Igual |
| Una empresa **nueva** con Pandapé, **sin el dato** | Republica en Computrabajo | **No republica** (decisión 6, a propósito) |
| Mi Compañía guarda el dato de republicación | No existe | Se guarda; solo se acepta Pandapé → Computrabajo, o nada |
| Mi Compañía guarda las credenciales de los portales | — | El dato de republicación no se toca |

## Qué se hace

### 1 · La creación recibe la elección (decisiones 9 y 10, punto F)

Un **campo nuevo** en la petición de crear: la lista de portales elegidos, opcional. **No se
reutiliza `atsIds`**, que solo sirve al modo de simulación (punto F).

- **No viene** → la lista de la oferta se arma como hoy: todos los portales que la empresa no tiene
  apagados, **con la regla de hoy** (punto G). Sin cambios para las entradas sin casillas.
- **Viene, aunque sea vacía** → la lista de la oferta son **solo los elegidos**, en el orden que sea
  (el orden de publicación lo pone el registro). Un portal repetido cuenta una vez.
- **Comprobación** antes de guardar nada: cada elegido tiene que estar **disponible para la
  empresa**: con usuario, con contraseña y no apagado (decisión 8). Si alguno no lo está, la creación
  se rechaza con un error que nombra el portal, del tipo «elempleo no está disponible en tu empresa».
  **No se crea la oferta ni se cobra nada.** Un valor que no es un portal, o un campo que no es una
  lista, lo rechaza **el propio servicio** con un error que nombra el valor. (Corregido en la opinión
  previa: la validación de las peticiones está apagada en todo el backend y no rechazaría nada.)
- **Modo demo**: la elección se ignora y no se comprueba; la oferta nace sin portales, como hoy.
- **Modo de simulación**: los identificadores de prueba se siguen buscando como hoy, pero solo para
  los portales de la lista.

### 2 · «Disponible para la empresa» entra en la interfaz (decisión 3)

El canal dice si está disponible para una empresa, a partir de sus credenciales. Es lo que usa la
comprobación del punto 1. **El agente, Maya y la creación sin elección no la usan**: siguen con la
regla de hoy.

### 3 · El dato de republicación de la empresa (decisión 6)

Un dato propio de la empresa, **aparte de las credenciales**: en qué portales republica cada portal
de origen. **Uno a muchos**: hoy, como mucho, Pandapé → [Computrabajo].

- ⚠️ **Falso amigo:** las ofertas ya tienen `atsRepublish`, que es el **informe** de lo que el robot de
  Pandapé leyó en su paso «Divulgación». No tiene nada que ver con este dato. Elige un nombre que no se
  confunda con él, ni con `publishers` (otro informe de Pandapé).
- **Se guarda desde Mi Compañía**, por la misma petición con la que hoy se edita la empresa.
  🔴 **Trampa:** esa petición escribe sin pasar las validaciones del esquema de la base. **Todo lo que
  entre tiene que filtrarlo la propia petición**: solo se acepta Pandapé → [Computrabajo] o vacío;
  cualquier otra combinación se rechaza.
- **Guardar las credenciales no lo toca**: van por otro dato, y la mezcla de credenciales rehace cada
  entrada desde cero (decisión 6). Prueba que lo demuestre.
- **Sale por la API con la empresa**, para que el portal lo lea en los pasos 3 y 4. Comprueba que no
  hay nada que lo recorte al salir.
- Ninguna empresa lo tiene al desplegar salvo la que se escriba a mano (ver *Qué entregar*).

### 4 · La línea de Elvis lee el dato (decisión 6, punto C)

En la publicación de Pandapé, la petición fija de republicar en Computrabajo pasa a decir **sí solo si
la empresa tiene Pandapé → Computrabajo**. Lo que esa función lee de la empresa se amplía con el
dato; **el resto de esa función no cambia**, y las otras dos funciones de publicación no se tocan.
Los reintentos pasan por ahí, así que lo respetan solos.

## 🔴 Dónde se para

- **Nada del portal**: ni el paso nuevo, ni el switch, ni el interruptor general.
- **Ni el agente ni Maya** preguntan por los canales (decisión 9, al final).
- **`hasPublicationChannels` no cambia** (punto E): cuenta la lista de la oferta, que ya será la
  elegida.
- **La republicación no se toca más allá de su línea**: ni los reintentos que la repiten, ni el
  informe de Pandapé, ni la prueba de Pandapé de las herramientas de desarrollo.
- **Las ofertas ya creadas no cambian.**
- Sin comentarios en el código, sin formateador, sin lint. Identificadores en inglés, también en
  las pruebas y en los parámetros de los callbacks.

## Lo que tu opinión previa tiene que confirmar

1. **Que la creación sin elección arma la lista exactamente como hoy**, también en modo de simulación
   y en modo demo.
2. **Que la comprobación va antes de guardar la oferta y antes de cualquier cobro o reserva.** Recorre
   la creación y di qué pasa antes de ese punto: si algo ya escribió en la base, un rechazo lo dejaría
   a medias.
3. **Por dónde sale la empresa hacia el portal**, y que el dato nuevo llegue entero.
4. **Que el guardado de la empresa no deja pasar otra combinación** de republicación, ni por la
   petición de editar ni por la de crear empresa, si la acepta.
5. Los nombres del campo de la petición, del dato de la empresa y del método de disponibilidad.

## Pruebas y verificación

- **Creación**: sin elección → como hoy; con una parte → solo esa, y solo se publica esa; vacía → sin
  portales y sin publicar; repetida → una vez; un elegido apagado, sin contraseña o sin usuario →
  rechazo que nombra el portal, **sin oferta guardada**; modo demo con elección → sin portales y sin
  rechazo; modo de simulación → solo los elegidos, con su identificador de prueba.
- **Disponibilidad**: los cuatro casos de una credencial (completa, sin usuario, sin contraseña,
  apagada) y una empresa sin ese portal.
- **Dato de republicación**: guardar Pandapé → [Computrabajo] y vacío; rechazar otra combinación;
  guardar las credenciales no lo borra.
- **Línea de Elvis**: con el dato → la petición al robot pide republicar; sin el dato → no. **El resto
  de lo que se manda al robot es idéntico en los dos casos.**
- Las pruebas existentes pasan **sin cambios**. Si alguna tiene que cambiar, dilo en la opinión previa,
  con el porqué.
- **Control negativo** en las nuevas: invierte la expectativa, comprueba que falla, bórralo.
- `npx jest --clearCache`, `npm run build` y `npm test`, **una vez**, frente a la línea base.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados.
2. Después: qué cambió y el resultado real de la verificación, frente a la línea base.
3. Qué decisiones tomaste que no estaban en el brief.
4. **La instrucción exacta para escribir a mano el dato de la empresa que ya usa Pandapé**, lista para
   pegar en la consola de la base: escribe Pandapé → [Computrabajo] en las empresas que tienen una
   credencial de Pandapé. Se corre **antes** de desplegar el backend (bitácora, *Antes de desplegar*).
5. Todo en el índice, con el índice y el árbol coincidiendo.
6. Un mensaje de commit.
