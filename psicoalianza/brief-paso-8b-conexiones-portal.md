# Brief · Paso 8b de la etapa 1 — la conexión con nombre en el portal, y "Puntaje mínimo"

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en
los otros `.md`.** Toca los dos repositorios, casi todo en el portal.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto. Mira la verificación de **cada** repositorio.
3. `flujo-actual-etapa-psicometrica.md` — cómo funciona hoy la etapa. Importan las piezas y §1.
4. `integrate-psicoalianza.md` — la bitácora. Importan **41**, 1, 2, 3, 8 y el registro del
   paso 8a: qué sirve hoy el backend y qué acepta.
5. En el portal: la página de Mi compañía —la sección de la prueba psicométrica, el modal de
   credenciales, y cómo arma el cuerpo del guardado general—; el detalle de la oferta y el
   formulario de creación donde aparece "IGI"; el modelo de la empresa; y los textos de idioma.
   En el backend: el DTO de credenciales de la empresa y los dos textos del agente de WhatsApp
   que dicen "IGI".

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio en los dos
repositorios. Si algo de aquí no cuadra con el código, gana el código y hay que decirlo.

## Este paso es visible, a propósito

Es el único de la etapa que cambia lo que ve el reclutador, y son dos cosas:

- En Mi compañía, donde hoy dice **"Credenciales EvaluaTest — Cuenta EvaluaTest configurada —
  correo · Enterprise ID"**, verá **"Conexión de pruebas psicométricas — EvaluaTest Medicall
  (EvaluaTest) — correo"**, y el modal pedirá un **nombre** además del correo y la contraseña.
  La contraseña **ya no aparece rellenada**.
- En la oferta, donde hoy dice **"Puntaje IGI mínimo (%)"** dirá **"Puntaje mínimo (%)"**, con
  su ayuda reescrita, y el agente de WhatsApp dirá **"puntaje mínimo 80"** en vez de "IGI ≥ 80"
  (decisión 8).

Todo lo demás se ve igual.

## Alcance exacto — backend (pequeño)

1. **El DTO de credenciales acepta `name`**, opcional. La escritura en la lista del 8a lo usa
   para poner o cambiar el nombre de la conexión; si no viene, conserva el que hay, y si no
   hay, "EvaluaTest". Nada más del backend de conexiones cambia: sigue aceptando el mismo bloque
   y sirviendo lo mismo.
2. **Los dos textos del agente de WhatsApp** que muestran la prueba al reclutador —el resumen
   de la oferta y el del borrador— dicen "puntaje mínimo N" en vez de "IGI ≥ N". Solo texto; el
   campo sigue llamándose igual.

## Alcance exacto — portal

3. **El modelo de la empresa** gana `psychometricConnections`: lista de `id`, `name`,
   `provider`, `configured`, tal como la sirve el backend desde el 8a. El bloque
   `evaluatestCredentials` del modelo se queda (el backend lo sigue sirviendo, sin contraseña).
4. **La señal "hay proveedor"** pasa a la lista: la empresa tiene proveedor si alguna conexión
   está `configured`. Son los dos sitios del paso de la cuenta compartida —el detalle de la
   oferta y el formulario de creación— y la sección de Mi compañía.
5. **Mi compañía, la sección de la prueba:** título neutro, y si hay conexión muestra su nombre,
   el proveedor entre paréntesis y el correo; si no, "sin proveedor conectado". El botón abre el
   modal.
6. **El modal** se titula "Conexión de pruebas psicométricas" y tiene tres campos: **nombre**
   (obligatorio; al abrir sobre una conexión existente viene con su nombre; al conectar por
   primera vez, con "EvaluaTest"), correo y contraseña. **La contraseña viene siempre vacía y es
   obligatoria para guardar**: el guardado valida contra EvaluaTest como hoy y manda correo,
   contraseña, identificador de empresa y nombre. El proveedor no se elige: es EvaluaTest, y el
   selector es de la etapa 3 (decisión 3).
7. **El guardado general de la página deja de mandar `evaluatestCredentials`.** Hoy lo manda
   siempre, con lo que tenga en memoria; la conexión solo se guarda desde el modal. Con eso el
   estado local de la contraseña desaparece de la página.
8. **"IGI" sale de los textos**: la etiqueta y la ayuda del campo en el formulario de creación
   (que hoy van escritos a mano) y en el detalle (que van por claves de idioma), en español e
   inglés. Las claves de idioma que llevan "igi" en el nombre se pueden renombrar o dejar; el
   campo `minIGIScore` **no** se toca.
9. **Textos de idioma** nuevos para la sección y el modal, en los dos idiomas; los viejos que
   queden sin uso se retiran.

## 🔴 Dónde se para — qué NO se hace

- **No se añade selector de proveedor** ni segunda conexión: decisión 3, etapa 3.
- **No se toca el bloque `evaluatestConfig`** ni ningún campo guardado; solo etiquetas.
- **No se tocan las rutas** ni sus nombres.
- **No se cambia lo que el backend sirve** más allá de aceptar `name`.
- **No se tocan los modales de portales de empleo ni de antecedentes**, que siguen recibiendo
  la contraseña: es la deuda conocida, y este paso solo cierra la de pruebas, ya cerrada en el
  backend por el 8a.
- **No se toca el aviso de "sin proveedor"** del paso anterior más allá de su señal.

## 🔴 Las trampas

**1. La contraseña ya no llega, y hay código que la espera.** El portal guarda hoy en memoria
la contraseña que recibe y la reenvía en cuatro guardados distintos de la página. Desde el 8a
no llega ninguna; si algún reenvío sobrevive con la contraseña vacía, el backend la conserva
(regla del 8a), así que no rompe — pero el punto 7 los quita todos, y el reporte confirma que
no queda ninguno.

**2. El identificador de empresa lo pone la validación, no el usuario.** Hoy el modal llama
primero a la validación, que devuelve el identificador de empresa, y solo entonces guarda. Se
conserva tal cual: con nombre nuevo o sin él, primero validar, después guardar.

**3. Los textos escritos a mano en el formulario de creación.** La etiqueta y la ayuda del
puntaje están escritas directamente en el componente, no en los archivos de idioma, así que la
búsqueda por claves no las encuentra. Son dos sitios: creación y detalle, con formas distintas.

**4. Sin pruebas en el portal.** Todo se verifica leyendo y con la comprobación de tipos. Los
cambios de lógica son dos (la señal y el guardado general); el resto es texto.

## Lo que hay que preservar entero

| Qué | Por qué existe |
| --- | --- |
| **Validar contra EvaluaTest antes de guardar**, y guardar solo lo del modal | Lo arregló Elvis el 2026-09-09: antes se guardaba de rebote y se perdía al recargar |
| **El aviso de "sin proveedor"** de los dos escenarios y su enlace según permiso | Del paso anterior; solo cambia de dónde sale la señal |
| **La alerta de estado de la vacante** y su condición | No se toca |

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
  el reclutador al conectar, el nombre, y "puntaje mínimo") y §8.
- 🔴 **`before-deploy.md`**: este paso cambia el orden. El portal nuevo lee la lista, que solo
  existe con el backend del 8a; y el backend del paso 7 escribe códigos que solo el portal nuevo
  traduce. **Los dos repositorios se despliegan a la vez.** Se anota ahí, reemplazando la fila
  del orden.

## Pruebas

**Backend:** el DTO con `name` pone y cambia el nombre de la conexión, y sin `name` lo conserva.
Los dos textos del agente se comprueban en las pruebas que ya los cubran, si las hay.

**Portal:** sin pruebas. En el reporte va una tabla por lectura con **cuatro casos** de Mi
compañía —sin conexión, con conexión, conectar por primera vez, editar la existente— y lo que
se ve y se manda en cada uno; y la confirmación de que ningún guardado de la página manda ya
`evaluatestCredentials` salvo el modal.

## Verificación

Una vez sobre el conjunto del cambio:

- Backend: `npm run build` y `npm test`.
- Frontend: `npm run typecheck`.

## Qué entregar

1. **Qué cambió** y **qué se verificó** en cada repositorio, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos.
5. **La tabla de los cuatro casos** y la confirmación del punto 7.
6. **Confirmación de que "IGI" no aparece en ningún texto** que vea el reclutador, con cómo se
   buscó en los dos repositorios.
7. **Un mensaje de commit por repositorio.**
