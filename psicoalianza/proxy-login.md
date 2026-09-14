# Login automatizado de Psicoalianza — proxy y medición

## Qué se investigó y qué resultó

El login de `ats.psicoalianza.com` está protegido con reCAPTCHA v3 (`action: 'submit'`, no
Enterprise). La página genera el token con `grecaptcha.execute` y lo envía al hacer clic en el botón;
el formulario lo arma JavaScript en el cliente, así que un `fetch` crudo no lo ve.

reCAPTCHA v3 puntúa dos cosas a la vez: **la reputación de la IP concreta** y **el navegador**. Hace
falta que las dos sean buenas; una sola no alcanza. Mediciones (2026-09-13):

| Origen del token | Resultado |
|---|---|
| SolveCaptcha, sin proxy (IP datacenter) | rechazado (8/8) |
| SolveCaptcha + proxy **móvil** (HTTP puro, sin navegador propio) | rechazado (3/3) |
| Navegador real **a mano, una persona**, IP residencial propia (Telmex) | pasa |
| Navegador **automatizado** (headless, sin proxy), misma IP residencial | **rechazado (3/3)** — medido el 2026-09-14 |
| Navegador real + proxy **residencial** rotativo (3 IPs) | rechazado (3/3) |
| Navegador real + proxy **móvil** (Comcel/Claro, CGNAT) | pasa |

🔴 **Las dos filas de navegador sin proxy dicen cosas distintas, y la diferencia es todo el frente**
(aclarado el 2026-09-14). Que una persona entre a mano desde su casa no dice nada del login automatizado: el mismo
Chrome, sin ventana y sin proxy, **desde esa misma IP residencial fue rechazado las tres veces**. Sin
esa distinción, la tabla se lee como «basta con una IP residencial decente» y de ahí se concluiría
que el proxy móvil sobra. **No sobra.**

Conclusiones:

- Los pools **residenciales rotativos** están quemados (los comparten cientos de clientes que
  automatizan). Las IPs **móviles** ganan porque miles de usuarios reales comparten cada IP por CGNAT y
  Google no las bloquea sin dañar a gente legítima.
- El **solver no sirve** ni con IP móvil: su navegador de granja está fichado como automatizado. No hay
  vía "sin navegador propio". SolveCaptcha se puede eliminar del flujo.
- **Headless funciona** (sirve en servidor sin pantalla).
- Marcar **"Permanecer conectado"** emite la cookie `remember_web_<hash>` que dura **~5 días**. El login
  deja `ats_session` + `remember_web_` + `XSRF-TOKEN`.
- **La sesión no está atada a la IP**: acuñada desde una IP móvil y reusada desde otra IP sin proxy,
  redirige a `/inicio`. `ats_session` sola y `remember_web_` sola funcionan cross-IP.

## Arquitectura que se desprende

El navegador (headless + proxy móvil) se lanza **solo para acuñar la sesión**, se guardan
`ats_session` + `remember_web_`, y de ahí en más el backend trabaja **por HTTP con esas cookies** desde
la IP del servidor. Se relanza el navegador solo cuando la sesión muere (cada ~5 días o antes). Así el
navegador es un pico corto cada varios días, no un proceso permanente.

Alternativa que eliminaría todo el andamiaje (proxy + navegador): pedir a Psicoalianza que pongan en
**lista blanca la IP del servidor** para esa cuenta. Pendiente.

## La sonda: `scripts/measure-proxy-login.mjs`

Mide el **ancho de banda por login** a través del proxy móvil, que es lo que DataImpulse factura (cobra
por gigabyte, ambos sentidos). Engancha el contador de red del navegador (protocolo de depuración de
Chrome) y suma los bytes recibidos por recurso, desglosados por tipo. Corre dos escenarios: el flujo
completo y uno bloqueando imágenes/fuentes/CSS, y reporta MB por login y logins por GB.

**Requisitos para correrla:** Node con soporte ESM y `npm i puppeteer-core` en la carpeta. Lee las
credenciales y el proxy del `.env` de `esscoti-backend`. Usa el Chrome instalado del sistema.

**Resultado medido (2026-09-13):**

- **~2.8 MB por login** (2.64 MB de bajada + 0.16 MB de subida) → **~360–400 logins por GB**.
- Dónde se va: Script (reCAPTCHA + jQuery + app + analítica) 1.69 MB · Imágenes 536 KB · Fuentes
  174 KB · CSS 149 KB · resto ~94 KB.
- La cuenta es la del navegador; el medidor de DataImpulse suma sobrecarga de conexión, así que el
  panel marcará un poco más. El número exacto se confirma con el consumo del panel antes/después.

**Lectura de costo:** con la cookie de 5 días son ~6–8 logins al mes ≈ **~20 MB/mes**, o sea centavos
de centavo. El costo lo manda la **frecuencia** de login, no el tamaño. Optimizar los 2.8 MB no vale la
pena salvo que algo obligue a reloguear seguido (sesiones que mueren, muchas cuentas).

**Si igual se quiere achicar:**

- Lo grande y seguro: **no cargar `/procesos`** tras el login. Las cookies llegan en la respuesta del
  POST, antes de descargar la página del app; abortando esa navegación se ahorra buena parte del Script
  y las imágenes, y es después de autenticar (cero riesgo de captcha).
- Bloquear imágenes/fuentes/CSS baja a ~1.4 MB (la mitad), pero en la prueba el intento bloqueado salió
  rechazado. Con un solo intento no se puede afirmar que bloquear rompa el login (puede ser el fallo
  aleatorio de la tasa aún sin medir). No adoptar sin repetirlo varias veces.

## Pendiente de medir

**Tasa de éxito del login headless**: cuántas veces entra de cuántos intentos. Hoy solo hay datos
sueltos (entró 1/1 en una prueba; en otra, una corrida falló y la siguiente entró a la primera). No es
una tasa. Falta muestreo sistemático (varias tandas de N intentos repartidas en el día para no martillar
la cuenta), registrando **por qué** falla cada intento (captcha rechazado vs. timeout del proxy), que es
lo que decide el diseño del reintento.
