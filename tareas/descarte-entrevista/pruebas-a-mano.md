# Pruebas a mano · la causal del rechazo final

Los casos que **una persona prueba en el portal**, porque el portal no tiene pruebas automáticas y quien
ejecuta los pasos no maneja un navegador. Se corren **todos juntos cuando la rama esté lista**, antes de
desplegar. Si un caso falla, no se despliega: se anota qué se vio y se abre un arreglo.

## Cómo se prepara

**Se corren en el servidor de pruebas** (decidido por el usuario el 2026-09-27), que despliega `develop`:
cuando los pasos 2 y 3 estén terminados, el frente entero se fusiona en `develop` en los dos
repositorios, se despliega, se prueba ahí y solo después pasa a `main`. El entorno local no sirve hoy:
base vacía, sin Firebase y con el portal nunca levantado (visto por el ejecutor el 2026-09-27).

🔴 **En el servidor de pruebas WhatsApp está encendido.** Rechazar a Luis le envía la despedida de verdad
al número que tenga guardado. **Todos los candidatos de estas pruebas tienen que tener números del
equipo**; si no los hay, se crean antes. Donde los casos hablan del «log del backend», es el del
servidor de pruebas, y los envíos a números del equipo salen bien: en el caso 12 se busca la despedida
recibida en el teléfono, no un aviso de envío fallido.

Hace falta un usuario con permiso de gestión de la oferta elegida.

⚠️ **El backend mueve los datos solo.** Las tareas programadas ven conversaciones
con fechas viejas y descartan por tiempo de espera. **Elegir a los candidatos justo antes de probar**, y
comprobar que siguen en el estado que pide cada caso.

**Candidatos que hacen falta**, en una misma oferta: **Ana**, descartada por el agente; **Luis**, en
proceso y ya contactado; **uno en la cola que nunca se contactó y que no sea el primero de la cola**
(rechazar a Luis libera su cupo y el backend contacta al primero de la cola); **Pedro**, que terminó el proceso; **Sara**, que terminó el proceso (para «Otro»); y **un
rechazo anterior al cambio**, solo con texto.

## Paso 2 — la causal en el portal

Brief: `brief-paso2-portal.md`. **El orden importa**: el 10 va antes que el 8, y contratar a Ana va al
final.

| Orden | Qué se hace | Qué se tiene que ver | Resultado |
| --- | --- | --- | --- |
| 1 | Abrir la ficha de Ana | Solo «Marcar como contratado»; **no** aparece «Marcar como rechazado» | ☐ |
| 2 | Abrir la ficha de Pedro y pulsar «Marcar como rechazado» | La ventana con el selector de causal, las diez etiquetas en orden, y el detalle marcado como opcional. Confirmar, apagado | ☐ |
| 3 | Elegir «Otro» sin escribir detalle; luego escribir solo espacios | Confirmar sigue apagado y se indica que el detalle es obligatorio con «Otro» | ☐ |
| 4 | Cancelar y volver a abrir la ventana | Sin causal ni detalle: la ventana empieza de cero | ☐ |
| 5 | Elegir «Expectativa salarial fuera de rango», sin detalle, y confirmar | Se guarda. La ficha de Pedro muestra «Razón de rechazo», la causal, y ningún detalle. Ya no hay botones | ☐ |
| 6 | Ficha de Sara: rechazar con «Otro» y un detalle | Se guarda; la ficha muestra «Otro» y el detalle debajo | ☐ |
| 7 | Abrir la ficha de Pedro en dos pestañas; en la segunda, abrir la ventana de rechazo, rechazar en la primera y confirmar en la segunda | La segunda muestra, dentro de la ventana, «ya tiene una decisión de contratación registrada», como hoy | ☐ |
| 8 | Pestaña de auditoría de la oferta, en modo de desarrollo | En la entrada del rechazo de Pedro, la fila `reason` dice «salary_expectation_mismatch — Expectativa salarial fuera de rango»; el resto de la entrada, como siempre | ☐ |
| 9 | Página Candidatos, buscar a Pedro | En el aviso de su proceso, la causal y, si lo hay, el detalle; sin título nuevo | ☐ |
| 10 | Rechazar al candidato de la cola, nunca contactado, con cualquier causal | Se guarda. En el log del backend: «stopAfterRecruiterRejection: … sacado del proceso tras el rechazo del reclutador (nunca contactado)», **sin** aviso de envío | ☐ |
| 11 | Ficha de Luis: rechazar con «No cumple el perfil técnico» y un detalle | Se guarda la causal con el detalle debajo. Tras unos segundos y recargar, en la tabla de candidatos de la oferta su **Estado** dice «Descartado» y su **Motivo de descarte**, «Rechazado por el reclutador», no un código | ☐ |
| 12 | Tras el caso 11 | Luis recibe en su teléfono (del equipo) la despedida, y el log dice «stopAfterRecruiterRejection: … (ya contactado)» | ☐ |
| 13 | Página Candidatos, buscar a Luis | «No aprobó: Rechazado por el reclutador» y, debajo, su causal con el detalle | ☐ |
| 14 | Abrir la ficha del rechazo anterior al cambio | Se ve como antes: «Razón de rechazo» y el texto, sin etiqueta de causal ni «sin causal» | ☐ |
| 15 | Cambiar el idioma del portal a inglés | El selector, la ficha de Pedro y el motivo de Luis, en inglés | ☐ |
| 16 | **Al final**: contratar a Ana, la descartada por el agente | Funciona exactamente como antes. Es la prueba en pantalla de que la contratación no se tocó | ☐ |

La pestaña abierta desde antes del despliegue (decisión 15) no se prepara aquí y no se prueba: la cubre el mensaje de error del backend, probado en el paso 1b. El estado `DISCARDED` es
raro en una copia y lo cubre la prueba del backend del paso 1d.
