# Brief · Paso 2b — textos del recorrido de creación, traducibles

Para quien ejecuta este paso. Pasar a los textos del portal unos textos escritos a mano en español, y
cambiar una palabra del aviso. Mismo comportamiento: **brief corto y una sola ronda**. Solo portal.

Sale de las pruebas a mano del cierre (2026-10-06): con el portal en inglés, el recorrido de crear
una oferta mezcla los dos idiomas. Lee en la bitácora **la decisión 7 y la 17**.

## Rama

El frente ya está en `develop`. Rama nueva **`fix/offers-without-ats-copy`** desde `develop` al día,
en `esscoti-frontend`. Reinstala dependencias si `develop` trajo librerías nuevas. Tipos sin errores
antes de empezar.

## Qué se hace

### 1 · El aviso (decisión 7)

En español, el aviso del formulario de creación cambia «a mano» por «manualmente»: «No tienes canales
de publicación habilitados. La oferta se creará, pero los candidatos tendrás que cargarlos
manualmente.» El inglés no cambia.

### 2 · Textos escritos a mano que pasan a los textos del portal (decisión 17)

| Dónde | Textos |
| --- | --- |
| Listado de ofertas | El botón «Crear con IA» |
| Ventana «Crear con IA» | Todos: título, explicación, etiqueta y ejemplo del campo, contador de caracteres, «Ofertas previas usadas como referencia», Cancelar, «Generar borrador», «Generando…», el aviso de descripción demasiado corta y el error genérico |
| Formulario de creación | La confirmación al cancelar: título, pregunta, «Sí» y «No» |
| Listado de ofertas | El mensaje verde tras generar con IA (sus tres variantes), el texto y el nombre accesible de «Copiar oferta», y el error si falla la copia |

- **Reutiliza las claves que ya existan** para lo mismo (por ejemplo, un «Sí», un «No» o un
  «Cancelar» genéricos) en vez de crear otras. Las nuevas, en inglés y en la línea de las vecinas.
- **El texto en español no cambia**: se copia tal cual a los textos del portal.
- **Las traducciones al inglés las propones tú** en la opinión previa, en una tabla español → inglés.
  El ejemplo del campo puede adaptarse en inglés, pero describe la misma vacante.
- Donde hoy se interpolan valores (el título de la oferta copiada, el número de ofertas, el número de
  caracteres), se interpolan igual con los textos del portal.

## 🔴 Dónde se para

- **Los errores que manda el backend** se muestran tal cual: no se traducen.
- **Ningún otro texto** fuera de esta lista, aunque lo veas escrito a mano. Si encuentras más en este
  mismo recorrido, dilo en la opinión previa y no lo toques.
- Nada de comportamiento ni de estilos. Sin comentarios en el código, sin formateador.
  Identificadores en inglés, también en los parámetros de los callbacks.

## Verificación

- `npm run typecheck`, una vez.
- Busca en los archivos tocados que no quede ninguno de los textos de la lista escrito a mano.
- Las pruebas a mano las hace el usuario en el servidor de pruebas: el recorrido entero en español y
  en inglés.

## Qué entregar

1. Tu opinión previa, **antes de tocar código**, con los puntos numerados y la tabla de traducciones.
2. Después: qué cambió y el resultado de la comprobación de tipos.
3. Qué decisiones tomaste que no estaban en el brief.
4. Todo en el índice, con el índice y el árbol coincidiendo.
5. Un mensaje de commit.
