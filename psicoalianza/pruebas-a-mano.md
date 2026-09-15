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
| 15 | 13 | Abrir una oferta de esa empresa | Sigue diciendo *no tienes proveedor*: lo esperado **si el 6.2 todavía no está hecho**. Con el 6.2 hecho, este caso lo sustituyen los del 6.2 | ☐ |

**No se hace**: el caso extra con una cuenta real de EvaluaTest, porque no la hay.
