# Pruebas a mano · la causal del rechazo final

Los casos que **una persona prueba en el portal**, porque el portal no tiene pruebas automáticas y quien
ejecuta los pasos no maneja un navegador. Se corren **todos juntos cuando la rama esté lista**, antes de
desplegar. Si un caso falla, no se despliega: se anota qué se vio y se abre un arreglo.

## Cómo se prepara

- El entorno local de `../../entorno-local.md`, con backend y portal **de la rama**.
- **Datos**: la copia de la base de pruebas que describe esa guía, en local. WhatsApp y los correos
  están apagados en local, así que ningún candidato real recibe nada: la despedida falla al enviarse y
  el candidato se saca igual (decisión 23).
- Una oferta con, al menos: **un candidato descartado por el agente** (Ana), **uno en proceso** que ya
  haya recibido mensajes (Luis), **uno en proceso que nunca se contactó** (en la cola), **uno que
  terminó el proceso** (Pedro) y **un rechazo anterior al cambio**, solo con texto.
- Un usuario con permiso de gestión de esa oferta.

## Paso 2 — la causal en el portal

Brief: `brief-paso2-portal.md`.

| Orden | Qué se hace | Qué se tiene que ver | Resultado |
| --- | --- | --- | --- |
| 1 | Abrir la ficha de Ana | Solo «Marcar como contratado»; **no** aparece «Marcar como rechazado» | ☐ |
| 2 | Abrir la ficha de Pedro y pulsar «Marcar como rechazado» | La ventana con el selector de causal, las diez etiquetas en orden, y el detalle marcado como opcional. Confirmar, apagado | ☐ |
| 3 | Elegir «Otro» sin escribir detalle; luego escribir solo espacios | Confirmar sigue apagado y se indica que el detalle es obligatorio con «Otro» | ☐ |
| 4 | Cancelar y volver a abrir la ventana | Sin causal ni detalle: la ventana empieza de cero | ☐ |
| 5 | Elegir «Expectativa salarial fuera de rango», sin detalle, y confirmar | Se guarda. La ficha de Pedro muestra «Razón de rechazo», la causal, y ningún detalle. Ya no hay botones | ☐ |
| 6 | Pestaña de auditoría de la oferta | La entrada del rechazo de Pedro muestra la causal con su etiqueta, no `salary_expectation_mismatch` (si el usuario no vetó el punto 7 del brief) | ☐ |
| 7 | Página Candidatos, buscar a Pedro | Su proceso rechazado muestra la causal | ☐ |
| 8 | Ficha de Luis: rechazar con «No cumple el perfil técnico» y un detalle | Se guarda la causal con el detalle debajo. Tras unos segundos y recargar, su estado dice «Rechazado por el reclutador», no un código | ☐ |
| 9 | En el log del backend, tras el caso 8 | El intento de despedida (que falla en local por WhatsApp apagado) y el descarte de Luis con `recruiter_rejected` | ☐ |
| 10 | Rechazar al candidato de la cola con cualquier causal | Se guarda y sale del proceso **sin intento de despedida** en el log | ☐ |
| 11 | Abrir la ficha del rechazo anterior al cambio | Se ve como antes: «Razón de rechazo» y el texto, sin etiqueta de causal ni «sin causal» | ☐ |
| 12 | Contratar a cualquier candidato pendiente | Funciona exactamente como antes | ☐ |

La pestaña abierta desde antes del despliegue (decisión 15) no se puede preparar bien en local y no se
prueba aquí: la cubre el mensaje de error del backend, probado en el paso 1b.
