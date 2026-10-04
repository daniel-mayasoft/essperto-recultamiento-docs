# Pruebas a mano · crear ofertas sin canales

Se corren **en el servidor de pruebas**, con el frente entero fusionado en `develop` y antes de pasar
a `main` (bitácora, *Antes de desplegar*). El portal no tiene pruebas automáticas, y lo que dice el
agente de WhatsApp tampoco se puede probar con ellas: esto es lo único que comprueba lo que ve y lee
una persona.

⚠️ Si en el servidor de pruebas está encendido el modo de pruebas de los portales, ese modo ya se
saltaba el rechazo del backend: ver crearse la oferta no prueba el paso 1, que cubren las pruebas
automáticas. Aquí se prueba lo que ve la persona.

## Las empresas

| Quién | Portales | Formulario público (Mi Compañía) | Ofertas |
| --- | --- | --- | --- |
| **Laura** | Ninguno habilitado | Apagado | Ninguna al empezar |
| **Sofía** | Ninguno habilitado | Encendido | Cualquiera |
| **Pedro** | Computrabajo habilitado | Apagado | Cualquiera |

Laura puede ser la misma empresa que Sofía, encendiendo el formulario después de sus casos.

## Portal (paso 2)

| # | Quién | Qué hace | Qué se espera | Resultado |
| --- | --- | --- | --- | --- |
| P1 | Laura | Abre el listado de ofertas vacío y pulsa el botón del listado vacío | El formulario abre con el aviso «No tienes canales de publicación habilitados. La oferta se creará, pero los candidatos tendrás que cargarlos a mano.» | |
| P2 | Laura | Completa y guarda la oferta | Se crea, sin error | |
| P3 | Laura | Ya con una oferta: mira crear, crear con IA y copiar | Los tres encendidos, sin «Configura al menos un ATS…» al pasar el ratón; copiar dice «Copiar oferta» | |
| P4 | Laura | Abre el formulario por crear, por crear con IA y por copiar | Las tres veces, el mismo aviso | |
| P5 | Laura | Carga un candidato a mano desde la oferta, y otro con la carga masiva | Los dos entran en la oferta y empiezan su recorrido | |
| P6 | Sofía | Abre el formulario de creación | Sin aviso | |
| P7 | Pedro | Abre el formulario de creación | Sin aviso; todo como antes | |
| P8 | Laura, con el portal en inglés | Abre el formulario de creación | El aviso en inglés | |
| P9 | Una empresa en modo demo, sin portales ni formulario | Abre el formulario de creación | Sin aviso | |

## Agente de WhatsApp (pasos 1 y 1c)

| # | Quién | Qué hace | Qué se espera | Resultado |
| --- | --- | --- | --- | --- |
| W1 | Laura | Pide una oferta por WhatsApp; el agente le muestra el borrador | Si habla de la búsqueda, lo hace en condicional («si tienes canales…»); no la promete | |
| W2 | Laura | Confirma | La oferta se crea, y el agente le dice que no se publicará en ningún canal y que los candidatos se cargan a mano desde el portal | |
| W3 | Laura | Pregunta por esa oferta, todavía sin candidatos | Le dice que no tiene canales y que los candidatos no llegan solos; no promete avisar | |
| W4 | Sofía | Crea una oferta por WhatsApp | Le dice que el sistema ya comenzó a buscar candidatos | |
| W5 | Sofía | Pregunta por esa oferta, sin candidatos | Le dice que está publicada y aún no hay postulantes | |
| W6 | Pedro | Crea una oferta por WhatsApp | Como antes: el sistema ya comenzó a buscar candidatos | |
| W7 | Cualquiera | Pregunta «¿qué ofertas tengo?» | «En proceso» se explica sin decir que el sistema capta candidatos | |
