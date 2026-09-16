# Entorno local

Cómo levantar el proyecto en una máquina de desarrollo: **la base de datos en Docker, el backend
y el portal en PowerShell**. Leído del código el 2026-09-13.

**Estado:** este documento existe; el archivo de Docker y los dos `.env` **todavía no**. Se
crean siguiendo los pasos de abajo.

⚠️ **En revisión (2026-09-13):** el plan cambia de "base local vacía" a **"base local con una
copia de la de test"**. La sección "Copia de la base de test" ya está al día; el resto del
documento todavía describe el plan viejo y se reescribe al terminar los pasos.

## Copia de la base de test

**Por qué una copia y no conectarse a la de test:** el backend tiene tareas automáticas sin
interruptor (tiempos de espera, rescates, consulta de resultados). Un backend local contra la
base de test trabajaría sobre los mismos candidatos que el del servidor, y además con otra
versión: test corre `develop`.

### Paso 1 · Sacar la copia en el servidor (desde MobaXterm)

Todo es **solo lectura** para la base de test. Se hace en la sesión SSH del servidor. Si el
usuario no puede usar Docker directamente, cada `docker` va con `sudo` delante.

**1a · Espacio en disco.** La copia comprimida ocupa bastante menos que la base, pero se escribe
dos veces (dentro del contenedor y en el servidor):

```bash
df -h / ~
```

**1b · Versión y tamaño.** Pide la contraseña de Mongo (`MONGO_INITDB_ROOT_PASSWORD` en el
compose de test); escrita en el aviso, no queda en el historial de la terminal:

```bash
docker exec -it selessia-mongodb mongosh --quiet -u mayaAdmin -p --authenticationDatabase admin \
  --eval "const s = db.getSiblingDB('esscoti').stats(1024*1024); print('version', db.version()); print('datos MB', s.dataSize); print('disco MB', s.storageSize)"
```

**Anotar la versión**: la imagen de Docker local tiene que ser esa misma (test usa
`mongo:latest`, sin fijar).

**1c · Sacar la copia**, solo la base `esscoti` (la del orquestador no hace falta):

```bash
docker exec -it selessia-mongodb mongodump -u mayaAdmin --authenticationDatabase admin \
  --db esscoti --gzip --archive=/tmp/esscoti-test.archive.gz
```

Pide la contraseña. Al final dice cuántos documentos copió de cada colección. Test sigue
funcionando mientras tanto; la copia no es de un instante exacto, y para desarrollo da igual.

**1d · Sacarla del contenedor al servidor y borrarla del contenedor:**

```bash
docker cp selessia-mongodb:/tmp/esscoti-test.archive.gz ~/esscoti-test.archive.gz
ls -lh ~/esscoti-test.archive.gz
docker exec selessia-mongodb rm /tmp/esscoti-test.archive.gz
```

**1e · Bajarla** con el explorador de archivos de MobaXterm (panel lateral de la sesión SSH), a
una carpeta **fuera de los tres repositorios**. Una vez bajada y con el mismo tamaño que dio
`ls -lh`, borrarla del servidor con `rm ~/esscoti-test.archive.gz`: son datos personales de
candidatos.

| Pieza | Dónde corre | Dirección |
| --- | --- | --- |
| MongoDB | Contenedor de Docker | `localhost:27017`, solo desde esta máquina |
| Backend | PowerShell, `npm run start:dev` | `http://localhost:3000` (API en `/docs`) |
| Portal | PowerShell, `npm run dev` | `http://localhost:5173` |
| Inicio de sesión | Firebase **real**, el proyecto de pruebas | — |

## 🔴 Antes de nada: el `.env` del backend no es una configuración

Hoy, en `esscoti-backend`, el archivo `.env` es **una nota de tres líneas** —empieza por un
enlace— y no una lista de variables. Por lo que cuenta la bitácora, ahí está el acceso de
PsicoAlianza que queda por rotar.

**No se sobrescribe.** Git lo ignora, así que no hay copia en ningún commit: si se pisa, se
pierde. Primero se guarda su contenido donde corresponda (un gestor de contraseñas) y se borra a
mano; solo entonces se crea el `.env` de abajo.

## Qué lee cada uno

- **Backend:** `esscoti-backend/.env`, validado al arrancar. Si falta una variable obligatoria,
  **no arranca** y dice cuál. Existe una segunda fuente, `src/environments/.env.stage.<STAGE>`,
  pero esa carpeta no existe: no se usa.
- **Portal:** `esscoti-frontend/.env`, ignorado por git. Sin él, la API apunta a
  `http://localhost:3000` por defecto, pero Firebase no tiene configuración y no se puede entrar.
- **Docker:** el archivo de compose lee usuario y contraseña de la base **del mismo `.env` del
  backend**. Una sola fuente: la base y el backend no pueden quedar con contraseñas distintas.

## 1 · La base de datos en Docker

Archivo `esscoti-backend/docker-compose.local.yml`:

```yaml
services:
  mongo:
    image: mongo:7
    container_name: essperto-mongo-local
    ports:
      - "127.0.0.1:27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME:?falta MONGO_USERNAME en .env}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:?falta MONGO_PASSWORD en .env}
    volumes:
      - essperto-mongo-local-data:/data/db

volumes:
  essperto-mongo-local-data:
```

Tres decisiones:

- **Sin contraseña escrita en el archivo**, que se commitea: sale del `.env`, y si falta, Docker
  se niega a arrancar con el mensaje de arriba. Es la regla de credenciales del backend.
- **Solo escucha en `127.0.0.1`.** Otra máquina de la red no llega a la base. (La de producción
  sí está expuesta a internet; no se repite aquí.)
- ⚠️ **`mongo:7` es provisional.** Tiene que ser la misma versión mayor que el servidor de pruebas.
  Se comprueba con `db.version()` en la consola de esa base y se ajusta la imagen.

## 2 · El `.env` del backend

Obligatorias para arrancar:

| Variable | Valor local | Nota |
| --- | --- | --- |
| `MONGO_URI` | `mongodb` | Es el esquema, no la dirección: el backend arma la cadena por piezas |
| `MONGO_HOST` | `localhost` | |
| `MONGO_PORT` | `27017` | |
| `MONGO_DATABASE` | `esscoti_local` | **Distinto de `esscoti`** a propósito: si alguien apunta por error a un servidor, el nombre lo delata |
| `MONGO_USERNAME` / `MONGO_PASSWORD` | Los que quieras | Solo existen en tu contenedor |
| `MONGO_ADDITIONAL_PARAMETERS` | vacía | |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | `local-sin-aws` | Obligatorias aunque no se usen. Con esto, subir archivos falla; es lo esperado |
| `AWS_REGION` / `AWS_S3_BUCKET_NAME` | `us-east-1` / `local` | |
| `SECRET_KEY` | 32 caracteres o más, aleatorios | Cifra las contraseñas de las conexiones. **Distinta a la de los servidores**: nada cifrado allá se descifra aquí, y así debe ser |
| `ADMIN_KEY` | 32 caracteres o más, aleatorios | Cabecera de las rutas de administración |

Para generar las dos claves en PowerShell:

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object { [char]$_ })
```

Inicio de sesión:

| Variable | Valor local | Nota |
| --- | --- | --- |
| `FIREBASE_AUTH_REQUIRED` | `true` | Con `false`, una petición sin sesión pasa y el backend no filtra por empresa: se prueba algo distinto de lo que corre en los servidores |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Los del proyecto de pruebas, **se piden al equipo** | La clave privada va en una línea, con los saltos escritos como `\n` |

Freno para lo que habla con el mundo real:

| Variable | Valor local | Por qué |
| --- | --- | --- |
| `STOP_ATS_SCRAPING` | `true` | No dispara robots contra los portales de empleo |
| `WHATSAPP_*` (token, número, agente) | **vacías** | 🔴 Con el token real, el backend local le escribe a personas reales desde el número de la empresa, y sus respuestas llegan al servidor, no a tu máquina |
| `ORCHESTRATOR_URL` / `ORCHESTRATOR_BEARER_TOKEN` | vacías | Es la cola de los robots |
| `SES_FROM_EMAIL` / `SES_SUPPORT_EMAIL` / `ALERT_SUPPORT_EMAILS` | vacías | Sin correos reales |
| `QDRANT_*`, `OPENAI_*`, `CALENDAR_SYNC_*`, `DOCUMENT_READER_URL` y sus credenciales | vacías | Cada una apaga su función con un aviso en el registro |

El resto tiene valor por defecto y no hace falta tocarlo.

**PsicoAlianza, dos formas de tener sesión** (decisiones 42 y 43):

- **Pegada a mano**, la de emergencia y la de hoy: ver la sección *La sesión de PsicoAlianza, a
  mano*, más abajo.
- **Conseguida por el backend con Chrome por proxy móvil**, la oficial. La pieza que consigue la
  sesión existe desde el paso 2c.1 y **desde el 2c.2 la llama la renovación** (decisión 54): una
  tarea al minuto 17 de cada hora que renueva la sesión a los cuatro días o cuando la ve muerta, el
  adaptador al encontrar la sesión caducada al invitar o al consultar, y el guardado de la conexión
  de PsicoAlianza desde *Mi compañía*. Necesita en el `.env` la cuenta del proxy (DataImpulse) con
  las cinco variables del módulo de proxy (paso 2b) y las tres de la pieza, todas en las tablas de
  abajo, y Chrome instalado en la máquina. Sin estas variables el backend arranca y falla solo al
  conseguir la sesión.

  🔴 **En una máquina de desarrollo sin la sesión manual encendida y con la ruta del navegador
  puesta, la tarea entra de verdad con la cuenta del cliente** cada hora que haga falta, y cada
  intento gasta reputación de esa cuenta en el captcha. No es un fallo: es lo que hace. Quien
  levante el backend en su máquina tiene que elegir: o la sesión manual encendida (con ella nada de
  la renovación hace nada), o `PSICOALIANZA_CHROMIUM_PATH` vacía (la renovación termina como *sin
  configurar* sin arrendar ni lanzar). **Dispararla a mano en local**, si hace falta: guardar la
  conexión de PsicoAlianza desde *Mi compañía* dispara una ráfaga por detrás; o el script fuera de
  los repositorios de la tanda del paso 3, que monte la pieza compilada (`dist/`) con una lectura de
  conexiones falsa —las credenciales de la cuenta principal, leídas del `.env` sin imprimirlas— y
  un almacén falso que solo imprima nombres de cookies. Reglas: un solo intento por llamada, al
  menos una hora entre fallos, tope de tres al día, parar al primer éxito o ante *credenciales
  rechazadas* o *sin cookie de recuerdo*; y **no pulsar «cerrar sesión» en PsicoAlianza** mientras
  tanto, que invalida todas las sesiones.

Las tres variables de PsicoAlianza (paso 2 de la etapa 3). Ninguna es obligatoria: sin ellas el
backend arranca igual.

| Variable | Valor local | Nota |
| --- | --- | --- |
| `PSICOALIANZA_BASE_URL` | vacía | Usa la oficial, `https://ats.psicoalianza.com` |
| `PSICOALIANZA_MANUAL_SESSION_ENABLED` | `true` solo mientras pegues una sesión | Apagada por defecto. Encendida, **todas las empresas** de tu base hablan con PsicoAlianza por esa sesión |
| `PSICOALIANZA_MANUAL_SESSION_COOKIES` | Las cookies de tu navegador | Ver *La sesión de PsicoAlianza, a mano* |

Las cinco variables del proxy móvil (paso 2b de la etapa 3, decisión 43). Ninguna es
obligatoria y una línea vacía cuenta como ausente: sin ellas el backend arranca y falla solo al
arrendar una IP, que hoy nadie hace hasta la pieza que consigue la sesión (2c).

| Variable | Valor local | Nota |
| --- | --- | --- |
| `PROXY_HOST` | `gw.dataimpulse.com` | El gateway de DataImpulse |
| `PROXY_PORT` | `823` | HTTP; `824` para SOCKS5 |
| `PROXY_LOGIN` | El login de la cuenta de DataImpulse **seguido de `__asn.26611`** | El país y la sesión pegajosa los añade el módulo detrás. El sufijo fija el operador en Claro, el único con el que se ha visto entrar; **medido el 2026-09-16** (bitácora, *Medición del operador del proxy*): sin él, cuatro de nueve arriendos salen por Claro y el resto por UNE, Movistar o WOM; con él, dieciséis de dieciséis. ⚠️ Vive en la configuración: si se rota el login, **conservar el sufijo**, o la tasa baja sin que nada falle |
| `PROXY_PASS` | La contraseña de la cuenta | Tal cual, sin sufijos |
| `PROXY_PROTOCOL` | vacía | `http` por defecto; `socks5` si se usa el puerto 824. ⚠️ **Para conseguir la sesión tiene que ser HTTP**: Chromium no autentica un proxy SOCKS5 por la autenticación de página, y la pieza termina como *sin configurar* nombrando esta variable |

Las tres variables de la pieza que consigue la sesión (paso 2c.1). Ninguna es obligatoria y una línea
vacía cuenta como ausente: sin las dos primeras la pieza termina como *sin configurar* nombrando la
variable, sin arrendar IP ni lanzar nada.

| Variable | Valor local | Nota |
| --- | --- | --- |
| `PSICOALIANZA_CHROMIUM_PATH` | `C:/Program Files/Google/Chrome/Application/chrome.exe` | En local, el Chrome instalado; en el servidor, `/usr/bin/chromium` |
| `PSICOALIANZA_LOGIN_DIR` | Una carpeta **fuera de los repositorios** | Dentro van el perfil persistente de Chrome (`profile/`) y las capturas de los intentos que no entran |
| `PSICOALIANZA_LOGIN_HEADLESS` | vacía | **Con ventana por defecto** (cambiado el 2026-09-15: ese día, sin ventana entró 0 de 4 y con ventana 2 de 2). En Linux la ventana se dibuja sobre una pantalla virtual Xvfb; en Windows es una ventana de verdad y **ya no termina como *error***. Con `true`, sin ventana |

Las cuatro variables de la renovación de la sesión (paso 2c.2, decisión 54). Opcionales, con valor
por defecto; una línea vacía cuenta como el valor por defecto; cero, negativos y decimales se
rechazan al arrancar.

| Variable | Valor local | Nota |
| --- | --- | --- |
| `PSICOALIANZA_LOGIN_ATTEMPTS_PER_BURST` | vacía | `3` intentos por ráfaga |
| `PSICOALIANZA_LOGIN_BURST_COOLDOWN_MINUTES` | vacía | `60` minutos entre ráfagas; el guardado de la conexión salta esta espera |
| `PSICOALIANZA_LOGIN_ATTEMPTS_PER_WINDOW` | vacía | `20` intentos por ventana de 24 horas, contando todos los de cada ráfaga; al llegar, correo a `ALERT_SUPPORT_EMAILS` |
| `PSICOALIANZA_SESSION_RENEWAL_DAYS` | vacía | Renovar cuando la sesión guardada pasa de `4` días |

**SolveCaptcha:** ya no hace falta (decisión 25 descartada).

## 3 · El `.env` del portal

| Variable | Valor local |
| --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:3000` |
| `VITE_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID` | Los del **mismo** proyecto de Firebase que el backend, se piden al equipo |
| `VITE_SCHEDULING_BASE_URL` | vacía (esconde "Mi agenda") |

⚠️ Si el portal y el backend usan proyectos de Firebase distintos, el inicio de sesión funciona
en el portal y **todas las peticiones responden "token inválido"**.

## 4 · Arrancar

**Versión de Node:** las imágenes de los dos repositorios usan **Node 20**. Esta máquina tiene la
25. Si algo falla de forma rara al instalar o compilar, lo primero es probar con la 20.

Tres ventanas de PowerShell:

```powershell
# 1 · Base (desde esscoti-backend)
docker compose -f docker-compose.local.yml up -d
docker compose -f docker-compose.local.yml ps

# 2 · Backend (esscoti-backend)
npm install
npm run start:dev

# 3 · Portal (esscoti-frontend)
npm install
npm run dev
```

**Comprobación** de que el backend llegó a la base: al arrancar siembra los roles por defecto.

```powershell
docker exec -it essperto-mongo-local mongosh -u <usuario> -p --authenticationDatabase admin esscoti_local --eval "db.roles.countDocuments()"
```

Esperado: **más de 0**. El control es que `db.tenants.countDocuments()` en la misma base dé **0**
en una instalación nueva: prueba que se está mirando la base local recién creada y no otra.

## 5 · El primer ingreso

La base local nace sin empresas. Se entra al portal con un usuario de Firebase y, al no tener
empresa, el portal ofrece registrarla: eso crea **la empresa y su administrador** en la base
local. Los roles ya existen porque el backend los sembró al arrancar.

- **Usa un usuario de Firebase solo para local** (otro correo). El registro escribe en el usuario
  de Firebase la empresa y el miembro **locales**. El portal de los servidores usa esos datos
  solo si falla su consulta de perfil, pero con el mismo usuario en los dos lados quedarían
  mezclados.
- **El NIT puede ser inventado**; solo tiene que no repetirse en la base local.
- Los correos de bienvenida y verificación **fallan sin SES, y el registro sigue igual**
  (comprobado en el código): queda un aviso en el registro del backend.

## 6 · Apagar y borrar

```powershell
docker compose -f docker-compose.local.yml down      # para la base; los datos se quedan
```

🔴 Añadir `-v` a ese comando **borra el volumen, es decir, la base local entera**. No tiene vuelta
atrás.

## La sesión de PsicoAlianza, a mano (decisión 42: emergencia y local)

Hasta que el 2c.2 la llame, el backend local **no hace login en PsicoAlianza** por su cuenta: usa
una sesión que tú abres en el navegador y pegas en el `.env`. Después, sigue sirviendo como red
de emergencia. Dura **5 días**; cuando el backend empiece a fallar con *sesión de PsicoAlianza
caducada*, se repite esto.

1. En el navegador, entrar a `https://ats.psicoalianza.com/login` con la cuenta de pruebas y
   **la casilla *permanecer conectado* marcada**. Sin la casilla, la sesión dura horas.
2. Abrir las herramientas de desarrollador → *Application* (Chrome) o *Almacenamiento*
   (Firefox) → *Cookies* → `https://ats.psicoalianza.com`.
3. Copiar el valor de **`ats_session`** y el de **`remember_web_<hash>`** (el nombre termina en
   una tira larga de letras y números; es una sola cookie).
4. Pegarlos en el `.env` del backend, en **una línea**, con la forma exacta con que el navegador
   manda la cabecera `Cookie`: nombre, `=`, valor, y `; ` entre las dos:

   `PSICOALIANZA_MANUAL_SESSION_COOKIES=ats_session=<valor>; remember_web_<hash>=<valor>`

   Sin comillas, sin espacios alrededor del `=` de la variable. `XSRF-TOKEN` no hace falta: el
   backend la renueva solo antes de cada envío.
5. **Encender el interruptor**, en otra línea: `PSICOALIANZA_MANUAL_SESSION_ENABLED=true`. 🔴 **Hacen
   falta las dos cosas**: con las cookies pegadas y el interruptor apagado, no se usan. Es a
   propósito — así una línea olvidada en el `.env` de un servidor no hace nada.
6. Reiniciar el backend: el `.env` se lee al arrancar. Al arrancar, el registro **advierte** de que
   la sesión manual está encendida.

🔴 **Mientras uses la sesión pegada, no pulses «cerrar sesión» en PsicoAlianza.** Cerrar sesión la
invalida **en el servidor**, así que mata también la del `.env` y hay que repetir todo esto. Cerrar
la pestaña o el navegador no pasa nada; lo que mata es el botón. Pasó el 2026-09-14 a mitad de una
tanda de pruebas.

✅ **Lo que no la mata** (comprobado el 2026-09-14): que el backend la use. PsicoAlianza emite una
cookie nueva en cada respuesta, pero **la anterior sigue valiendo**, así que la línea del `.env` no
se gasta de una corrida a otra.

🔴 **Esa línea es una credencial viva de la cuenta del cliente.** El `.env` está ignorado por git
y ahí se queda; no va a ningún mensaje, captura de pantalla ni `.md`. Y **no va en ningún
servidor**: la lista de antes del despliegue lo tiene como bloqueo.

## La conexión de PsicoAlianza

**Se conecta desde *Mi compañía*** (paso 6.1 de la etapa 3): en la pestaña del flujo, fila de
PsicoAlianza, botón *Conectar*, con el correo y la contraseña de la cuenta. El backend cifra la
contraseña al guardar con tu `SECRET_KEY` local. No entra en PsicoAlianza al guardar: que la
sesión sirva lo dice la etiqueta de la fila.

**Insertarla a mano en la base sigue sirviendo** si hace falta —por ejemplo, sin el portal
levantado—. Es la cuenta de PsicoAlianza de la empresa: correo y contraseña, **la contraseña
cifrada con tu `SECRET_KEY` local**. Una contraseña cifrada en otra máquina no se descifra aquí.

1. Compilar el backend una vez (`npm run build`), porque el cifrado se toma de lo compilado.
2. Cifrar la contraseña, desde `esscoti-backend`. `Read-Host` la pide sin que quede en el
   historial de PowerShell:

   ```powershell
   $env:PA_PASSWORD = Read-Host "Contraseña de PsicoAlianza"
   node -r dotenv/config -e "console.log(require('./dist/shared/crypto.util').encrypt(process.env.PA_PASSWORD, process.env.SECRET_KEY))"
   Remove-Item Env:PA_PASSWORD
   ```

   Sale una tira de cuatro bloques separados por `:`. Esa tira es la contraseña cifrada.
3. Insertarla en tu empresa local, en `mongosh` contra `esscoti_local`. Solo añade si la empresa
   todavía no tiene conexión de PsicoAlianza:

   ```js
   db.tenants.updateOne(
     { _id: ObjectId("<id de tu empresa>"), "psychometricConnections.provider": { $ne: "psicoalianza" } },
     { $push: { psychometricConnections: {
       id: new ObjectId().toHexString(),
       name: "PsicoAlianza",
       provider: "psicoalianza",
       credentials: { email: "<correo de la cuenta>", encryptedPassword: "<la tira del paso 2>" }
     } } }
   )
   ```

   Esperado: `modifiedCount: 1`. Con `0`, o el identificador no es el de tu empresa o ya tenía
   conexión.

**Para probar el cliente contra PsicoAlianza de verdad** hacen falta las dos cosas: esta conexión
en la base y la sesión pegada en el `.env` con el interruptor encendido. El cliente todavía no
guarda sesiones propias: sin la pegada responde *sin sesión*.

## Una oferta con PsicoAlianza

Desde el paso 4a el embudo invita y consulta por el proveedor de la conexión que la oferta tiene
congelada (decisión 48). **Desde el paso 6.2b se elige en el portal**: al crear la oferta o en el
modal de la prueba de su ficha, con un selector de proveedor cuando la empresa tiene las dos
conexiones, y sin selector cuando tiene una sola. El portal manda siempre la conexión al guardar.

**Escribirla a mano sigue sirviendo** si hace falta —por ejemplo, para preparar una oferta de las
pruebas a mano—. Dos formas:

- **Por la ruta**, con el portal abierto: la ruta que guarda la configuración de la prueba
  (`PATCH offers/<id>/evaluatest-config`) acepta `connectionId` en el cuerpo. Mandar el de la
  conexión de PsicoAlianza junto a `enabled: true` y el `jobProfileId` de una vacante activa de
  PsicoAlianza; el backend comprueba la vacante allí y la congela.
- **En la base**, en `mongosh` contra `esscoti_local`, sobre una oferta que ya tenga la prueba
  configurada:

  ```js
  db.offers.updateOne(
    { _id: ObjectId("<id de la oferta>") },
    { $set: {
      "evaluatestConfig.enabled": true,
      "evaluatestConfig.jobProfileId": <id de la vacante en PsicoAlianza>,
      "evaluatestConfig.jobProfileName": "<nombre de la vacante>",
      "evaluatestConfig.connectionId": "<id de la conexión de PsicoAlianza de tu empresa>"
    } }
  )
  ```

  El `connectionId` es el campo `id` de la entrada de la lista `psychometricConnections` de la
  empresa (el que generó el paso de arriba). El nombre de la vacante es obligatorio: sin él la
  invitación aborta como fallo permanente. Los campos `jobProfileCode`, `evaluationCode` y
  `selectedTests` se quedan vacíos: son de EvaluaTest.

Con eso, un candidato que entre a la etapa en esa oferta se invita en PsicoAlianza con los cuatro
pasos, queda con `psicoalianza` como proveedor y el cron lo consulta en el tablero de esa vacante.
Una empresa con **solo** la conexión de PsicoAlianza no necesita nada de esto: la regla por empresa
ya la elige.

## Lo que este entorno todavía no cubre

- **Probar la etapa psicométrica de punta a punta.** El candidato habla por WhatsApp, y aquí
  WhatsApp está apagado a propósito. Cómo se mete a un candidato en la etapa sin WhatsApp sigue
  sin anotarse aquí; qué tiene que tener la oferta para que la etapa use PsicoAlianza, sí (*Una
  oferta con PsicoAlianza, a mano*). **Con el simulador de WhatsApp y una empresa en modo demo sí
  se puede** (decisión 57): la demo inyecta al candidato al crear la oferta y, con
  `demoMode.realPsychometrics` en verdadero, la etapa invita de verdad en el proveedor de la oferta.
  ⚠️ Una empresa demo sin ese interruptor simula la etapa entera: enlace `DEMO-…` de EvaluaTest y
  «gracias por completar» a los 45 segundos, aunque la oferta sea de PsicoAlianza. Y el candidato de
  la demo tiene que llevar tu cédula y un correo tuyo: con el correo nulo la etapa lo descarta sin
  mensaje, y con una cédula ajena se invita a esa persona en la cuenta real.

  ```js
  db.tenants.updateOne(
    { _id: ObjectId("<id de la empresa demo>") },
    { $set: {
      "demoMode.realPsychometrics": true,
      "demoMode.candidate.documentId": "<tu cédula>",
      "demoMode.candidate.email": "<tu correo>"
    } }
  )
  ```
- 🔴 **PsicoAlianza no tiene ambiente de pruebas.** Cada invitación hecha desde local le llega a
  una persona real en la cuenta real. Se prueba con documentos y correos propios, **un correo
  real distinto por candidato**: allá un correo pertenece a una sola persona en toda la
  plataforma, así que el desvío de correos de pruebas de EvaluaTest no sirve.
- **La conexión de PsicoAlianza de la empresa local** se guarda en la base, cifrada con la
  `SECRET_KEY` local, como en producción: ver *La conexión de PsicoAlianza*, arriba.
  **No va en el `.env`**: en el `.env` va solo la sesión, que es otra cosa — la conexión dice
  *qué cuenta usa esta empresa*; la sesión, *ya estoy dentro*.
