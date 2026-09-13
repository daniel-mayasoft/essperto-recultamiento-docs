# Brief · Etapa 3, paso 1 — el módulo de captcha

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en
los otros `.md`**, sobre todo en las decisiones 23 a 26 y en su precisión del 2026-09-13.
Toca solo el backend.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../CLAUDE.md` — el proyecto, y `../../esscoti-backend/CLAUDE.md` — las credenciales nunca en el
   código.
3. `integrate-psicoalianza.md` — la bitácora. Importan **23, 24, 25 (con su precisión del
   2026-09-13) y 26**, *Confirmado de PsicoAlianza* (la mecánica del captcha) y *Dónde va la etapa
   3*.
4. `../CAPTCHAS.md` — cómo lo resuelve otro proyecto de la casa. **Sirve para entender, no para
   copiar**: lista tres errores de esa implementación, y en dos puntos contradice al servicio (ver
   la trampa 3).
5. En el backend, **la capa psicométrica como patrón a seguir**: el puerto con su token, el archivo
   de tipos aparte, el adaptador, un archivo por error propio, y cómo el módulo de ofertas enlaza el
   token del puerto a la instancia del adaptador. Y el esquema de entorno.

Después, **antes de tocar código**: dar una opinión del plan, con el árbol limpio. Si algo de
aquí no cuadra con el código o con la documentación del servicio, gana lo verificable y hay que
decirlo.

## El caso

Dentro de unas semanas, el sistema tendrá que entrar a PsicoAlianza para invitar a **Laura** a su
prueba. El login de PsicoAlianza está protegido con reCAPTCHA v3: Google le pone una nota de
"parece humano" a quien intenta entrar, y un proceso automático no la saca. Así que quien hace el
login le pedirá a este módulo: *«un token de reCAPTCHA v3 para esta clave de sitio, esta página,
la acción `submit` y puntaje 0.3»*. El módulo se lo encarga al servicio de pago, espera, y devuelve
el token, o un error que dice exactamente qué falló.

**Hoy nadie lo llama.** Es un paso aditivo: no puede romper nada. Brief corto, una ronda.

## Cómo tiene que quedar

El módulo varía en **dos ejes independientes**, y la forma tiene que hacer barato moverse en
cualquiera de los dos sin tocar al otro:

| Eje | Qué es | Hoy | Mañana, sin tocar lo de hoy |
| --- | --- | --- | --- |
| **Proveedor** | Quién resuelve | SolveCaptcha | Un adaptador nuevo (2Captcha u otro) |
| **Tipo de captcha** | Qué se resuelve | reCAPTCHA v3 | Una variante más de la petición (v2, hCaptcha…) |

Quien pide el token **no sabe qué proveedor hay detrás**. Es el mismo patrón que la capa
psicométrica: seguirlo, no inventar otro (decisión 25).

## Alcance exacto

1. **Un módulo propio, `captcha`, al nivel de los demás módulos del backend** —no dentro de
   ofertas ni de la capa psicométrica: es infraestructura (decisión 25)—. Exporta el puerto por su
   token. **No lo importa ningún otro módulo todavía**, ni el de la aplicación: lo importa el paso
   2.
2. **El puerto** tiene una sola operación: resolver un captcha. Recibe una petición y devuelve una
   solución. No nombra a ningún servicio.
3. **La petición es un tipo discriminado por su tipo de captcha.** Hoy tiene una sola variante,
   reCAPTCHA v3, con cuatro datos: **clave del sitio, dirección de la página, acción y puntaje
   mínimo**. Añadir v2 mañana es añadir una variante: quien hoy pide v3 no cambia.
4. **La solución es un objeto con el token**, no el texto suelto. hCaptcha, por ejemplo, exige
   además un user agent (ver `CAPTCHAS.md`); con un objeto, eso se añade sin romper a nadie.
5. **Errores de tipo propio**, uno por archivo, como en la capa psicométrica. Son tres, porque son
   las tres cosas que quien llama trata distinto:
   - *sin configurar* — falta la clave del servicio. Es permanente: reintentar no lo arregla.
   - *petición no soportada* — este proveedor no sabe resolver ese tipo, o un dato está fuera de lo
     que el servicio acepta (el puntaje, abajo). También permanente, y se lanza **antes** de llamar.
   - *no se pudo resolver* — el servicio respondió error, la respuesta no se entiende, o se agotó el
     tiempo. Pasajero. Lleva el motivo y el texto del servicio en el mensaje.
6. **El adaptador de SolveCaptcha**, que implementa el puerto. El contrato está verificado en la
   documentación oficial del servicio el 2026-09-13:

   | Qué | Cómo |
   | --- | --- |
   | Encargar | `in.php` con `key`, `method=userrecaptcha`, `version=v3`, `googlekey` (clave del sitio), `pageurl`, `action`, `min_score` y `json=1`. Devuelve el identificador de la tarea |
   | Preguntar | `res.php` con `key`, `action=get`, `id` y `json=1` |
   | Todavía no | El servicio responde `CAPCHA_NOT_READY` (así, con esa ortografía) |
   | Listo | `status` 1 y el token en `request` |
   | Ritmo | Esperar de 15 a 20 segundos antes de la primera pregunta, y después cada 5 |
   | Puntaje | El servicio acepta de **0.3 a 0.9** |

   ⚠️ **Sin verificar, y hay que confirmarlo en la opinión previa con la fuente**: la forma exacta en
   JSON de *todavía no* y de un error, y la lista de códigos de error. **El diseño no puede
   depender de ellas**: *todavía no* se reconoce por ese texto venga donde venga, y cualquier otra
   respuesta que no sea `status` 1 es *no se pudo resolver*, con el texto del servicio dentro.

   **Tiempo total, alrededor de dos minutos**, como constante del adaptador, no como variable de
   entorno. Un puntaje fuera de 0.3 a 0.9 es *petición no soportada*, sin llamar: el adaptador no lo
   corrige en silencio.
7. **Dos variables de entorno**, declaradas en el esquema con su validación:
   - `SOLVECAPTCHA_BASE_URL`, con la dirección oficial por defecto —no es un secreto, y sigue la
     forma de `OPENAI_BASE_URL`—.
   - `SOLVECAPTCHA_API_KEY`, **opcional y sin valor por defecto**. 🔴 **No obligatoria**: si lo
     fuera, el día que se mezcle la rama no arrancarían ni el servidor de pruebas ni el backend
     local de nadie que no la tenga. Sin clave, falla **al pedir un token**, con *sin configurar*,
     no al arrancar. Es además el primer error de `CAPTCHAS.md`: comprobar **la variable de
     entorno**, no otra cosa.
8. **Un solo proveedor, sin selector**: el módulo enlaza el token del puerto a la instancia del
   adaptador de SolveCaptcha, igual que el módulo de ofertas con EvaluaTest. **Nada de una variable
   para elegir proveedor**: con uno solo no hay nada que elegir.

## 🔴 Dónde se para — qué NO se hace

- **Nada de PsicoAlianza**: ni login, ni leer la clave del sitio de su página, ni reintentar cuando
  el sitio rechaza el token por puntaje bajo. Es el paso 2, porque solo quien hace el login ve ese
  rechazo.
- **Ningún otro tipo de captcha**: ni v2, ni hCaptcha, ni imagen, ni la variante Enterprise.
- **Ningún otro proveedor**, ni variable para elegirlo.
- **No se importa el módulo** en ningún otro.
- **No se reporta** al servicio si un token funcionó o no.
- **No se mide** con qué puntaje pasa PsicoAlianza: hace falta el login.
- **No se toca la capa psicométrica** ni nada de ofertas.

## 🔴 Las trampas

**1. La clave del servicio viaja en la dirección de la consulta.** `res.php` se pide con la clave
como parámetro. Los clientes de la casa vuelcan al registro direcciones y cuerpos enteros (deuda
conocida): aquí **ni la clave ni el token van al registro**, ni dentro de una dirección ni dentro de
un mensaje de error. Sí van el tipo de captcha, el identificador de la tarea, el largo del token y
cuánto tardó.

**2. `action` significa dos cosas.** En el encargo es la acción del captcha (`submit` para
PsicoAlianza); en la consulta es `get`, un parámetro del servicio. Confundirlas no falla en
compilación.

**3. `CAPTCHAS.md` describe otra implementación, y en dos puntos va contra el servicio.** Allí se
pregunta cada 2 segundos, y el servicio pide 5. Y allí el puntaje por defecto es 0.3, cuando es un
dato de cada petición. Sus tres errores conocidos tampoco se copian.

**4. Una petición HTTP sin tope puede colgarse para siempre.** El tiempo total de dos minutos no
sirve si una sola petición nunca responde. Cada petición lleva su propio límite de tiempo.

**5. Una variante nueva de la petición no puede pasar en silencio.** Si mañana alguien añade v2 al
tipo y no al adaptador, eso tiene que ser **un error de compilación o un *no soportada* explícito**,
nunca una petición mal armada contra el servicio.

**6. En el backend no hay precedente de simular `fetch` en una prueba.** Las pruebas que hoy
aparecen buscando `fetch` usan relojes simulados, no respuestas simuladas. El adaptador se prueba
simulando `fetch` y con **relojes simulados**, así que ninguna prueba espera dos minutos de verdad
ni llama al servicio.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **El backend arranca igual sin las variables nuevas** | Servidor de pruebas y máquinas locales del equipo |
| **Compilación y pruebas en verde** | Nada existente se toca |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador.**
- **Comentarios: ninguno nuevo en archivos de código.**
- **Los identificadores van en inglés**, incluidos los de los `.spec` y los parámetros de callbacks.
- **Ningún secreto en ningún archivo**, tampoco en una prueba: la clave de las pruebas es un texto
  inventado y evidente.
- **La solución más pequeña que resuelve el caso.**
- **No commitear.** Los archivos nuevos se añaden al índice, con `add`.
- **Documentación en el mismo diff** (el flujo de la etapa psicométrica no cambia):
  - `../entorno-local.md` — las dos variables, en la sección del `.env` del backend, en lugar de la
    línea que dice que llegan con este brief.
  - `before-deploy.md` — una fila: **configurar `SOLVECAPTCHA_API_KEY` en los servidores antes de
    que una empresa use PsicoAlianza**. No bloquea desplegar este paso solo.
  - `../CLAUDE.md` — en *Dónde está lo importante*, **una frase**: el módulo de captcha existe, con
    su puerto sin proveedor.

## Pruebas

- **Token feliz**: el servicio responde *todavía no* un par de veces y luego el token; la solución
  lo trae.
- **El encargo lleva exactamente** los parámetros de la tabla, con los cuatro datos de la petición
  en su sitio.
- **Error al encargar** y **error al preguntar** → *no se pudo resolver*, con el texto del servicio.
- **Tiempo agotado** → *no se pudo resolver*, diciendo que fue el tiempo.
- **Sin clave** → *sin configurar*, **sin llamar a `fetch`**.
- **Puntaje fuera de 0.3 a 0.9** → *petición no soportada*, **sin llamar a `fetch`**.
- **El registro no contiene la clave ni el token** en ningún caso, tampoco en los de error.

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo, y borrarlo después,
limpiando la caché.

## Verificación

Una vez sobre el conjunto del cambio: `npm run build` y `npm test` en el backend. El resultado va
en el reporte.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos.
5. **Lo que el contrato dejaba sin verificar** (forma de *todavía no* y de los errores), con la
   fuente.
6. **Confirmación de que ningún módulo importa el nuevo** y de que el backend arranca sin las
   variables.
7. **En tres líneas, qué habría que tocar para añadir reCAPTCHA v2**, y en otras tres, **para
   añadir 2Captcha**. Es la prueba de que la forma cumple lo que promete.
8. **Un mensaje de commit.**
