# Brief · Paso 8b de la etapa 1 — la conexión con nombre en el portal, y "Puntaje mínimo"

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en
los otros `.md`.** Toca los dos repositorios, casi todo en el portal.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto. Mira la verificación de **cada** repositorio.
3. `flujo-actual-etapa-psicometrica.md` — cómo funciona hoy la etapa. Importan las piezas y §1.
4. `integrate-psicoalianza.md` — la bitácora. Importan **41**, 1, 2, 3, 8, B8 y el registro del
   paso 8a: qué sirve hoy el backend y qué acepta.
5. En el portal: la página de Mi compañía —la sección de la prueba psicométrica, el modal de
   credenciales, y cómo arma el cuerpo de los guardados de la página—; el detalle de la oferta y
   el formulario de creación; el modelo de la empresa; y los textos de idioma. En el backend: el
   DTO de credenciales de la empresa, el servicio del agente de WhatsApp, su prompt de sistema y
   el flujo del borrador por WhatsApp.

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio en los dos
repositorios. Si algo de aquí no cuadra con el código, gana el código y hay que decirlo.

## Este paso es visible, a propósito

Es el único de la etapa que cambia lo que ve el reclutador, y son dos cosas:

- En Mi compañía, donde hoy dice **"Credenciales EvaluaTest — Cuenta EvaluaTest configurada —
  correo · Enterprise ID"**, verá **"Conexión de pruebas psicométricas — EvaluaTest Medicall
  (EvaluaTest) — correo"**, y el modal pedirá un **nombre** además del correo y la contraseña.
  La contraseña **ya no aparece rellenada**.
- **"IGI" desaparece de todo lo que lee el reclutador** y de lo que el agente de WhatsApp le
  dice: "Puntaje mínimo" (decisión 8).

Todo lo demás se ve igual.

## Alcance exacto — backend

1. **El DTO de credenciales acepta `name`**, opcional. La escritura en la lista del 8a lo usa
   para poner o cambiar el nombre de la conexión. **Vacío o solo espacios cuenta como ausente**:
   conserva el que hay, y si no hay, "EvaluaTest" — el nombre es obligatorio en el esquema y un
   blanco haría fallar el guardado. Nada más del backend de conexiones cambia.
2. **"IGI" sale de siete textos**, sin tocar el campo `minIGIScore` ni el nombre del parámetro
   de la herramienta del agente, que es contrato con el modelo:
   - **Tres que lee el reclutador**, en el servicio del agente: el informe de estado de la
     oferta («mínimo IGI 80»), el detalle de la oferta («puntaje IGI mínimo 80») y la
     confirmación de un cambio («puntaje IGI mínimo → 80»).
   - **Uno en el flujo del borrador por WhatsApp**: la plantilla del estado de la prueba
     («Activada — IGI ≥ 80%»).
   - **Tres instrucciones al modelo**: las dos descripciones de herramientas que lo nombran y la
     línea del prompt de sistema. Si siguen diciendo IGI, el agente lo repite en la conversación.

## Alcance exacto — portal

3. **El modelo de la empresa** gana `psychometricConnections` (`id`, `name`, `provider`,
   `configured`). En el bloque `evaluatestCredentials` **se quita `password`** del tipo: el
   backend ya no lo manda, y con eso la comprobación de tipos marca cualquier lectura que quede.
4. **La señal "hay proveedor" pasa a ser "la conexión de EvaluaTest está configurada"**, no
   "alguna": los controles que muestra llaman a EvaluaTest, y en la etapa 3 "alguna" le
   enseñaría controles de EvaluaTest a una empresa conectada solo a PsicoAlianza. Una función
   pequeña del portal, usada en **los cuatro sitios**: en el detalle de la oferta, el
   interruptor, la sección entera y **la carga de las pruebas de la vacante al abrir la oferta**
   —si se escapa esta, vuelve el error que arregló el paso de la cuenta compartida—; y el
   formulario de creación.

   ⚠️ **La señal se endurece**: hoy basta con que el backend mande el bloque, que manda con
   tener contraseña; "configurada" exige correo, contraseña e identificador. Una empresa con los
   dos primeros y sin identificador pasaría a ver el aviso de "sin proveedor". Medido en B8:
   **cero empresas**.
5. **Mi compañía, la sección de la prueba:** título neutro. Con conexión configurada muestra
   **nombre** (de la lista), **proveedor** (texto visible por clave de idioma a partir de su
   identificador) y **correo** (del bloque derivado, que es donde viene); sin ella, "sin proveedor
   conectado". Deja de decidir por el correo guardado en memoria.
6. **El modal** se titula "Conexión de pruebas psicométricas" y tiene tres campos: **nombre**
   (obligatorio; al editar viene con el de la conexión; al conectar por primera vez, con
   "EvaluaTest"), correo y contraseña. **La contraseña viene vacía y es obligatoria para
   guardar**: el guardado valida contra EvaluaTest como hoy —y sin contraseña no puede— y
   manda correo, contraseña, identificador de empresa y nombre. Renombrar exige volver a teclear
   la contraseña; se acepta a sabiendas (decisión 41, corregida). El proveedor no se elige: es
   EvaluaTest, y el selector es de la etapa 3 (decisión 3).
7. **Los textos escritos a mano del modal pasan a claves de idioma**: título, etiquetas,
   «Verificando…», los tres mensajes de error y el de éxito, sin nombrar "credenciales" ni
   EvaluaTest donde no haga falta. El modal hermano de antecedentes no se toca.
8. **Ningún guardado de la página manda ya `evaluatestCredentials`** salvo el modal. Hoy lo
   mandan cuatro guardados con lo que tengan en memoria. Con eso desaparecen de la página el
   estado de la contraseña y el del identificador de empresa (el modal lo toma de la validación).
9. **"IGI" sale de los textos del portal**, en los dos sitios con formas distintas:
   - **Formulario de creación**, escritos a mano: la descripción de la sección («Solo avanzan
     quienes superan el puntaje IGI mínimo…»), la etiqueta y la ayuda del campo.
   - **Detalle**, por claves de idioma en español e inglés: la descripción, la etiqueta y la
     ayuda. Las claves con "igi" en el nombre se pueden renombrar o dejar.
10. **Textos de idioma** nuevos para la sección, el modal y el nombre visible del proveedor, en
    los dos idiomas; los viejos que queden sin uso se retiran.

## 🔴 Dónde se para — qué NO se hace

- **No se añade selector de proveedor** ni segunda conexión: decisión 3, etapa 3.
- **No se añade "desconectar".** Hoy no existe salvo de rebote —el guardado general mandando todo
  vacío—, y ese rebote desaparece con el punto 8. El backend conserva la regla de quitar la
  conexión con todo vacío, pero el portal no la usa.
- **No se toca el bloque `evaluatestConfig`** ni ningún campo guardado; solo textos.
- **No se tocan las rutas** ni sus nombres, ni el nombre del parámetro de la herramienta del
  agente.
- **No se cambia lo que el backend sirve** más allá de aceptar `name`.
- **No se tocan los modales de portales de empleo ni de antecedentes**, que siguen recibiendo
  la contraseña: es la deuda conocida.
- **No se toca el aviso de "sin proveedor"** del paso anterior más allá de su señal.

## 🔴 Las trampas

**1. La contraseña ya no llega, y hay código que la espera.** El portal la guarda en memoria y
la reenvía en cuatro guardados. Si alguno sobrevive, el backend conserva la guardada (regla del
8a) y no rompe, pero el punto 8 los quita todos y **el punto 3 lo garantiza por tipos**, no por
búsqueda.

**2. El identificador de empresa lo pone la validación, no el usuario.** Primero validar,
después guardar, como hoy.

**3. "IGI" vive en tres formas**: escrito a mano en el componente, en claves de idioma, y en
plantillas del backend con el valor dentro. Una búsqueda por clave no encuentra las primeras, y
una por la palabra suelta no encuentra las que van pegadas al campo en la misma línea.

**4. Sin pruebas en el portal ni en el agente.** Los textos del agente y todo el portal se
verifican leyendo y con la comprobación de tipos.

## Lo que hay que preservar entero

| Qué | Por qué existe |
| --- | --- |
| **Validar contra EvaluaTest antes de guardar**, y guardar solo lo del modal | Lo arregló Elvis el 2026-09-09: antes se guardaba de rebote y se perdía al recargar |
| **El aviso de "sin proveedor"** de los dos escenarios y su enlace según permiso | Del paso anterior; solo cambia de dónde sale la señal |
| **La alerta de estado de la vacante** y su condición | No se toca |
| **El detalle no pide las pruebas de la vacante sin conexión** | Del paso anterior; es uno de los cuatro sitios de la señal |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador en ninguno de los dos repositorios.**
- **Comentarios: ninguno nuevo en archivos de código.**
- **Los identificadores van en inglés.** Los textos que ve el reclutador, en español e inglés
  en sus archivos.
- **La solución más pequeña que resuelve el caso.** Nada de reorganizar la página de Mi
  compañía de paso: es un archivo grande que otros tocan.
- **No commitear.** Los archivos nuevos se añaden al índice.
- 🔴 **`flujo-actual-etapa-psicometrica.md` se actualiza en este mismo diff**: §1 (lo que ve
  el reclutador al conectar, el nombre, la señal y "puntaje mínimo") y §8.

## Pruebas

**Backend:** el DTO con `name` pone y cambia el nombre de la conexión; sin `name`, y con `name`
en blanco, lo conserva.

**Portal y agente:** sin pruebas. En el reporte va una tabla por lectura con **cuatro casos** de
Mi compañía —sin conexión, con conexión, conectar por primera vez, editar la existente— con lo
que se ve y lo que se manda en cada uno; la confirmación del punto 8; y la lista de los siete
textos del backend y los textos del portal cambiados.

## Verificación

Una vez sobre el conjunto del cambio:

- Backend: `npm run build` y `npm test`.
- Frontend: `npm run typecheck`.

## Qué entregar

1. **Qué cambió** y **qué se verificó** en cada repositorio, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos.
5. **La tabla de los cuatro casos** y la confirmación del punto 8.
6. **Confirmación de que "IGI" no aparece en ningún texto** que vea el reclutador ni en las
   instrucciones del agente, con cómo se buscó en las tres formas de la trampa 3.
7. **Un mensaje de commit por repositorio.**

## Para el despliegue

El orden está en `before-deploy.md`: migración, backend, y portal inmediatamente después.
