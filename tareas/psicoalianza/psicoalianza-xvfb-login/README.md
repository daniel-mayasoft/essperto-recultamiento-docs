# Prueba · login de PsicoAlianza con Chromium con ventana sobre Xvfb, en Docker

Solo de pruebas: nada de esto va a producción ni a ningún repositorio. Sirve para demostrar que el
backend, en el paso 2c, puede conseguir sesión en PsicoAlianza con un navegador **con ventana** dibujado sobre una
pantalla virtual en memoria (Xvfb), dentro de un contenedor Debian como el que tendría el backend.

**Lo que demuestra:** que la pieza funciona y cuánto cuesta. **Lo que no demuestra:** que con ventana
se entre más que sin ventana. Para eso hacen falta muestras comparables (ver `proxy-login.md`).

## Cuándo sale bien

1. Chromium arranca con ventana sobre Xvfb dentro del contenedor, sin errores.
2. Entra al menos una vez en como mucho cinco intentos.
3. Con las cookies conseguidas, el listado de vacantes activas responde desde la máquina del
   usuario, sin proxy y solo con la cookie de 5 días.

Si no entra en ninguno de los cinco, **no** queda demostrado que la ventana no sirva: se reporta tal
cual. Y como la imagen usa Chromium de Debian y no Google Chrome (con el que se entró las otras
veces), un 0 de 5 tiene dos sospechosos, no uno.

## Qué hay en la carpeta

| Archivo | Qué es |
| --- | --- |
| `Dockerfile` | Node 22 sobre Debian 13 ligero, Chromium de Debian, Xvfb y `fonts-liberation` |
| `docker-compose.yml` | Memoria compartida de 1 GB, perfil de Chromium en un volumen con nombre, carpeta `output/` montada, y el `.env` del backend en solo lectura |
| `login.mjs` | Un intento por ejecución, dentro del contenedor |
| `check-session.mjs` | La comprobación, en la máquina del usuario, fuera de Docker |
| `output/` | `attempts.jsonl` (un intento por línea), `cookies.json` si entró, capturas de los intentos que no entraron |

## Credenciales

Se leen del `.env` del backend, montado en solo lectura: la cuenta es la que está debajo del
encabezado `CUENTA ALTERNA`, y el proxy, las claves `PROXY_*`. Nada de eso entra en la imagen. Si el
encabezado cambia, el script falla diciendo qué falta.

🔴 El script nunca imprime contraseñas, credenciales del proxy, IPs ni valores de cookies: solo nombres
de cookies y resultados. `output/cookies.json` **sí** contiene la sesión: es un secreto que abre la
cuenta durante 5 días.

## Cómo se corre

Construir una vez:

    docker compose build

Un intento:

    docker compose run --rm login

Si entró, comprobar la cookie desde la máquina (Node 18 o superior):

    node check-session.mjs

Empezar con un perfil de Chromium limpio:

    docker volume rm psicoalianza-xvfb-login-profile

## 🔴 Reglas de los intentos — sin calentar la cuenta

- **Un intento. Si falla, al menos una hora antes del siguiente. Tope de cinco en el día.** Nada de
  ráfagas: calientan la cuenta y bajan la puntuación del captcha.
- **Con la cuenta alterna.** La principal tiene la sesión pegada en el entorno local del backend.
- **Parar al primer éxito.**
- **Bloqueo o credenciales rechazadas: parar en seco** ese día.
- Cada intento pide una IP pegajosa colombiana nueva al proxy móvil de DataImpulse.

| Resultado en `attempts.jsonl` | Cuenta como intento | Qué hacer |
| --- | --- | --- |
| `passed` | Sí | Parar y correr la comprobación |
| `captcha_rejected` | Sí | Esperar una hora |
| `locked` / `bad_credentials` | Sí | Parar el día |
| `unknown` | Sí | Mirar la captura y esperar una hora |
| `network` | No: el formulario no llegó a enviarse | Reintentar a los pocos minutos; tres seguidos, parar y mirar |
| `already_inside` | No | El perfil conserva una sesión: borrar el volumen del perfil |
| `error` con `counted: false` | No | Fallo del contenedor o de Chromium antes de tocar el login |

## Trampas que el script ya resuelve

- **Cookies de PsicoAlianza borradas antes de cada intento, las de Google conservadas.** Si no, el
  primer éxito deja la sesión en el perfil, PsicoAlianza echa del login a quien ya está dentro y los
  siguientes intentos fallan con un error que no es del captcha.
- **No se carga la página de trabajo.** Las cookies llegan en la respuesta del envío; la navegación
  que sale del login se aborta.
- **Éxito = la navegación sale del login y aparece `remember_web_<hash>`.** Una `ats_session` nueva
  no prueba nada: PsicoAlianza la da a cualquiera.
- **El perfil vive en un volumen con nombre, no en una carpeta de Windows montada**, y los ficheros
  `Singleton*` se borran al arrancar: si un intento muere a mitad, Chromium no se niega a abrir el
  perfil la vez siguiente.

## Resultados — 2026-09-14

### Intentos

| # | Hora (Bogotá) | Cuenta sin intentos | Resultado | Segundos | Arranque Xvfb + Chromium |
| --- | --- | --- | --- | --- | --- |
| 1 | 16:33 | ~7 h (dato del usuario) | **Entró** → `/inicio` | 35,1 | 0,1 + 0,5 |

Perfil de Chromium recién creado (volumen nuevo, sin historial de Google). Paró al primer éxito.

### Las tres condiciones

| # | Condición | Resultado |
| --- | --- | --- |
| 1 | Chromium con ventana sobre Xvfb, sin errores | ✅ Ventana de 1920×1080, `navigator.webdriver` en falso. Solo ruido de dbus y GPU en la salida de Chromium, que no afecta |
| 2 | Entra en como mucho cinco intentos | ✅ Al primero |
| 3 | Las cookies sirven desde la máquina del usuario, sin proxy, solo con la de 5 días | ⚠️ **La sesión sí sirve, pero el listado de vacantes no se puede pedir con esta cuenta** (abajo) |

🔴 **La cuenta alterna es de aspirante, no de empresa.** Su inicio redirige a
`/tareas-pendientes-aplicantes` («Mis aplicaciones»). Por eso `procesos-listado-tabla` responde 302 a
`/inicio` y `check-session.mjs` falla con ella: no es la cookie. Lo comprobado en su lugar, desde la
máquina del usuario y sin proxy:

| Petición | Cookies | Respuesta |
| --- | --- | --- |
| `/login` | solo `remember_web_`, solo `ats_session`, o las tres | 302 a `/inicio`: autenticada |
| `/tareas-pendientes-aplicantes` | solo `remember_web_` | **200, «Mis aplicaciones»**, sin formulario de login |
| `/tareas-pendientes-aplicantes` | ninguna | 302 a `/login` |
| `procesos-listado-tabla` | sesión de la cuenta principal (la pegada en el `.env`) | 200 con el listado: el endpoint no cambió |

Para cumplir la condición 3 tal como está escrita hace falta una cuenta de empresa.

### Lo que cuesta

| Qué | Valor |
| --- | --- |
| Imagen | **1,4 GB** en disco, sin comprimir; la base `node:22-trixie-slim` ocupa 333 MB → Chromium, Xvfb, fuentes y Puppeteer suman **~1,07 GB** |
| Memoria en el pico del login | **465 MB**, contenedor entero (`memory.peak` del cgroup, que incluye caché de ficheros) |
| Tiempo por intento | **35 s** con perfil nuevo: 0,1 s Xvfb, 0,5 s Chromium, 9,7 s desde el clic hasta salir del login; el resto, cargar el login por el proxy y teclear |

### Decisiones técnicas

| Qué | Cómo |
| --- | --- |
| Memoria compartida | `shm_size: 1gb` en compose, no `--disable-dev-shm-usage` |
| Aislamiento de Chromium | `--no-sandbox`, porque corre como root. En producción, correr como otro usuario **no basta** para quitarlo: hace falta además un permiso o perfil de seguridad del contenedor |
| Versiones | Chromium de Debian **152.0.7977.82** · `puppeteer-core` **25.10.0** (apunta a 152.0.7977.75) · Node 22.23.2 · Debian 13 |
| Fuentes | Bastó con `fonts-liberation` |
| Ventana | `--window-size` y `--window-position` explícitos: sin gestor de ventanas, maximizar no hace nada |

### Lo que no salió a la primera

- **«Permanecer conectado» NO venía marcado** (`rememberCheckedByDefault: false`), contra lo que dice
  la bitácora. El script lo marca si hace falta. **La pieza que consigue la sesión tiene que comprobarlo, no suponerlo**:
  sin esa casilla no hay cookie de 5 días.
- **La comprobación con la cuenta alterna** — ver arriba: cuenta de aspirante.
- **Node 25 en Windows abortaba al salir** con `process.exit` y la respuesta sin leer
  (`Assertion failed ... async.c`). Se lee el cuerpo y se usa `process.exitCode`.
- **dbus y GPU** llenan la salida de Chromium de errores dentro del contenedor. Son ruido: no hay bus
  del sistema ni tarjeta gráfica. Solo se ven con `dumpio`.

⚠️ **Un éxito en un intento no es una tasa**, y el navegador es Chromium, no Google Chrome: esta prueba
demuestra que la pieza funciona, no que con ventana se entre más.
