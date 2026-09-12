# Essperto Reclutamiento — contexto general

## Qué hace

Automatiza el reclutamiento de punta a punta. La empresa crea una oferta; el sistema
la publica en portales de empleo, recoge las hojas de vida, contacta a cada candidato
por WhatsApp y lo pasa por filtros hasta dejarlo agendado en una entrevista.

El candidato solo ve la conversación de WhatsApp. El portal es para el reclutador.

## Repositorios

- `esscoti-backend` — NestJS sobre MongoDB. Toda la lógica. API en `/docs`.
- `esscoti-frontend` — React Router 7 con Material UI. El portal del reclutador.

⚠️ **Cada carpeta es su propio repositorio git, y la raíz del workspace no lo es.**
Esta carpeta de documentación también es un repositorio aparte.

## Verificación

- Backend: `npm run build` y `npm test`.
- Frontend: `npm run typecheck`.

🔴 No correr `npm run lint` en el backend: está definido con corrección automática y
reformatea archivos que nadie tocó.

## Vocabulario

- **Tenant** — la empresa cliente. Casi todo se configura por tenant; el valor de
  entorno solo aplica si el tenant no lo define.
- **Oferta** — la vacante. Tiene plazas; cuando se llenan, se cierra.
- **Candidato** — la persona, que existe una sola vez y participa en varias ofertas.
  El estado de la conversación vive en su participación, no en la persona.
- **ATS** — los portales de empleo: Computrabajo, elempleo, Pandapé.
- **Robot** — procesos externos que operan esos portales. No corren aquí.

## Dónde está lo importante

El embudo de etapas —publicación, captación, compatibilidad, preguntas por WhatsApp,
prueba psicométrica, verificación de requisitos, documentos, agendamiento— tiene su
**fuente única en `stage-order.ts`**. Cualquier cambio de etapas empieza ahí.

El recorrido del candidato está en `pipeline-orchestrator.service.ts`, el archivo más
grande del proyecto.

La **prueba psicométrica habla con su proveedor a través de una capa propia**, en
`src/offers/psychometrics/`: un puerto que no conoce a ningún proveedor, el adaptador de
EvaluaTest que envuelve su cliente, y los tipos del contrato. El arranque de la etapa y el
cron de resultados del orquestador pasan por ahí. **El modo demo es la excepción a
propósito**: sigue siendo un condicional dentro del embudo. El detalle y el porqué están en
`psicoalianza/integrate-psicoalianza.md`.

## Al leer el código

Los comentarios largos casi siempre documentan una trampa averiguada en producción, no
la lógica de negocio. Antes de simplificar uno, leerlo. Los `.spec` son la mejor
documentación de comportamiento que hay.

## Deuda conocida

- Hubo una credencial real de un proveedor externo como valor por defecto en el esquema
  de entorno del backend. **Ya no está en el código** —hoy esos valores por defecto están
  vacíos, comprobado en `develop` y en la rama de trabajo—, pero **sigue en el historial de
  git**, en el commit que introdujo la integración. Por eso el arreglo es rotarla, no
  borrarla.
- Los clientes externos vuelcan al log peticiones y respuestas completas, con datos
  personales de candidatos.
- **El backend entrega desencriptadas las contraseñas de las cuentas externas de la
  empresa** —portales de empleo, EvaluaTest y antecedentes— en la respuesta de "mi
  compañía", que piden la lista de ofertas, el detalle de una oferta, la tarjeta de
  agendamiento y Mi compañía. Se guardan encriptadas, pero cualquier usuario de la empresa,
  incluido el rol más bajo, las recibe en texto plano en su navegador; el listado interno de
  empresas devuelve las de todas. Anotado el 2026-09-11; no es de ningún frente abierto y se
  arregla cuando haya tiempo. **El arreglo va aparte y con cuidado:** el formulario de
  credenciales se rellena con la contraseña recibida y la reenvía al guardar, y el portal
  decide si muestra la prueba psicométrica según reciba o no las credenciales — las dos cosas
  hay que pasarlas a un "configurado: sí" sin borrar lo guardado.
- El soporte de varios portales de empleo se resolvió con condicionales repartidos, no
  con una capa de proveedor. Es el precedente de la casa; conviene no repetirlo. **El
  contraejemplo a seguir ya existe**: la capa psicométrica de arriba.
