# Plataforma propia vs. herramientas comerciales: por qué seguimos con el desarrollo propio

> Reporte ejecutivo para conversar con el líder técnico.
> Compara **Cekura**, **TestSprite** y **Momentic** (evaluadas en [report.es.md](report.es.md)) con la
> **Chatbot Testing Platform** que estamos construyendo en `prestobots/app/`.
> Fecha: 2026-11-26. Estado de la plataforma tomado del código de la rama `main`.

---

## 1. Resumen

**La pregunta no es qué herramienta es mejor, sino cuál puede detectar la falla que más nos importa:
que el bot le diga al paciente "tu turno está confirmado" y el turno no exista.**

- Ninguna de las tres herramientas comerciales puede detectarla sin que construyamos nosotros la
  parte difícil: mandar mensajes por el canal real del bot (webhook de Gupshup), leer sus respuestas
  en Firestore y verificar el turno. Con eso construido, la herramienta aporta poco más y suma costo
  recurrente, dependencia del proveedor y datos de pacientes fuera de nuestros sistemas.
- La plataforma propia **ya tiene construida esa parte difícil** para el envío y la lectura: actúa
  como paciente sobre el webhook real de salud-stage, lee las respuestas en Firestore en modo solo
  lectura, entiende botones y listas, y suma juez con IA, generación de casos, reportes y tarjetas de
  Jira, todo usable por un admin no técnico.
- **Todavía no verifica el turno** (no hay chequeo contra Macena ni contra la base de turnos) y
  **todavía no corrió una batería completa contra el bot real**: depende de accesos que pedimos a
  desarrollo. Ese es el punto más importante que falta y es el próximo paso.

**Recomendación:** seguir con la plataforma propia y enfocar la próxima etapa en dos cosas: la
primera corrida real en salud-stage y el chequeo de turnos. Con un criterio explícito para revisar
la decisión si no se logra (sección 7).

---

## 2. Qué tiene que poder hacer una herramienta para nuestro bot

El bot de Cauce no tiene pantalla. Un paciente escribe por WhatsApp, el mensaje pasa por **Gupshup**,
**Dialogflow CX** lo interpreta y el bot reserva en **Macena**. El webhook solo contesta
"recibido"; la respuesta real queda guardada en **Firestore**. Para probar una reserva de punta a
punta hace falta:

1. Enviar un mensaje como paciente por el canal real.
2. Leer la respuesta del bot en Firestore (no viene en la respuesta HTTP).
3. Entender botones, listas y WhatsApp Flows.
4. **Verificar qué pasó realmente** (¿existe el turno?).
5. Evaluar respuestas en español con un juez de IA, sin depender de texto exacto.

Los puntos 2 y 4 concentran el riesgo. Ninguna de las tres herramientas los cubre.

---

## 3. Tabla comparativa

Criterios ordenados por lo que más pesa para esta decisión: cobertura del riesgo, costo y
mantenimiento, tiempo hasta valor. Datos de las herramientas según su documentación pública al
2026-11-19 (ver informe de proveedores).

**Leyenda:** ✅ lo resuelve · 🟡 parcial o con trabajo nuestro · ❌ no lo resuelve · ⏳ diseñado,
esperando un acceso o archivo externo

### 3.1 Cobertura del riesgo

| Criterio | Momentic | TestSprite | Cekura | Plataforma propia (hoy) |
| --- | --- | --- | --- | --- |
| Envía mensajes por el canal real del bot | 🟡 Con un paso HTTP armado por nosotros | 🟡 Llama al webhook, pero solo ve "recibido" | 🟡 Necesita un número de WhatsApp real y Twilio, o un puente WebSocket que construimos nosotros | ✅ Mensajes con formato Gupshup al webhook de salud-stage, ids `qa-` |
| Lee la respuesta real del bot (Firestore) | 🟡 Con JavaScript propio dentro de su entorno | ❌ Daría todo por aprobado | ❌ Evalúa la transcripción que recibe, no lee la base | ✅ Lectura de `conversations/{id}/messages`, solo lectura |
| Botones y listas de WhatsApp | ❌ | ❌ | ❌ Su documentación de WhatsApp solo describe texto | ✅ Chequeos de botones, listas, opciones ofrecidas y elegir una opción |
| WhatsApp Flows (formulario de reserva) | ❌ | ❌ | ❌ | 🟡 Detecta que el bot ofreció el formulario; completarlo no es posible desde afuera para nadie hoy |
| **Verifica que el turno exista** | ❌ | ❌ | ❌ "Turno confirmado" sin turno aprobaría | ❌ **Todavía no.** Previsto en el alcance (Macena de pruebas o base de turnos), sin implementar |
| Evalúa respuestas en español con IA | 🟡 Funciones de IA pensadas para pantallas | ❌ | ✅ Su punto fuerte | ✅ Juez con Claude, que nunca puede convertir un chequeo fallido en aprobado |
| Distingue falla del bot de falla ajena | ❌ | ❌ | ❌ | 🟡 Separa "no se pudo correr" de "falló" y la IA clasifica la causa probable (incluye "problema de la plataforma"); no detecta caídas de Gupshup o Macena por sí sola |
| Propone casos de prueba a partir del bot | ❌ | 🟡 Propone pruebas de endpoints, no conversaciones | ❌ Escenarios escritos a mano | ✅ Explora los menús del bot y lee los Flows del código; ⏳ falta el agente de Dialogflow (archivo pedido) |

### 3.2 Costo y mantenimiento

| Criterio | Momentic | TestSprite | Cekura | Plataforma propia |
| --- | --- | --- | --- | --- |
| Modelo de costo | Suscripción por usuario o ejecución | Suscripción por usuario o ejecución | Suscripción por usuario o ejecución | Sin licencia. Claude API por uso, con tope mensual configurable y aviso al 80 % |
| Qué construimos igual | Envío, lectura de Firestore y verificación | Lo mismo | Puente con Gupshup y Firestore, y la verificación | — (es la plataforma) |
| Dónde viven las pruebas | En el proveedor | En el proveedor | En el proveedor | En nuestro repo y una base SQLite local |
| Datos de pacientes de prueba | Salen a un tercero | Salen a un tercero | Salen a un tercero | No salen, salvo el texto que va a Claude y a Jira (las tarjetas nunca llevan el teléfono ni claves) |
| Quién mantiene | El proveedor (la herramienta), nosotros (la integración) | Ídem | Ídem | Nosotros, todo. Hoy, una sola persona |
| Calidad del código | — | — | — | TypeScript estricto, TDD, ~190 tests automáticos, reglas de proyecto escritas (constitución, specs). Falta CI y linter |

### 3.3 Tiempo hasta valor

| Criterio | Momentic | TestSprite | Cekura | Plataforma propia |
| --- | --- | --- | --- | --- |
| Para empezar a probar el bot real hace falta | Escribir nuestro propio runner dentro de su entorno | No encaja con el modelo asíncrono | Número real de WhatsApp + Twilio, o el puente WebSocket | ⏳ Acceso de lectura a salud-stage (ya resuelto con login de Google), URL del webhook y OK para usar la clínica de QA |
| Lo que ya se puede usar hoy | — | — | — | Todo el flujo completo contra el bot de demostración: crear, generar, correr, reportar, Jira |
| Uso por un admin no técnico | 🟡 Pensado para QA/desarrollo | 🟡 Ídem | 🟡 Ídem | ✅ Diseñado para eso: casos en lenguaje natural, mensajes de error con qué hacer |

---

## 4. Qué ya está construido

En cuatro iteraciones y una spec activa, la plataforma cubre el circuito completo que el alcance del
MVP pide:

- **Casos de prueba** como historias en español con pasos y chequeos de sí o no. El admin nunca ve
  código.
- **Escribir o cambiar un caso en lenguaje natural** ("probá un paciente que…"), con "Probarlo" antes
  de guardar.
- **Generación automática:** la plataforma recorre los menús del bot (sin tocar nunca opciones que
  reservan, confirman, cancelan o derivan a una persona), la IA propone lo que falta cubrir, cada
  propuesta se prueba dos veces y el admin aprueba o rechaza.
- **Corridas con progreso en vivo** y reporte con la conversación como burbujas de WhatsApp, cada
  chequeo, el veredicto del juez, la causa probable y el historial reciente de cada caso.
- **Tarjetas de Jira** en dos clics, con detección de tarjetas previas para comentar en lugar de
  duplicar.
- **Presupuesto de IA** visible en el encabezado, con corte al 100 % (las pruebas siguen corriendo
  con sus chequeos fijos).
- **Conexión al bot real en salud-stage** con el login de Google de prestobots.com (sin archivos de
  claves), seis chequeos de conexión explicados y un botón "Enviar hola de prueba".
- **Seguridad:** solo salud-stage, nunca producción; guardas que se verifican antes de cada envío o
  lectura; Firestore solo se lee. Las guardas tienen tests.

La decisión de aprobado o fallado se basa en chequeos exactos. La IA solo juzga lo que no se puede
verificar con exactitud, y no puede dar por buena una prueba que falló un chequeo.

---

## 5. Lo que la plataforma todavía no cubre o le cuesta

Esta sección es la más importante para que la decisión sea honesta.

1. **No verifica el turno.** Es el riesgo central del informe de proveedores y la plataforma aún no
   lo cubre: no hay chequeo contra Macena ni contra la colección de turnos. Hoy, igual que Cekura,
   un bot que dice "confirmado" sin crear el turno pasaría la prueba. La diferencia es que en la
   plataforma propia agregarlo es un chequeo más dentro de la arquitectura existente, y en las
   herramientas comerciales no hay dónde ponerlo. El §5 del informe de proveedores ya separa lo
   construido de lo planificado (verificación de turnos y generación desde Dialogflow).
2. **No corrió todavía una batería completa contra el bot real.** Todo lo demostrable hoy corre
   contra el bot de demostración. Faltan la URL confirmada del webhook, el OK para usar la clínica de
   QA y confirmar con desarrollo qué pasa con la ventana de 24 h de WhatsApp. Los 8 casos iniciales
   siguen el menú del bot de demostración y habrá que ajustar nombres de opciones en la primera
   corrida real.
3. **La estabilidad no está medida.** El MVP pide que los mismos casos den el mismo resultado 9 de
   cada 10 veces. Eso solo se puede medir contra el bot real.
4. **WhatsApp Flows.** La plataforma detecta que el bot ofreció el formulario, pero no puede
   completarlo: cada formulario usa una clave de un solo uso que solo recibe WhatsApp. Ninguna
   herramienta lo resuelve; requiere trabajo de desarrollo del bot y está pedido como consulta.
5. **Generación sin el diseño del bot.** Sin el archivo del agente de Dialogflow CX, la IA propone
   casos a partir de los menús y de los Flows, no de lo que el paciente puede escribir libremente.
6. **Recordatorios.** Salen de tareas programadas; la plataforma solo lee y no puede dispararlos.
7. **Local y de una sola persona.** Corre en una computadora, una corrida a la vez, sin login ni
   historial de quién hizo qué, con respaldo manual de la base. Si la computadora se apaga, la
   corrida se corta. Alojarla en la nube está fuera del MVP.
8. **Mantenimiento y dependencia de una persona.** Todo el código lo mantiene una sola persona. Hay
   reglas, specs y tests que ayudan a que otra persona lo tome, pero no hay CI ni linter, y la
   interfaz web solo tiene tests de sus funciones puras.
9. **El presupuesto de IA cuenta solo las llamadas de la plataforma.** La lectura del gasto real de
   la cuenta de Anthropic (Admin API) está en el alcance pero no implementada. El tope del Console
   sigue siendo el freno real.
10. **Lo que una herramienta comercial sí haría mejor:** Cekura tiene métricas maduras de calidad de
    conversación y usuarios simulados; Momentic sería una buena opción para probar el panel de
    administración o la landing, que sí tienen pantalla. Ninguna de las dos cosas resuelve el riesgo
    principal del bot.

---

## 6. Costo y mantenimiento, sin números

- **Herramienta comercial:** suscripción recurrente por usuario o por ejecución **más** el costo de
  construir y mantener la integración con Gupshup, Firestore y Macena, que es la mayor parte del
  trabajo. Pagaríamos dos veces por la parte difícil: una al construirla y otra en la licencia de
  funciones que no usamos.
- **Plataforma propia:** sin licencia. El costo variable es la Claude API, con tope mensual definido
  por el admin y corte automático. El costo fijo es el tiempo de mantenimiento, hoy concentrado en
  una persona.
- **El trabajo ya hecho no se pierde** si en el futuro se decide sumar una herramienta: el envío, la
  lectura de Firestore, las guardas de seguridad y el chequeo de turnos son justamente lo que
  cualquier proveedor nos pediría construir para conectarse.

---

## 7. Recomendación y próximos pasos

**Seguir con la plataforma propia.** Es la única opción de las cuatro que puede llegar a verificar
que el turno existe, ya resuelve envío, lectura y uso por admins no técnicos, y no suma licencias ni
datos de pacientes en terceros.

Próximos pasos, en orden:

1. **Primera corrida real en salud-stage.** Conseguir de desarrollo la URL del webhook y el OK para
   la clínica de QA, y las respuestas sobre el "hola" de reinicio y la ventana de 24 h
   ([07-developer-requests.md](../07-developer-requests.md)). Ajustar los casos iniciales al menú
   real.
2. **Chequeo de turnos.** Acordar con desarrollo si alcanza con leer los turnos en Firestore o si
   hace falta el sistema de pruebas de Macena, y agregar el chequeo "el turno existe / fue
   cancelado". Esto cierra la brecha principal.
3. **Medir estabilidad** con el criterio del MVP (9 de 10) sobre los casos activos.
4. **Pedir el archivo del agente de Dialogflow CX** para que la generación cubra lo que el paciente
   escribe.
5. **Bajar la dependencia de una persona:** CI con typecheck y tests, linter, y una guía corta para
   que otra persona pueda correrla y mantenerla.

**Cuándo revisar la decisión.** Si el chequeo de turnos no se puede implementar (por ejemplo, porque
ni la base ni Macena de pruebas permiten confirmar una reserva), la ventaja central de la plataforma
propia se reduce a envío, lectura y usabilidad. En ese caso conviene volver a comparar con Cekura
para la parte de calidad de conversación, reutilizando nuestro puente con Gupshup y Firestore.

**Qué le pedimos al líder técnico:**

- Respaldo para destrabar los accesos y respuestas pendientes con el equipo de `prestobotsv3`.
- Acuerdo sobre cómo verificar turnos (Firestore o Macena de pruebas).
- Definir si en el mediano plazo alguien más del equipo participa del mantenimiento.
