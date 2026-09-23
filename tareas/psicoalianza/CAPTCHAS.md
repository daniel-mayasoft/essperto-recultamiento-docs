# Captchas en Robot-Manager

Este documento describe cómo resuelve captchas este proyecto. Está escrito para que otro
proyecto con Puppeteer pueda replicar el mecanismo sin tener que leer los tres mil líneas
de la clase base.

## Resumen en una frase

Ningún captcha se resuelve localmente: no hay OCR ni modelo de visión en el proyecto. El
token siempre lo entrega un servicio externo de pago, y el trabajo del robot es pedirlo con
los parámetros correctos y saber dónde ponerlo en la página.

## Los dos proveedores

Hay dos servicios en uso, con cuenta y clave separadas.

**SolveCaptcha** (`API_URL_SOLVECAPTCHA`, `API_TOKEN_SOLVECAPTCHA`) entrega el token de
reCAPTCHA **v3** y el de hCaptcha. Usa la API antigua de dos pasos: una llamada encola el
trabajo y devuelve un identificador, otra pregunta si ya está listo.

**2Captcha** (`API_KEY_2CAPTCHA`) cubre el resto: el plugin de Puppeteer que resuelve los
v2, la extensión de navegador y los captchas de imagen. Usa la API nueva
(`createTask` / `getTaskResult`).

## reCAPTCHA v3: la receta

Son tres pasos, y solo los dos primeros se copian tal cual.

### Paso 1 — obtener la clave del sitio

En la clase base, el método `getSiteKeyGoogleCaptcha` lee la clave pública desde la página
ya cargada, probando cuatro cosas en orden:

1. El parámetro `render=` en el `src` del script de Google. Es el caso típico de v3.
2. El atributo `data-sitekey` de cualquier elemento. Es el caso de v2.
3. Una llamada a `grecaptcha.execute` escrita dentro de un script de la propia página.
4. El `k=` en el `src` del iframe, cuando el sitio usa la variante Enterprise.

Merece la pena copiar las cuatro heurísticas: cubren casi todo lo que aparece en la
práctica, y evitan tener que hardcodear la clave por sitio.

### Paso 2 — pedir el token

El método `solveCaptchaV3` hace la llamada a SolveCaptcha. Los parámetros que importan:

- **`action`**: la acción que el sitio le declara a Google al pedir el token. Tiene que
  coincidir con la que usa la página real, o el score sale mal. Se averigua mirando la
  llamada a `grecaptcha.execute` en el fuente de la página. Aquí se usa `submit`, que es
  el valor por defecto más común, pero no es universal.
- **`minScore`**: el score mínimo que se pide. Aquí se usa `0.3`. Cuanto más alto, más
  caro y más lento; si el sitio rechaza tokens de 0.3, hay que subirlo.
- **`isEnterprise`**: solo si la clave se sacó del caso 4 del paso anterior.

Después encuesta el resultado hasta 60 veces cada 2 segundos, o sea que puede tardar hasta
dos minutos. Hay que dimensionar los timeouts del robot contando con eso.

### Paso 3 — inyectar el token (esta parte NO se copia)

**Aquí está el trabajo real, y es distinto en cada sitio.** La clase base devuelve el token
y no hace nada más con él: dónde encaja depende de cómo esté construido el formulario de
destino.

En este proyecto hay **un solo robot** que usa v3: la transcripción de incapacidades de ARL
Seguros Bolívar. Esa página está hecha con Livewire —un framework donde el estado del
formulario vive en el servidor y el navegador solo lo sincroniza—, así que el robot busca el
componente en el DOM y le fija dos cosas: la propiedad que guarda el token, y una bandera
que marca el captcha como validado.

Ese segundo paso, la bandera, no es parte de la receta de v3: es manipulación del estado
del formulario, y funciona solo si el servidor de ese portal se fía de ella. **No lo
copies a ciegas.** En el sitio nuevo hay que averiguar de nuevo:

- ¿Dónde espera el token el formulario? Puede ser el `textarea` estándar
  `g-recaptcha-response`, un campo oculto, o el estado de un framework.
- ¿El sitio pide el token al enviar, o al cargar? Si lo pide al enviar, hay que interceptar
  ese momento.
- ¿El servidor revalida contra Google, o se fía de lo que llega del navegador?

Si el otro Claude reporta "v3 implementado" habiendo copiado solo los pasos 1 y 2, el
trabajo está a medias.

## Los otros tipos, por si aparecen

**reCAPTCHA v2** (la casilla y la invisible): no hace falta nada de lo anterior. Se arranca
el navegador con `puppeteer-extra` y el plugin `puppeteer-extra-plugin-recaptcha`
configurado con el proveedor 2Captcha, y después se llama a `solveRecaptchas()` sobre la
página. El plugin detecta el widget, pide el token y lo pega solo. Es el camino que usan
unos veinte robots aquí. Con v3 no sirve, porque no hay widget que detectar.

**Captcha de imagen**: se recorta el elemento de la imagen a una captura en base64, se manda
a `createTask` de 2Captcha y se encuesta `getTaskResult`. Está en `solveNormalCaptcha`.

**hCaptcha**: flujo propio en `solveHcaptcha`. Detalle que se olvida y hace fallar la
validación: además del token hay que **cambiar el user agent del navegador** al que
devuelve el servicio, porque hCaptcha lo comprueba.

**Extensión de 2Captcha**: dos robots cargan la extensión oficial en Chrome, rellenan la
clave en su pantalla de configuración y luego hacen clic en el botón que la extensión
inyecta. Es el camino más frágil, porque depende de textos de interfaz. No lo recomiendo
para un proyecto nuevo.

## Errores conocidos: no los copies

Hay tres cosas mal en la implementación actual. Si el código se copia tal cual, viajan.

1. **La validación de configuración de v3 mira la variable equivocada.** Antes de llamar al
   servicio comprueba si falta la URL, pero comprueba el parámetro `url` que recibe —que es
   la URL de la página destino— en vez de la variable de entorno. Si la variable falta, la
   comprobación pasa y la petición sale hacia una dirección inválida, con un error que no
   habla de configuración.

2. **La lectura de la clave del sitio revienta si no encuentra nada.** El cuarto intento
   parte una cadena sin comprobar antes que exista, así que en una página sin ninguno de los
   cuatro casos no se obtiene "no encontré la clave" sino un `TypeError`.

3. **No hay reintento por score bajo.** Se pide el token una vez y se sigue. Si el sitio lo
   rechaza por score, el robot falla más adelante, en un punto que no menciona el captcha y
   que cuesta diagnosticar.

## Credenciales

Las claves de ambos servicios están commiteadas en los archivos de entorno de este repo.
Eso es un problema pendiente aquí y **no se debe replicar**: en el proyecto nuevo van por
variable de entorno, fuera del control de versiones.

Antes de empezar hay que decidir si el proyecto nuevo usa la misma cuenta o abre la suya.
Compartir cuenta significa compartir saldo, y significa que si un proyecto quema la cuenta
—por un bucle de reintentos, por ejemplo— el otro se queda sin captchas sin saber por qué.

## Checklist para implementarlo en otro proyecto

1. Abrir la página destino a mano y encontrar la clave del sitio y la `action`.
2. Confirmar que es v3 y no v2. Si es v2, usar el plugin y saltarse todo lo demás.
3. Copiar la lectura de la clave y la llamada al servicio, con los tres errores de arriba
   corregidos.
4. Averiguar dónde espera el token el formulario. Esta es la parte larga.
5. Probar con un score bajo primero; subirlo solo si el sitio rechaza.
