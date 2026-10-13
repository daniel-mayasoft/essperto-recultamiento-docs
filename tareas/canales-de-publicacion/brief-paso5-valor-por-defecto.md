# Brief · Paso 5 — sin elección, el mismo valor por defecto que el paso de canales

Para quien ejecuta este paso. Cuando la creación de una oferta llega **sin elección** de portales
—el agente de WhatsApp, Maya, el superadmin—, la lista de la oferta deja de incluir Computrabajo si
la empresa tiene Pandapé ligado a Computrabajo y Pandapé disponible. Así esas ofertas dejan de salir
dos veces en Computrabajo. Solo backend. Cambio pequeño, pero decide dónde se publica cada oferta:
**una ronda de opinión previa**.

Antes de empezar, lee en la bitácora **las decisiones 6, 8, 9 y 15** y **el punto G**. El código que
se toca lo dejaron los pasos 1 y 2 (`brief-paso1-piezas-y-punto-unico.md` y
`brief-paso2-eleccion-y-republicacion.md`).

## Rama

**Directamente en `develop`** (usuario), en un commit propio. `develop` del backend está en
`dc57280`, con los pasos 1 y 2 fusionados. Comprueba que el árbol esté limpio antes de cambiarte a
`develop` y actualízala. Línea base: **compila; 198 suites y 2.061 pruebas que pasan, 1 suite y 43
omitidas**; mídela antes de empezar.

## Qué le pasa a una persona

Medicall tiene Computrabajo, elempleo y Pandapé configurados y encendidos, y Pandapé ligado a
Computrabajo.

| | Hoy | Después |
| --- | --- | --- |
| Medicall crea una oferta por WhatsApp (sin elección) | Computrabajo, elempleo y Pandapé: sale **dos veces** en Computrabajo | elempleo y Pandapé; llega a Computrabajo una vez, por Pandapé |
| Medicall, con Pandapé **sin contraseña**, crea sin elección | Los tres en la lista (Pandapé no llega a publicar) | **Igual**: Computrabajo se queda, o la oferta no llegaría a ninguno de los dos |
| Medicall, con Pandapé **apagado**, crea sin elección | Computrabajo y elempleo | Igual |
| Pedro, sin el enlace, crea sin elección | Todos sus portales encendidos | Igual |
| Medicall crea **con** elección, Computrabajo y Pandapé marcados (aceptó la confirmación) | Los dos | Igual: una elección explícita se respeta |
| Una empresa en modo demo | Sin portales | Igual |

## Qué se hace

En la rama **sin elección** de la resolución de la lista (`resolveListedCredentials`, en el registro
de canales): después de tomar los portales que la empresa no tiene apagados, como hoy (punto G), se
quita Computrabajo si se cumplen **las dos**:

1. La empresa tiene Pandapé ligado a Computrabajo en su dato de republicación. Una entrada sin
   destinos, o el dato ausente, cuenta como sin enlace (como en la publicación de Pandapé).
2. **Pandapé está disponible** según la decisión 8 (usuario, contraseña y encendido), mirando la misma
   credencial que la publicación. No basta con que esté en la lista: la lista sin elección admite un
   portal sin contraseña (punto G), y ese Pandapé no publicaría.

🔴 **Trampa: la creación no lee hoy el dato de republicación.** Pide a la empresa solo seis campos
(credenciales, configuración de pruebas, facturación, valores por defecto y modo demo). Si no se
añade el dato a esa lectura, la condición 1 nunca se cumple y la regla no hace nada, **sin fallar**.
Una prueba tiene que demostrar que la creación de verdad, no solo el registro, quita Computrabajo.

La rama **con elección** no cambia. Tampoco la del modo demo.

## 🔴 Dónde se para

- **Ni Maya ni el agente**: siguen sin preguntar (pasos 6 y 7).
- **La publicación de Pandapé y su línea de republicar** no cambian.
- **Los reintentos** no cambian: actúan sobre el portal de la lista que falló.
- **Las ofertas ya creadas** no cambian.
- Sin comentarios en el código, sin formateador, sin lint. Identificadores en inglés, también en las
  pruebas y en los parámetros de los callbacks.

## Lo que tu opinión previa tiene que confirmar

1. **Que todas las entradas sin elección pasan por esta rama**: el agente, Maya y el superadmin. Di
   cómo lo comprobaste.
2. **Cómo le llega el dato de republicación a la resolución**, y que la lectura de la empresa en la
   creación lo incluye.
3. **Que la disponibilidad de Pandapé** se mira con la misma regla y la misma credencial que el paso 2.
4. **Qué pruebas existentes** podrían cambiar. Si alguna crea sin elección con Pandapé ligado y espera
   Computrabajo, dilo antes de tocarla.

## Pruebas y verificación

- **El registro, sin elección**: con enlace y Pandapé disponible → sin Computrabajo; con enlace y
  Pandapé sin contraseña, sin usuario o apagado → con Computrabajo; sin enlace, con entrada sin
  destinos o sin dato → con Computrabajo; empresa sin Computrabajo → nada que quitar.
- **El registro, con elección**: Computrabajo y Pandapé elegidos con enlace → los dos.
- **La creación**: sin elección, con enlace y Pandapé disponible → la oferta guardada no tiene
  Computrabajo y no se llama a su publicación.
- **Control negativo** en las nuevas: invierte la expectativa, comprueba que falla, bórralo.
- `npx jest --clearCache`, `npm run build` y `npm test`, **una vez**, frente a la línea base.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados.
2. Después: qué cambió y el resultado real de la verificación, frente a la línea base.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
