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

## 🔴 Actualizado el 2026-10-07: buena parte ya está hecha

**Elvis añadió el 2026-09-30 una tabla «Calidad por canal de entrada»** en la analítica (commit `054a480`,
en `develop`). Ya cuenta cada candidato por su origen **en esta oferta**: la carga individual, la carga
masiva y el enlace público tienen su propia fila, y los de portal se reparten por portal. Antes de
planificar hay que releer el código y ver qué queda de esta lista. Lo que se ve desde fuera, sin
comprobar todavía:

- **Probablemente hecho**: cada canal manual en su fila, y el origen por oferta.
- **Probablemente pendiente**:
  - el nombre, que es «Calidad por canal de entrada» y no «Candidatos por canal»;
  - **los portales siguen saliendo de la ficha de la persona**, así que se mantiene el doble conteo por
    otras ofertas que describe `planning.md`;
  - **LinkedIn no tiene fila propia**: sus candidatos entran por el enlace público, con LinkedIn como
    detalle de origen, y caen en la fila del enlace público;
  - los canales sin candidatos en cero.

**La estimación de 2,5 jornadas probablemente sobra.** Hay que rehacerla con lo que de verdad falte y
proponérsela al usuario antes de empezar.

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
