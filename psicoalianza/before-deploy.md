# Antes de desplegar la rama de PsicoAlianza

Lo que hay que hacer **fuera del código** antes de soltar `feat/integrate-psicoanalisis-provider`
a producción, en orden. Se va completando a medida que los pasos lo exigen; cuando la rama
esté lista, se recorre esta lista de arriba abajo.

**Regla:** todo paso que deje algo que hacer antes del despliegue lo anota aquí, en el mismo
diff de documentación. Lo que está en la bitácora y no aquí, no se va a hacer.

| # | Qué | Quién | Hecho |
| --- | --- | --- | --- |
| 1 | Correr la migración de conexiones (abajo) | Usuario, en la consola de la base | ☐ |
| 2 | Retirar las tres variables de la cuenta compartida de los entornos desplegados | Quien despliega | ☐ |
| 3 | Desplegar en orden: **backend primero, portal inmediatamente después** (ver abajo) | Quien despliega | ☐ |
| 4 | Avisar al equipo del cambio de rutina en local: probar contra EvaluaTest exige una empresa con credenciales guardadas, y las tres variables salen del archivo de entorno local | Usuario | ☐ |
| 5 | Rotar las dos credenciales: PsicoAlianza (archivo de entorno local) y EvaluaTest (historial de git) | Equipo | ☐ |
| 5b | **Secretos en texto plano en el despliegue de pruebas** (anotado el 2026-09-14, aplazado por el usuario hasta que todo funcione): el archivo de despliegue del servidor de pruebas lleva escritas claves de AWS, la contraseña de un correo, la clave privada de Firebase y la clave de los robots. Pasarlas a variables fuera del archivo y rotarlas si ese archivo se ha compartido | Equipo | ☐ |
| 5c | **Sacar a la persona de prueba** de las vacantes activas de la cuenta del cliente en PsicoAlianza donde se la invitó para comprobar (aplazado por el usuario): la **5146** (tanda del 2026-09-14) y la **1135**, OPERARIO DE PRODUCCIÓN — MANISOL (invitación real de comprobación del paso 3, el mismo día) | Usuario | ☐ |
| 6 | 🔴 **Bloqueo de la etapa 3**: PsicoAlianza no se despliega a ningún servidor sin el acuñador de sesión (paso 2c, decisión 43) y su aviso a soporte. Con la sesión pegada a mano (decisión 42) no: muere a los 5 días sin avisar y, con la decisión 36, dos días sin sesión descartan candidatos reales por vencimiento | Usuario | ☐ |
| 7 | **La imagen base del backend, en dos tiempos** (decisión 43; procedimiento en §4, abajo). Tiempo 1: Node 22 sobre Debian ligero, sin Chromium, un día en el servidor de pruebas. Tiempo 2: la misma base más Chromium, fuentes y Xvfb. Cada tiempo va **a mano y con el despliegue nocturno sin programar** | Usuario y quien despliega | ☐ |
| 7b | **Medir el consumo de memoria del backend en el servidor de pruebas** antes del tiempo 2, y ponerle límite: el consumo medido más unos 600 MB, y memoria compartida de 1 GB, en los dos compose. Comando en §4 | Quien despliega | ☐ |
| 7c | **Deuda aceptada el 2026-09-15**: Chromium corre **sin su aislamiento** (como root, dentro del contenedor del backend). Acotado a que el acuñador solo navega a PsicoAlianza y a los dominios del captcha. Activarlo es un paso propio: usuario propio en la imagen, cambio de dueño de los volúmenes de registros y un perfil de seguridad en los dos compose | Equipo, después | ☐ |
| 8 | Configurar en los servidores las variables del proxy (`PROXY_HOST`, `PROXY_PORT`, `PROXY_LOGIN`, `PROXY_PASS`, protocolo) antes de que una empresa use PsicoAlianza. Sin ellas el backend arranca; falla al acuñar | Quien despliega | ☐ |
| 8b | **Correr las pruebas a mano del portal** de `pruebas-a-mano.md`, en local y con la rama entera, y anotar el resultado de cada caso. Si alguno falla, no se despliega | Usuario | ☐ |
| 9 | Configurar en los servidores las variables de PsicoAlianza antes de que una empresa la use: `PSICOALIANZA_BASE_URL` si no es la oficial, y comprobar que **`PSICOALIANZA_MANUAL_SESSION_ENABLED` no está encendida** ni hay cookies pegadas (paso 2 de la etapa 3). No bloquea desplegar ese paso solo | Quien despliega | ☐ |

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

### Tiempo 2 · Chromium, fuentes y Xvfb

Etiqueta `selessia-node-chromium:22-debian-1`. Se escribe cuando el tiempo 1 lleve un día en verde:
`Dockerfile.base` gana la instalación de `chromium`, `xvfb` y `fonts-liberation` (lo que probó el
otro chat el 2026-09-14), y **las versiones instaladas se anotan en este documento** junto a la
versión de la librería que las maneja, para comprobar el par la próxima vez que se reconstruya la
base. `IMAGE_BACKEND_BASE` en el script y la primera línea del Dockerfile del backend cambian a la
etiqueta nueva.

Antes de este tiempo, el punto 7b: medir el consumo del backend en el servidor de pruebas con
`docker stats --no-stream selessia-backend`, y en los dos compose ponerle al backend `mem_limit` (lo
medido más unos 600 MB) y `shm_size: 1gb`. Sin la memoria compartida, Chromium se cae.

**Después del tiempo 2, el backend puede acuñar sesiones** cuando exista el 2c. El acuñador necesita
además un volumen con nombre para el perfil de Chromium y una carpeta para las capturas de los intentos
fallidos; los dos se añaden a los compose con el brief del 2c.
