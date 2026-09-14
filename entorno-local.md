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

**SolveCaptcha:** sus variables entran con el brief 1 de la etapa 3, y este documento se
actualiza en ese mismo diff.

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

## Lo que este entorno todavía no cubre

- **Probar la etapa psicométrica de punta a punta.** El candidato habla por WhatsApp, y aquí
  WhatsApp está apagado a propósito. Cómo se mete a un candidato en la etapa sin WhatsApp se
  decide antes del brief 5 de la etapa 3 y se anota aquí.
- 🔴 **PsicoAlianza no tiene ambiente de pruebas.** Cada invitación hecha desde local le llega a
  una persona real en la cuenta real. Se prueba con documentos y correos propios, **un correo
  real distinto por candidato**: allá un correo pertenece a una sola persona en toda la
  plataforma, así que el desvío de correos de pruebas de EvaluaTest no sirve.
- **La conexión de PsicoAlianza de la empresa local** se guarda en la base, cifrada con la
  `SECRET_KEY` local, como en producción. Cómo insertarla se añade aquí cuando el backend sepa
  leerla (brief 2 de la etapa 3). **No va en el `.env`.**
