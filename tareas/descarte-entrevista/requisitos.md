# Requisito · Estructurar la causal de descarte tras la entrevista

## La historia

Como **responsable de una oferta**, quiero **elegir una causal al descartar a un candidato tras la
entrevista**, para que **la analítica muestre por qué se pierden los candidatos en la etapa final**.

## El problema

Hoy, al descartar a alguien después de la entrevista, el responsable escribe el motivo en texto libre.
Eso impide agregar los motivos en la analítica: cada descarte queda como una cadena distinta, y dos
personas que descartan por lo mismo escriben cosas diferentes.

## Qué se pide

Un **selector de causal** con una **lista fija**, y el texto libre se conserva como **detalle
complementario**.

## Las causales

La lista la define Essperto-R y es **la misma para todas las empresas**:

1. No se presentó a la entrevista
2. Desistió del proceso
3. No cumple el perfil técnico
4. No cumple competencias blandas
5. Presentación personal inadecuada
6. Conducta inapropiada
7. Expectativa salarial fuera de rango
8. Disponibilidad incompatible
9. Se seleccionó a otro candidato
10. Otro

## Aceptación

- [ ] Al descartar a un candidato tras la entrevista, el responsable **elige una causal de la lista fija**.
- [ ] La lista es **definida por Essperto-R, igual para todos los tenants**: la empresa no la configura ni
      la amplía.
- [ ] El **detalle en texto es opcional** para todas las causales y **obligatorio para «Otro»**.
- [ ] **No se puede guardar el descarte sin causal.**
- [ ] La analítica puede **agrupar los descartes por causal**.

## Lo que hay que decidir antes de implementar

Está en `planning.md`, con el mapa de dónde vive hoy cada pieza. Lo más importante: **hoy el detalle en
texto es obligatorio en todo descarte**, así que volverlo opcional cambia un comportamiento que ya
funciona, y **los descartes ya guardados no tienen causal**.

## Alcance y estimación acordados (2026-09-23)

Lo que se le comunicó a la dirección, tal cual quedó. **Planificar dentro de este alcance**: si algo no
cabe, se avisa antes, no se amplía en silencio.

### Entendimiento de la tarea

**Situación actual.** Al descartar a un candidato después de la entrevista, el responsable de la oferta
registra el motivo en un campo de texto libre, obligatorio. Cada persona lo redacta a su manera, por lo que
no es posible agrupar ni medir los motivos: la analítica no puede mostrar por qué se pierden los candidatos
en la etapa final.

**Situación deseada.** El descarte pasa a registrarse con una causal seleccionada de una lista fija de diez
opciones, definida por Essperto-R e igual para todos los clientes. El texto se conserva como detalle
complementario, opcional en todas las causales y obligatorio únicamente en «Otro». No se puede guardar un
descarte sin causal.

**Resultado esperado.** Los descartes quedan clasificados de forma homogénea, y la analítica puede mostrar
la distribución de motivos de pérdida en la etapa final del proceso.

### Implementación técnica

El backend incorpora la lista de causales como un catálogo cerrado en código, no configurable por cliente,
y la participación del candidato en la oferta gana un campo nuevo para almacenarla.

El portal incorpora el selector de causal en la ventana de rechazo, y deja el texto como campo opcional; la
confirmación permanece bloqueada hasta que haya causal. En la ficha del candidato se muestra la causal y,
debajo, el detalle cuando exista.

La analítica agrega un corte nuevo que agrupa los descartes de la etapa final por causal, con el mismo
filtro por oferta que el resto de indicadores. Los descartes registrados antes del cambio no tienen causal
y se presentan en un grupo aparte, sin asignarles ninguna.

### Estimación (confirmada por el usuario)

| Frente | Jornadas |
| --- | --- |
| Backend | 0,5 |
| Portal | 0,5 |
| Analítica | 1 |
| Testeo y despliegue | 1 |
| **Total** | **3** |

### Decisiones ya tomadas

- **La analítica entra en esta tarea.** Sin ella la historia no se cumple.
- **El detalle deja de ser obligatorio**, salvo en «Otro». Es un cambio visible sobre un flujo en
  producción, asumido a propósito.
- **Los descartes anteriores no reciben causal**: se muestran en un grupo aparte, «sin causal».
- **La causal es solo del rechazo**, no del «contratado».

### Decisiones abiertas (ver `planning.md`)

- Si la decisión de contratación sigue siendo definitiva e imposible de corregir (recomendado: dejarla así
  y anotarlo).
- Si la auditoría guarda también la causal (recomendado: sí).

### Punto de partida

Rama nueva desde `develop`, que ya incluye los pasos 10 a 12 de PsicoAlianza y la fusión del trabajo de
plazos y recordatorios de la prueba psicométrica.
