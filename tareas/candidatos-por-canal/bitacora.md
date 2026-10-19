# Bitácora · candidatos por canal en analítica

**La fuente única de la verdad de este frente.** Aquí están las decisiones numeradas, lo que el
código dice y los documentos no, lo que queda fuera, el avance y lo que hay que hacer antes de
desplegar. Los briefs apuntan aquí por número; no repiten las decisiones.

Qué se pide y el alcance acordado con la dirección: `requisitos.md`, empezando por su tabla
*Actualizado el 2026-10-19*. Cómo funciona hoy y dónde está cada pieza: `planning.md`, empezando por
su sección *Actualizado el 2026-10-19*, con las correcciones de *Lo que dice el código*, más abajo,
que ganan sobre él.

## Vocabulario de este frente

- **La tabla** — «Calidad por canal de entrada», en el panel global de la analítica. La añadió Elvis
  el 2026-09-30 (`054a480`). Esta tarea la completa; no hace otra.
- **Participación** — el registro de una persona dentro de una oferta. Una persona tiene una sola por
  oferta.
- **Origen** — por dónde entró esa persona a esa oferta, guardado en la participación: portal, alta
  individual, carga masiva o enlace público. Nulo en las participaciones anteriores al 2026-09-21, que
  se leen como portal.
- **Detalle de origen** — un segundo dato de la participación. Hoy solo se escribe con el enlace
  público: `linkedin`, o `manual` para el enlace que el reclutador compartió por su cuenta.
- **Ficha de la persona** — el registro único de la persona. Su lista de portales acumula todos por
  los que llegó alguna vez, a cualquier oferta.

## Decisiones

Tomadas con el usuario el 2026-10-19.

1. **Estimación: 2 jornadas**, la del estratega. Al usuario le es indiferente.
2. **Una participación vieja de portal cuyo portal no se puede saber va a una fila «Portal sin
   identificar»**: cuando la persona y la oferta tienen dos o más portales en común, o ninguno. No se
   inventa el dato ni se reparte. Las nuevas no tienen el problema (decisión 7). Su tamaño se mide en
   la base antes del brief (punto H).
3. **Canales que salen en cero**: alta individual y carga masiva siempre; cada portal configurado y
   habilitado en la empresa; el enlace compartido si la empresa tiene el formulario público encendido;
   LinkedIn si tiene la cuenta vinculada. Un canal que ya no está disponible pero trajo gente en el
   periodo sale igual, con sus cifras.
4. **«En el periodo» es la creación de la oferta**, como el resto del panel (punto C).
5. **Se retira el campo viejo `atsPlatforms` de la respuesta de la analítica**, y el portal quita su
   respaldo. Comprobado el 2026-10-19: solo lo lee la pantalla de analítica, y solo ella llama a ese
   cálculo. 🔴 **Hay homónimos**: `atsPlatforms` también nombra la elección de portales del agente de
   WhatsApp y de Maya, y un campo de la configuración de las etapas en el portal. No tienen nada que
   ver: el retiro se hace editando, nunca con un buscar y reemplazar.
6. **Se conservan las columnas de viables** (número y tasa) en todos los canales.
7. **El portal se guarda a partir de ahora en el detalle de origen** que ya usa el enlace público,
   al vincular a alguien desde un portal. No se crea un campo nuevo.
8. **Nombres de las filas**: «Enlace compartido» («Shared link») para el enlace que el reclutador
   comparte por su cuenta, y «LinkedIn». El resto de etiquetas, en el brief del portal.
9. **Se avisa a Elvis** de que se toca su tabla. El planificador prepara el mensaje.
10. **Script de relleno para lo viejo** (usuario, 2026-10-19; punto I), en vez de deducir el portal
    cada vez que se abre la analítica. Escribe una sola vez, solo donde el dato está vacío:
    - una participación de portal cuya persona comparte **un solo** portal con la oferta → ese portal,
      en el detalle de origen (12.140 en producción);
    - una participación sin origen y marcada como añadida a mano que **pasó por la petición de hoja de
      vida** → origen carga masiva (1);
    - una participación sin origen y marcada como añadida a mano que no pasó por ella → origen alta
      manual (26 altas individuales y **17 candidatos sintéticos de demo**, que el sistema crea
      imitando un alta individual);
    - el resto se queda vacío → «Portal sin identificar» (unas 2.600).
    Los 17 de demo como alta manual: confirmado por el usuario el 2026-10-19. No se excluyen de la
    analítica: solo existen en empresas de demostración y la analítica es de cada empresa, así que
    nunca inflan las cifras de un cliente real.
11. **El candidato sintético del modo demo se guarda con origen alta manual** a partir de ahora. Hoy
    se crea sin origen y la tabla lo cuenta como portal. Va en el paso 1. Confirmado por el usuario el
    2026-10-19.

## Lo que dice el código y los documentos no

Comprobado leyendo `develop` el 2026-10-19 (backend `740f478`, portal `986bead`). La tabla de estado
de `requisitos.md` se sostiene punto por punto; estas son las correcciones y los matices.

- **A. 🔴 El cruce «por el identificador de la vacante» no existe** (corrige el planning). La lista de
  portales de la ficha guarda **el identificador de la persona en ese portal**, no el de la vacante:
  el contrato del robot lo describe como «plataforma + id externo» del candidato, y la base tiene un
  índice **único** sobre portal e identificador en toda la colección de personas, que chocaría con dos
  candidatos de la misma vacante. Con lo que hay guardado, para lo anterior solo se puede cruzar **qué
  portales tienen en común la persona y la oferta**. Si es uno, es ese; si son dos o más, o ninguno,
  no se puede saber.
- **B. El portal sí se conoce al vincular a alguien desde un portal.** La llegada desde un portal
  recibe del robot la plataforma y crea la participación con origen «portal», pero no guarda cuál.
  Guardarlo a partir de ahora es una línea en ese punto.
- **C. La participación no guarda cuándo llegó la persona.** No tiene fecha propia: solo la del cobro
  (que no todas tienen) y las de sus etapas. Filtrar por «llegada en el periodo» exigiría un dato
  nuevo, y lo anterior quedaría sin él.
- **D. La tabla solo está en el panel global.** El detalle de cada oferta no la tiene; para ver una
  oferta se elige en el filtro de Ofertas, como el resto del panel.
- **E. La tabla se esconde si no hay ningún canal con candidatos.** Con los ceros tiene que salir
  siempre.
- **F. El enlace público ya distingue LinkedIn del enlace compartido** en el detalle de origen, y lo
  que no reconoce lo guarda como compartido. LinkedIn no depende de nadie.
- **G. Hoy, la suma de las filas puede pasar del total de candidatos**: una persona que llegó por
  portal y tiene dos portales en su ficha suma en los dos.

- **H. Casi todas las participaciones de portal están en ofertas con dos portales** (consulta del
  usuario, 2026-10-19, presumiblemente en producción): 15 en ofertas sin ningún portal, 34 en ofertas
  con uno y **14.724 en ofertas con dos**. Medido después, cruzando cada participación con la ficha de
  su persona: **12.140 (82 %) comparten un solo portal con su oferta** y se resuelven; **1.230 (8 %)
  comparten dos**; **1.403 (10 %) no comparten ninguno**. Ese último grupo es sospechoso: sugiere que
  no todas llegaron por portal. Hipótesis en comprobación: las altas manuales anteriores al
  2026-09-21, que tienen el origen vacío y se leen como portal, pero llevan la marca de añadidas a mano.
  Según git, la marca de añadido a mano existe desde el 2026-07-15, la carga masiva desde el
  2026-09-02 y el origen desde el 2026-09-21: entre el 2 y el 21 de septiembre, también las cargas
  masivas llevan la marca y el origen vacío. Se distinguirían porque la carga masiva es lo único que
  hace pasar a la persona por la petición de hoja de vida (`cv_request`); el alta individual entra
  directa a las preguntas. **Comprobado en producción el 2026-10-19**: de las 11.463 participaciones
  sin origen, solo 44 llevan la marca: 26 altas individuales (agosto y septiembre), 1 carga masiva
  (septiembre, con la petición de hoja de vida) y 17 candidatos sintéticos de empresas en modo demo.
  Las otras ~1.360 del grupo sin portal en común llegaron de verdad por portal y no hay dato que diga
  cuál.
- **J. La marca de añadido a mano la ponen tres caminos**, no uno: el alta individual (desde el
  2026-07-15), la carga masiva (desde el 2026-09-02) y **el candidato sintético del modo demo** (desde el
  2026-09-08). 🔴 **El modo demo sigue creando hoy participaciones sin origen**, que la tabla cuenta como
  portal (decisión 11).
- **I. Rellenar en la base lo que se pueda deducir** (propuesta del usuario, 2026-10-19): un script
  que escriba una sola vez el portal en las participaciones viejas que se resuelven, en vez de
  deducirlo cada vez que se abre la analítica. Lo escribe el ejecutor, en el repositorio, con modo de
  prueba que solo cuenta, solo escribe donde el dato está vacío, idempotente y con pruebas; lo corre
  el usuario, primero en el servidor de pruebas y después en producción, con copia de seguridad
  antes. La base no tiene otro historial que diga el portal por oferta: las corridas de los robots no
  guardan el portal, y la ficha de la persona no dice a qué oferta llegó por cada uno.

## Fuera del alcance, a sabiendas

Pendiente de acordar con el usuario.

## Preguntas abiertas

Ver el registro de avance del 2026-10-19: se le presentan al usuario numeradas.

## Pasos

Rama `feat/candidates-by-channel`, desde `develop` (backend `740f478`, portal `986bead`), en los dos
repositorios. Pasos aprobados por el usuario el 2026-10-19.

| Paso | Qué | Repositorio | Estado |
| --- | --- | --- | --- |
| 1 | Guardar el origen completo: el portal al vincular desde un portal, el origen del candidato de demo (decisión 11), y el script de relleno con modo de prueba (decisión 10). **Tratamiento completo**: escribe en producción | backend | Brief escrito (`brief-paso1-origen-completo.md`) |
| 2 | La analítica: lee el origen guardado, separa LinkedIn del enlace compartido, los ceros y el retiro del campo viejo | backend | Propuesto |
| 3 | La tabla «Candidatos por canal», con un nombre por fila y visible siempre | portal | Propuesto |
| Cierre | Fusionar `develop`, desplegar, **correr el script justo después** (pruebas, luego producción, con copia de seguridad), pruebas a mano y avisar del cambio de cifras | los dos | Propuesto |

## Registro de avance

- **2026-10-19** — Bitácora creada. Leídos `requisitos.md` y `planning.md`, con sus secciones del
  2026-10-19; comprobada la tabla de estado contra `develop`. Corregido el cruce del planning (punto A).
  Ramas creadas en los dos repositorios, limpias y sin seguimiento a `develop`, para que un envío no
  acabe ahí. Sin brief.
- **2026-10-19** — Consulta del usuario sobre los portales de las ofertas (punto H). Decisiones 1 a 9.
  Pendiente: medir en la base cuántas participaciones quedan «sin identificar» (decisión 2) y el
  mensaje a Elvis.

## Antes de desplegar

- 🔴 **El script de relleno se corre justo después de desplegar el backend**: primero con `--dry-run`
  en el servidor de pruebas y después de verdad; luego en producción, **con copia de seguridad antes**,
  primero con `--dry-run`. Lo corre el usuario. Hasta que se corra, lo viejo sale como «Portal sin
  identificar» una vez desplegado el paso 2.

- **Avisar de que las cifras de los portales cambian, a la baja**: deja de contarse a una persona en
  un portal por otra oferta (`requisitos.md`, *Notas de alcance*).
- **Avisar a Elvis** de que se toca su tabla, y por qué.
