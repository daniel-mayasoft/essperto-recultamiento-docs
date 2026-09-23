# Antes de desplegar la rama de PsicoAlianza

Lo que hay que hacer **fuera del código** antes de soltar `feat/integrate-psicoanalisis-provider`
a producción, en orden. Se va completando a medida que los pasos lo exigen; cuando la rama
esté lista, se recorre esta lista de arriba abajo.

**Regla:** todo paso que deje algo que hacer antes del despliegue lo anota aquí, en el mismo
diff de documentación. Lo que está en la bitácora y no aquí, no se va a hacer.

✅ **Desplegado en producción el 2026-09-17** (§5, *Lo que se hizo en producción*). La rama está en
`develop` y en `main`; lo que sigue abierto en la tabla es lo que quedó para después.

| # | Qué | Quién | Hecho |
| --- | --- | --- | --- |
| 1 | Correr la migración de conexiones (abajo) | Usuario, en la consola de la base | ✅ Producción, 2026-09-17: 3 empresas, 66 ofertas |
| 2 | Retirar las tres variables de la cuenta compartida de los entornos desplegados | Quien despliega | ✅ Comprobado el 2026-09-17: no estaban en el compose de producción |
| 3 | Desplegar en orden: **backend primero, portal inmediatamente después** (ver abajo) | Quien despliega | ✅ 2026-09-17 |
| 4 | Avisar al equipo del cambio de rutina en local: probar contra EvaluaTest exige una empresa con credenciales guardadas, y las tres variables salen del archivo de entorno local | Usuario | ☐ |
| 5 | Rotar las dos credenciales: PsicoAlianza (archivo de entorno local) y EvaluaTest (historial de git) | Equipo | ☐ |
| 5b | **Secretos en texto plano en el despliegue de pruebas** (anotado el 2026-09-14, aplazado por el usuario hasta que todo funcione): el archivo de despliegue del servidor de pruebas lleva escritas claves de AWS, la contraseña de un correo, la clave privada de Firebase y la clave de los robots. Pasarlas a variables fuera del archivo y rotarlas si ese archivo se ha compartido | Equipo | ☐ |
| 5c | **Sacar a la persona de prueba** de las vacantes activas de la cuenta del cliente en PsicoAlianza donde se la invitó para comprobar (aplazado por el usuario): la **5146** (tanda del 2026-09-14) y la **1135**, OPERARIO DE PRODUCCIÓN — MANISOL (invitación real de comprobación del paso 3, el mismo día) | Usuario | ☐ |
| 6 | 🔴 **Bloqueo de la etapa 3**: PsicoAlianza no se despliega a ningún servidor sin la pieza que consigue la sesión (paso 2c, decisión 43), con quien la llame y su aviso a soporte. Con la sesión pegada a mano (decisión 42) no: muere a los 5 días sin avisar y, con la decisión 36, dos días sin sesión descartan candidatos reales por vencimiento. **Estado: en lo que depende del código, el bloqueo queda levantado** — el 2c.1 (la pieza), el 2c.2 (quién la llama: la tarea de cada hora, los disparos del adaptador y del guardado, el tope y el correo a los desarrolladores) y el 2c.3 (la etiqueta por estado y el botón *Conectar* de *Mi compañía*) están. **Lo que sigue faltando es la infraestructura** (7, 7b, 7d) **y las variables** (8) | Usuario | ☐ |
| 7 | **La imagen base del backend, en dos tiempos** (decisión 43; procedimiento en §4, abajo). Tiempo 1: Node 22 sobre Debian ligero, sin Chromium, un día en el servidor de pruebas. Tiempo 2: la misma base más Chromium, fuentes y Xvfb. Cada tiempo va **a mano y con el despliegue nocturno sin programar**. **Estado: tiempo 1 desplegado en pruebas el 2026-09-16, en su día de prueba** (§4); producción cambiará de imagen al fusionar `develop` en `main` | Usuario y quien despliega | ✅ Producción en la imagen con Chromium desde el 2026-09-17, **en un solo salto desde Alpine** |
| 7b | **Medir el consumo de memoria del backend en el servidor de pruebas** antes del tiempo 2, y ponerle límite: el consumo medido más unos 600 MB, y memoria compartida de 1 GB, en los dos compose. Comando en §4 | Quien despliega | ✅ Límite puesto: 1 GB en pruebas, **2 GB en producción** (servidor ampliado a 23 GB el 2026-09-17; el backend consumía 546 MB). El pico durante un login sigue sin medir (7d) |
| 7c | **Deuda aceptada el 2026-09-15**: Chromium corre **sin su aislamiento** (como root, dentro del contenedor del backend). Acotado a que la pieza solo navega a PsicoAlianza y a los dominios del captcha. Activarlo es un paso propio: usuario propio en la imagen, cambio de dueño de los volúmenes de registros y un perfil de seguridad en los dos compose | Equipo, después | ☐ |
| 7d | **La comprobación real de la pieza que consigue la sesión se hace en el servidor de pruebas, no en local** (decidido por el usuario el 2026-09-15). Después del tiempo 2, y con las variables del punto 8 puestas: un intento, y si falla, al menos una hora antes del siguiente. Procedimiento en §4. **Estado: en pruebas entró al primer intento el 2026-09-16** (§5, *Pendiente*); falta el pico de memoria, y en producción se repite | Usuario y quien despliega | ☐ En producción, pendiente: solo cuando una empresa vaya a usar PsicoAlianza (§5, paso 7) |
| 8 | Configurar en los servidores las variables del proxy (`PROXY_HOST`, `PROXY_PORT`, `PROXY_LOGIN` **con el sufijo `__asn.26611`, que fija el operador en Claro — medido el 2026-09-16, sin él la mitad de las IPs salen por otros operadores; si se rota el login, conservar el sufijo**, `PROXY_PASS`, y `PROXY_PROTOCOL`, opcional: `http` si no se pone; **para conseguir la sesión tiene que ser HTTP**, con `socks5` termina como *sin configurar*) y las tres de la pieza (paso 2c.1): `PSICOALIANZA_CHROMIUM_PATH=/usr/bin/chromium`, `PSICOALIANZA_LOGIN_DIR` apuntando al volumen del §4 (por ejemplo `/var/lib/psicoalianza-login`) y `PSICOALIANZA_LOGIN_HEADLESS` sin poner (**con ventana sobre Xvfb**, que es la forma que entró; `true` solo para medir sin ventana). Las cuatro de la renovación (paso 2c.2), **opcionales, sin poner salvo que haya que ajustar la cadencia**: `PSICOALIANZA_LOGIN_ATTEMPTS_PER_BURST` (3 intentos por ráfaga), `PSICOALIANZA_LOGIN_BURST_COOLDOWN_MINUTES` (60 minutos entre ráfagas), `PSICOALIANZA_LOGIN_ATTEMPTS_PER_WINDOW` (20 intentos por ventana de 24 horas) y `PSICOALIANZA_SESSION_RENEWAL_DAYS` (renovar a los 4 días). 🔴 **`ALERT_SUPPORT_EMAILS` tiene que estar puesta**, o los correos de la renovación —credenciales rechazadas, tope alcanzado, variable que falta— no salen y solo queda un aviso en el registro. Todo antes de que una empresa use PsicoAlianza. Sin ellas el backend arranca; falla al conseguir la sesión | Quien despliega | ✅ Puestas en producción el 2026-09-17, con `PSICOALIANZA_LOGIN_ATTEMPTS_PER_BURST: 1` para el primer intento (se quita después, §5 paso 7). Cuenta de DataImpulse distinta de la de pruebas |
| 8b | **Correr las pruebas a mano del portal** de `pruebas-a-mano.md` —los pasos 6.1, 6.2b y **2c.3**—, en local y con la rama entera, y anotar el resultado de cada caso. Si alguno falla, no se despliega | Usuario | ☐ **Se desplegó sin correrlos** (decisión del usuario el 2026-09-17). Quedan por correr en producción: la sección de la decisión 56, la del paso 9 y los del 6.2b que no necesitan cuenta de EvaluaTest |
| 9 | Configurar en los servidores las variables de PsicoAlianza antes de que una empresa la use: `PSICOALIANZA_BASE_URL` si no es la oficial, y comprobar que **`PSICOALIANZA_MANUAL_SESSION_ENABLED` no está encendida** ni hay cookies pegadas (paso 2 de la etapa 3). No bloquea desplegar ese paso solo | Quien despliega | ☐ |
| 10 | **Pasos 10 y 11, rama `feat/psychometric-followups`** (añadido el 2026-09-21), un despliegue aparte, solo backend. Antes: 🔴 **la plantilla `pending_process_reminder` aprobada en Meta** (en aprobación el 2026-09-21; sin ella, a quien se invita con la ventana de WhatsApp cerrada no le llega nada y espera al plazo de respaldo); los casos a mano de los dos pasos en el servidor de pruebas; y, justo antes, la consulta de «esperando resultado externo sin identificador» en producción (brief del paso 10) | Usuario | ☐ |
| 10b | 🔴 **Al fusionar con `develop`: la rama de Elvis** (añadido el 2026-09-22). `fix/mensaje-prueba-psicometrica` cambia el mensaje de la prueba de EvaluaTest —el correo completo y antes del enlace, con aviso de registrarse con él— **dentro del orquestador**, en el texto que el paso 11 sacó a `src/offers/pipeline/psychometric-invite-message.util.ts` (el paso 12 lo deja ahí a propósito, al lado del orquestador). Si su rama llega a `develop` antes o después que la nuestra, **habrá un conflicto en el orquestador**. Resolverlo quedándose con la versión nuestra **borra su arreglo sin que nada falle**. Lo correcto: llevar su texto al archivo del mensaje en su sitio nuevo, que es el que usan el arranque y la entrega del botón, y comprobar que sus pruebas del mensaje de EvaluaTest pasan. No se le avisó por decisión del usuario | Quien fusione | ✅ **Resuelto el 2026-09-22** por el planificador al fusionar `develop` en la rama, a petición del usuario: el orquestador se quedó con el bloque de la ventana, y el texto de Elvis para EvaluaTest pasó a `psychometric-invite-message.util.ts`, tal cual; después el usuario cambió su «Búscate» por «Busca», con las dos pruebas que comparan el mensaje entero. Siete pruebas del mensaje actualizadas al texto nuevo (en `develop` estaban fallando: su rama no las tocó) y una nueva para el caso sin correo. 141 suites y 1.478 pruebas con la caché limpia |
| 10c | 🔴 **Contrastar la rama de Henry antes de desplegar** (añadido el 2026-09-22). `feature/new-psycometric-flow` (#87) entró en `develop` junto con los pasos 10 a 12 y cambia la misma etapa: el plazo pasa a ser por oferta con foto por candidato y **1 día por defecto**, capacidad propia para la prueba, recordatorios de EvaluaTest. Sin contrastar con este frente. Lo mínimo antes de producción: (1) **el plazo por oferta no valida días enteros**, y con PsicoAlianza un decimal descarta candidatos por arranque fallido; (2) **las ofertas vivas sin plazo propio pasan a 1 día**, sea cual sea el de su empresa, y no hay migración: medir cuántas y de qué empresas; (3) leer su capacidad y sus recordatorios contra los pasos 10 y 11. Detalle en la bitácora, *Estado a 2026-09-22* | Planificador y usuario | ☐ |

## 1 · La migración de conexiones (paso 8a, decisión 41)

**Por qué:** el backend nuevo lee la conexión de EvaluaTest de cada empresa **solo** de la lista
nueva `psychometricConnections`. Si arranca con la lista vacía, para él ninguna empresa tiene
conexión y **la etapa psicométrica se salta en silencio para todas**: los candidatos pasan sin
prueba y nada falla. Por eso va **antes** del backend.

**Qué hace:** solo añade. A cada empresa con credenciales de EvaluaTest le crea su conexión en
la lista copiando el bloque viejo tal cual (la contraseña ya va cifrada; no se toca). A cada
oferta con la prueba activa le rellena `connectionId` con la conexión de su empresa. No borra
ni cambia nada de lo que ya existe, y repetirlo es inofensivo: solo toca donde todavía no hay
conexión.

**Cuándo:** con el backend viejo todavía corriendo es seguro, porque el código actual ignora la
lista y `connectionId`. Si hay ambiente de pruebas o una copia, hacerlo ahí primero, con los
seis pasos completos.

### Paso 1 · Consola y base

Conectar a la base, como para las mediciones, y `use esscoti`.

### Paso 2 · Contar antes

```js
db.tenants.countDocuments({ "psychometricConnections.provider": "evaluatest" })
db.offers.countDocuments({ "evaluatestConfig.enabled": true,
  "evaluatestConfig.jobProfileId": { $ne: null },
  "evaluatestConfig.connectionId": { $in: [null] } })
```

Esperado antes: **0** empresas con conexión; todas las ofertas activas sin `connectionId`.
Anotar los dos números.

### Paso 3 · Crear la conexión de cada empresa

```js
db.tenants.find({
  "evaluatestCredentials.email": { $nin: [null, ""] },
  "evaluatestCredentials.encryptedPassword": { $nin: [null, ""] },
  "psychometricConnections.provider": { $ne: "evaluatest" }
}).forEach(t => db.tenants.updateOne({ _id: t._id }, { $push: { psychometricConnections: {
  id: new ObjectId().toHexString(),
  name: "EvaluaTest",
  provider: "evaluatest",
  credentials: {
    email: t.evaluatestCredentials.email,
    encryptedPassword: t.evaluatestCredentials.encryptedPassword,
    enterpriseId: t.evaluatestCredentials.enterpriseId ?? null
  }
} } }))
```

No imprime nada. Si falla a mitad, cada empresa se procesa entera o no se procesa; repetir el
paso completa las que falten.

### Paso 4 · Rellenar la conexión en las ofertas

```js
db.tenants.find({ "psychometricConnections.provider": "evaluatest" }).forEach(t => {
  const c = t.psychometricConnections.find(x => x.provider === "evaluatest");
  db.offers.updateMany(
    { tenantId: t._id, "evaluatestConfig.enabled": true,
      "evaluatestConfig.jobProfileId": { $ne: null },
      "evaluatestConfig.connectionId": { $in: [null] } },
    { $set: { "evaluatestConfig.connectionId": c.id } }
  );
});
```

`tenantId` está guardado como identificador de objeto (comprobado en las mediciones del
2026-09-12), así que `t._id` va tal cual.

### Paso 5 · Contar después

Las dos consultas del paso 2, otra vez. Esperado:

- Empresas con conexión: **3** (las que tenían credenciales el 2026-09-10; si se sumó alguna,
  una más).
- Ofertas activas sin `connectionId`: **solo las de empresas sin credenciales** (la cuenta de
  pruebas). Si el número sorprende, esto dice de quién son:

```js
db.offers.aggregate([
  { $match: { "evaluatestConfig.enabled": true, "evaluatestConfig.jobProfileId": { $ne: null },
              "evaluatestConfig.connectionId": { $in: [null] } } },
  { $lookup: { from: "tenants", localField: "tenantId", foreignField: "_id", as: "tenant" } },
  { $unwind: "$tenant" },
  { $group: { _id: "$tenant.name", ofertas: { $sum: 1 } } }
])
```

### Paso 6 · Solo entonces, desplegar el backend

Si los conteos no cuadran, no se despliega; se mira por qué.

**Después del despliegue:** el bloque viejo `evaluatestCredentials` queda en la base sin uso.
Se borra en una limpieza aparte, cuando la etapa lleve tiempo estable (decisión 41).

## 3 · Por qué backend primero y portal justo después

"A la vez" no existe: siempre hay unos minutos en que corre uno nuevo con el otro viejo, y cada
desfase rompe algo distinto (levantado en la opinión previa del 8b, 2026-09-13):

| Ventana | Qué se rompe mientras dura |
| --- | --- |
| **Portal nuevo con backend viejo** | No llega la lista de conexiones: **todas** las empresas ven "sin proveedor", las ofertas con la prueba activa muestran la advertencia falsa de que se está omitiendo, y el nombre que manda el modal se pierde sin error |
| **Backend nuevo con portal viejo** | El 8a se diseñó para convivir con ese portal. Solo se ven en crudo, unos minutos, los motivos de rechazo nuevos (pasos 7 y 33) |

La segunda es claramente menos mala. Con la migración (1) antes de los dos.

## 4 · La imagen base del backend, en dos tiempos (punto 7)

**Por qué una base aparte.** El backend se construye con un `docker build` en el propio servidor,
sin registro. Si Chromium se instalara en el Dockerfile del backend, la caché de capas lo
reinstalaría —con la versión que Debian tenga ese día— cada vez que la imagen de Node se actualice,
y la versión de Chromium se separaría de la que espera la librería que lo maneja **sin que nadie lo
pida**. Con una base construida una vez y etiquetada, Chromium queda congelado hasta que alguien
cambie la etiqueta a propósito.

**Dónde está.** En el servidor, **junto a `deploy.sh`**, un archivo `Dockerfile.base`; no está en
ningún repositorio, como el resto de esa carpeta, y la copia local es `.deploy/<servidor>/`. La
etiqueta es una variable del script, `IMAGE_BACKEND_BASE`, como las demás imágenes. Los dos `deploy.sh`
(pruebas y producción) construyen la base **solo si esa etiqueta no existe todavía en el servidor**,
justo antes de construir el backend, y sin contexto de construcción porque el archivo no copia nada.
Hay que subir `Dockerfile.base` con Moba y **pegar en el `deploy.sh` del servidor** las tres piezas de
la copia local: la variable, la función y el `if` antes del `docker build` del backend — no
sobrescribir el script del servidor sin comparar.

**Cómo se enlazan.** La primera línea del Dockerfile del backend nombra la misma etiqueta que
`IMAGE_BACKEND_BASE`. Si no coinciden, el `docker build` del backend **falla ruidoso** pidiendo una
imagen que no existe: no hay forma de desplegar con la base equivocada sin enterarse.

⚠️ **Los dos tiempos van a mano.** El despliegue nocturno (`schedule-deploy.sh`) reconstruye todo lo
que haya en la rama de cada repositorio. Antes de cada tiempo, comprobar con `atq` que no hay ninguno
programado, o el segundo tiempo entra solo una noche.

### Tiempo 1 · Debian y Node 22, sin Chromium

Etiqueta `selessia-node:22-debian-1`. Dos cambios a la vez —el sistema y la versión de Node, que dejó
de tener soporte en abril de 2026—, aceptados porque las pruebas dentro de la imagen los delatan
antes de correr un día y repetir el despliegue en dos tiempos cuesta más.

1. En el backend, cambiar la primera línea del Dockerfile por esa etiqueta y commitear. **Después de
   que el 2b esté commiteado**, en su propio commit.
2. Desplegar el backend en el servidor de pruebas con `deploy.sh deploy selessia-backend`. El registro
   tiene que decir que construyó la base.
3. Dentro de la imagen, correr las pruebas: `docker compose exec selessia-backend npm test`.
4. Dejarlo **un día** y comprobar: que arranca; **la hora con la zona de Bogotá** en los registros; el
   cron psicométrico; WhatsApp; S3; los correos.
5. Si algo falla, volver es cambiar la primera línea del Dockerfile a `node:20-alpine` y desplegar.

**En pruebas, desplegado el 2026-09-16 a las 07:34** (comprobado con el usuario desde la consola del
servidor). Antes: el script del servidor tiene la variable y la función de la base, igual que la copia
local; `Dockerfile.base` idéntico; ningún despliegue programado; el constructor de imágenes en uso es
el controlador `docker` (hay otro, `docker-container`, inactivo: **no activarlo**, no vería la base).
El cambio de la primera línea entró **directo en `develop`** (la rama que despliega pruebas; `main`
despliega producción), en un commit solo, sin nada de PsicoAlianza.

| Comprobación | Resultado |
| --- | --- |
| Imagen base | Construida en ese despliegue, 234 MB |
| Dentro del contenedor | Node 22.23.2 —la misma versión con la que entró la prueba de Chromium en Docker—, Debian 13.6, hora `-05` |
| Registros | Arranca; las tareas programadas y el cron psicométrico corren, con la hora de Colombia |
| Pruebas dentro de la imagen | 110 suites y 935 pruebas (926 pasan, 9 omitidas): las de `develop`, no las de la rama |
| Memoria | 113,9 MB antes, con Alpine; 186,2 MB después, **recién arrancado y justo tras correr las pruebas dentro**: no son comparables, se vuelve a medir con el día cumplido para el 7b |

⚠️ **El servidor estaba unos veinte commits atrás de `develop`**, así que ese despliegue metió también
arreglos ajenos (recordatorios, teléfonos, Qdrant, RETHUS, archivado en Pandapé) y reinició el portal y
el lector de correos. Si algo falla en el día, **no es automático atribuirlo a Debian**: se vuelve a
Alpine y, si el fallo sigue, era de esos arreglos.

**Pendiente para cerrar el tiempo 1**, con el día cumplido: WhatsApp, S3 y correos funcionando, y la
memoria medida otra vez.

⚠️ **Producción cambia de imagen cuando `develop` se fusione en `main`.** Su `deploy.sh` ya construye la
base, así que ese despliegue será Debian **aunque no traiga PsicoAlianza**. Quien despliegue producción
tiene que saberlo, y comprobar antes en ese servidor lo mismo que se comprobó en pruebas.

### Tiempo 2 · Chromium, fuentes y Xvfb

✅ **En pruebas desde el 2026-09-16 a las 10:50**, sin esperar el día del tiempo 1 (decisión del usuario).
**Versiones instaladas: Chromium 152.0.7977.82 de Debian 13, con `puppeteer-core` 25.10.0** —el par que
entró en la prueba en Docker—. Si al reconstruir la base sale otro Chromium, se compara antes de seguir.
La receta completa, con lo que salió mal, en §5.

Etiqueta `selessia-node-chromium:22-debian-1`. Se escribe cuando el tiempo 1 lleve un día en verde:
`Dockerfile.base` gana la instalación de `chromium`, `xvfb` y `fonts-liberation` (lo que probó el
otro chat el 2026-09-14), y **las versiones instaladas se anotan en este documento** junto a la
versión de la librería que las maneja, para comprobar el par la próxima vez que se reconstruya la
base. `IMAGE_BACKEND_BASE` en el script y la primera línea del Dockerfile del backend cambian a la
etiqueta nueva.

Antes de este tiempo, el punto 7b: medir el consumo del backend en el servidor de pruebas con
`docker stats --no-stream selessia-backend`, y en los dos compose ponerle al backend `mem_limit` (lo
medido más unos 600 MB) y `shm_size: 1gb`. Sin la memoria compartida, Chromium se cae.

🔴 **Y `init: true` en el backend de los dos compose** (anotado el 2026-09-16 al revisar el despliegue).
El contenedor arranca con `npm` como primer proceso, y `npm` no recoge los procesos huérfanos: cuando un
intento de login vence y se corta por la fuerza, los subprocesos de Chromium quedan como zombis y se
acumulan intento tras intento. La prueba en Docker no lo podía ver porque hacía un login y terminaba.
`init: true` le pone al contenedor un proceso inicial que sí los recoge.

**Después del tiempo 2, el backend puede conseguir sesiones** cuando el 2c.2 lo llame, y el tiempo 2
es obligatorio para ello: desde el 2026-09-15 el modo por defecto es **con ventana**, que en Linux
necesita Xvfb en la imagen.

**La comprobación real (punto 7d).** Nadie llama a la pieza todavía —eso llega con el 2c.2 y el
2c.3—, así que el intento se dispara a mano **dentro del contenedor del backend**: un script
desechable que monte la pieza ya compilada, con una lectura de conexiones falsa que tome las
credenciales del entorno y un almacén falso que solo imprima nombres de cookies. Se borra al
terminar. Reglas, medidas el 2026-09-15: **un intento por llamada**; si sale *captcha rechazado*,
al menos una hora antes del siguiente; ante *bloqueada*, *credenciales rechazadas* o *sin cookie de
recuerdo*, parar en seco ese día. Entró significa que la clasificación es *entró* **y** que el
listado de vacantes responde con esas cookies desde fuera del servidor, sin proxy.

**Alternativa desde el 2c.2, y mejor: por el código de producción.** Con la renovación en el
código, no hace falta el script con piezas falsas: se guarda la conexión de PsicoAlianza desde *Mi
compañía* en el servidor de pruebas —o se inserta en su base— y eso mismo dispara una ráfaga por
detrás; si no entra, la tarea de la hora (minuto 17) vuelve a intentarlo. Prueba el camino real: la
lectura de conexiones, la pieza, el almacén y el correo a los desarrolladores. Las reglas de
intentos de arriba se cumplen solas —una ráfaga de tres, una hora entre ráfagas, tope de veinte por
ventana de 24 horas— y ante *credenciales rechazadas* la conexión se para hasta volver a guardarla.
Se comprueba en el registro del backend (una línea por ráfaga y por intento, sin cookies) y con la
ruta de estado de sesión de *Mi compañía*, que debe responder `connected`. Para que salgan los
correos, `ALERT_SUPPORT_EMAILS` (punto 8).

⚠️ **Lo que todavía no se ha probado y esta comprobación cierra:** el modo con ventana entró dos
veces, pero siempre con el script de la prueba (`../../psicoalianza-xvfb-login/`), **nunca por el
código de la pieza**. En Windows ese modo se quedó sin probar porque el usuario decidió llevarlo al
servidor.

**Lo que el compose del backend necesita para la pieza** (paso 2c.1): un **volumen con nombre**
montado en la ruta de
`PSICOALIANZA_LOGIN_DIR`; la pieza crea dentro `profile/` (el perfil persistente de Chromium, que
abarata el login a la mitad) y deja ahí las capturas `login-attempt-<fecha>.png` de los intentos que no
entran. Volumen con nombre y no una carpeta del servidor montada: el perfil lleva ficheros de candado y
sockets que Chromium necesita poder crear. El volumen conserva el perfil entre despliegues; borrarlo es
empezar con un perfil sin reputación de Google. Las capturas se limpian a mano.

## 5 · Desplegar en producción: la receta, con lo aprendido en pruebas

> Escrito el 2026-09-16, después de desplegar la rama entera en pruebas en una mañana, con el usuario en
> la consola del servidor. Es para quien lo repita en producción **sin haber estado ahí**. Lo que aquí
> se da por comprobado se comprobó en **pruebas**; en producción hay que volver a mirarlo todo.

### Cómo están las ramas y los servidores

| Rama | Servidor | Cómo se despliega |
| --- | --- | --- |
| `main` | Producción | `deploy.sh` hace `git pull` de la rama que tenga puesta la carpeta de cada repositorio. **El script no nombra ramas** |
| `develop` | Pruebas, normalmente | Igual |
| `feat/integrate-psicoanalisis-provider` | Pruebas, **desde el 2026-09-16**, con `deploy-branch.sh` | Script propio **solo en pruebas**, junto a `deploy.sh`: cambia las carpetas del backend y del portal a la rama que se le pida —se detiene si hay cambios a mano—, enseña un resumen, pide confirmar y despliega backend y, justo después, portal. `bash deploy-branch.sh develop` devuelve pruebas a `develop` |

🔴 **Mientras pruebas esté en la rama, lo que otros suban a `develop` no llega a pruebas.** Y la rama **no está
en `develop` ni en `main`**. Para producción el camino es rama → `develop` → `main`, y **nadie puede pasar
`develop` a `main`** hasta que esta lista esté hecha en producción: sin la migración, la etapa psicométrica
se salta para todas las empresas sin dar error.

### Lo que salió mal o casi, en pruebas

| Qué pasó | Cómo se evita |
| --- | --- |
| Pruebas estaba **veinte commits atrás de `develop`**: el despliegue del tiempo 1 metió arreglos ajenos | Antes de desplegar, comparar el último commit de la carpeta del servidor con el remoto |
| A la rama le faltaban commits de `develop` —entre ellos **el propio cambio de imagen**—: desplegarla así habría vuelto a Alpine | Traer `develop` a la rama en local, verificar compilación y pruebas, y solo después desplegar. Hubo un conflicto, solo de importaciones en el orquestador |
| Alguien fusionó `develop` en la rama por pull request (#80) y el despliegue trajo arreglos de publicación que nadie de este frente revisó | Mirar qué trae el `git pull` en la salida del despliegue, siempre |
| Una **`T` de más** al principio de `PROXY_LOGIN`, restos del marcador «TU_LOGIN» al pegar. Cada intento habría fallado como error de red, sin decir que el usuario estaba mal | Comparar el valor con el `.env` sin imprimirlo, antes de desplegar |
| `sh deploy.sh` no sirve: el script usa cosas de bash | Siempre `bash deploy.sh …`. Sin argumentos abre un menú donde la opción 2 despliega **todos** los servicios |
| `git` como `maya-admin` responde *dubious ownership* | Todo como root: `sudo su` |
| Los comandos con barras verticales copiados de una **tabla** del chat llegan rotos: la tabla se come la barra invertida y el `grep` busca otra cosa sin avisar | Dar esos comandos fuera de tablas |
| **Las pruebas dentro del contenedor se atascaron** tras poner el límite de memoria de 1 GB: Jest lanza varios procesos en paralelo dentro del mismo contenedor que el backend, y pasarse del límite puede matar al backend | Dentro del contenedor, solo `npx jest --runInBand`. Y comprobar después con `docker ps` que el backend no se reinició |
| El lector de correos y el portal **se reinician** cada vez que se despliega el backend | Es normal: el lector depende del backend en el compose |
| Aviso *«Your kernel does not support swap limit capabilities»* al arrancar | Inofensivo: el límite de memoria se aplica igual |

### La receta, en orden

Todo en la consola del servidor de **producción**, como root, en la carpeta de `deploy.sh`. Las copias locales de
`.deploy/prod/` **no se suben**: el servidor se edita a mano, porque alguien pudo cambiar algo allí.

**1 · Mirar antes de tocar nada.**

- `bash deploy.sh config` → hoy la copia local de producción dice `IMAGE_BACKEND_BASE=selessia-node:22-debian-1`
- `grep -nE "ensure_backend_base_image|Dockerfile.base" deploy.sh` → cinco líneas: la función existe
- `cat Dockerfile.base` → Node 22 sobre `trixie`
- `atq` → vacío
- `docker buildx ls` → el constructor en uso, el del asterisco, con el controlador `docker`. **No activar** uno `docker-container`: no ve las imágenes base construidas en el servidor
- `git -C repositories/esscoti-backend branch --show-current` → `main`; y `git -C … status --short` en backend y portal → vacío
- `grep -n "STAGE" docker-compose.yml` → ⚠️ **la copia local de producción tiene `STAGE: dev` en el backend**. Comprobarlo en el servidor: esa variable decide qué archivo de entorno se carga y cómo se titulan las alertas
- `grep -nE "EVALUATEST_EMAIL|EVALUATEST_PASSWORD|EVALUATEST_ENTERPRISE_ID|PSICOALIANZA_MANUAL" docker-compose.yml` → vacío (puntos 2 y 9)

**2 · Copia de la base. En producción es obligatoria** (decidido con el usuario; en pruebas no se hizo). El usuario y la
contraseña de Mongo están en el `docker-compose.yml` del servidor, en el servicio de Mongo. En la cadena de conexión, los
caracteres especiales de la contraseña van codificados —en pruebas, `^` como `%5E`— y hace falta `authSource=admin`:

- `docker exec <contenedor de mongo> mongodump --uri "mongodb://USUARIO:CONTRASEÑA@localhost:27017/esscoti?authSource=admin" --archive=/tmp/esscoti-antes-psicoalianza.gz --gzip`
- `mkdir -p backups` y `docker cp <contenedor de mongo>:/tmp/esscoti-antes-psicoalianza.gz backups/`
- `ls -lh backups/` → el archivo, no vacío

**3 · La migración** (§1), con el backend viejo todavía corriendo. Se entra con `docker exec -it <contenedor de mongo> mongosh "<la misma cadena>"`.
Además de los conteos de §1, **antes del paso 4** estas dos tienen que dar lo mismo, o el paso 4 no rellena esas ofertas:

- `db.offers.countDocuments({})`
- `db.offers.countDocuments({ tenantId: { $type: "objectId" } })`

Y **después del paso 4**, esta tiene que salir vacía, porque cada oferta tiene que apuntar a una conexión de su propia empresa:

- `db.offers.aggregate([{ $match: { "evaluatestConfig.connectionId": { $nin: [null] } } }, { $lookup: { from: "tenants", localField: "tenantId", foreignField: "_id", as: "tenant" } }, { $unwind: "$tenant" }, { $match: { $expr: { $not: { $in: ["$evaluatestConfig.connectionId", "$tenant.psychometricConnections.id"] } } } }, { $count: "malas" }])`

En pruebas, de referencia: 4 empresas, 2 con credenciales, 15 ofertas activas rellenadas, 0 sin conexión. ⚠️ Al pegar
comandos largos en `mongosh`, la consola a veces **enseña** caracteres duplicados (`trtrue`) que no se ejecutan así: los
conteos de después son los que dicen si se escribió bien.

**4 · Editar a mano los tres archivos del servidor.** Primero una copia de cada uno con el sufijo `.antes-chromium`. En YAML, **espacios, nunca tabuladores**.

- `Dockerfile.base`: la línea del `apt-get install` termina en `tzdata chromium xvfb fonts-liberation \`
- `deploy.sh`, línea 14: la etiqueta pasa a `selessia-node-chromium:22-debian-1`
- `docker-compose.yml`, servicio del backend:
  - Debajo de la última variable, con 6 espacios: `PROXY_HOST: "gw.dataimpulse.com"`, `PROXY_PORT: 823`, `PROXY_LOGIN: "<login de DataImpulse>__asn.26611"`, `PROXY_PASS: "<contraseña>"`, `PSICOALIANZA_CHROMIUM_PATH: /usr/bin/chromium`, `PSICOALIANZA_LOGIN_DIR: /var/lib/psicoalianza-login` y, **solo para el primer intento**, `PSICOALIANZA_LOGIN_ATTEMPTS_PER_BURST: 1`. Comprobar que `ALERT_SUPPORT_EMAILS` está
  - Antes de su `volumes:`, con 4 espacios: `shm_size: 1gb`, `mem_limit:` (ver *Pendiente*) e `init: true`
  - En su `volumes:`, con 6 espacios: `- psicoalianza_login:/var/lib/psicoalianza-login`
  - En el `volumes:` general del final, con 2 espacios: `psicoalianza_login:`
- `docker compose config -q` → **no imprime nada**. Si imprime, hay un error de sangría
- `grep -nE "PROXY_|PSICOALIANZA_|shm_size|mem_limit|init: true|psicoalianza_login" docker-compose.yml` → las líneas nuevas, en el servicio del backend (también aparecen los `mem_limit` de los robots, que ya estaban)

**5 · Desplegar.** Con `main` ya conteniendo la rama: `bash deploy.sh deploy selessia-backend` y, **en cuanto termine**,
`bash deploy.sh deploy selessia-front` (§3). La salida del backend tiene que decir `Building base image 'selessia-node-chromium:22-debian-1'`
—la primera vez tarda un minuto— y `Created` para el volumen de la pieza.

**6 · Comprobar.**

- `docker ps --filter name=selessia-backend` → *Up*, sin reinicios
- `docker exec selessia-backend node -v` → `v22.23.2`
- `docker exec selessia-backend date` → hora con `-05`
- `docker exec selessia-backend chromium --version` → `Chromium 152.0.7977.82`
- `docker exec selessia-backend which Xvfb` → `/usr/bin/Xvfb`
- `docker exec selessia-backend df -h /dev/shm` → `1.0G`
- `docker exec selessia-backend ps -o pid,comm -p 1` → `docker-init`
- `docker exec selessia-backend ls -la /var/lib/psicoalianza-login` → la carpeta existe
- Los errores del registro desde el arranque → nada nuevo
- En el portal: *Mi compañía* de una empresa con EvaluaTest dice **EvaluaTest — Configurado — correo**, y una oferta con prueba activa enseña sus controles, no «tu empresa no tiene proveedor»

**7 · La primera conexión de PsicoAlianza** (punto 7d), solo en la empresa que la vaya a usar y con su cuenta:

- Dos consolas: el registro del backend filtrado por PsicoAlianza, en vivo, y `docker stats selessia-backend`, apuntando el **máximo** de memoria
- *Mi compañía* → fila PsicoAlianza → *Editar* → correo y contraseña → *Guardar*. Guardar dispara la ráfaga: «Conectando…» y después «Conectado» o «Conexión fallida — vuelve a intentarlo.»
- 🔴 Si falla, **no pulsar *Conectar* durante al menos una hora** —el botón se salta la espera a propósito—; ante *credenciales rechazadas* o *bloqueada*, parar el día; **no cerrar sesión en PsicoAlianza**
- Cuando entre, quitar `PSICOALIANZA_LOGIN_ATTEMPTS_PER_BURST` del compose y volver a desplegar el backend

**8 · Volver atrás, si hace falta.**

| Qué falló | Cómo se vuelve |
| --- | --- |
| La imagen | La primera línea del Dockerfile del backend a la etiqueta anterior, y desplegar. Las bases construidas se quedan en el servidor |
| El código | Desplegar la versión anterior. **La base puede quedarse como está**: la migración solo añade, y el backend viejo ignora lo nuevo |
| Datos estropeados por el código nuevo | Restaurar la copia del paso 2 con `mongorestore`, reemplazando las colecciones, **junto con** volver al código anterior. Borra lo escrito después de la copia |
| Pruebas, volver a `develop` | `bash deploy-branch.sh develop` |

### Pendiente de pruebas antes de producción

- ✅ **El primer intento real por el código de producción entró** (2026-09-16, 11:49, en pruebas): ráfaga lanzada con el botón *Conectar*, **un intento, `passed` en 36,1 s**, Chromium 152.0.7977.82 con ventana, por el proxy con el operador fijado. Después, la comprobación de la etiqueta respondió viva (302).
- ☐ **El pico de memoria del backend durante un login**: en ese intento no se midió. Con ese pico se fija el `mem_limit` de producción: si queda por debajo de unos 700 MB, 1 GB; si se acerca, 1,5 o 2 GB. Se mide en el próximo intento, con `docker stats` abierto.
- ✅ **Reiniciar el backend no tira la sesión** (medido a las 11:56): tras `docker restart`, la primera comprobación dio 302 solo con la cookie de cinco días, y la lista de vacantes cargó. ⚠️ Esa primera petición de datos tardó **12,4 s**; si se repite, el selector de vacantes irá lento justo después de cada reinicio.
- ☐ **Sin explicar: a las 11:47, diez minutos después de desplegar, la sesión guardada apareció muerta** (200 en la comprobación), y hasta que se pulsó *Conectar* la etiqueta dijo «Conexión fallida». No es el reinicio (ver arriba). El despliegue **recreó el contenedor y borró su registro anterior**, así que no se ve qué pasó antes. Hipótesis abiertas: alguien usó o cerró sesión con la cuenta de gerencia desde un navegador, o la sesión de antes nunca quedó bien guardada. Pendiente: preguntar al equipo y leer en la base `attemptsInWindow` y las fechas de la sesión. Para no perder la pista la próxima vez: **antes de desplegar, guardar el registro** (`docker logs selessia-backend > backups/backend-<fecha>.log`).
- ☐ **Defecto de la etiqueta del 2c.3**: dice «Conexión fallida — vuelve a intentarlo.» cuando la sesión no responde **aunque el último intento haya entrado**, porque «hubo algún intento» cuenta también los que entraron. Engaña justo en el caso de las 11:47 e invita a gastar un intento. Sin arreglo todavía.
- ☐ **Las pruebas dentro de la imagen** con la rama y lo fusionado de `develop`, con `--runInBand`. **No se hicieron antes de producción**: se verificó `develop` en local, no dentro de la imagen.
- ☐ **Los casos a mano** de `pruebas-a-mano.md` (punto 8b), que ahora se pueden correr en el servidor de pruebas. **No se hicieron antes de producción.**

### Lo que se hizo en producción el 2026-09-17

Con el usuario en la consola, en una tarde, siguiendo la receta de arriba con estas diferencias:

| Qué | Cómo quedó |
| --- | --- |
| **Servidor** | Ampliado a 23 GB antes de desplegar (tenía 11 con 1,7 disponibles y sin swap). Reinicio incluido; los 13 contenedores volvieron |
| **`deploy.sh`** | Producción tenía cambios de otra persona que pruebas no (el servicio de agenda, detección de repositorios preguntándole a git). **No se pisó con el de pruebas**: se añadieron los cuatro bloques de la imagen base a mano. Copia previa en `deploy.sh.antes-chromium` |
| **`Dockerfile.base`** | Creado a mano; **nació con CRLF** desde el editor de MobaXterm y se corrigió con `sed` antes de construir. Los archivos nuevos hay que comprobarlos con `file` |
| **Compose** | Editado en el archivo vivo, no en copia (decisión del usuario). Variables del proxy y de la pieza debajo de las de RETHUS (`PROXY_SERVER`/`PROXY_USER`/`PROXY_PASSWORD`, que se parecen y no son las nuestras); `shm_size: 1gb`, `mem_limit: 2g`, `init: true`, volumen `psicoalianza_login`. `STAGE` ya decía `prod` en el servidor; la copia local mentía |
| **Copia de la base** | `backups/esscoti-antes-psicoalianza.gz`, 9,8 MB, hecha **antes** de la migración. Contenedor `mongodb`, no `selessia-mongodb` |
| **Migración** | Con el backend viejo corriendo, dos horas antes del despliegue. Antes: 3 empresas con credenciales, 0 con conexión, 66 ofertas activas sin conexión (48 de Medicall, 18 de Mayasoft Servicios Temporales), 75 de 75 con `tenantId` como identificador de objeto. Después: 3, 0 y ninguna oferta apuntando a una conexión ajena |
| **Ramas** | La rama se fusionó a `develop` por pull request (#81 backend, #52 portal) con un conflicto solo de comentarios contra un commit de Henry del mismo día; `develop` se verificó en local con la caché limpia (133 suites, 1.372 pruebas, 1.363 pasan, 9 omitidas; tipos del portal limpios) y pasó a `main`. Salieron con nosotros tres commits de Henry: el archivado de ofertas en Pandapé y el modelo de facturación por defecto de las empresas nuevas |
| **Despliegue** | Backend y portal, sin contratiempos. Registro previo guardado en `backups/backend-antes-psicoalianza.log` |
| **Comprobación** | El primer ciclo del cron: 13 ofertas, 48 candidatos, 48 emparejados, 0 errores. La sincronización de perfiles entró en EvaluaTest con las cuentas de dos empresas: el backend nuevo lee la lista nueva |

**Lo que quedó para después del despliegue:**

- ☐ Devolver pruebas a `develop` con `bash deploy-branch.sh develop`.
- ☐ Los casos a mano en producción (punto 8b de la tabla).
- ☐ La primera conexión de PsicoAlianza (paso 7 de la receta), cuando una empresa la use: medir el pico de memoria y quitar `PSICOALIANZA_LOGIN_ATTEMPTS_PER_BURST` del compose.
- ☐ **Rotar**: la contraseña de Mongo de producción y la del proxy de RETHUS quedaron pegadas en el chat del despliegue; la clave privada de Firebase de pruebas también (5b).
- ☐ **El puerto 27017 de Mongo de producción está abierto a internet**: la consola entró por la IP pública con usuario y contraseña. No es de este frente; avisar al equipo.
- ☐ El registro del backend vuelca el tablero entero de cada vacante de EvaluaTest, con nombre, correo y fecha de nacimiento de cada candidato (deuda conocida del contexto del proyecto); la copia guardada en `backups/` los contiene.
