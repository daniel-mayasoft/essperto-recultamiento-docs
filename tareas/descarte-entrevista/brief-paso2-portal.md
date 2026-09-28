# Brief · Paso 2 — la causal en el portal

Para quien ejecuta este paso. **Toca el embudo desde la pantalla**: cambia lo que hace una persona real
al rechazar a un candidato. Según `../psicoalianza/arranque-del-ejecutor.md`, lleva el tratamiento
completo. Solo portal.

Antes de empezar, lee `../../CLAUDE.md`, el arranque del ejecutor y **`bitacora.md`**: decisiones 1 a
24, puntos A a G y *Fuera del alcance*. `planning.md` es el mapa del código del portal.

> Escrito el 2026-09-27 sobre `284a0f1` del portal (la rama del frente, igual a `develop`, con el fin
> del flujo de revelar), leyendo la ventana de rechazo, la ficha del candidato en la oferta, la página
> Candidatos, los tipos, los textos, las etiquetas de los motivos del embudo y la pestaña de auditoría.

## Rama y orden

`feat/hiring-rejection-reason` **del portal**. Árbol limpio y al día. **Su propio commit, sin PR a
`develop`**: se fusiona junto con el backend (bitácora, *Antes de desplegar*). **Depende del backend de
los pasos 1b y 1d**: sin ellos no hay causal que guardar ni código `recruiter_rejected` que mostrar.

## 🔴 El alcance: solo el rechazo

**La contratación no se toca**: el botón «Marcar como contratado» y lo que hace siguen como hoy, en
todos los candidatos, aunque compartan sección con el rechazo (bitácora, *Fuera del alcance*).

## Qué le pasa a Marta

| Situación | Hoy | Después de este paso |
| --- | --- | --- |
| Rechaza a alguien | Escribe un texto obligatorio | Elige una causal de la lista; el texto es opcional, salvo con «Otro» |
| Mira la ficha de alguien rechazado | Ve el texto bajo «Razón de rechazo» | Ve la causal y, debajo, el texto si lo hay. Un rechazo antiguo se ve como hoy |
| Mira la ficha de alguien que el agente ya descartó | Ve los dos botones | Ve solo «Marcar como contratado» (decisión 22) |
| Mira a Luis, rechazado a mitad del proceso | — | Su estado dice «Rechazado por el reclutador», no un código crudo |

## Qué se hace

### 1 · La lista en el portal

Un archivo nuevo en `app/lib/` con los **diez códigos de la decisión 2, en ese orden**, y el tipo que
sale de ellos. Es la única fuente de la lista en el portal: el selector, las fichas y los tipos la usan.
Los códigos son contrato con el backend: se escriben **exactamente** como allí.

### 2 · Los tipos

En `app/lib/models.ts`, la participación de la oferta y el proceso de la página Candidatos suman
`hiringOutcomeReason`, con el tipo de la lista más el nulo.

### 3 · La ventana de rechazo (decisiones 5 y 6)

En la ficha de la oferta:

- **Un selector de causal**, obligatorio, con las diez etiquetas en el orden de la lista.
- **El detalle**, ahora opcional: la etiqueta lo dice. Con «Otro», pasa a obligatorio y lo indica.
- **Confirmar** queda apagado sin causal, o con «Otro» y el detalle vacío o solo con espacios.
- Lo que se manda: el desenlace, la causal (`reason`) y el detalle (`note`), vacío si no hay.
- Al cerrar o cancelar, la ventana olvida la causal y el detalle, como hoy olvida el texto.
- **Los errores del backend se muestran como hoy**, tal cual llegan.

El texto de aviso de la ventana («ya ocupa una plaza facturada») es inexacto y **no se toca**: está en
*Fuera del alcance*.

### 4 · El botón de rechazar, solo donde se puede (decisión 22)

«Marcar como rechazado» **no aparece** si el estado del candidato es descartado (`REJECTED` o
`DISCARDED`). **«Marcar como contratado» sigue apareciendo como hoy.**

### 5 · La causal en las dos fichas (decisiones 8 y 11)

- **Ficha del candidato en la oferta**: bajo «Razón de rechazo», primero la etiqueta de la causal y
  debajo el detalle si lo hay.
- **Página Candidatos**: lo mismo en cada proceso rechazado.
- **Rechazo antiguo, sin causal**: se ve exactamente como hoy, solo con el texto. Sin etiqueta de «sin
  causal».

### 6 · El código nuevo del embudo

`recruiter_rejected` necesita su etiqueta en `app/lib/status-labels.ts`, en la tabla de códigos del
embudo, y su texto en `es.ts` y `en.ts` bajo `rejection`: «Rechazado por el reclutador» / «Rejected by
the recruiter». Sin eso, el estado de Luis se ve como el código crudo (el encabezado del enum del
backend lo avisa).

La vista del embudo dentro de la propia oferta cuenta a Luis como descartado en la etapa donde estaba.
Es la vista del proceso de esa oferta, no el panel de analítica, y decir que salió ahí es cierto: **no
se toca**. Si al trabajar crees que debería, dilo en la opinión previa.

### 7 · La causal en la pestaña de auditoría

La pestaña solo aparece en el modo de desarrollo y muestra los datos del registro tal cual. Para la
clave `reason` de las entradas de rechazo, el valor se muestra **con el código y la etiqueta juntos**:
`salary_expectation_mismatch — Expectativa salarial fuera de rango` (decidido por el usuario el
2026-09-27). **Solo esa clave**: el nombre de la clave, la acción y el resto de la pestaña quedan como
están.

### 8 · Los textos

En `es.ts` y `en.ts`, bajo `candidates.hiringOutcome`: el título del selector, las diez etiquetas, la
etiqueta del detalle opcional y el aviso de detalle obligatorio con «Otro». Las etiquetas en español son
**las de la decisión 2, al pie de la letra**. En inglés:

| Código | Inglés |
| --- | --- |
| `no_show` | Did not attend the interview |
| `withdrew` | Withdrew from the process |
| `technical_profile_mismatch` | Does not meet the technical profile |
| `soft_skills_mismatch` | Does not meet the soft skills |
| `inappropriate_appearance` | Inappropriate personal presentation |
| `inappropriate_conduct` | Inappropriate conduct |
| `salary_expectation_mismatch` | Salary expectation out of range |
| `availability_mismatch` | Incompatible availability |
| `other_candidate_selected` | Another candidate was selected |
| `other` | Other |

## 🔴 Dónde se para — qué NO se hace

- **Nada de la contratación.**
- **Nada de la analítica**: es el paso 3.
- **No se toca el aviso inexacto de la ventana** ni se refactoriza la ficha de la oferta, que es un
  archivo enorme: solo lo necesario, en su sitio.
- **Boy scout** (decisión 19): solo importaciones sin usar en los archivos tocados.
- **Sin comentarios** en el código, **sin formateador**, **sin PR a `develop`**.

## Opinión previa del ejecutor (2026-09-27), verificada e incorporada

| Punto | Decidido |
| --- | --- |
| Contratar y rechazar usan la misma función del portal | **Se le añade la causal como dato opcional.** La petición de contratar sale idéntica, y el reporte lo confirma |
| Luis no tiene un «estado» que diga «Rechazado por el reclutador» | Correcto: sale en la columna «Motivo de descarte». Corregido el caso en `pruebas-a-mano.md` |
| La página Candidatos no tiene el título «Razón de rechazo» | La causal va **dentro del aviso que ya existe**, encima del detalle, sin título nuevo. Un rechazo antiguo queda idéntico |
| La etiqueta del código nuevo aparece también en otros tres sitios | Correcto y deseable. La exclusión de las cifras del agente sigue siendo del paso 3 |
| El embudo de la oferta | No se toca |
| Comentario falso en los tipos del portal | Se deja: no es de este cambio |
| Las pruebas a mano no se pueden correr en local | **Se corren en el servidor de pruebas**, con números del equipo. Lista rehecha con el orden, los casos que faltaban y qué buscar en el log |
| Punto 7, la auditoría | **Código y etiqueta juntos**, solo en la clave `reason` (usuario) |
| La contratación | Sin cambios fuera de la función compartida |

**Se puede empezar.**

## Verificación

`npm run typecheck`, una vez sobre el conjunto. 🔴 **El portal no tiene pruebas automáticas**: la
comprobación de tipos no dice nada de lo que ve Marta. Los casos a mano están en
**`pruebas-a-mano.md`**, en esta carpeta; los corre una persona, todos juntos, con backend y portal de la
rama levantados, antes de desplegar. **Recórrelos en la opinión previa** contra el código y dime si falta
alguno o si alguno no se puede preparar.

## Qué entregar

1. Qué cambió y el resultado real de la comprobación de tipos.
2. **Confirmación de que la contratación no cambió**: ninguna línea de su botón ni de su llamada.
3. Los textos nuevos, en los dos idiomas, copiados del código.
4. La lista de identificadores nuevos y el nombre del archivo nuevo, mirada abriendo cada archivo.
5. **Qué decisiones tomaste que no estaban en el brief.**
6. Archivos nuevos en el índice, e índice y árbol coincidiendo.
7. Un mensaje de commit para el portal.
