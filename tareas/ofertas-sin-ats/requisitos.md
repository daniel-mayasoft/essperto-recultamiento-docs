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

## Alcance y estimación acordados (2026-09-23)

Lo que se preparó para la dirección. **Planificar dentro de este alcance**: si algo no cabe, se avisa
antes, no se amplía en silencio.

### Entendimiento de la tarea

**Situación actual.** El sistema exige tener al menos un portal de empleo habilitado para poder crear una
oferta. Si la empresa no tiene ninguno, los botones de crear oferta, crear con IA y copiar oferta aparecen
deshabilitados, y la API rechaza la creación. La carga masiva y la carga individual de candidatos, en
cambio, están siempre disponibles, por lo que la empresa siempre dispone de al menos un canal para
abastecer la oferta.

**Situación deseada.** Se elimina la exigencia de tener un portal configurado. Una empresa puede crear
ofertas sin ningún portal ni red social habilitados, y abastecerlas por carga masiva, carga individual o
redes sociales. Al crear la oferta sin canales de publicación habilitados, el sistema advierte que los
candidatos deberán cargarse manualmente.

**Resultado esperado.** Las empresas que no operan con portales de empleo pueden usar el sistema sin un
bloqueo que no responde a ninguna necesidad real del proceso.

### Implementación técnica

El backend elimina la validación que impide crear la oferta sin plataformas habilitadas. La oferta pasa a
admitir la lista de plataformas vacía, un caso que hoy solo se da en modo demostración. Se revisan y
ajustan los procesos que recorren esas plataformas —publicación, extracción de candidatos e informes por
plataforma— para que una oferta sin ninguna se comporte correctamente y no genere alertas falsas al
reclutador.

El portal habilita los botones de creación, sustituye el aviso actual por el que indica que los candidatos
deberán cargarse a mano, y revisa los valores por defecto del formulario de oferta, que hoy proponen un
portal preseleccionado.

Los dos canales manuales, carga masiva y carga individual, se verifican para confirmar que no dependen en
ningún punto de que la oferta tenga plataformas asociadas.

### Estimación (propuesta, sin confirmar por el usuario)

| Frente | Jornadas |
| --- | --- |
| Backend (validación y comportamiento con cero plataformas) | 1 |
| Portal | 0,5 |
| Testeo y despliegue | 1 |
| **Total** | **2,5** |

El backend lleva una jornada y no media porque el riesgo no está en quitar la validación, sino en el caso
nuevo que habilita: ofertas sin ninguna plataforma.

### Decisiones ya tomadas

- **Elegir canales por oferta no es de esta tarea**: pasó a `../canales-de-publicacion/`.
- **LinkedIn no se prepara aquí.** Si entra como un canal más en la configuración de la empresa, esta
  tarea lo contempla sola; si entra aparte, su integración lo suma a la misma comprobación. Se decide en
  **una reunión única con Elvis**, compartida con las tareas de canales de publicación y candidatos por
  canal.
- **El aviso habla de «canales de publicación», no de «ATS»**, para que no haya que cambiarlo cuando entre
  LinkedIn.

### Punto de partida

Rama nueva desde `develop`. **Va antes que `../canales-de-publicacion/`**, o junto con ella: las dos
comparten el caso «oferta sin ninguna plataforma».
