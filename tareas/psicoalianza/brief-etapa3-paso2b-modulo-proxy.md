# Brief · Etapa 3, paso 2b — el módulo de proxy

Para quien ejecuta este paso. **Este documento dice qué hacer y qué no. El *porqué* está en la
decisión 43**, en la tabla *La arquitectura, toda en el backend*, fila *Módulo `proxy`*. Toca solo
el backend.

> Escrito el 2026-09-15 leyendo la decisión 43, *Medición con proxy* (la tabla *Lo que el brief del 2b
> y del 2c necesitan saber del proxy y de Chrome*), `proxy-login.md`, el script que entró
> (`evidencia/login-por-proxy-movil.mjs`), el esquema de entorno del backend, el módulo de Qdrant como
> módulo pequeño de la casa, y la capa psicométrica como patrón de puerto, tipos y errores propios.
>
> **Incorpora la opinión previa del ejecutor del 2026-09-15**, verificada contra el código por el
> planificador: el token del puerto como alias de la instancia (ya no hay precedente), vacío admitido
> en las cinco variables, la forma rotativa como convención y no como medida, el tipo de IP con dos
> valores en el puerto, el orden de los dos errores, la operación asíncrona, el montaje de la prueba de
> cableado y cómo se verifica el arranque. Marcado como «opinión previa» en su sitio.

## Antes de escribir una sola línea

Leer, en este orden:

1. `arranque-del-ejecutor.md` — cómo se trabaja aquí y qué ya salió mal. Se lee una vez.
2. `../../CLAUDE.md` — el proyecto, y `../../../../esscoti-backend/CLAUDE.md` — las credenciales nunca en el
   código, y el chequeo de secretos que corre sobre el diff.
3. `integrate-psicoalianza.md` — la bitácora. Importan la **decisión 43** (la tabla de la
   arquitectura y las protecciones), *Medición con proxy* dentro de *Dónde va la etapa 3* (la tabla
   de lo que este brief necesita saber del proxy), y la fila **2b** de la tabla de pasos.
4. `../../entorno-local.md` — la sección *PsicoAlianza, dos formas de tener sesión*, que ya nombra las
   variables del proxy, y la del `.env` del backend.
5. `brief-etapa3-paso1-modulo-captcha.md` — **es la forma que este paso copia**: módulo propio al
   nivel de los demás, puerto sin proveedor, tipos aparte, un archivo por error, adaptador único sin
   selector, variables opcionales que fallan al usar y no al arrancar. Ese paso se descartó; su forma
   no.
6. En el backend: la capa psicométrica —el puerto, su archivo de tipos, los errores propios, un
   archivo por uno— y el módulo de Qdrant, que es el módulo más pequeño de la casa. Y el esquema de
   entorno, en la zona de las variables de PsicoAlianza.

Después, **antes de tocar código**: opinión del plan, con el árbol limpio. Si algo de aquí no
cuadra con el código, gana el código y hay que decirlo.

## El caso

Dentro de poco, la pieza que consigue la sesión (paso 2c) tendrá que entrar a PsicoAlianza con un navegador
que salga por una IP móvil colombiana, porque desde cualquier otra IP el captcha lo rechaza. Para
eso le pedirá a este módulo: *«una IP móvil de Colombia, pegajosa con este identificador»*, y el
módulo le devolverá **cómo conectarse al proxy** para salir por ella: protocolo, host, puerto,
usuario y contraseña, ya armados. La pieza que consigue la sesión no sabe que detrás hay DataImpulse ni cómo se codifica
el país en el usuario.

**Hoy nadie lo llama.** Es un paso aditivo: no puede romper nada. Brief corto, una ronda.

**No habla con nadie.** Arrendar una IP en DataImpulse es *componer las credenciales*: no hay
petición HTTP, no hay lista de IPs, no hay comprobación de que la IP funcione. Eso lo hace el
navegador al conectarse, en el 2c. Este módulo es puro: recibe una petición y devuelve un objeto.

## Alcance exacto

1. **Un módulo propio, `proxy`, al nivel de los demás módulos del backend** —no dentro de ofertas ni
   de la capa psicométrica: es infraestructura, igual que el captcha del paso 1—. Exporta el puerto por
   su token. **No lo importa ningún otro módulo todavía**: lo importa el 2c.
2. **El puerto** tiene una sola operación: *arrendar una IP*. Recibe una petición y devuelve un
   arriendo, **de forma asíncrona** aunque el adaptador de hoy sea puro (opinión previa): un
   proveedor que arriende por API es asíncrono, y con retorno síncrono cambiaría el puerto. No nombra
   a ningún proveedor.
3. **La petición** lleva tres datos:
   - **país**, como código ISO de dos letras (`CO` para Colombia);
   - **tipo de IP**: el tipo del puerto declara **móvil y residencial** (opinión previa), y el
     adaptador de hoy solo sirve móvil (ver la trampa 2). Así la prueba de *residencial → no
     soportada* existe sin forzar tipos;
   - **adherencia**: *pegajosa*, con un **identificador que genera quien llama** —la misma IP mientras
     se repita el identificador; un identificador nuevo es otra IP—, o *rotativa*, sin identificador.
4. **El arriendo** es un objeto con **protocolo, host, puerto, usuario y contraseña**, como datos
   separados, nunca como una URL con la contraseña dentro. ⚠️ La decisión 43 pedía además *hasta
   cuándo vale*. **No se devuelve**: no está medido cuánto dura una sesión pegajosa de DataImpulse, y
   quien llama genera un identificador nuevo por intento, así que nadie lo consumiría. Si algún día
   hace falta, es un campo opcional más en el objeto.
5. **Errores de tipo propio**, uno por archivo, como en la capa psicométrica. Son dos:
   - *sin configurar* — falta alguna de las variables del proxy. Es permanente. Se lanza **al
     arrendar**, no al arrancar.
   - *petición no soportada* — este proveedor no sabe servir esa petición: un tipo de IP que no sea
     móvil, un país que no tenga dos letras, o un identificador de sesión que no sea solo letras y
     dígitos (ver la trampa 1). Se lanza **antes de armar nada**.

   **Si aplican los dos, gana *no soportada*** (opinión previa): se valida la petición primero y se
   leen las variables después. Una petición mal formada es un error del programa y tiene que dar la
   misma respuesta en cualquier máquina, tenga o no el `.env` configurado.
6. **El adaptador de DataImpulse**, que implementa el puerto. Lo que sabe:

   | Qué | Cómo |
   | --- | --- |
   | Usuario del proxy | El login de la cuenta, seguido de `__cr.` y el país en minúsculas, y, si es pegajosa, `__sid.` y el identificador. Para Colombia pegajosa: `<login>__cr.co__sid.<identificador>`, **que es lo medido el 2026-09-13**. Rotativa: sin la parte de `__sid.`. ⚠️ **La rotativa no está medida** (opinión previa): el script de la evidencia solo usó pegajosa, y que sin `__sid.` la IP rote es la convención de DataImpulse. Se implementa igual porque es lo que la 43 pide y el 2c solo usa pegajosa; comprobarla sería una petición real por el proxy y **no es de este paso** |
   | Contraseña | La de la cuenta, tal cual, sin sufijos |
   | Host y puerto | Los de las variables. Con DataImpulse, `gw.dataimpulse.com`, **823** para HTTP y **824** para SOCKS5; el módulo no los conoce: vienen del `.env` |
   | Protocolo | El de la variable; HTTP por defecto |
   | Tipo de IP | La cuenta contratada es del plan móvil, y el plan lo fija la cuenta, no un parámetro. El adaptador acepta **solo *móvil***; cualquier otro tipo es *petición no soportada* |

7. **Cinco variables de entorno**, declaradas en el esquema, **todas opcionales y sin valor por
   defecto salvo el protocolo**. 🔴 **Ninguna obligatoria**: si lo fueran, el día que se mezcle la
   rama no arrancarían ni el servidor de pruebas ni el backend local de nadie que no las tenga. Sin
   ellas, falla **al arrendar**, con *sin configurar*, no al arrancar.

   | Variable | Qué es | Validación |
   | --- | --- | --- |
   | `PROXY_HOST` | El gateway del proveedor | Texto, opcional, admite vacío |
   | `PROXY_PORT` | El puerto del gateway | Número entero positivo, opcional, **admite vacío** |
   | `PROXY_LOGIN` | El login de la cuenta, sin sufijos | Texto, opcional, admite vacío |
   | `PROXY_PASS` | La contraseña de la cuenta | Texto, opcional, admite vacío |
   | `PROXY_PROTOCOL` | `http` o `socks5` | Solo esos dos valores **o vacío**; **`http` por defecto** |

   Las cuatro primeras **ya existen con esos nombres** en el `.env` local del usuario y en la fila 8 de
   `before-deploy.md`: no se renombran. La quinta es nueva. ⚠️ Una línea vacía en el `.env` llega
   como texto vacío, no como ausente, **y las cinco tienen que admitirlo** (opinión previa, comprobado
   por el planificador con el Joi del proyecto: un número o un valor de lista fija sin *admite vacío*
   rechazan la cadena vacía y el backend no arranca). El adaptador trata vacío y ausente igual: en
   las cuatro primeras, *sin configurar*; en el protocolo, `http`.
8. **Un solo proveedor, sin selector.** ⚠️ **El precedente de «token del puerto enlazado a la
   instancia» ya no existe** (opinión previa): el 4a quitó el token de la capa psicométrica y lo
   sustituyó por el resolvedor. Aquí se hace así: **un token constante exportado desde el archivo del
   puerto**, el adaptador de DataImpulse registrado como clase, y el token como **alias a esa misma
   instancia**. **Nada de una variable para elegir proveedor**: con uno solo no hay nada que elegir.
   Cambiarlo mañana es otro adaptador y una línea en el módulo.

## 🔴 Dónde se para — qué NO se hace

- **Nada de Chrome, de Puppeteer ni de PsicoAlianza.** Ni lanzar un navegador, ni comprobar la IP de
  salida, ni el login. Es el 2c.
- **Ninguna petición HTTP.** El módulo no comprueba que el proxy responda ni que la IP sea móvil ni
  colombiana: eso solo se ve al usarla.
- **Ningún reintento, candado, tope diario ni aviso a soporte.** Son protecciones de la pieza que consigue la sesión, no
  del arriendo.
- **Ningún otro proveedor**, ni variable para elegirlo, ni otro tipo de IP.
- **No se importa el módulo** en ningún otro, tampoco en el de la aplicación.
- **No se toca la capa psicométrica** ni nada de ofertas, ni el cliente de PsicoAlianza.
- **No se añade Chromium a la imagen** ni se toca ningún Dockerfile: eso se decide con el usuario
  antes del 2c.

## 🔴 Las trampas

**1. El usuario del proxy es un formato con separadores.** DataImpulse lee los parámetros del usuario
separándolos por `__`. Un identificador de sesión que lleve `_`, `:`, `@` o espacios no falla: se
interpreta como otro parámetro, o rompe la autenticación del proxy, y el error que se ve es del
navegador, no de aquí. Por eso el identificador tiene que ser **solo letras y dígitos**, y lo que no
lo sea es *petición no soportada* antes de armar nada. Igual el país: dos letras, y se mandan en
minúsculas porque así se midió (`cr.co`).

**2. El tipo de IP no se elige por parámetro.** En DataImpulse el tipo lo fija el plan contratado, y
las credenciales del `.env` son las del plan móvil. El puerto pide el tipo igual —quien llama tiene
que decir qué necesita, y la decisión 43 lo exige— y el adaptador **solo sabe servir móvil**. Si
alguien pide residencial, el error es explícito; no se sirve una IP móvil en silencio ni al revés.

**3. La contraseña del proxy es una credencial.** No va al registro, no va dentro de un mensaje de
error, no va en una URL. El arriendo la devuelve como campo aparte; quien la use decide cómo la
mete al navegador. El chequeo de secretos del `CLAUDE.md` del backend marca `password` seguido de un
texto de seis caracteres o más: **los valores de las pruebas se eligen para no dispararlo**, con
textos cortos y evidentes.

**4. Vacío no es ausente en el `.env`.** Ver el punto 7 del alcance. La validación del esquema tiene
que admitir vacío **en las cinco**, también en el puerto y en el protocolo, o quien tenga la línea
vacía no arranca.

**5. `PROXY_PORT` llega como texto** si no se declara como número en el esquema. El arriendo lo
devuelve como número.

**6. El módulo montado solo no ve la configuración** (opinión previa). La configuración es global
desde el módulo de la aplicación y el nuevo módulo no la importa, como Qdrant. La prueba de cableado
lo monta con una configuración vacía que no lea ningún archivo de entorno —hay precedente en la
prueba de cableado de PsicoAlianza, que entrega una configuración falsa que no devuelve nada— y
comprueba **identidad de instancias, no valores**: que el token y la clase son el mismo objeto. La
construcción no lee variables, se leen al arrendar, así que monta sin nada.

## Lo que hay que preservar entero

| Qué | Por qué |
| --- | --- |
| **El backend arranca igual sin las variables nuevas** | Servidor de pruebas y máquinas locales del equipo |
| **El backend arranca igual con las cuatro que ya están en el `.env` local** y sin `PROXY_PROTOCOL` | Es el `.env` del usuario hoy |
| **Compilación y pruebas en verde** | Nada existente se toca |

## Reglas de la casa

Las de `arranque-del-ejecutor.md`. Las que más se han incumplido en este frente:

- 🔴 **No correr el lint ni ningún formateador.**
- **Comentarios: ninguno nuevo en archivos de código.**
- **Los identificadores van en inglés**, incluidos los de los `.spec` y los parámetros de callbacks.
  Los nombres de las variables de entorno y los sufijos `__cr.` y `__sid.` son contrato: no se
  traducen.
- **Ningún secreto en ningún archivo**, tampoco en una prueba (trampa 3).
- **Finales de línea**: los archivos nuevos en LF, como los de la capa psicométrica; el esquema de
  entorno se edita respetando su CRLF (opinión previa, comprobado).
- **Identificador de sesión sin tope de largo**; país en cualquier caja, mandado en minúsculas
  (opinión previa, aceptado).
- **La solución más pequeña que resuelve el caso.**
- **No commitear.** Los archivos nuevos se añaden al índice, con `add`.
- **Documentación en el mismo diff** (el flujo de la etapa psicométrica no cambia):
  - `../../entorno-local.md` — en *PsicoAlianza, dos formas de tener sesión*, la frase que dice que los
    nombres exactos los fija el brief del 2b pasa a listar las cinco variables con su valor local; y
    en la tabla del `.env` del backend, las cinco, junto a las de PsicoAlianza.
  - `before-deploy.md` — la fila 8 gana `PROXY_PROTOCOL` en su lista, con la nota de que es opcional.
  - `../../CLAUDE.md` — en *Dónde está lo importante*, **una frase**: el módulo de proxy existe, con su
    puerto sin proveedor, y nadie lo llama hasta la pieza que consigue la sesión.

## Pruebas

Todas puras, sin red y sin relojes: el adaptador no llama a nada.

- **Pegajosa, Colombia, móvil** → el usuario es `<login>__cr.co__sid.<identificador>`, la contraseña
  la de la cuenta, host y puerto los de las variables, protocolo `http`.
- **Rotativa** → el usuario es `<login>__cr.co`, sin `__sid.`.
- **País en mayúsculas** (`CO`) → va en minúsculas en el usuario.
- **Protocolo `socks5` en la variable** → el arriendo lo dice.
- **Sin `PROXY_PROTOCOL`, o vacío** → `http`.
- **Falta cualquiera de las cuatro variables, o está vacía** → *sin configurar*, **nombrando las que
  faltan y nunca su valor**. Una prueba por variable, o una parametrizada.
- **Tipo residencial** → *petición no soportada*, aunque las variables estén; **y también cuando
  además faltan las variables**: gana *no soportada*.
- **País de tres letras, o vacío** → *petición no soportada*.
- **Identificador con `_`, con `:` o vacío** → *petición no soportada*; **con letras y dígitos** →
  pasa.
- **El módulo, montado solo, entrega el puerto por su token** y es la misma instancia que el
  adaptador de DataImpulse: como nadie lo importa, es lo único que comprueba el cableado antes del
  2c. Cómo se monta, en la trampa 6.

**Cómo se verifica que el backend arranca sin las variables y con las cuatro del `.env` local**, sin
levantar el servidor (opinión previa, aceptado): un script **en el scratchpad, fuera de los
repositorios**, que carga el `.env` con `dotenv` —ya está instalado como dependencia de la
configuración de Nest—, lo valida contra el esquema exportado, y **solo imprime *válido* o el nombre
de la variable que falla, nunca un valor**. Se corre dos veces: con el `.env` tal cual, y quitando en
memoria las claves `PROXY_*`. El resultado de las dos corridas va en el reporte, y el script se borra.

⚠️ Una prueba que pasa a la primera merece desconfianza: control negativo en la de *pegajosa* —cambiar
el separador esperado y ver que falla—, y borrarlo después, limpiando la caché.

## Verificación

Una vez sobre el conjunto del cambio: `npm run build` y `npm test` en el backend, con la caché de
Jest limpia. El resultado va en el reporte.

## Qué entregar

1. **Qué cambió** y **qué se verificó**, con el resultado real.
2. **Qué quedó fuera** y por qué.
3. **Qué decisiones se tomaron que no estaban en este brief.**
4. **Confirmación de que el diff no trae cambios de formato** ni comentarios nuevos en código, **y la
   lista de los identificadores nuevos**, parámetros de funciones flecha incluidos.
5. **Confirmación de que ningún módulo importa el nuevo** y de que el backend arranca sin las
   variables y con las cuatro del `.env` local.
6. **En tres líneas, qué habría que tocar para añadir otro proveedor de proxy**, y en otras tres,
   **para servir también IP residencial con DataImpulse**. Es la prueba de que la forma cumple lo que
   promete.
7. **Los documentos actualizados.**
8. **Un mensaje de commit** por repositorio.
