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

## Relación con otras tareas

- **LinkedIn (Elvis)**: el canal LinkedIn todavía no existe en el sistema. Hasta que se integre, aparece en
  cero. Ver `planning.md`.

Lo que hay que decidir antes de implementar está en `planning.md`.
