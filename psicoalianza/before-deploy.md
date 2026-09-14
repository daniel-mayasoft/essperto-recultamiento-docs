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
| 5c | **Sacar a la persona de prueba** que la tanda del 2026-09-14 invitó a una vacante activa de la cuenta del cliente en PsicoAlianza (aplazado por el usuario) | Usuario | ☐ |
| 6 | 🔴 **Bloqueo de la etapa 3**: PsicoAlianza no se despliega a ningún servidor sin el acuñador de sesión (paso 2c, decisión 43) y su aviso a soporte. Con la sesión pegada a mano (decisión 42) no: muere a los 5 días sin avisar y, con la decisión 36, dos días sin sesión descartan candidatos reales por vencimiento | Usuario | ☐ |
| 7 | **La imagen del backend cambia** (decisión 43): Chromium dentro, de 300 a 500 MB más, y en el minuto del login la instancia puede doblar su memoria. Antes del brief del 2c: cómo se construye la imagen hoy, límite de memoria del contenedor y cuántas instancias corren. Antes de desplegar: probar la imagen nueva en el servidor de pruebas | Usuario y quien despliega | ☐ |
| 7b | **La imagen del backend pasa de Alpine a Debian ligero, en su propio despliegue y antes de meter Chromium.** Leído el 2026-09-14: ninguna dependencia del backend se compila para el sistema y el código no ejecuta programas del sistema, así que el riesgo es bajo; lo que no se sabe leyendo se prueba. **Primero solo el cambio de sistema, sin Chrome**, al servidor de pruebas, y dejarlo correr un día comprobando: que arranca, que `npm test` pasa **dentro de la imagen**, la hora con la zona de Bogotá, el cron psicométrico, WhatsApp, S3 y los correos. Si algo falla, volver es cambiar la primera línea del Dockerfile. Chromium se añade después sobre esa imagen, y si se sigue la estrategia de imagen base (la de Sucomex), la base tiene que estar en el registro desde el que construya quien despliega | Quien despliega | ☐ |
| 8 | Configurar en los servidores las variables del proxy (`PROXY_HOST`, `PROXY_PORT`, `PROXY_LOGIN`, `PROXY_PASS`, protocolo) antes de que una empresa use PsicoAlianza. Sin ellas el backend arranca; falla al acuñar | Quien despliega | ☐ |
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
