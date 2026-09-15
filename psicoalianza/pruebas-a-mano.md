# Pruebas a mano pendientes de la integración de PsicoAlianza

Los casos que **una persona tiene que probar en el portal**, porque el portal no tiene pruebas
automáticas y quien ejecuta los pasos no puede manejar un navegador. Se corren **todos juntos cuando la
rama esté lista**, antes de desplegar: la lista de antes del despliegue lo tiene como paso.

**Regla:** todo paso que toque el portal y deje casos sin correr los añade aquí, con su orden y lo que
hay que ver. Si un caso falla, no se despliega: se anota qué se vio y se abre un arreglo.

## Cómo se prepara

El entorno local de `../entorno-local.md`: base, backend y portal levantados, y la sesión de PsicoAlianza
pegada en el `.env` del backend con el interruptor de la sesión manual. **Una sola empresa local sin
ninguna conexión** basta para todo el paso 6.1: cada caso deja preparado el siguiente.

## Paso 6.1 — Mi compañía por proveedor

Brief: `brief-etapa3-paso6-1-mi-compania.md`. El número de caso es el del brief.

| Orden | Caso | Qué se hace | Qué se tiene que ver | Resultado |
| --- | --- | --- | --- | --- |
| 1 | 1 | Abrir *Mi compañía*, pestaña del flujo | Dos filas: «EvaluaTest — sin conectar» y «PsicoAlianza — sin conectar», sin etiqueta | ☐ |
| 2 | 2 | *Conectar* en EvaluaTest con correo y contraseña inventados. **Un solo intento** (hace un login real contra EvaluaTest; autorizado por el usuario el 2026-09-14) | «Correo o contraseña incorrectos», y la fila sigue *sin conectar* | ☐ |
| 3 | 11 | Añadir `mode=dev` a la dirección; en la pestaña de desarrollo, plazo 1,5 y guardar | Se guarda, igual que hoy | ☐ |
| 4 | 14 | *Conectar* en PsicoAlianza con la contraseña y **el correo vacío** | El formulario exige el correo; no sale «correo o contraseña incorrectos» | ☐ |
| 5 | 3 | Lo mismo, con correo | La fila dice «PsicoAlianza (PsicoAlianza) — correo»; **la de EvaluaTest sigue *sin conectar*** | ☐ |
| 6 | 12 | Recargar la página; pulsar cualquier interruptor de etapa del flujo | El mensaje de días enteros del backend, no «error al actualizar» | ☐ |
| 7 | 15 | Guardar las credenciales de un portal de empleo (Computrabajo) | El mismo mensaje. **Anotar si se ve con el modal abierto o solo al cerrarlo** | ☐ |
| 8 | 9 | Pestaña de desarrollo (`mode=dev`): plazo 1,5 y guardar | No se manda; aviso de días enteros | ☐ |
| 9 | 10 | Plazo 2 y guardar | Se guarda | ☐ |
| 10 | 4 | Sesión válida pegada e interruptor de la sesión manual encendido; recargar | Carga, y luego la etiqueta verde *Conectado* | ☐ |
| 11 | 6 | Pegar una cookie inventada, **reiniciar el backend** y recargar | El aviso amarillo de *Sin conexión* con el texto aprobado | ☐ |
| 12 | 5 | Apagar el interruptor, **reiniciar el backend** y recargar | El mismo aviso | ☐ |
| 13 | 7 | Volver a la sesión válida y reiniciar; en las herramientas del navegador, **bloquear solo la petición del estado de sesión**, y recargar | «No se pudo comprobar la sesión», nunca *Sin conexión* | ☐ |
| 14 | 8 | Quitar el bloqueo; *Editar conexión* de PsicoAlianza, cambiar solo el nombre y reteclear la contraseña | Cambia el nombre y la etiqueta se vuelve a pedir | ☐ |
| 15 | 13 | ~~Abrir una oferta de esa empresa~~ | **Sustituido** por la sección del paso 6.2b, que ya está hecho | — |

**No se hace**: el caso extra con una cuenta real de EvaluaTest, porque no la hay.

## Paso 6.2b — la oferta elige su conexión

Brief: `brief-etapa3-paso6-2b-la-oferta-por-proveedor.md`. El número de caso es el del brief. **Ningún caso
invita a nadie**, pero los que listan o comprueban vacantes consultan las cuentas reales en solo lectura.

🔴 **No hay cuenta real de EvaluaTest.** Los casos que necesitan listar o comprobar vacantes de EvaluaTest se
anotan como *no se pueden correr sin cuenta*. Para tener «las dos conexiones» basta insertar a mano en la base
una conexión de EvaluaTest con datos inventados (`../entorno-local.md`): cuenta como configurada, pero su lista
de vacantes y su estado fallarán.

**Preparación**, sobre la empresa del 6.1, que ya tiene PsicoAlianza conectada: al menos una vacante activa en
PsicoAlianza, y para el caso 8 las de los estados que se puedan preparar.

| Orden | Caso | Cómo está la empresa | Qué se hace | Qué se tiene que ver | Resultado |
| --- | --- | --- | --- | --- | --- |
| 1 | 2 | Solo PsicoAlianza | Crear una oferta con la prueba activada | Sin selector; vacantes de PsicoAlianza, cada una solo con su nombre; **sin pruebas adicionales**; se crea | ☐ |
| 2 | 2 | Igual | Abrir la oferta del orden 1 | Los controles de la prueba, **no** *tu empresa no tiene proveedor* | ☐ |
| 3 | 8 | Igual | En el modal, elegir cada vacante que se haya preparado (completada, suspendida, sin pruebas) y escribir un número inventado | Cada una con su texto del alcance 4 del brief; el número inventado, «No encontramos esta vacante…» | ☐ |
| 4 | 12 | Igual | Abrir una oferta de antes de la migración, sin conexión congelada, con prueba y vacante (preparada a mano en la base) | PsicoAlianza, **sin vacante** y con su puntaje | ☐ |
| 5 | 13 | Igual | En la oferta del orden 1: *Desactivar* la prueba, recargar y volver a *Configurar* | Aparecen la conexión y la vacante de antes; se vuelve a activar y guarda | ☐ |
| 6 | 6 | Igual | Copiar desde el listado la oferta del orden 1 | La copia viene con PsicoAlianza y su vacante | ☐ |
| 7 | 3 | **Las dos** (insertar la de EvaluaTest a mano) | Crear desde cero con la prueba activada e intentar pasar de paso sin elegir proveedor | *Selecciona el proveedor de la prueba psicométrica para continuar, o desactiva este paso.*; no se ven vacante, puntaje ni pruebas | ☐ |
| 8 | 3 | Igual | Elegir EvaluaTest y una vacante con pruebas adicionales; cambiar a PsicoAlianza; elegir vacante y guardar | Al cambiar se borran vacante y pruebas y se listan las de PsicoAlianza. ⚠️ **Elegir vacante en EvaluaTest no se puede correr sin cuenta**: hacer solo el cambio de proveedor y el guardado con PsicoAlianza | ☐ |
| 9 | 4 | Igual | Abrir la oferta del orden 8, cambiar el puntaje y guardar. Pedir al planificador la consulta de la base | PsicoAlianza elegida. **En la base**: la conexión congelada es la de PsicoAlianza, el código de perfil es texto vacío y las pruebas adicionales una lista vacía. **La ficha recibe la conexión** de la oferta (se ve elegida al abrir) | ☐ |
| 10 | 9 | Igual | En el modal, elegir una vacante de PsicoAlianza; cambiar a EvaluaTest y escribir el mismo número | El aviso se vuelve a consultar al cambiar (se ve «Verificando…» otra vez). ⚠️ El resultado en EvaluaTest **no se puede comprobar sin cuenta** | ☐ |
| 11 | 5 | Igual | Pasar una oferta activa de EvaluaTest a PsicoAlianza desde la ficha | ⚠️ **No se puede correr sin cuenta**: necesita una oferta activa en EvaluaTest | ☐ |
| 12 | 7 | Igual | Crear con la IA | EvaluaTest elegida con la vacante sugerida. ⚠️ **No se puede correr sin cuenta**: la IA solo sugiere vacantes de EvaluaTest | ☐ |
| 13 | 11 | **Solo PsicoAlianza**, con una oferta activa congelada en una conexión que ya no existe (cambiar su conexión a mano en la base) | Abrir la oferta y *Configurar* | El aviso nuevo **junto a los controles**; el modal abre con PsicoAlianza, **sin vacante**; elegir una vacante y guardar, y el aviso desaparece. Repetir la preparación y *Desactivar* en vez de guardar | ☐ |
| 14 | 11 | Igual, con **las dos** conexiones | Lo mismo | El modal abre **sin proveedor elegido** y sin vacante | ☐ |
| 15 | 10 | **Sin ninguna** conexión configurada, con la misma oferta | Abrir la oferta | El aviso de hoy, *tu empresa ya no tiene un proveedor conectado*, **en lugar de** los controles | ☐ |
| 16 | 1 | Solo EvaluaTest | Crear una oferta con prueba; abrirla y cambiar el puntaje | ⚠️ **No se puede correr sin cuenta** | ☐ |
| 17 | Revisión del diff | Solo PsicoAlianza, con la oferta del orden 1 | En las herramientas del navegador, **bloquear solo la petición de la empresa** (`/tenants/my-tenant`) del listado de ofertas; recargar y copiar la oferta con prueba | Sale el error del listado y **no se abre el diálogo**; nunca un diálogo con la prueba sin vacante | ☐ |
| 18 | Revisión del diff | Igual | Con la petición de la empresa todavía bloqueada, recargar el listado, *Crear con IA*, escribir una descripción y generar | El error sale **dentro del diálogo de la IA**, que sigue abierto **con la descripción escrita**; no se abre el diálogo de crear. Sin cuenta real de EvaluaTest la IA no sugiere prueba, pero el fallo se ve igual | ☐ |
