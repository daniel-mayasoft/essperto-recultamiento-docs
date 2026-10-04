# Brief · Paso 2 — el portal deja crear ofertas sin canales

Para quien ejecuta este paso. Encender tres botones y cambiar un aviso. No toca el embudo ni le
escribe a nadie: **brief corto y una sola ronda**. Solo portal.

Antes de empezar, lee `../../CLAUDE.md`, `../psicoalianza/arranque-del-ejecutor.md` y la bitácora de
este frente, `bitacora.md`: **el vocabulario, las decisiones 3, 7, 14, 15 y 16, y los puntos C, D y L de
*Lo que dice el código***. El backend ya acepta la oferta sin portales (pasos 1 y 1c, commiteados).

## Rama

`feat/offers-without-ats` del portal, igual a `develop` (`cbc47b1`), limpia. **Reinstala las
dependencias** (`npm ci`): `develop` trae librerías nuevas. La comprobación de tipos pasa sin errores
antes de empezar.

## Qué le pasa a una persona

| | Hoy | Después |
| --- | --- | --- |
| Laura, sin portales y con el formulario público apagado, abre el listado de ofertas | «Crear oferta», «Crear con IA» y «Copiar oferta» están apagados, con «Configura al menos un ATS…» al pasar el ratón | Los tres encendidos, sin ese texto |
| Laura abre el formulario de creación, por cualquiera de las cuatro entradas | Aviso: «No hay ninguna plataforma ATS configurada. La oferta se guardará pero no podrá publicarse…» | Aviso de la decisión 7 |
| Sofía, sin portales y con el formulario público encendido, abre el formulario | El mismo aviso viejo | Ningún aviso |
| Pedro, con Computrabajo | Botones encendidos, sin aviso | Igual |
| Una empresa en modo demo sin portales | Botones apagados; el botón del listado vacío abre el formulario con el aviso viejo | Botones encendidos y ningún aviso (decisión 15) |

Las cuatro entradas al formulario son crear, crear con IA, copiar y el botón del listado vacío
(punto D). Las cuatro llegan al mismo formulario, y el aviso está en su primer paso.

## Qué se hace

### 1 · Los tres botones del listado

En crear, crear con IA y copiar, se quita la condición de «alguna credencial habilitada» que los
apaga, y el texto que muestran al pasar el ratón por ese motivo. **Se conservan las demás
condiciones** que los apagan hoy (sin empresa cargada, o una copia en curso). Copiar vuelve a mostrar
siempre su texto normal, «Copiar oferta». El botón del listado vacío no se toca: ya está encendido.

### 2 · El aviso del formulario (decisiones 7 y 14)

Sale al crear cuando la empresa **no tiene ninguna credencial de portal habilitada y tiene el
formulario público apagado**. Es la misma condición de «habilitada» que se usa hoy («Portal
habilitado», en el vocabulario de la bitácora). El campo del formulario público ya llega en los datos de la empresa que tiene el
formulario.

El texto deja de estar escrito a mano y pasa a los textos del portal, en español y en inglés:

- **Español**: «No tienes canales de publicación habilitados. La oferta se creará, pero los
  candidatos tendrás que cargarlos a mano.»
- **Inglés**: «You have no publication channels enabled. The offer will be created, but you'll have
  to add candidates manually.»

Mismo lugar y mismo tipo de aviso que hoy (de advertencia).

### 3 · El modo demo (decisión 15)

Una empresa en modo demo **no ve el aviso**, aunque no tenga portales ni formulario. La marca del
modo demo ya llega en los datos de la empresa (el backend los devuelve enteros), pero el tipo de la
empresa del portal no la declara: se añade solo lo que hace falta leer, la marca de encendido.

## 🔴 Dónde se para

- **El Computrabajo «preseleccionado» del formulario no se toca** (punto C): no hace nada.
- **Nada del formulario público, de «Compartir» ni de LinkedIn**: solo se lee el campo de la
  empresa.
- **Ni el panel «Vinculación ATS» ni las demás herramientas de desarrollo.**
- **Nada del backend.**
- Sin comentarios en el código, sin formateador. Identificadores en inglés, también en los parámetros
  de los callbacks. **Lo nuevo no lleva texto escrito a mano**: va a los textos del portal.

## Verificación

- `npm run typecheck`, una vez sobre el conjunto.
- **Las pruebas a mano no las haces tú**: el usuario las corre en el servidor de pruebas, con el frente
  entero, en el cierre. Están en `pruebas-a-mano.md`. Si al leer el código ves un caso que falta,
  dilo.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados.
2. Después: qué cambió y el resultado de la comprobación de tipos.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
