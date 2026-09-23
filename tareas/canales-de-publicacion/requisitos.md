# Requisito · Paso de canales de publicación al crear la oferta (ATS y LinkedIn)

## La historia

Como **responsable de una oferta**, quiero **elegir en qué canales se publica al crearla**, para **decidir
dónde difundo cada vacante sin depender de la configuración global**.

## El problema

Hoy la oferta se publica en todos los portales configurados en la empresa, sin que nadie elija dónde. Con
la llegada de LinkedIn y la configuración de canales por empresa, hace falta un punto en la creación donde
el responsable confirme o ajuste los canales de esa oferta en concreto.

## Qué se pide

Un paso nuevo en el asistente de creación que muestra los canales disponibles, **precargados con la
configuración por defecto de la empresa**.

## Aceptación

- [ ] La creación de la oferta incluye **un paso de canales de publicación, al final**.
- [ ] **Los canales por defecto son los configurados en la empresa**, y el responsable puede cambiarlos.
- [ ] **Un canal no configurado en la empresa aparece deshabilitado**, con la indicación de que hay que
      configurarlo.
- [ ] **La oferta se publica solo en los canales elegidos.**
- [ ] **Se puede crear la oferta con todos los canales desmarcados**: se abastece por carga masiva o
      individual (viene de «Ofertas sin ATS»).

## Relación con otras tareas

- **Ofertas sin ATS**: el caso «ningún canal elegido» es el mismo caso nuevo que abre esa tarea (ofertas
  sin plataformas). Conviene hacerla antes o junto con esta.
- **LinkedIn (Elvis)**: el paso tiene que mostrarlo, y eso depende de cómo lo integre. Ver `planning.md`.

Lo que hay que decidir antes de implementar está en `planning.md`.

## Alcance y estimación acordados (2026-09-23)

Lo que se le comunicó a la dirección. **Planificar dentro de este alcance**: si algo no cabe, se avisa
antes, no se amplía en silencio.

### Entendimiento de la tarea

**Situación actual.** Los canales de publicación se configuran una sola vez, a nivel de empresa. Al crear
una oferta, el sistema la publica automáticamente en todos los portales habilitados, sin que el responsable
elija dónde.

**Situación deseada.** El asistente de creación incorpora un paso final de canales de publicación,
precargado con los canales configurados en la empresa. El responsable puede confirmarlos o ajustarlos para
esa oferta en concreto. Los canales no configurados en la empresa se muestran deshabilitados, con la
indicación de que deben configurarse. La oferta se publica únicamente en los canales elegidos.

**Resultado esperado.** Cada vacante se difunde solo donde el responsable decide, sin depender de la
configuración global de la empresa.

### Implementación técnica

El backend pasa a guardar en la oferta los canales elegidos, validando que cada uno esté configurado y
habilitado en la empresa. Hoy, al publicar, cada portal solo verifica que esté habilitado en la
configuración de la empresa. Con el cambio, además, verifica que haya sido elegido para esa oferta. La
regla se aplica en los tres portales y en todo momento en que la oferta se publica: al crearla, al
republicarla y al reintentar una publicación fallida.

El portal incorpora el paso nuevo al final del asistente de creación, con los canales de la empresa
marcados por defecto y los no configurados deshabilitados. El paso aplica igual al crear una oferta, al
crearla con IA y al copiar una existente.

### Estimación (confirmada por el usuario)

| Frente | Jornadas |
| --- | --- |
| Backend (incluye el punto único de decisión de publicación) | 1,5 |
| Portal | 0,5 |
| Testeo y despliegue | 1 |
| **Total** | **3** |

### Decisiones ya tomadas

- **Punto único de decisión de publicación.** Dentro de esta tarea, y por eso el backend lleva 1,5
  jornadas: una sola función que recorre los canales elegidos de la oferta y llama a la publicación de cada
  portal, usada al crear, al republicar y al reintentar. La forma en que publica cada portal no se toca.
  Detalle en `planning.md`.
- **La capa completa de portales queda fuera** (adaptadores, extracción, archivado y credenciales desde un
  solo sitio): compensa cuando un cuarto canal necesite lo mismo que los tres de hoy.
- **Solo en la creación.** Cambiar los canales de una oferta ya publicada queda fuera.
- **LinkedIn no está incluido.** Se muestra como un canal más si se integra en la misma configuración de la
  empresa; se decide en **la reunión única con Elvis**, compartida con las otras dos tareas de canales.
- **El documento para la dirección no menciona deuda técnica ni autores.** Se presenta como una decisión
  de diseño de esta tarea.

### Punto de partida

Rama nueva desde `develop`, **después de `../ofertas-sin-ats/` o junto con ella**.
