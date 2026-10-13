# Pruebas a mano · canales de publicación al crear la oferta

Se corren **en el servidor de pruebas**, con la tarea entera fusionada en `develop` y desplegada, y
antes de pasar a `main` (bitácora, *Antes de desplegar*). El portal no tiene pruebas automáticas: esto
es lo único que comprueba lo que ve una persona. Se revisan una por una con el planificador.

⚠️ **Con el modo de simulación de portales encendido no se despacha ningún robot**: no se publica nada
de verdad, y la republicación de Pandapé en Computrabajo no se puede ver aquí (la cubren las pruebas
automáticas del backend). Lo que sí se ve es **en qué portales queda apuntada la oferta**, que es lo
que decide dónde se publicaría. Se mira en la base con:

`db.offers.findOne({ _id: ObjectId("<id de la oferta>") }, { title: 1, atsIds: 1 })`

El identificador de la oferta sale en la dirección de su ficha.

## Antes de empezar

| # | Qué | Resultado |
| --- | --- | --- |
| B1 | El modo de simulación de portales en el backend: `docker exec selessia-backend printenv ATS_STUB_MODE` | **Encendido** (`true`, 2026-10-12): no se despacha ningún robot; las pruebas se leen en la base |
| B2 | 🔴 **Antes de desplegar el backend**, en la base del servidor de pruebas (confirma a cuál estás conectado): ver qué empresas tienen Pandapé y escribirles el dato de republicación. Las dos instrucciones están en la bitácora, *Antes de desplegar* | **Hecho** (2026-10-12), antes de desplegar el backend: cuatro empresas con Pandapé (dos de Medicall, «Elvis Test» y una de pruebas), ninguna con el dato; escrito en las cuatro (`matchedCount: 4`, `modifiedCount: 4`) |
| B3 | Desplegado `develop` con la tarea, backend y portal. El asistente de creación tiene siete pasos | **Bien** (2026-10-13). De aquí sale el paso 3b: el usuario pide las notas de cada portal a la derecha del nombre, en gris e itálica |

## Las empresas

| Quién | Portales | Formulario público |
| --- | --- | --- |
| **Laura** | Ninguno configurado | Apagado |
| **Pedro** | Computrabajo y elempleo, con usuario y contraseña, encendidos. Pandapé sin configurar al empezar | Da igual |

Pedro puede ser la empresa de pruebas del usuario. Para las pruebas de Pandapé (sección D), Pedro
configura Pandapé con un usuario y una contraseña cualquiera: con el modo de simulación no se usan.

🔴 **Al terminar: dejar las empresas como estaban** (portales encendidos, Pandapé y su switch).

## C · El paso del asistente (paso 3)

| # | Quién | Qué hace | Qué se espera | Resultado |
| --- | --- | --- | --- | --- |
| C1 | Pedro | Abre «Crear oferta» y llega al último paso | Siete pasos; el último, «Canales de publicación», con Computrabajo y elempleo marcados y Pandapé deshabilitado con «Sin configurar. Configúralo en Mi Compañía.» | |
| C2 | Pedro | Crea sin tocar las casillas | En la base, la oferta tiene Computrabajo y elempleo | |
| C3 | Pedro | Crea desmarcando elempleo | En la base, solo Computrabajo | |
| C4 | Pedro | Crea desmarcando todo | Se crea; en la base, la lista vacía | |
| C5 | Laura | Abre el asistente y crea | En el primer paso, el aviso de siempre; en el último, los tres deshabilitados; en la base, la lista vacía | |
| C6 | Pedro | Apaga elempleo en Mi Compañía y abre el asistente | elempleo deshabilitado con «Apagado en Mi Compañía.» | |
| C7 | Pedro | Abre el asistente hasta el último paso; en otra pestaña apaga elempleo; vuelve y crea con elempleo marcado | Error arriba del asistente: «elempleo no está disponible en tu empresa…»; el asistente sigue abierto con todo; al desmarcar elempleo, crea | |
| C8 | Pedro | Copia la oferta de la C3 (solo Computrabajo) | En el último paso, Computrabajo **y** elempleo marcados: parten de la empresa | |
| C9 | Pedro | Entra al asistente por «Crear con IA» | El mismo último paso | |
| C10 | Pedro | En el asistente, «Atrás» desde la agenda y desde el último paso | Desde la agenda vuelve a documentos (antes saltaba a verificación); desde el último, a la agenda | |
| C11 | Pedro | Cambia casillas, cancela, vuelve a abrir el asistente | El último paso vuelve a los valores de la empresa | |
| C12 | Pedro, con el portal en inglés | Llega al último paso | Textos en inglés: «Publication channels», «Not set up…», «Turned off…» | |
| C13 | Pedro | Mira el último paso en una ventana ancha y luego en una estrecha (paso 3b) | Ancha: cada nota a la derecha de su portal, en una columna, gris e itálica. Estrecha: la nota baja debajo del nombre; nada se corta ni se monta | |

## D · Pandapé ligado a Computrabajo (pasos 2, 3 y 4)

| # | Quién | Qué hace | Qué se espera | Resultado |
| --- | --- | --- | --- | --- |
| D1 | Pedro | En Mi Compañía, abre «Editar» de Computrabajo y de elempleo | Sin switch de republicación | |
| D2 | Pedro | Abre «Editar» de Pandapé, pone usuario y contraseña, deja el switch como está y guarda | El switch sale **apagado**; Pandapé queda configurado y encendido | |
| D3 | Pedro | Abre el asistente | Pandapé marcado y Computrabajo marcado, **sin** aviso | |
| D4 | Pedro | En el modal de Pandapé enciende «Republicar en Computrabajo» y guarda; lo vuelve a abrir | El switch sigue encendido. En la base, la empresa tiene `atsCrossPosting` con Pandapé → Computrabajo | |
| D5 | Pedro | Abre el asistente | Pandapé marcado; Computrabajo **desmarcado**, con «Esta oferta también saldrá en Computrabajo a través de Pandapé.» | |
| D6 | Pedro | Marca Computrabajo | Confirmación «¿Publicar también en Computrabajo?». «Cancelar» lo deja desmarcado; «Marcar igual» lo marca | |
| D7 | Pedro | Desmarca Pandapé; luego lo vuelve a marcar | Al desmarcar: Computrabajo se marca solo y el aviso se va. Al marcar: Computrabajo se desmarca solo, sin confirmación, y vuelve el aviso | |
| D8 | Pedro | Crea con Pandapé y sin Computrabajo | En la base, la oferta tiene Pandapé (y elempleo si estaba marcado), sin Computrabajo | |
| D9 | Pedro | Apaga Computrabajo en Mi Compañía y abre el asistente | Computrabajo deshabilitado con «Apagado…»; el aviso de Pandapé sigue saliendo con Pandapé marcado | |
| D10 | Pedro | Vuelve a encender Computrabajo. Edita sus credenciales y guarda | En la base, `atsCrossPosting` no cambia | |
| D11 | Pedro | En el modal de Pandapé apaga el switch y guarda | En la base, `atsCrossPosting` queda como lista vacía; en el asistente, sin aviso y Computrabajo marcado | |
| D12 | La empresa que ya usa Pandapé, si está en el servidor de pruebas | Abre su modal de Pandapé | El switch sale encendido (por la B2) | |
| D13 | Pedro, con Pandapé configurado y el switch apagado, con dos pestañas: el asistente en el paso de canales y Mi Compañía | En Mi Compañía enciende el switch y guarda. En el asistente, «Atrás» y «Siguiente» para volver al paso, **sin recargar** (paso 3c) | Un instante «Cargando los portales de tu empresa…»; luego Computrabajo desmarcado y el aviso de Pandapé | |
| D14 | Pedro, igual que la D13 pero al revés | Apaga el switch en la otra pestaña y vuelve al paso | Computrabajo marcado y sin aviso | |
| D15 | Pedro, con el switch apagado | En el asistente marca y desmarca Computrabajo hasta dejarlo marcado; vuelve a la agenda; en la otra pestaña enciende el switch; vuelve al paso | Computrabajo desmarcado con el aviso (vuelve a su valor por defecto); marcarlo pide la confirmación | |

## G · El interruptor general de Mi Compañía (paso 4)

| # | Quién | Qué hace | Qué se espera | Resultado |
| --- | --- | --- | --- | --- |
| G1 | Pedro | Mira el general «Portales de empleo» | Encendido, se puede tocar, sin «Obligatorio» al pasar el ratón. Viabilidad, más abajo, sigue con «Obligatorio» | |
| G2 | Pedro | Apaga el general | Todos sus portales se apagan y sus interruptores quedan grises; «Editar» sigue funcionando | |
| G3 | Pedro | Enciende el general | Los interruptores se pueden tocar, pero siguen apagados. Enciende elempleo | |
| G4 | Pedro | Con todos los portales apagados, recarga la página | El general sale apagado | |
| G5 | Pedro | Enciende el general sin encender ningún portal y pulsa «Recargar» de Mi Compañía | El general sigue encendido | |
| G6 | Pedro | Con el general apagado, edita la contraseña de un portal apagado y guarda | El portal sigue apagado y el general también | |
| G7 | Laura | Mira el general | Apagado; los «Editar» funcionan | |

## Lo que no se prueba aquí, y por qué

- **Que la republicación siga o no según el dato**: con el modo de simulación no se despacha el robot.
  Lo cubren las pruebas automáticas del backend.
- **Crear sin elección** (agente de WhatsApp, Maya, superadmin): el agente no está en uso y el
  simulador no llega a su línea. Lo cubren las pruebas automáticas.
- **El asistente sin los datos de la empresa** (decisión 13): difícil de provocar; se revisó en el
  código.
- **Un portal con usuario y sin contraseña**: Mi Compañía no deja guardarlo así; se revisó en el
  código.
