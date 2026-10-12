# Brief · Paso 4 — el interruptor general y el switch de republicación en Mi Compañía

Para quien ejecuta este paso. Dos cambios en la pestaña Flujo de Mi Compañía: el interruptor general
«Portales de empleo», que hoy no hace nada, pasa a funcionar; y el modal de edición de Pandapé suma
el switch «Republicar en Computrabajo», que guarda el dato que el backend ya lee (paso 2). Solo
portal, en un **commit nuevo** encima del paso 3. **Una ronda de opinión previa.**

Antes de empezar, lee en la bitácora **las decisiones 6 y 11** y, en la tabla de *Pasos*, la nota del
paso 4.

## Rama

`feat/publication-channels` en `esscoti-frontend`, con el paso 3 commiteado (`8ff8b17`), limpia. Línea
base: `npm run typecheck` sin errores. Si `develop` avanzó, dilo y no lo fusiones.

## Qué le pasa a una persona

Pedro tiene Computrabajo y elempleo configurados y encendidos.

| | Hoy | Después |
| --- | --- | --- |
| Pedro mira el interruptor general | Encendido, gris, con «Obligatorio» al pasar el ratón; no hace nada | Encendido y se puede tocar |
| Pedro lo apaga | — | Computrabajo y elempleo se apagan (se guarda) y sus interruptores quedan grises |
| Lo vuelve a encender | — | Los interruptores de cada portal se pueden tocar, **pero siguen apagados**; Pedro enciende el que quiera |
| Recarga la página | — | El general sale encendido si algún portal lo está, y apagado si están todos apagados |
| Enciende el general, no enciende ningún portal y recarga | — | El general vuelve a salir apagado (coherente: no tiene nada encendido) |
| Laura, sin portales configurados | Encendido, gris | Apagado. Los botones «Editar» de cada portal siguen funcionando |
| Con el general apagado, Pedro configura un portal nuevo desde «Editar» | — | Ese portal nace encendido (como hoy) y el general pasa a encendido |
| Pedro abre «Editar» de Pandapé | Usuario y contraseña | Además, el switch «Republicar en Computrabajo» |
| Abre «Editar» de Computrabajo o de elempleo | Usuario y contraseña | Igual: el switch no sale |
| La empresa que ya usa Pandapé abre su modal | — | El switch sale **encendido** (el dato se escribe en la base antes de desplegar) |
| Una empresa que nunca lo tocó | — | El switch sale **apagado**: el dato no viene, y «no viene» es apagado |
| Pedro enciende o apaga el switch y pulsa «Guardar» | — | Se guarda junto con las credenciales |

## Qué se hace

### 1 · El interruptor general (decisión 11)

- **Su estado vive solo en el portal.** Se calcula al cargar la empresa: encendido si algún portal con
  credenciales está encendido.
- 🔴 **Trampa:** si el estado se recalculara siempre a partir de los portales, encenderlo con todos
  apagados no serviría de nada: el cálculo lo devolvería a apagado al instante y los interruptores de
  cada portal seguirían grises. Encenderlo tiene que dejarlo encendido hasta recargar. Pero cada
  cambio de un portal recarga la empresa en la página, así que «recalcular al cargar» tiene que
  significar al entrar en la pantalla, no en cada recarga de la empresa. Propón cómo en la opinión
  previa.
- **Apagarlo** apaga todos los portales con credenciales **en una sola petición** (como el
  interruptor de un portal, pero para todos) y deja grises sus interruptores. Si la petición falla,
  todo vuelve a como estaba y sale el error de siempre.
- **Encenderlo** no guarda nada: solo deja tocar los interruptores de cada portal.
- **Los botones «Editar» de cada portal funcionan siempre**, con el general encendido o apagado.
- **Se quita «Obligatorio»** del general. El interruptor de Viabilidad, más abajo, lo conserva: ese sí
  es obligatorio.
- El aviso de Mi Compañía «No hay ninguna plataforma ATS habilitada…» **no cambia**.

### 2 · El switch de republicación en el modal de Pandapé (decisión 6)

- **Solo en el modal de Pandapé.** El modal es uno solo para los tres portales; el switch sale cuando
  el portal es Pandapé.
- **Su valor**: encendido si la empresa tiene una entrada de Pandapé con Computrabajo entre sus
  destinos. 🔴 **Las empresas existentes llegan sin el dato**: «no viene» es apagado.
- **Se guarda con «Guardar» del modal**, en la misma petición que las credenciales: encendido manda
  Pandapé → [Computrabajo]; apagado manda **la lista vacía**. 🔴 **Nunca un nulo**: el backend lo
  rechaza y el guardado entero fallaría. Los modales de Computrabajo y elempleo **no mandan** el dato.
- Cancelar el modal no guarda nada.

### 3 · El comentario fuera de sitio del paso 3

En el asistente de creación, los dos estados del paso de canales (`channelOverrides` y
`confirmDoublePublishOpen`) quedaron debajo del comentario «Edit-mode vacancy confirmation state», que
los describe mal. Súbelos por encima de ese comentario, sin añadir otro.

### 4 · Los textos

En español e inglés. **Confirmados por el usuario el 2026-10-12; literales:**

| Dónde | Español | Inglés |
| --- | --- | --- |
| Switch del modal de Pandapé | Republicar en Computrabajo | Republish on Computrabajo |
| Explicación debajo del switch | Al publicar en Pandapé, la oferta también sale en Computrabajo, con los créditos de tu cuenta de Pandapé. | When publishing on Pandapé, the offer is also posted on Computrabajo, using your Pandapé account's credits. |

El interruptor general queda **sin texto al pasar el ratón**.

## 🔴 Dónde se para

- **Nada del asistente de creación** salvo el punto 3.
- **Nada del backend.**
- **Los interruptores de cada portal** siguen guardando como hoy; solo se ponen grises con el general
  apagado.
- **Ni el formulario público, ni las etapas del proceso, ni Viabilidad.**
- Sin comentarios en el código, sin formateador, sin lint. Identificadores en inglés, también en los
  parámetros de los callbacks, aunque el archivo tenga nombres en español de antes.

## Lo que tu opinión previa tiene que confirmar

1. **Cómo resuelves la trampa del punto 1**, y en qué momento exacto se calcula el general.
2. **Qué manda la petición de apagar todo** y que conserva usuario y contraseña de cada portal (vacía
   significa «conserva la guardada»).
3. **Que el guardado del modal de Pandapé manda el dato y los otros dos no**, y que ningún otro
   guardado de Mi Compañía lo manda.
4. **Si hay otra pantalla que edite las credenciales de los portales** (por ejemplo, la edición
   interna de empresas) y qué pasa allí con el general y con el switch.
5. Los nombres que propones.

## Verificación

- `npm run typecheck`, **una vez**, sin errores.
- **Las pruebas a mano son del cierre, en el servidor de pruebas.** El planificador las escribe a
  partir de la tabla de arriba. Si ves algo que conviene probar y no está, dilo en el reporte.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados.
2. Después: qué cambió y el resultado real de la comprobación de tipos.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
