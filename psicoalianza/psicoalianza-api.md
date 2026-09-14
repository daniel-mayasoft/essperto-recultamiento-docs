# API de PsicoAlianza — contrato observado

Referencia técnica de los endpoints del portal de PsicoAlianza, capturados de su propio
tráfico web. **Las decisiones y las preguntas abiertas viven en `integrate-psicoalianza.md`**;
aquí va solo el detalle de cada petición y su respuesta, para no repetirlo en dos sitios.

> ⚠️ **No es una API pública ni versionada.** Es el mismo tráfico que usa el portal, así
> que puede cambiar sin aviso. Todo lo de abajo está observado, no documentado por el
> proveedor. Los nombres de campo son de ellos: son contrato con datos externos, no
> estilo nuestro, y no se traducen.

Base: `https://ats.psicoalianza.com`. Fecha de captura: 2026-09-09.

## Sesión y autenticación

- **La autenticación es un formulario web de Laravel, no un token.** Responde con un
  redirect y deja la sesión en cookies de servidor. No hay nada que decodificar. El
  login está protegido con reCAPTCHA v3 validado en el servidor — la mecánica para
  pasarlo está en `integrate-psicoalianza.md` (decisión 23) y en `../CAPTCHAS.md`.
- **Cookies que emite el login:**

  | Cookie | Vida | Para qué |
  | --- | --- | --- |
  | `ats_session` | pocas horas; **5 días** si se marca *permanecer conectado* | La sesión. `httpOnly`, no se ve desde JavaScript |
  | `XSRF-TOKEN` | igual que la sesión | Valor CSRF para los envíos. El portal lo renueva en `GET /obtener-token-csrf` |
  | `remember_web_<hash>` | 5 días | Solo aparece si se marca *permanecer conectado*. Con ella Laravel reautentica solo al caducar la sesión, sin login ni captcha |

- **Verificar que una sesión sigue viva:** `GET /login` con las cookies. Si redirige
  (302) a `/inicio`, está autenticada — Laravel echa del login a quien ya entró. Si
  devuelve 200 con el formulario, caducó.
- **Recorrido del usuario autenticado:** `/inicio` → `/vacantes` → `/procesos`. El
  trabajo vive bajo `/procesos`.
- **Soporta varias sesiones simultáneas:** una segunda no tumba la primera.
- **`remember_web_<hash>` sola sirve para los endpoints de datos** (medido el 2026-09-14 con
  `GET /procesos-listado-tabla`): sin `ats_session`, responde 200 con los datos y emite una
  `ats_session` nueva. **Sin ninguna cookie, el mismo endpoint responde 401** — y también emite
  una `ats_session`, de una sesión anónima, así que recibir esa cookie no prueba estar dentro.
- **Cómo llamar a los endpoints de datos:** mandar las cookies en la cabecera `Cookie`
  y `X-Requested-With: XMLHttpRequest`. Los listados son de la librería DataTables:
  responden un sobre `{ draw, recordsTotal, recordsFiltered, data[] }`.

## `GET /procesos-listado-tabla` — listado de vacantes

Lista los procesos (vacantes) de la empresa. Formato DataTables.

**Parámetros que importan** (los `draw` / `columns[...]` son ruido de la librería):

| Parámetro | Valor | Efecto |
| --- | --- | --- |
| `activo` | `true` | Procesos no archivados — **incluye Activo Y Completado** (112 procesos). ✅ **Sin el parámetro `activo`, el listado trae también los archivados** (medido el 2026-09-14: 118 = 113 no archivados + 5 con `activo: false`; con `activo=false`, solo esos 5, y uno de ellos en estado Activo). Para comprobar una vacante cualquiera, omitir `activo` y `estado_id` |
| `estado_id` | `2` | **Filtra a solo Activo** (17). Sin él, el listado trae también vacantes ya completadas. Para "vacantes a las que se puede invitar", va `activo=true` + `estado_id=2` |
| `orden` | `recientes` | Orden por fecha |
| `nombre` | texto | Filtro de búsqueda por nombre |
| `start` | entero | Desplazamiento de página |
| `length` | entero | Tamaño de página — ver paginación |

**Paginación — con trampas medidas:**

- **Omitir `length` devuelve todo sin tope** (17 activas con el filtro, 116 sin él, en
  una sola petición). Es la forma limpia de listar: el filtro de activas ya acota.
- Con `length` presente, pagina; el portal manda `length=10`.
- `length=-1` (la convención habitual de "todas") **tumba el backend con HTTP 500**.
- `length=0` devuelve cero filas.

**Respuesta — campos de cada vacante en `data[]`:**

| Campo | Tipo | Nota |
| --- | --- | --- |
| `id` | number | **Identificador de la vacante** (el que guardaríamos) |
| `nombre` | string | Nombre de la vacante |
| `estado_id` / `estado` | number / `{id, nombre}` | Estado del **proceso**: `2` = Activo, `3` = Completado. (Distinto del estado de la agenda) |
| `activo` | boolean | Archivado o no — un proceso Completado sigue con `activo: true` |
| `empresa` | `{id, razon_social}` | La empresa dueña |
| `cantidad_vacantes` | number | Plazas |
| `medio_envio` | string \| null | En todas las vacantes observadas: `"correo"` (alguna en `null`). No se ha visto otro valor — refuerza B2 |
| `participantes_total` / `_en_pruebas` / `_seleccionados` / `_descartados` / `_expirados` | number | Contadores del embudo |
| `duracion_total_pruebas` | number | Minutos |
| `pruebas` | array | **Las pruebas embebidas en la vacante** — `{id, nombre, slug, duracion, pivot}` |
| `pruebas_asociadas` | array | Igual, con `perfil_id`, `porcentaje` (peso) y `fecha_limite` por prueba |

**Lo que NO trae:** ningún campo de enlace, URL, token ni código de la vacante — solo
el `slug` de cada prueba. **El enlace del candidato no sale de aquí**; queda para la
invitación o un detalle aparte. *(Resuelto más abajo: se pide aparte con `POST
/regenerar-acceso-usuario/{usuario_id}`.)*

## `GET /participantes-proceso/{proceso_id}` — participantes y resultados de una vacante

Pese al nombre que uno esperaría, esta es **la consulta de resultados**: devuelve todos
los candidatos de una vacante con su puntaje, su etapa y el estado de cada prueba. Es
decir, **los resultados se consultan por vacante, no por candidato** (relevante para la
decisión 22 y A7). Parámetros vistos: `nombre` (búsqueda) y `recientes=1` (orden).

**Sobre:** `{ data[], empresa{} }`. `data[]` son los participantes; `empresa` repite los
datos de la empresa dueña.

**Campos de cada participante:**

| Campo | Tipo | Nota |
| --- | --- | --- |
| `id` | number | **Identificador del candidato** en PsicoAlianza (= `usuario_id` / `evaluado_id`). Es **global de la persona**, estable entre vacantes: el mismo documento tiene el mismo `id` en procesos distintos. Sus participaciones y agendas cuelgan por proceso |
| `documento` | string | Número de documento |
| `tipo_documento` | `{id, nombre, abreviatura}` | `1` = CC |
| `email` | string | Correo del candidato |
| `nombres` / `apellidos` / `telefono` | string \| null | Suelen venir vacíos: PsicoAlianza no los exige para invitar |
| `indice_talento` | string decimal | **El puntaje agregado de esa participación** (pondera sus pruebas **en esta vacante**). ✅ **Es por vacante, no de la persona** (medido el 2026-09-14: de 62 personas presentes en dos o más tableros, 58 tienen un índice distinto en cada uno, y en uno siguen en `-2.0` mientras en otro ya tienen nota). `-2.0` es centinela de "aún sin puntaje"; un positivo es real (`84.6`, `85.0`). El cron no debe leer `-2.0` como nota |
| `estado_id` | number | Estado del candidato (visto `1`) |
| `etapas_usuarios[].etapa` | `{id, nombre, orden}` | Etapa del candidato. **Se queda en `9` "En pruebas" aunque la prueba esté finalizada y recomendada** — no avanza sola. El aprobado/rechazado NO se lee de aquí |
| `agendas[]` | array | Una por prueba citada — ver abajo. **Aquí vive el resultado real** |

**Cada `agenda` (una prueba citada a un candidato):**

| Campo | Nota |
| --- | --- |
| `prueba` | `{id, nombre, slug, procesos_pruebas[]}` con su `perfil` y `porcentaje` (peso de la prueba en el agregado) |
| `proceso_id` | ✅ **La vacante de la agenda.** Medido el 2026-09-14 sobre los 118 tableros: las 2.121 agendas traen `proceso_id` y **todas son de la vacante del tablero**. El tablero de una vacante no mezcla pruebas que la persona tenga en otras. Trae además `id`, `estado_id`, `evaluado_id`, `prueba_id`, `perfil_id`, `perfil` y `digitacion_valida` |
| `estado` | `{id, nombre}`. Visto: `1` = Agendada, `3` = Finalizada, `4` = Expirada |
| `ajuste` | number \| null. La **nota fina** de esa prueba (`84.63`, `85.04`); `null` mientras no termine |
| `estado_recomendacion` | string. Visto: `"Pruebas pendientes"` (sin terminar), `"Recomendado"` (terminada) |
| `recomendacion` | number. Visto: `0` (pendiente), `3` (recomendado). **Este es el veredicto** que el cron traduce a aprobado/rechazado |
| `fecha_procesamiento` | timestamp \| null. Cuándo se calificó; `null` mientras esté pendiente |
| `fecha_inicio` / `fecha_cierre` | **La ventana de la prueba.** ~2 días; pasada `fecha_cierre` sin terminar, la agenda queda `Expirada` |

**Tampoco aquí hay enlace del candidato** — ni URL, ni token, ni código. *(Resuelto más
abajo: el enlace personal se pide aparte con `POST /regenerar-acceso-usuario/{usuario_id}`
y no depende del correo, así que la entrega por WhatsApp se sostiene.)*

**Catálogos, hasta ahora:**

- Agenda `estado`: `1` Agendada · `3` Finalizada · `4` Expirada. Faltan `2` y `5`+.
- `recomendacion`: `0` pendiente · `3` recomendado. Faltan los valores de "no
  recomendado" y demás bandas — un candidato reprobado los revelará.
- Etapa del candidato: solo se ha visto `9` "En pruebas". No se ha observado que avance.

## `GET /obtener-correo-usuario?documento={doc}` — ¿el documento ya tiene correo?

Consulta previa **obligatoria** antes de invitar: dado un número de documento, devuelve
el correo que la plataforma ya tiene registrado para esa persona, o `null` si no la
conoce.

- Respuesta: `{ "email": "..." }` o `{ "email": null }`.
- **La regla que impone la unicidad:** el correo es único por usuario en toda la
  plataforma. Al invitar, el par documento+correo tiene que ser consistente:
  - Si esta consulta devuelve un correo → el documento ya existe; hay que invitar **con
    ese mismo correo**. Mandar otro choca con "ya fue tomado".
  - Si devuelve `null` → documento nuevo; se le puede asignar un correo fresco, siempre
    que ese correo no pertenezca ya a otro documento.

## `POST /procesos-participantes/{proceso_id}` — invitar candidatos

**Es un lote**: `participantes` es un array, se puede invitar a varios de una vez.

**Cuerpo** (form): `_token` (CSRF), `proceso_id`, y opciones de la invitación:

| Campo | Ejemplo | Nota |
| --- | --- | --- |
| `dias_vencimiento_agendas` | `2` | **Aquí se fija la ventana de la prueba** — de aquí salen los ~2 días de `fecha_cierre` |
| `vigencia_pruebas` | `1` | Bandera de vigencia |
| `maneja_empresa` | `0` | |
| `titulo_mensaje` / `descripcion_mensaje` | texto / HTML | El mensaje del correo. ✅ **Lo que su portal manda por defecto, capturado el 2026-09-14** (abajo). El enlace del HTML va a `ats.psicoalianza.com` **genérico**, no al enlace personal del candidato |
| `informacion` | `{"medio_envio":{"valor":"correo"}}` | **El medio de envío se elige al invitar.** Único valor visto: `correo` |
| `participantes[]` | ver abajo | Los candidatos a invitar |

**Catálogo de `tipo_documento_id`**, leído el 2026-09-14 del `value` de cada opción del
desplegable del formulario de invitar. ⚠️ **El orden en que la lista los muestra no es su
número**: leer el `value`, nunca contar posiciones.

| `value` | Tipo |
| --- | --- |
| `1` | CC — Cédula de ciudadanía |
| `2` | TI — Tarjeta de identidad (menor de edad) |
| `3` | PA — Pasaporte |
| `4` | CE — Cédula de extranjería |
| `5` | OTRO |
| `6` | PEP — Permiso especial de permanencia |

**Cada participante:** `tipo_documento_id` (ver catálogo), `documento`, `email`,
`indicativo_celular`, `celular`, `telefono`, `indicativo_telefono` (los de teléfono,
opcionales, vistos en `null`).

🔴 **Cómo viaja `participantes`, capturado del portal el 2026-09-14** — y **no** es como lo armó
nuestro cliente:

- **El portal manda UN SOLO campo llamado `participantes` con el JSON entero dentro**, como texto:
  una lista de objetos con **las siete claves**, las cuatro de teléfono en `null`, y
  **`tipo_documento_id` como texto** (`"1"`, no `1`).
- Nuestro cliente lo manda como campos sueltos con índice (`participantes[0][documento]`, etc.) y con
  solo tres claves. ⚠️ **Esa forma funciona** —se invitó de verdad el 2026-09-14 y la persona apareció
  en el tablero—, pero **no es la del portal**, así que depende de que su backend siga aceptando las
  dos. **Se alinea con la del portal**, que es la única garantizada.

**El mensaje por defecto de su portal**, que es el que sus reclutadores usan y el candidato reconoce:

- **Asunto:** `Comienza tus pruebas`
- **Cuerpo** (HTML): un párrafo «¡Avanzas en el proceso, candidato!», otro diciendo que ha sido
  invitado a presentar las **pruebas psicométricas**, y un tercero con «Accede al detalle aquí:» y el
  enlace a `ats.psicoalianza.com`.

⚠️ **Ese cuerpo no nombra a la empresa que invita ni lleva el enlace personal del candidato**: manda
a la portada de la plataforma. Quien lo recibe tiene que saber ya de qué va. Con nosotros el enlace
personal llega por WhatsApp, así que este correo es un segundo aviso.

**Respuesta de error (400)** — formato observado:

```
{ "message": "...", "errors": "...", "agregados": 0,
  "errores_filas": [ { "documento", "email", "error" } ], "advertencias": [] }
```

**Respuesta de éxito (201):** `{ "message": "Participantes agregados correctamente",
"agregados": 1 }`. **No devuelve el `id` del candidato** — solo el conteo. Para obtener
el `id` hay que **buscarlo después** en `/participantes-proceso/{proceso}` casando por
documento (igual que el `findCandidateByExternalId` de EvaluaTest). **Confirmado:** tras
invitar, el candidato aparece en ese tablero con su `id`, su agenda `Agendada` y la
ventana de vencimiento fijada por `dias_vencimiento_agendas`.

**El correo es único por usuario en toda la plataforma.** El 400 fue *"ya fue tomado por
otro usuario"* (ese correo pertenecía a otro documento); la reinvitación con el par
documento+correo consistente dio 201. De ahí la consulta previa obligatoria de arriba.

**El enlace por candidato NO vuelve en la respuesta de la invitación** (solo el conteo),
pero **sí se puede obtener por la API** con un endpoint aparte — ver abajo. La
invitación además dispara el correo con el enlace, según `medio_envio`.

## `POST /regenerar-acceso-usuario/{usuario_id}` — enlace personal del candidato

Devuelve el **enlace de acceso personal** de un candidato, el que le permite entrar a
presentar sus pruebas. `{usuario_id}` es el `id` global del candidato (p. ej. `65299`).

- Método: **POST**. Responde 200 **tanto si el candidato ya está registrado como si
  no** — se puede regenerar siempre.
- Respuesta: `{ "data": { "enlace": "https://ats.psicoalianza.com/control-acceso/{uuid}" } }`.
- **El enlace lleva a presentar las pruebas.** Al abrirlo, el candidato entra a su vista
  de tareas pendientes (que consulta `GET /vacantes-aplicante` — lado del candidato, no
  lo consumimos nosotros) con sus pruebas agendadas. Confirmado.
- El `uuid` es personal por candidato. ~~**"Regenerar" sugiere que cada llamada emite un
  enlace nuevo y probablemente invalida el anterior**~~ ✅ **Confirmado por el usuario el
  2026-09-14: pedir el enlace por aquí NO invalida el botón «Comenzar» del correo que
  PsicoAlianza manda al invitar**; los dos llevan a la misma pantalla de tareas pendientes
  del candidato. Se sigue pidiendo una vez, guardando y entregando, y no en cada pasada
  del cron.
- **Esto es lo que rescata la entrega por WhatsApp** (B2): el enlace no depende del
  correo, se pide con el `id` del candidato y se reenvía por el canal que sea.
