# La etapa psicométrica hoy, de punta a punta

Cómo funciona la etapa **tal como está en el código** de la rama de trabajo, leído el
2026-09-11 tras el paso 7 y el rescate, y actualizado el 2026-09-12 con el cambio de la cuenta
compartida (decisiones 34 y 40) y el del correo inventado (decisión 33). No es historia ni
justificación: **los porqués están en la bitácora**, y aquí solo se apunta el número de
decisión. Cuenta qué le pasa a una persona en cada caso.

🔴 **Regla de mantenimiento:** todo brief que cambie el flujo actualiza este documento **en la
misma revisión del diff**, antes de dar el paso por cerrado. Si no, en dos pasos será una
tercera copia desincronizada, que es justo lo que existe para evitar.

## Las piezas, en una frase cada una

- **El embudo** (el orquestador): decide cuándo arranca la etapa, le escribe al candidato,
  guarda su estado, aprueba y descarta. Es el único que conoce el modo demo.
- **El puerto**: una capa que no conoce a ningún proveedor. Ofrece listar vacantes, comprobar
  que una vacante sirve, validar una conexión, **invitar** a un candidato y **consultar
  resultados en lote**. Hoy tiene una sola implementación: el adaptador de EvaluaTest.
- **El adaptador de EvaluaTest**: resuelve las credenciales de la empresa —correo, contraseña e
  identificador de empresa, los tres, o falla como **sin conexión**—, hace contra el cliente
  los pasos que EvaluaTest exige y traduce sus estados a los neutros del puerto. Es **la única
  regla de lectura de credenciales** de la etapa; el embudo ya no lee ninguna (decisiones 34 y
  40).
- **El cliente de EvaluaTest**: las peticiones HTTP. Exige credenciales en cada llamada; **ya
  no existe la cuenta compartida del entorno** (decisión 34).
- **El cron**: cada 5 minutos consulta resultados por el puerto y decide el veredicto.

## 1 · La empresa se conecta y configura la oferta

1. En *Mi compañía*, un administrador guarda correo y contraseña de EvaluaTest. El backend
   los valida por el puerto y guarda además el identificador de empresa que EvaluaTest
   devuelve. La contraseña se guarda encriptada.
2. Al crear o editar una oferta, el reclutador ve los controles de la prueba psicométrica
   **solo si la empresa tiene esas credenciales guardadas**. Si no, en su lugar ve un aviso
   neutro —*tu empresa no tiene un proveedor de pruebas psicométricas conectado; esta etapa se
   omitirá*— con un enlace a *Mi compañía* si tiene permiso para editar la empresa, y si no,
   la indicación de pedírselo a un administrador (decisión 40). Con credenciales, elige una
   vacante de la lista que el puerto devuelve, fija el puntaje mínimo (hoy etiquetado "IGI",
   decisión 8 pendiente) y, opcionalmente, pruebas adicionales — estas últimas no pasan por el
   puerto: son exclusivas de EvaluaTest (decisión 4).
3. Al guardar con la prueba activa, el backend comprueba por el puerto que la vacante sigue
   sirviendo. **Si la empresa no tiene conexión, la comprobación falla antes de tocar al
   proveedor y la ruta rechaza con un mensaje propio** —conéctalo en Mi compañía antes de
   activar la prueba—, distinto del «no se pudo verificar, reintenta» de un fallo pasajero
   (decisión 40). Apagar la prueba no exige conexión. Con conexión, guarda la configuración en
   la oferta con la forma de EvaluaTest: vacante, nombre, dos códigos propios, puntaje mínimo
   y pruebas adicionales (decisiones 7 y 19, brief 8). Cada vez que se abre la oferta, el
   portal vuelve a comprobar la vacante y avisa si dejó de servir.
4. **Una oferta con la prueba activa cuya empresa ya no tiene conexión** —solo puede pasar
   si se borraron las credenciales después, o si la oferta se creó desde administración, que
   copia la configuración sin comprobar nada— muestra en el detalle un aviso de advertencia
   propio: *la prueba está activada, pero tu empresa ya no tiene proveedor; la etapa se está
   omitiendo*. Sin interruptor, sin botón de configurar y sin la alerta de estado de la
   vacante, que consultaría al proveedor sin conexión. El detalle tampoco pide las pruebas de
   la vacante hasta saber que la empresa tiene credenciales.

## 2 · El candidato entra a la etapa

El candidato viene de las preguntas por WhatsApp. El bombeo del embudo lo pone en la etapa
y llama al arranque.

**Si la oferta no tiene la prueba encendida**, la etapa se aprueba sola y sigue a la
siguiente. Es lo primero que ocurre, antes de mirar nada más.

**Si la tiene**, el arranque mira si la empresa está en modo demo (ver §7) y, si no:

1. Llama a **la invitación del puerto** con la vacante y su nombre, la empresa, nuestra
   referencia del candidato, su nombre y su correo **tal cual, con su nulo si no tiene**. Ya no
   se inventa ningún correo (decisión 33).
2. El adaptador comprueba tres cosas, **en este orden y antes de tocar al proveedor**, y cada
   una aborta con un error de tipo propio que el embudo trata distinto:
   - **La credencial de la empresa.** Si le falta cualquiera de las tres cosas, o no llegó
     empresa, aborta con *sin conexión*, y el embudo **aprueba la etapa y sigue**, por el
     mismo camino que la oferta sin prueba: el candidato no recibe ningún mensaje, no se le
     escribe nada y no se guarda nada. Queda un aviso en el registro con la empresa y la
     oferta (decisiones 34 y 40). Va primero porque sin prueba que perder da igual lo demás.
   - **El nombre de la vacante.** Si no está guardado, aborta con **el error de tipo
     permanente** (decisiones 35 y 39). Va antes que el correo porque es un error de
     configuración y merece la alerta a soporte.
   - **El correo del candidato**, nulo o en blanco. Aborta con *falta un dato del candidato*,
     y el embudo lo **descarta** con `psychometric_missing_email`, sin mensaje y sin escribirle
     nada más: Julián contestó la última pregunta y se quedó en silencio (decisiones 31 y 33).
     Es la única puerta por la que hoy sale gente del proceso al entrar a la etapa.

   Con las tres en orden, pasan **cuatro** cosas (32-a): se resuelve el código de evaluación
   de la vacante, se registra al candidato con nuestra referencia, se le invita, y **si la
   invitación falla se le manda el correo directo**.
3. El embudo guarda en el candidato: el proveedor (`evaluatest`), el identificador que
   EvaluaTest le dio, la fecha de consulta, y en la bolsa del proveedor **el correo de
   registro solo si difiere del real** — vacío significa *empareja por el correo verdadero*
   (32-d). El estado del candidato pasa a *esperando resultado externo*. El guardado es con
   reintento (varios candidatos de la misma oferta terminan a la vez).
4. Le escribe por WhatsApp: el enlace que devolvió la invitación, su correo enmascarado, las
   instrucciones y **el plazo**, que sale del mismo resolutor que usa el descarte (empresa >
   entorno > 2 días). Si la invitación no trajo enlace, el mensaje solo dice que llegará por
   correo — ⚠️ y no anuncia el plazo, aunque corre igual (riesgo abierto; con EvaluaTest hoy
   es inalcanzable).

### Si el arranque falla

- **Fallo pasajero** (red, proveedor caído, sin código de evaluación): se le avisa al
  candidato **una sola vez** —con un enlace de respaldo si se puede armar, o el aviso del
  correo si no—, se le deja *esperando resultado externo* **sin identificador** y se guarda.
  El enlace de respaldo lo arma **el adaptador**: con el código de evaluación guardado en la
  oferta si lo hay, y si no resolviéndolo por el cliente con la credencial de la empresa; el
  embudo ya no llama al cliente ni lee credenciales aquí. **El cron lo reintenta** cada 5 minutos (§4). ⚠️ *Sin código de evaluación*
  cuenta como pasajero a propósito: EvaluaTest responde igual cuando el código no existe y
  cuando el endpoint falla (decisión 39).
- **Fallo permanente** (vacante sin nombre guardado): el arranque **deja salir la excepción**
  y actúa el mecanismo de la casa para cualquier etapa que falla al arrancar: correo de
  alerta a soporte, vuelta a la cola, hasta tres intentos y descarte con el motivo de
  *arranque fallido*, que el portal ya traduce. **Ese candidato no recibe ningún mensaje**
  (decisión 39). Medido el 2026-09-11: hoy no hay ninguna oferta viva en ese caso.

### Las cinco puertas del arranque

Por dónde se puede llegar a arrancar la etapa, y qué hace cada una con el fallo permanente
(decisión 39). **Ni *sin conexión* ni *falta un dato* llegan a ninguna**: el arranque los
convierte en aprobar y en descartar antes de que salgan, así que por las cinco puertas la
empresa sin conexión se salta la etapa (decisión 40) y el candidato sin correo se descarta
(decisión 33). Dos consecuencias que constan: el reintento manual del administrador responde
"reintentado" en los dos casos, y el botón "Continuar proceso" aprueba o descarta sin decir
nada.

| Puerta | Qué pasa con el fallo permanente |
| --- | --- |
| El bombeo, al entrar a la etapa | Lo lleva al mecanismo de arranque fallido (arriba) |
| El bombeo, al retomar a un candidato aparcado sin identificador | Igual |
| El reintento manual del administrador | La petición responde con error y el candidato queda como estaba |
| El cron, al reintentar a quien no tiene identificador | Lo **descarta** con *arranque fallido* (§4) |
| El botón "Continuar proceso" de un recordatorio | ⚠️ **Se lo traga**: el webhook atrapa cualquier fallo. El candidato gastó la reapertura de WhatsApp en un botón que no hizo nada (sin paso todavía) |

Retomar a un candidato que **ya tiene** identificador no reinvita: solo lo devuelve a
*esperando resultado externo*.

## 3 · El cron consulta resultados

Cada 5 minutos, con un candado para que no corran dos pasadas a la vez. Recorre **todas las
ofertas menos las canceladas** que tengan candidatos esperando resultado en esta etapa, y por
cada oferta:

1. Salta la oferta si no tiene la prueba encendida.
2. Resuelve si la empresa está en demo desde un mapa cargado una vez por ciclo.
3. Separa a los pendientes en dos: **los que tienen identificador del proveedor** entran a la
   consulta; los que no, van al reintento del arranque (§4).
4. Carga en un solo golpe los correos reales de los que va a consultar.
5. Hace **una sola llamada al puerto por oferta** (decisión 22) con, por candidato, nuestra
   referencia, su identificador, el correo de registro y el correo real. El adaptador trae
   el tablero de la vacante y empareja **por dos llaves**: primero por correo —el de registro
   si existe, si no el real— y como respaldo por identificador.
6. Recibe un estado neutro por candidato:

| Estado | Qué significa | Qué hace el cron |
| --- | --- | --- |
| `finished` | Terminó; trae puntaje | Veredicto (§5) |
| `rejected_by_provider` | EvaluaTest lo descartó por su cuenta | Descarta con `psychometric_discarded` |
| `in_progress` | Está en el tablero y sigue en ello | Guarda estado y sigue esperando |
| `not_listed` | Se consultó bien y no aparece todavía | Guarda la fecha de consulta y sigue esperando |
| `query_failed` | **No se pudo preguntar** (excepción, tablero vacío, o **empresa sin conexión**) | Igual que `not_listed`, pero se cuenta aparte en el registro y en el resumen del ciclo |

⚠️ Ante `query_failed` **el plazo sigue corriendo** (decisión 36): una caída más larga que el
plazo descarta gente por vencimiento sin que nadie haya conseguido preguntar. Y el adaptador
no distingue *tablero vacío* de *petición fallida* — el arreglo es del cliente y no tiene paso.
La empresa sin conexión con gente ya esperando cae aquí, con el error *sin conexión* en el
registro, hasta que el plazo la descarte (decisión 40; medido el 2026-09-12: hoy nadie).

## 4 · Dentro del bucle, por candidato, en este orden

Cada iteración recarga la oferta fresca (aprobar a uno sube la versión del documento).

1. **Sin identificador del proveedor → reintenta el arranque entero** (§2). Si el reintento
   falla de forma **permanente**, lo **descarta** con *arranque fallido* — es el rescate del
   2026-09-11; antes se quedaba dentro para siempre, ocupando plaza y teléfono de pruebas
   (decisión 39). Si la empresa **no tiene conexión**, el reintento **aprueba la etapa** y el
   candidato sigue su proceso, igual que en el arranque (decisión 40). Si falla de forma
   pasajera, se registra, se cuenta como error y sigue esperando. ⚠️ Si el documento de la persona no se puede cargar, no se intenta nada y no
   se descarta nada. Medido el 2026-09-11: hoy no hay nadie sin identificador.
2. **Vencimiento**: si entró a la etapa hace más días que el plazo, le escribe que no se
   recibió su resultado a tiempo y lo descarta con `psychometric_external_timeout`. El plazo
   es la ventana que se le anunció; no se detiene por nada (decisión 36).
3. **El resultado** de §3, según el estado.

## 5 · El veredicto

Solo con `finished`. Se guarda el puntaje (⚠️ un puntaje ausente llega como **cero** y
reprueba — decisión 37, sin arreglar, no visto con EvaluaTest) y el estado; en la bolsa del
proveedor se guarda su código numérico. La bolsa **se empalma** a partir de la anterior desde
un único ayudante: el cron nunca pisa el correo de registro que escribió la invitación
(decisión 15).

- **Puntaje ≥ mínimo de la oferta** y, si hay pruebas adicionales, todas aprobadas → le
  escribe un agradecimiento y **aprueba** la etapa. Las pruebas adicionales se piden **al
  adaptador de EvaluaTest directamente** —es un método propio, fuera del puerto, como el de
  las pruebas de la vacante (decisión 4)— con el identificador que volvió del tablero (puede
  discrepar del guardado) y la credencial de la empresa resuelta con la regla del adaptador.
  Si el adaptador falla ahí —también por *sin conexión*—, cuenta como error del ciclo y el
  candidato sigue esperando, como con cualquier excepción. Una oferta demo se las salta por
  su bandera, antes de llamar (§7).
- **Puntaje bajo** → le escribe que se recibieron sus resultados y se seguirá analizando su
  perfil, y descarta con `psychometric_score_<puntaje>`.
- **Prueba adicional no aprobada** (o no encontrada: se tratan igual) → mismo mensaje, y
  descarta con `psychometric_exam_<nombre>`.

El descarte archiva la etapa donde cayó; el portal la lee de ahí y solo deduce por el motivo
en registros viejos (decisión 17).

## 6 · Lo que queda escrito en el candidato

Seis campos con nombre neutro más una bolsa (decisión 15, paso 6b). **Al escribir, siempre
los nuevos; al leer, el nuevo y si está vacío el viejo.** Solo dos se leen:

| Campo | Quién lo lee |
| --- | --- |
| `psychometricProvider` | Nadie todavía (decisión 6; hoy siempre `evaluatest`) |
| `psychometricCandidateId` | El cron (a quién consultar, y a quién reintentar), el retomar, el reenvío del botón |
| `psychometricScore` | Nadie |
| `psychometricState` | Nadie |
| `psychometricLastPolledAt` | Nadie |
| `psychometricProviderData` | El cron, para el correo de registro. Guarda además el código de estado y el resultado por prueba adicional |

Los seis campos viejos con prefijo `evaluatest` siguen en el esquema, solo se leen. La
compatibilidad caduca sola: nadie está a mitad de prueba más que el plazo.

🔴 **Sin vuelta atrás**: la versión anterior del backend no lee los campos nuevos y
reinvitaría a quien se invitó después del despliegue (registro del paso 6b).

## 7 · El modo demo: cinco puntos, todos en el embudo

Una empresa marcada como demo en la base (sin pantalla) enseña el producto a un cliente
potencial con una candidata configurada. La etapa psicométrica **no llama nunca a EvaluaTest**
y **el puerto no sabe que existe la demo** (decisión 38). Los cinco puntos:

1. **La invitación** (§2): en vez del puerto, fabrica un identificador determinístico y
   **positivo**, un enlace de apariencia normal que no lleva a ninguna prueba, y escribe los
   campos nuevos como cualquiera. El mensaje al candidato es el mismo.
2. **El temporizador**: tras el mensaje, agenda una pasada del cron a los segundos de retraso
   configurados (45 por defecto) para que la demo se resuelva sin esperar 5 minutos.
3. **La sustitución de la consulta** (§3): en vez del puerto, un constructor sintético
   devuelve `not_listed` a quien sigue dentro del retraso y `finished` con puntaje mínimo + 5
   a quien lo pasó. Sin credenciales, sin tablero.
4. **La acción de administración "avanzar ya"**: atrasa a mano la fecha de arranque para
   meter a la candidata en la ventana y dispara el cron.
5. 🔴 **El salto de las pruebas adicionales** (§5): condición aparte, dentro del veredicto,
   **delante** de la llamada al adaptador. Es el único sitio donde olvidar la bandera provoca
   una llamada real a EvaluaTest con un identificador inventado; hoy fallaría como *sin
   conexión* si la empresa demo no tiene credenciales, y saldría con las suyas si las tiene.

Fuera de la etapa, el portal de una empresa demo **sin credenciales muestra el aviso de "sin
proveedor" en vez de los controles de la prueba**, así que sus ofertas no la tienen; una demo
con credenciales usa las suyas para elegir vacante. La demo **se queda como está** (decisión
40).

## 8 · Lo que ve el reclutador

- **Motivos de rechazo** (decisiones 13, 16 y 33; paso 7 y cambio del correo): el backend
  escribe solo los cinco con prefijo `psychometric_`; el portal traduce viejos y nuevos **para
  siempre**, las métricas unifican viejo y nuevo antes de contar, y el visor del embudo los
  agrupa en *Psicométrica — no completó* (vencimiento), *Psicométrica — reprobada* (puntaje,
  prueba adicional y descarte del proveedor) y *Psicométrica — sin correo* (`missing_email`,
  con grupo propio porque nunca se le mandó nada). 🔴 Despliegue: **el portal antes que el
  backend, o a la vez**.
- **Ficha de la oferta**: la vacante elegida, el interruptor de la etapa, la alerta si la
  vacante dejó de servir. **Sin conexión de la empresa**, en su lugar el aviso de §1 —el
  informativo si la oferta no tiene prueba, el de advertencia si la tiene activa y se está
  omitiendo—, con enlace a *Mi compañía* solo para quien puede editar la empresa (decisión 40).
- **Lo que no ve**: nada de los campos del candidato de §6 (el portal no los lee).

## 9 · Lo que este flujo todavía arrastra, con su paso

| Qué | Dónde cae |
| --- | --- |
| Creación desde administración: copia la configuración de la prueba sin comprobar la conexión ni la vacante | Anotado, del equipo interno (decisión 40) |
| Configuración de la oferta con forma de EvaluaTest, "IGI" en la interfaz, conexiones como lista | Brief 8 (decisiones 1, 5, 7, 8, 19, 28) |
| Puntaje ausente leído como cero | Etapa 3 (decisión 37) |
| Tablero vacío indistinguible de petición fallida | Sin paso (decisión 36) |
| El botón "Continuar proceso" se traga el fallo permanente | Sin paso (decisión 39) |
| La rama sin enlace no anuncia el plazo | Riesgo abierto |
