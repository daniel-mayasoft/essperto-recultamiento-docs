# Brief · Paso 8a de la etapa 1 — la conexión de la empresa y la conexión de la oferta

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en
los otros `.md`** — sobre todo en la decisión 41, que es donde se decidió la forma de este paso
y por qué no otra.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto.
3. `flujo-actual-etapa-psicometrica.md` — cómo funciona hoy la etapa. Importan las piezas, §1
   y §2.
4. `integrate-psicoalianza.md` — la bitácora. Importan **41 entera**, 1, 2, 5, 7, 28 y 40, y
   el registro del cambio de la cuenta compartida.
5. El esquema de la empresa (el bloque de credenciales), el esquema de la oferta (el bloque de
   configuración), el servicio de empresas —cómo guarda y cómo sirve las credenciales— y los
   cuatro lectores de credenciales: el adaptador, la creación con IA, la sincronización del
   índice y el servicio de empresas.

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio. Si algo de
aquí no cuadra con el código, gana el código y hay que decirlo antes de empezar.

## El objetivo

Que la empresa pueda tener **conexiones de pruebas** con nombre —hoy una, de EvaluaTest— y que
la oferta guarde **con qué conexión** se hizo. Al terminar, **nadie ve nada distinto**: el
portal de hoy sigue funcionando sin tocarlo, y EvaluaTest se comporta igual.

🔴 **La forma está decidida y no se discute en la opinión previa: se extiende lo guardado, no se
duplica** (decisión 41). Campos nuevos al lado de los de siempre, una migración única antes de
desplegar, una sola copia de cada dato. Lo que sí se discute es todo lo demás.

## Alcance exacto — la empresa

1. **Esquema:** la lista `psychometricConnections`. Cada conexión: `id` (texto, único dentro
   de la empresa), `name`, `provider` (`evaluatest`), y `credentials`, una bolsa por proveedor
   donde EvaluaTest guarda correo, contraseña **cifrada** con el mismo cifrado de hoy, e
   identificador de empresa. El bloque viejo `evaluatestCredentials` **se queda en el esquema
   y deja de ser fuente**: nadie lo lee ni lo escribe después de este paso. No se borra.
2. **Una sola lectura de conexiones**, un servicio pequeño en la carpeta de la capa
   psicométrica, con dos operaciones. `resolveConnection(empresa, proveedor)`: devuelve
   identificador, nombre, proveedor, las credenciales de ese proveedor descifradas y **el
   correo de pruebas de la empresa** —que es de la empresa, no de la conexión, y viaja nulo si
   no hay (32-b)—, o lanza el error *sin conexión* que ya existe; incompleta cuenta como sin
   conexión. `listConnections(proveedor)`: todas las empresas con conexión de ese proveedor,
   cada una ya resuelta, **en una sola consulta**, para la sincronización. Con la decisión 2
   hay a lo sumo una conexión por proveedor y empresa.
3. **Los cuatro lectores pasan por ahí.** El adaptador (su `resolveCredential`, y **deja de
   inyectar el modelo de empresa**, que se lo lleva la lectura única; conserva la
   configuración por la base del enlace), la creación con IA (su copia de la regla), la
   sincronización del índice (su consulta por el campo viejo y su copia) y el servicio de
   empresas. Desaparecen las copias.
4. **El servicio de empresas escribe en la lista, y es el único escritor.** El portal de hoy
   manda `evaluatestCredentials` por la ruta de Mi compañía **en dos sitios**: el modal de
   credenciales y el guardado general de la página, que lo manda siempre, con nulos si la
   empresa no tiene nada. Eso **se sigue aceptando** y se escribe en la lista con esta regla:
   - correo **y** contraseña vacíos → se quita la conexión de EvaluaTest de la lista si existe
     (es lo que hoy significa el bloque vacío: desconectada);
   - correo presente y contraseña **vacía** → se conserva la contraseña guardada. ⚠️ Hoy eso
     escribe nulo y rompe la conexión en silencio; es un cambio de comportamiento a mejor, y
     es lo que permite dejar de servir la contraseña (punto 5);
   - lo demás → se crea la conexión con nombre "EvaluaTest" si no existe, o se actualiza.

   **La creación de empresa** también acepta el bloque y hoy lo copia tal cual al documento
   (sin contraseña, porque el esquema la descarta): pasa por la misma escritura a la lista.
   La validación de la conexión no cambia.
5. **El servicio de empresas sirve las dos cosas, y reemplaza la lista explícitamente** —la
   respuesta se construye copiando el documento entero, así que sin tocarla la lista saldría
   cruda con la contraseña cifrada dentro—: el bloque `evaluatestCredentials` **derivado de la
   lista**, con correo e identificador y **sin contraseña**, para que el portal actual siga
   viendo a la empresa configurada (su señal es que el bloque exista); y la lista
   `psychometricConnections` como `id`, `name`, `provider` y `configured`. Con la regla del
   punto 4, que el modal de hoy reenvíe la contraseña vacía ya no rompe nada, y **la fuga de
   esta credencial queda cerrada aquí**; las de portales de empleo y antecedentes siguen en
   deuda.

## Alcance exacto — la oferta

6. **Esquema:** dos campos más en el bloque `evaluatestConfig`: `connectionId` (texto, nulo por
   defecto) y `providerData` (objeto libre, nulo por defecto). Los campos actuales no cambian
   de nombre ni de tipo; el identificador de vacante sigue numérico (decisión 28).
7. **La ruta que guarda la configuración escribe `connectionId`** al activar la prueba: la
   conexión de EvaluaTest de la empresa, resuelta con la lectura única **antes de comprobar la
   vacante** —da el identificador que hay que guardar y lanza el *sin conexión* que la ruta ya
   convierte en 400; esa captura se queda como cinturón—. 🔴 **La ruta asigna hoy el bloque
   entero con los siete campos de siempre**, y la llaman el portal y el agente de WhatsApp al
   cambiar el puntaje o activar: `connectionId` y `providerData` **se arrastran del bloque
   anterior** en esa asignación, o cada guardado los borraría. Al desactivar se conservan.
8. **Un ayudante de lectura de la configuración**, al lado del ayudante de los campos del
   candidato: recibe el bloque y devuelve la forma neutra —activa, conexión, vacante, nombre
   de la vacante, puntaje mínimo, y una bolsa con lo propio de EvaluaTest (los dos códigos y
   las pruebas adicionales) más lo que traiga `providerData`—. **Solo lo usa la etapa**: los
   seis sitios del embudo que hoy leen el bloque a mano (arranque, mensaje de fin de preguntas,
   cron). ⚠️ Si `connectionId` viene nulo —una oferta creada desde administración, que copia
   la configuración tal cual—, el ayudante no falla: la etapa resuelve la conexión por empresa
   y proveedor, que con la decisión 2 es la misma. Se registra como aviso.
9. **Los otros lectores no se tocan**: el agente de WhatsApp, el borrador, la creación con IA
   (al copiar), administración y el servicio de ofertas siguen leyendo los campos de siempre,
   que siguen ahí.

## 🔴 Dónde se para — qué NO se hace

- **No se toca el portal.** Es el 8b. Este paso tiene que dejar al portal de hoy funcionando
  sin cambios: por eso el punto 5 sirve el bloque derivado.
- **No se toca el puerto.** Sus operaciones siguen recibiendo la empresa; el adaptador resuelve
  *la conexión de EvaluaTest de esa empresa*. Pasar la conexión concreta es de la etapa 3.
- **No se renombra ningún campo, ruta ni DTO.**
- **No se borra el bloque viejo de la empresa.** Se borra en una limpieza aparte.
- **No se toca el demo**: una empresa demo sin conexión sigue igual (decisión 40).
- **No se migra nada desde el código**: la migración es un script de consola, abajo, que corre
  una persona antes de desplegar.

## 🔴 Las trampas

**1. El backend nuevo da por hecho que las conexiones existen.** Si se despliega sin el script,
ninguna empresa tiene conexión y **la etapa se salta en silencio para todas** (decisión 40): los
candidatos pasan sin prueba y nada falla. El orden es script → backend, y la comprobación de
control del script es lo que lo garantiza.

**2. El portal de hoy reenvía la contraseña que recibe, y ahora recibe ninguna.** El modal y
el guardado general rellenan la contraseña con la que llega y la reenvían al guardar. Sin la
regla *contraseña vacía = conservar* del punto 4, servir el bloque sin contraseña rompería la
conexión en el siguiente guardado. La regla va antes que el recorte, y la prueba de la ruta lo
afirma explícitamente.

**3. La sincronización del índice busca empresas por el campo viejo.** Consulta a la base
"empresas con correo en `evaluatestCredentials`"; después del script ese campo sigue ahí y
seguiría funcionando **por casualidad**, hasta que alguien cambie una contraseña y el viejo
quede desactualizado. Tiene que consultar por la lista.

**4. Las pruebas montan empresas con el bloque viejo**, y son varias: la de paridad, el ciclo
mixto y el arranque por el puerto, como mínimo. Sus montajes pasan a construir la lista. ⚠️ La
prueba que decía "sin credenciales completas resuelve a sin conexión" sigue valiendo, con la
lista.

**5. `connectionId` nulo no es lo mismo que sin conexión.** Nulo es una oferta que nadie guardó
por la ruta después de este paso (administración); sin conexión es una empresa sin conexión.
El primero se resuelve por empresa; el segundo salta la etapa.

## Lo que hay que preservar entero

| Qué | Por qué existe |
| --- | --- |
| **El correo de pruebas de la empresa viaja con nulo cuando no tiene** (32-b) | Nulo apaga el desvío del entorno. La lectura única lo conserva como lo hacía el adaptador |
| **La contraseña se cifra al guardar y se descifra solo al leer** | Mismo cifrado y misma clave de hoy |
| **El portal actual ve a la empresa configurada** | Por el bloque derivado; sin él, el portal esconde la sección de la prueba. Su señal es que el bloque exista, no que traiga contraseña |
| **Validar la conexión en Mi compañía** | Usa lo que se teclea; no toca la lista ni el bloque |
| **La ruta de configuración comprueba la conexión antes que la vacante** | Del cambio anterior |
| **La creación con IA y la sincronización se saltan a la empresa sin conexión** | Hoy lo hacen con su copia; con la lectura única, igual |

## El script de migración

Se corre **una vez, antes de desplegar el backend**, en la consola de la base. Solo escribe
donde todavía no hay conexión, así que repetirlo es inofensivo.

**Empresas:** a cada una con `evaluatestCredentials.email` y `evaluatestCredentials.encryptedPassword`
no vacíos y sin conexión de EvaluaTest en la lista, añadirle una conexión con id nuevo, nombre
"EvaluaTest", proveedor `evaluatest` y las tres credenciales **tal cual están** (la contraseña ya
va cifrada; no se toca).

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

**Ofertas:** a cada una con `evaluatestConfig.enabled` y `evaluatestConfig.jobProfileId`, sin
`connectionId`, y cuya empresa tenga conexión de EvaluaTest, ponerle ese `connectionId`.

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

⚠️ Si `tenantId` está guardado como texto en las ofertas, cambiar `t._id` por
`t._id.toHexString()`. Las mediciones anteriores cruzaron bien con el identificador tal cual,
pero no cuesta comprobarlo.

**Comprobación de control**, antes y después:

```js
db.tenants.countDocuments({ "psychometricConnections.provider": "evaluatest" })   // esperado: 3
db.offers.countDocuments({ "evaluatestConfig.enabled": true,
  "evaluatestConfig.jobProfileId": { $ne: null },
  "evaluatestConfig.connectionId": { $in: [null] } })                              // esperado: solo las de empresas sin conexión
```

El segundo número no tiene que ser cero: las ofertas de la cuenta de pruebas sin credenciales
se quedan sin conexión, y la etapa se las salta como hoy.

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador.**
- **Comentarios: ninguno nuevo en archivos de código.** Los del bloque viejo del esquema no se
  borran. Lo que este paso decide vive en la decisión 41.
- **Los identificadores van en inglés**, incluidos los de los `.spec` y los parámetros de
  callbacks.
- **La solución más pequeña que resuelve el caso.** Nada de reorganizar el servicio de
  empresas ni el cliente de paso.
- **No commitear.** Los archivos nuevos se añaden al índice, con `add`.
- 🔴 **`flujo-actual-etapa-psicometrica.md` se actualiza en este mismo diff**: las piezas (la
  lectura única de conexiones), §1 (qué se guarda en la empresa y en la oferta, con la
  migración) y §2 (el ayudante).

## Pruebas

🔴 **Las redes de seguridad son las de siempre**: paridad de la capa, arranque por el puerto,
ciclo mixto, cron por el puerto. Cambian de montaje —la lista en vez del bloque—, no de
afirmación. Si alguna cambia de afirmación, el cambio se salió del alcance.

Lo nuevo que hay que cubrir:

- **La lectura única resuelve la conexión de EvaluaTest de la empresa** con la contraseña
  descifrada y el correo de pruebas de la empresa; **sin conexión lanza el error que ya
  existe**; y con el bloque viejo pero sin lista **también lanza** — el bloque viejo ya no es
  fuente.
- **Guardar por la ruta de Mi compañía escribe la lista** con la regla del punto 4: crea,
  actualiza, **conserva la contraseña si llega vacía con correo**, y quita la conexión si llegan
  correo y contraseña vacíos. **La creación de empresa** con bloque también escribe la lista.
- **El bloque derivado que se sirve coincide** con lo guardado y **no lleva contraseña**; **la
  lista servida no lleva credenciales**.
- **La ruta de configuración guarda `connectionId`** al activar la prueba, **y lo conserva** al
  cambiar el puntaje y al desactivar.
- **El ayudante devuelve la forma neutra** desde un bloque con los campos de hoy, y **tolera
  `connectionId` nulo** resolviendo por empresa.
- **La sincronización del índice encuentra a la empresa por la lista**, no por el bloque viejo.

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo, y borrarlo después,
limpiando la caché.

## Verificación

Una vez sobre el conjunto del cambio:

- Backend: `npm run build` y `npm test`.

El resultado va en el reporte. Si falla, el paso no está terminado.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos.
5. **Confirmación de que ningún lector del backend lee ya `evaluatestCredentials` ni ningún
   escritor lo escribe**, con cómo se buscó, y de que el portal no se tocó.
6. **La forma exacta de la conexión guardada y del bloque derivado**, en una línea cada una:
   es lo que el script y el 8b necesitan.
7. **Un mensaje de commit.**

## Para el despliegue, no para el código

- 🔴 **Orden: script de migración → backend → (después) portal 8b.** El script con su
  comprobación de control antes y después.
- El bloque viejo de la empresa queda en la base sin uso hasta la limpieza.
