# Brief · Paso 1 — el backend deja crear ofertas sin portales

Para quien ejecuta este paso. Quitar un rechazo y ajustar un mensaje del agente. No toca el embudo
ni le escribe a ningún candidato: **brief corto y una sola ronda**. Solo backend.

Antes de empezar, lee `../../CLAUDE.md`, `../psicoalianza/arranque-del-ejecutor.md` (cómo se trabaja
aquí y lo que ya salió mal) y la bitácora de este frente, `bitacora.md`: **el vocabulario, las
decisiones 5 y 8, y los puntos A, B, E, F, G y K de *Lo que dice el código***. Los puntos E a G son
la comprobación, camino por camino, de que una oferta sin plataformas no dispara avisos ni rompe el
cierre ni los canales manuales. **No hace falta rehacerla**, pero si al leer el código algo no
cuadra, dilo en la opinión previa: gana el código.

## Rama

`feat/offers-without-ats`, ya creada desde `develop` (`18b5463`), limpia. **Mide la línea base de
pruebas antes de tocar nada.**

## Qué le pasa a una persona

| | Hoy | Después |
| --- | --- | --- |
| Laura, de una empresa sin ningún portal habilitado, crea su primera oferta desde el botón del listado vacío | El backend la rechaza: «No hay plataformas ATS habilitadas…» | La oferta se crea, sin plataformas. Ningún robot intenta publicarla |
| Laura le pide al agente de WhatsApp que cree una oferta | El agente se disculpa: no se pudo crear | Se crea, y el agente le dice que no se publicará en ningún canal y que los candidatos se cargan a mano desde el portal de Essperto |
| Pedro, de una empresa con Computrabajo habilitado, crea una oferta | Nace con Computrabajo pendiente de publicar y se despacha el robot | Igual |
| Pedro crea una oferta por WhatsApp | El agente dice que el sistema ya empezó a buscar candidatos | Igual |
| Quien presenta una demo crea una oferta por WhatsApp (la oferta nace sin plataformas) | El agente dice que el sistema ya empezó a buscar candidatos | Igual: en la demo el candidato entra solo |

Los botones del portal siguen apagados hasta el paso 2. El del listado vacío no lo está (punto D), y
sirve para probar este paso en local.

## Qué se hace

### 1 · Quitar la validación

En la creación de la oferta del servicio de ofertas, se elimina el bloque que lanza «No hay
plataformas ATS habilitadas…» cuando la lista de plataformas queda vacía. **Nada más de la
creación cambia**: el armado de la lista, el modo demo, el de simulación y los tres envíos a los
robots se quedan como están. Sin credencial, cada envío escribe una línea en el log y sale (punto
E); eso se queda así.

### 2 · La confirmación del agente de WhatsApp (decisión 5)

En la herramienta del agente que crea la oferta, cuando la oferta recién creada **no tiene ninguna
plataforma**, la línea que le indica al modelo «El sistema ya comenzó a buscar candidatos» se
sustituye por:

> La oferta quedó creada, pero no se publicará en ningún canal. Los candidatos se cargan a mano
> desde el portal de Essperto.

La condición es la lista de plataformas de la oferta devuelta por la creación, **no** las
credenciales de la empresa: así sigue siendo cierta cuando llegue la elección de canales por
oferta. Con plataformas, el mensaje queda idéntico al de hoy, incluido el caso de una oferta que no
nace activa. El resto de líneas (cargo, estado, preguntas, EvaluaTest, «confírmalo en una frase
amable») no cambia.

**Excepción, decisión 8**: si la empresa está en modo demo, el mensaje es el de hoy aunque la
oferta nazca sin plataformas. El servicio de ofertas ya sabe leer si una empresa está en modo demo,
en un método privado; **reutiliza esa lectura en vez de escribir una segunda** contra la empresa.
Cómo exponerla —hacerla pública u otra forma— lo propones en la opinión previa.

## Opinión previa del ejecutor (2026-10-01), verificada e incorporada

| Punto | Decidido |
| --- | --- |
| Línea base 162 suites y 1.652 pruebas que pasan, 9 omitidas; `develop` avanzó tres commits ajenos a la zona | Correcto. No se traen ahora; se traen en el cierre |
| «No se despacha nada» no se puede probar imitando los tres envíos, porque se llaman siempre | **Aceptado, con un ajuste**: los tres envíos reales se ejecutan, con el orquestador y la clave configurados en la prueba, y se vigila el método que despacha la tarea al orquestador en vez de interceptar la red. Control negativo: con una credencial habilitada, sí se despacha |
| En local se verán tres avisos de «orquestador no configurado», no de «sin credencial» | **Aceptado.** Error del brief. Lo de «sin credencial» lo cubre la prueba automática |
| Hacer pública la lectura del modo demo del servicio de ofertas, sin otro cambio, y llamarla solo si la oferta nace sin plataformas | **Aceptado** |
| Si esa lectura falla, el agente diría «no se pudo crear» de una oferta que existe | **Decisión 9**: cuenta como «no es demo», se registra en el log y lleva su prueba |
| Oferta sin plataformas que no nace activa | **Decisión 10**: lleva la frase nueva en las dos variantes |
| Ampliar la prueba existente del modo demo apagado para comprobar que la plataforma nace pendiente | **Aceptado** |

**El mismo problema del punto de la decisión 9 ya existe con el guardado de preguntas y EvaluaTest**
del agente. Queda fuera (ver *Fuera del alcance* de la bitácora): no se toca.

**Se puede empezar.**

## 🔴 Dónde se para

- **Nada del portal.** Es el paso 2.
- **Maya y la API del agente no se tocan**: Maya no promete búsqueda, y la API crea borradores.
- **Los tres envíos a los robots, los crons y la analítica no se tocan** (puntos E a H).
- **Ningún portal se añade a una oferta ya creada** (decisión 6).
- Sin comentarios en el código, sin formateador, sin lint. Identificadores en inglés, también en
  las pruebas y en los parámetros de los callbacks.

## Pruebas y verificación

Las pruebas nuevas van en la carpeta `test/` de su módulo (en el del agente de WhatsApp no existe;
se crea con la misma convención). `demo-mode-offer-creation.spec.ts` es el precedente de cómo se
monta la creación.

- **Creación**:
  - Empresa sin credenciales, sin modo demo ni simulación: la oferta se guarda con la lista vacía,
    no lanza, y no se despacha nada al orquestador.
  - Empresa con todas sus credenciales deshabilitadas: lo mismo.
  - Empresa con una credencial habilitada: sigue naciendo con esa plataforma pendiente (si ya lo
    cubre una prueba existente, dilo y no la dupliques).
- **Agente**: oferta creada sin plataformas → el texto lleva la frase nueva y no la de «ya comenzó
  a buscar»; con una plataforma → el texto es el de hoy; sin plataformas en una empresa en modo
  demo → el texto es el de hoy; sin plataformas y con la lectura del modo demo fallando → la frase
  nueva, sin «no se pudo crear».
- **Control negativo** en las dos: invierte la expectativa, comprueba que falla, bórralo.
- **Punto K**: varias pruebas existentes crean ofertas con una empresa sin credenciales. Las del
  límite por miembro fallan antes de llegar a la validación y no deberían cambiar; confírmalo con
  el resultado, no con la lectura.
- `npx jest --clearCache`, `npm run build` y `npm test`, **una vez** sobre el conjunto. El resultado
  frente a la línea base va en el reporte.
- **A mano, en local**: una empresa sin portales y sin ofertas crea una desde el botón del listado
  vacío. Se crea, el formulario todavía muestra el aviso viejo (lo cambia el paso 2), y en el log
  del backend salen tres avisos de «orquestador no configurado» y ningún despacho. Luego se le carga un
  candidato a mano y se comprueba que entra en la oferta.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados.
2. Después: qué cambió y el resultado real de la verificación, frente a la línea base.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
