# Brief · Cierre — fusión en `develop`, pruebas en el servidor y paso a `main`

Para el usuario y para quien ejecuta. **Se empieza cuando el paso 3 esté aprobado y commiteado en los dos
repositorios.** Es el único momento en que el frente entra en `develop` (bitácora, *Antes de
desplegar*).

## Quién hace qué

| Etapa | Quién |
| --- | --- |
| 1 · Traer `develop` a la rama, en los dos repositorios | El ejecutor; revisa el planificador |
| 2 · Fusionar la rama en `develop` | El usuario, con un PR por repositorio |
| 3 · Desplegar en el servidor de pruebas | El usuario |
| 4 · Correr `pruebas-a-mano.md` | Una persona del equipo, con el portal |
| 5 · Pasar `develop` a `main` y desplegar producción | El usuario |

## 1 · Traer `develop` a la rama

`develop` sigue avanzando mientras trabajamos: el 2026-09-28 ya traía ocho commits en el backend (facturación,
lectura de documentos, recordatorios) y dos en el portal (textos y la ficha de la oferta), ninguno en la
zona del frente. Antes del PR, se fusiona `develop` en `feat/hiring-rejection-reason` **en los dos
repositorios**, como en el paso 1c.

- **Conflictos**: se queda lo nuestro en lo que es del frente y lo de ellos en todo lo demás. Si un
  conflicto toca la regla del rechazo, la detención del agente o la analítica, **para y avisa**.
- 🔴 **Nada de `checkout`, `restore` ni `reset`** para salir de un conflicto.
- **Comprobar que el texto de la despedida del rechazo sigue siendo idéntico al de la cancelación de
  oferta** (bitácora, registro del paso 1d): si alguien cambió el de la cancelación, se cambia el nuestro
  igual.
- **Verificación**, con la caché limpia: backend `npm run build` y `npm test`, y arranque en local;
  portal `npm run typecheck`. El número de pruebas se explica: las de `develop` más las del frente.
- No se commitea la fusión sin la revisión del planificador.

## 2 · Fusionar en `develop`

Un PR por repositorio, **los dos fusionados la misma vez**, antes del despliegue nocturno. Si solo entra
uno, el servidor de pruebas queda con backend y portal desparejados y los rechazos fallan (bitácora,
*Antes de desplegar*).

## 3 · Desplegar en el servidor de pruebas

Backend y portal juntos. No hay migración (decisión 8).

## 4 · Las pruebas a mano

`pruebas-a-mano.md`, las secciones de los pasos 2 y 3, **en su orden**. Antes de empezar:

- 🔴 **Candidatos con números del equipo.** En el servidor de pruebas WhatsApp está encendido: rechazar a
  alguien en proceso le envía la despedida de verdad.
- Elegir a los candidatos justo antes de cada caso: el sistema mueve los datos solo.
- Marcar cada caso con su resultado. **Si uno falla, no se pasa a `main`**: se anota qué se vio y se abre
  un arreglo en la rama, con su propio brief.

## 5 · Pasar a `main`

Solo con todas las pruebas en verde. `develop` a `main` en los dos repositorios y despliegue de producción
**de backend y portal en la misma ventana** (decisión 15 y *Antes de desplegar*). Después, marcar el
frente como terminado en la bitácora.

## Lo que no bloquea

La pregunta al equipo sobre la plaza de quien terminó el proceso (bitácora, *Preguntas abiertas*). Si la
respuesta es «sí», la fase 4 es un frente aparte, con aviso a la dirección, y no retrasa este cierre.
