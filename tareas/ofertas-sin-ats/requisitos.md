# Requisito · Permitir crear ofertas sin ATS configurado

## La historia

Como **empresa cliente sin portales de empleo conectados**, quiero **poder crear una oferta igualmente**,
para **abastecerla por los canales que sí tengo**: carga masiva, carga individual y redes sociales.

## El problema

Hoy el sistema exige tener al menos un portal de empleo habilitado para crear una oferta. La carga masiva
y la carga individual están siempre disponibles, así que **siempre hay al menos un canal para conseguir
candidatos**: la validación bloquea sin motivo a quien no usa portales.

## Qué se pide

Quitar la exigencia de tener al menos un portal configurado. Basta con que haya **al menos un canal
disponible**, y siempre lo hay.

## Aceptación

- [ ] **Se puede crear una oferta sin ningún portal de empleo ni red social configurados** en la empresa.
- [ ] **La carga masiva y la carga individual están siempre disponibles**, así que siempre hay al menos un
      canal.
- [ ] Si la empresa **no tiene ningún portal ni red habilitados**, al crear la oferta se **advierte que los
      candidatos habrá que cargarlos a mano**.

> **Movido a otra tarea el 2026-09-23:** «se puede crear una oferta aunque se deshabiliten todos sus
> canales de publicación» pedía elegir canales por oferta, que hoy no existe. Pasa a
> `../canales-de-publicacion/`, que añade ese paso al asistente de creación.

## Lo que hay que decidir antes de implementar

Está en `planning.md`, con el mapa de dónde vive hoy cada pieza. Lo más importante: **una oferta sin
ninguna plataforma es un caso que hoy no existe en el sistema**, y hay que comprobar qué hacen con ella la
publicación, la extracción de candidatos y los informes.
