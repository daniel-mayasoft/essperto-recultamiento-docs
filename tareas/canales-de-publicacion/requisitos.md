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
