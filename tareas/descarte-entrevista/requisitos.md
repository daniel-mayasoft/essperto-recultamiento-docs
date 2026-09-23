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
