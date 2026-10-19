# Requisito · Candidatos por canal en analítica

## Qué se pide

La métrica «candidatos obtenidos por ATS» pasa a ser **«Candidatos por canal»** e incluye, junto a los
portales de empleo, la **carga individual**, la **carga masiva** y **LinkedIn**.

## Aceptación

- [ ] La métrica se renombra a **«Candidatos por canal»**.
- [ ] Muestra **cada canal por separado**: cada portal de empleo, carga individual, carga masiva y LinkedIn.
- [ ] Un candidato que llegó a la misma oferta por varios canales **se atribuye al canal del registro
      conservado, el primero**.
- [ ] **Respeta los filtros existentes**: empresa, oferta, grupo de ofertas, rango de fechas y estado.
- [ ] **Los canales sin candidatos en el periodo se muestran en cero.**

## 🔴 Actualizado el 2026-10-19: buena parte ya está hecha (comprobado en el código)

**Elvis añadió el 2026-09-30 una tabla «Calidad por canal de entrada»** en la analítica (commit `054a480`).
Leído en `develop` (backend `740f478`, portal `986bead`), punto por punto contra la aceptación:

| Punto de aceptación | Estado hoy |
| --- | --- |
| El nombre «Candidatos por canal» | ❌ Se llama «Calidad por canal de entrada» |
| Cada portal por separado | ⚠️ Sí hay una fila por portal, pero **el portal sale de la ficha de la persona**, no de esta oferta: una persona que llegó por dos portales a lo largo de su vida suma en los dos, aunque a esta oferta llegara por uno, y puede sumar en un portal por otra oferta |
| Carga individual y carga masiva | ✅ Fila propia cada una, por el origen guardado en esta oferta |
| LinkedIn | ❌ No tiene fila. Sus candidatos entran por el **enlace público**, con LinkedIn guardado como detalle de origen, y caen todos en una fila «Public link», sin separar LinkedIn de lo compartido a mano. Esa fila además sale sin traducir |
| El primer registro, si llegó por varios canales | ✅ para los canales manuales y el enlace público, porque una persona tiene una sola participación por oferta. ❌ para los portales, por lo del punto «cada portal» |
| Los filtros existentes | ✅ Se aplican, igual que al resto del panel. ⚠️ El rango de fechas mira la creación de la oferta, no la llegada del candidato |
| Los canales sin candidatos en cero | ❌ Solo salen los canales que tienen algún candidato |

**Lo que queda**, en resumen: el nombre, el portal por oferta y no por persona, LinkedIn separado del
resto del enlace público, los ceros, y la traducción de la fila del enlace público. **La estimación de
2,5 jornadas sobra**: hay que rehacerla con esto y proponérsela al usuario antes de empezar (ver
`planning.md`).

⚠️ **«Canales de publicación» sigue abierta** (paso 7 en curso el 2026-10-19). No toca la analítica, pero sí
la creación de la oferta y sus portales: rama aparte y cuidado al fusionar `develop`.

## Relación con otras tareas

- **LinkedIn (Elvis)**: ~~todavía no existe~~ **existe desde el 2026-10-01**, modelado aparte de los
  portales; sus candidatos llegan por el enlace público (ver arriba). Ver también
  `../canales-de-publicacion/planning.md`.

Lo que hay que decidir antes de implementar está en `planning.md`.

## Alcance y estimación acordados (2026-09-23)

Lo que se preparó para la dirección. **Planificar dentro de este alcance**: si algo no cabe, se avisa
antes, no se amplía en silencio.

### Entendimiento de la tarea

**Situación actual.** Hoy la analítica solo reporta los candidatos que llegan por los portales de empleo.
Los que se incorporan por carga individual o masiva quedan fuera de la métrica, así que no hay una vista
completa de cuánto aporta cada canal ni forma de compararlos entre sí.

**Situación deseada.** La métrica pasa a llamarse «Candidatos por canal» y muestra por separado cada
portal de empleo, la carga individual, la carga masiva y LinkedIn. Cada candidato se atribuye al canal por
el que llegó primero a la oferta. La métrica respeta los filtros existentes, y los canales sin candidatos
se muestran en cero.

**Resultado esperado.** Se puede comparar el volumen y la calidad de los candidatos que aporta cada canal,
incluidos los manuales.

### Implementación técnica

El sistema ya registra por qué vía entró cada candidato a cada oferta, pero sin distinguir qué portal
concreto. El backend pasa a registrar también el portal a partir de ahora, y lo deduce para los registros
anteriores cruzando la información de la oferta con la del candidato. La métrica se reescribe sobre ese
dato, por oferta y no por candidato, lo que además corrige que una persona pudiera sumarse a un portal por
su participación en otra oferta.

El portal renombra la tabla y muestra todos los canales, incluidos los que están en cero.

### Estimación (propuesta, sin confirmar por el usuario)

| Frente | Jornadas |
| --- | --- |
| Backend | 1 |
| Portal | 0,5 |
| Testeo y despliegue | 1 |
| **Total** | **2,5** |

### Notas de alcance comunicadas

- **Las cifras de los portales cambiarán**, previsiblemente a la baja: la métrica actual cuenta candidatos
  de otras ofertas y la nueva lo corrige. Hay que comunicarlo a quien consulta la analítica.
- **LinkedIn se muestra en cero hasta que esté integrado.** Su integración debe registrar LinkedIn como
  canal de origen; se decide en **la reunión única con Elvis**, compartida con las dos tareas de canales.

### Decisiones abiertas (ver `planning.md`)

- Qué portal se atribuye cuando el cruce de lo anterior da dos.
- Si «en el periodo» es la fecha de creación de la oferta, como filtra hoy, o la de llegada del candidato.
- Qué canales se muestran en cero: todos los soportados o solo los configurados en la empresa más las dos
  cargas manuales (recomendado lo segundo).

### Punto de partida

Rama nueva desde `develop`. No depende de las otras tres para empezar. Casi todo es lectura, salvo una
escritura nueva: guardar el portal concreto de origen cuando llega un candidato desde un portal.
