# Pruebas a mano · crear ofertas sin canales

Se corren **en el servidor de pruebas**, con el frente entero fusionado en `develop` y antes de pasar
a `main` (bitácora, *Antes de desplegar*). El portal no tiene pruebas automáticas, y lo que dice el
agente de WhatsApp tampoco se puede probar con ellas: esto es lo único que comprueba lo que ve y lee
una persona.

⚠️ Si en el servidor de pruebas está encendido el modo de pruebas de los portales, ese modo ya se
saltaba el rechazo del backend: ver crearse la oferta no prueba el paso 1, que cubren las pruebas
automáticas. Aquí se prueba lo que ve la persona.

## Antes de empezar

| # | Qué | Resultado |
| --- | --- | --- |
| B1 | Índices de la colección de ofertas: ninguno único sobre las plataformas | **Bien** (2026-10-06): solo el `_id`, el de búsqueda y el único del enlace público, sobre otro campo |
| B2 | Modo de pruebas de los portales (`ATS_STUB_MODE`) en el backend | **Encendido** (2026-10-06). Ese modo ya se saltaba el rechazo: la P2 no prueba que el backend dejó de rechazar (lo cubren las pruebas automáticas). Tampoco despacha robots: con Pedro no se publica nada de verdad. Lo que ve y lee la persona sí se prueba igual |

## Las empresas

| Quién | Portales | Formulario público (Mi Compañía) | Ofertas |
| --- | --- | --- | --- |
| **Laura** | Ninguno habilitado | Apagado | Ninguna al empezar |
| **Sofía** | Ninguno habilitado | Encendido | Cualquiera |
| **Pedro** | Computrabajo habilitado | Apagado | Cualquiera |

Laura puede ser la misma empresa que Sofía, encendiendo el formulario después de sus casos.

**En el servidor de pruebas (2026-10-06)** se usa la empresa de pruebas del usuario como Laura:
en la pestaña Flujo de Mi Compañía se apaga **el interruptor de cada portal** (no el general
«Portales de empleo», que es decorativo) y el formulario de postulación. Como ya tiene ofertas, **la
P1 no aplica**: el botón del listado vacío abre el mismo formulario y el aviso se prueba en la P4.

🔴 **Al terminar: volver a encender los portales de esa empresa.** Mientras estén apagados, sus
ofertas no traen candidatos de los portales.

## Portal (paso 2)

| # | Quién | Qué hace | Qué se espera | Resultado |
| --- | --- | --- | --- | --- |
| P1 | Laura | Abre el listado de ofertas vacío y pulsa el botón del listado vacío | El formulario abre con el aviso «No tienes canales de publicación habilitados. La oferta se creará, pero los candidatos tendrás que cargarlos a mano.» | **No aplica** en el servidor de pruebas: la empresa ya tiene ofertas. Cubierta por la P4 |
| P2 | Laura | Completa y guarda la oferta | Se crea, sin error | **Bien** (2026-10-06): «Prueba oferta sin canales» (`6ac515a7d4f32ed732ce5332`), creada con IA; en la base, activa y con la lista de plataformas vacía |
| P3 | Laura | Ya con una oferta: mira crear, crear con IA y copiar | Los tres encendidos, sin «Configura al menos un ATS…» al pasar el ratón; copiar dice «Copiar oferta» | **Bien** (2026-10-06) |
| P4 | Laura | Abre el formulario por crear, por crear con IA y por copiar | Las tres veces, el mismo aviso | **Bien** (2026-10-06). El usuario pide «manualmente» en vez de «a mano» (decisión 7 corregida) |
| P5 | Laura | Carga un candidato a mano desde la oferta, y otro con la carga masiva | Los dos entran en la oferta y empiezan su recorrido | **Bien, reducida** (2026-10-06): solo el alta individual, por decisión del usuario; el candidato entró y le llegó el primer mensaje. La carga masiva queda comprobada solo leyendo el código (punto G) |
| P6 | Sofía | Abre el formulario de creación | Sin aviso | **Bien** (2026-10-07, según el usuario) |
| P7 | Pedro | Abre el formulario de creación | Sin aviso; todo como antes | **Bien** (2026-10-07, según el usuario) |
| P8 | Laura, con el portal en inglés | Abre el formulario de creación | El aviso en inglés | **Bien** (2026-10-06). De esta prueba salió el paso 2b: el resto del recorrido mezclaba idiomas |
| P9 | Una empresa en modo demo, sin portales ni formulario | Mira los botones y abre el formulario de creación | Crear, crear con IA y copiar encendidos; sin aviso | **Bien** (2026-10-07, según el usuario) |
| P10 | Laura, en español | Abre el formulario de creación | El aviso dice «…tendrás que cargarlos manualmente.» (paso 2b) | **Bien** (2026-10-07, según el usuario) |
| P11 | Cualquiera, con el portal en inglés | Recorre «Create with AI» (botón, ventana, generar), cancela una creación, copia una oferta | Todo en inglés: botón, ventana, contador, mensajes verdes, confirmación con «Yes»/«No», «Copy offer» (paso 2b) | **Bien** (2026-10-07, según el usuario) |
| P12 | Cualquiera, en español | El mismo recorrido | Los mismos textos de antes, en español (paso 2b) | **Bien** (2026-10-07, según el usuario) |

Si el formulario se abre desde el listado vacío antes de que carguen los datos de la empresa, el
aviso tarda un instante en salir. Pasaba igual antes del cambio: no es un fallo.

## Agente de WhatsApp (pasos 1 y 1c)

**No se prueban a mano** (usuario, 2026-10-06): crear ofertas por el agente de WhatsApp todavía no
está en uso. Además, el simulador de WhatsApp del servidor de pruebas solo escribe a la línea de
reclutamiento (`…001`), no a la del agente (`…002`): comprobado en el registro de mensajes entrantes
del backend. Lo que el código le indica al agente en cada caso está cubierto por las pruebas
automáticas; queda sin ver cómo lo redacta el agente (W1 y W7).

| # | Quién | Qué hace | Qué se espera | Resultado |
| --- | --- | --- | --- | --- |
| W1 | Laura | Pide una oferta por WhatsApp; el agente le muestra el borrador | Si habla de la búsqueda, lo hace en condicional («si tienes canales…»); no la promete | |
| W2 | Laura | Confirma | La oferta se crea, y el agente le dice que no se publicará en ningún canal y que los candidatos se cargan a mano desde el portal | |
| W3 | Laura | Pregunta por esa oferta, todavía sin candidatos | Le dice que no tiene canales y que los candidatos no llegan solos; no promete avisar | |
| W4 | Sofía | Crea una oferta por WhatsApp | Le dice que el sistema ya comenzó a buscar candidatos | |
| W5 | Sofía | Pregunta por esa oferta, sin candidatos | Le dice que está publicada y aún no hay postulantes | |
| W6 | Pedro | Crea una oferta por WhatsApp | Como antes: el sistema ya comenzó a buscar candidatos | |
| W7 | Cualquiera | Pregunta «¿qué ofertas tengo?» | «En proceso» se explica sin decir que el sistema capta candidatos | |
