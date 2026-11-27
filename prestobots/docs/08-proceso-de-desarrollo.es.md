# Cómo se pensó y se construyó la Chatbot Testing Platform

> Resumen ejecutivo del proceso de desarrollo, del primer análisis al MVP y los próximos pasos.
> Fecha: 2026-11-26.

---

## 1. En una página

**El problema.** El chatbot de Cauce reserva, confirma y cancela turnos por WhatsApp. La falla más
grave que puede tener es decirle al paciente "tu turno está confirmado" sin que el turno exista. No
había forma automática de detectarla: el backend tiene tests unitarios, pero nadie probaba la
conversación completa de punta a punta.

**La respuesta.** Una plataforma web propia donde un admin no técnico crea casos de prueba (escritos
por la IA o en sus propias palabras), los corre con un clic contra el bot, lee un reporte detallado y
convierte las fallas en tarjetas de Jira.

**Cómo llegamos.** En seis pasos, cada uno apoyado en un documento:

| # | Paso | Pregunta que responde | Documento |
| --- | --- | --- | --- |
| 1 | Entender el sistema | ¿Qué hay hoy y dónde está el riesgo? | [README.md](README.md) |
| 2 | Estrategia | ¿Cómo se prueba algo así en general? | [04-e2e-testing-strategy.md](04-e2e-testing-strategy.md), [05-chatbot-testing-simple.md](05-chatbot-testing-simple.md) |
| 3 | Recortar el MVP | ¿Qué hacemos primero y qué no? | [06-mvp-scope.md](06-mvp-scope.md), [07-developer-requests.md](07-developer-requests.md) |
| 4 | Construir por iteraciones | ¿Funciona la idea completa? | [../app/README.md](../app/README.md) |
| 5 | Validar la decisión de construir | ¿No convenía comprar una herramienta? | [vendor-evaluation/](vendor-evaluation/) |
| 6 | Formalizar el método | ¿Cómo seguimos sin perder calidad? | [constitution.md](constitution.md), [architecture.md](architecture.md), [../specs/](../specs/) |

**Dónde estamos.** El circuito completo funciona contra un bot de demostración. La conexión al bot
real (salud-stage) está construida y casi cerrada; falta la primera corrida real y, sobre todo, el
chequeo de que el turno exista.

---

## 2. La historia, paso a paso

### Paso 1 — Entender el sistema

**El webhook del bot solo responde "recibido".** La respuesta real del bot queda guardada en
Firestore y el turno se crea en Macena. Cualquier prueba seria tiene que mirar ahí, no en la
respuesta HTTP.

También aparecieron hallazgos de seguridad en los repos de clientes, que se documentaron para
tratarlos en privado con el líder técnico.

### Paso 2 — Estrategia amplia, después en palabras simples

Primero se pensó en grande: probar los tres repos con Playwright, un "paciente sintético" para el
bot, agentes de IA que escriben y reparan pruebas, y todo en CI. Tres principios de ese documento
siguen vigentes hoy:

- **La IA prepara y explica.** Escribe los casos de prueba, explora el bot para proponer casos nuevos
  y explica las fallas.
- **Un robot corre las pruebas, siempre igual y sin IA.** Si la IA corriera cada prueba, sería lento,
  caro e inestable: podría improvisar distinto en cada corrida y no se sabría si falló el bot o la IA.
- **Los chequeos exactos deciden si una prueba pasa o falla** (¿llegó la respuesta?, ¿están los
  botones?, ¿existe el turno?). La IA solo juzga lo que no se puede verificar con exactitud, y nunca
  puede aprobar una prueba que falló un chequeo.

Después se reescribió la idea para lectores no técnicos: qué es un webhook, qué es un Flow, qué hace
el admin y qué no.

### Paso 3 — Recortar el MVP

La estrategia completa era demasiado para empezar. El MVP se recortó a:

- **Solo el chatbot de Cauce** (no la landing, ni el bot legacy, ni Turnos).
- **Solo salud-stage, dentro de la clínica de QA.** Nunca producción.
- **Local, en una computadora, sin login.** La nube viene después.
- **Cuatro funciones:** crear casos de prueba (IA + lenguaje natural), correrlos, ver el reporte y
  crear tarjetas de Jira. Más un presupuesto mensual de IA siempre visible.

Se escribieron nueve criterios de "MVP terminado" (por ejemplo: al menos 6 propuestas útiles de
casos, el mismo resultado 9 de cada 10 veces, nada corre fuera de salud-stage) y una lista de lo que
queda afuera a propósito (corridas nocturnas, pruebas en cada PR, pruebas que se reparan solas…).

En paralelo se armó **qué pedirle a desarrollo**: solo accesos y respuestas, nada de trabajo nuevo
para ellos (la URL del webhook, lectura de la base de stage, el OK para usar la clínica de QA).

**Este documento de alcance funcionó como la especificación del MVP:** describe qué tiene que hacer
cada función (incluida la generación de casos), y a partir de él se construyeron las iteraciones 1 a
4. Las specs formales llegaron después (paso 6).

### Paso 4 — Construir por iteraciones

Con el alcance claro, la plataforma se construyó en cuatro iteraciones, cada una usable por sí sola:

| Iteración | Qué agregó |
| --- | --- |
| 1 | Casos de prueba, corridas con progreso en vivo, reporte detallado, bot de demostración y la conexión al bot real (a la espera de accesos) |
| 2 | Escribir y cambiar casos en lenguaje natural con "Probarlo", juez con IA, explicación de fallas, resumen de corridas y presupuesto de IA |
| 3 | Tarjetas de Jira en dos clics, con detección de tarjetas previas para comentar en vez de duplicar |
| 4 | "Generar casos de prueba": la plataforma recorre los menús del bot (sin tocar nunca opciones que reservan o cancelan), la IA propone lo que falta, cada propuesta se prueba dos veces y el admin aprueba o rechaza |

Construir primero contra un **bot de demostración** permitió avanzar sin depender de los accesos de
desarrollo y probar todo sin costo ni riesgo.

### Paso 5 — Validar la decisión de construir

Antes de seguir invirtiendo, se evaluaron tres herramientas comerciales: **Cekura, TestSprite y
Momentic**. Conclusión: son buenas en lo suyo, pero ninguna puede verificar que el turno exista sin
que construyamos nosotros la parte difícil (enviar por el canal real, leer Firestore, consultar
Macena). Y una vez construida esa parte, la herramienta suma poco, más costo recurrente y datos de
pacientes en terceros.

El reporte de plataforma propia vs. herramientas comerciales recomienda **seguir con la plataforma
propia**, con un criterio explícito para revisar la decisión: si el chequeo de turnos resulta
imposible, volver a comparar con Cekura.

### Paso 6 — Formalizar el método

Con cuatro iteraciones hechas y el proyecto creciendo, se pasó a un **desarrollo guiado por
especificaciones y por tests** para que el código siga siendo confiable y otra persona pueda
tomarlo:

- **Arquitectura de base** ([architecture.md](architecture.md)): una foto de lo que el código *es*
  hoy, punto de partida de toda especificación.
- **Constitución** ([constitution.md](constitution.md)): principios que no se negocian. Solo
  salud-stage; Firestore solo se lee; las guardas de seguridad se pueden ampliar pero nunca relajar;
  pocas dependencias; tests antes del código.
- **Una carpeta por funcionalidad** en `specs/NNN-<nombre>/`, con tres documentos (ver §3).

Desde entonces, cada funcionalidad nueva empieza como una spec. La **Spec 001 — acceso al bot real
con login de Google** es la primera y, por ahora, la única hecha con este método.

La primera necesidad que surge es leer la base de stage, para lo cual se adoptó el método de
`cauce-herramientas`, la herramienta interna de desarrollo: leer con la cuenta de Google de cada
persona, en lugar de una clave de servicio. Así, el admin inicia sesión con su cuenta de
prestobots.com, ve seis chequeos de conexión explicados en palabras simples y puede mandar un "hola"
de prueba. Va **26 de 28 tareas**; faltan la verificación final contra salud-stage y cerrarla.

---

## 3. Spec, plan y tareas: el orden y para qué sirve cada uno

El orden natural va **de lo que se quiere a cómo se hace y después a los pasos**:

```
spec.md  ──▶  plan.md  ──▶  tasks.md  ──▶  código (tarea por tarea, test primero)
 QUÉ y POR QUÉ   CÓMO          EN QUÉ ORDEN
```

| Documento | Responde | Lo lee | Ejemplo en la Spec 001 |
| --- | --- | --- | --- |
| **spec.md** | Qué necesita el usuario y por qué. Sin detalles de código. Cada requisito se puede verificar con una prueba | Cualquiera, técnico o no | "Como admin, quiero iniciar sesión con mi cuenta de Google para que la plataforma lea las respuestas del bot sin un archivo de claves" + 22 requisitos verificables |
| **plan.md** | Cómo se construye: módulos, datos, decisiones técnicas, riesgos, estrategia de pruebas. Cada decisión apunta a un requisito de la spec | Quien implementa o revisa | Login de Google por OAuth, lectura de Firestore sin SDK, una guarda que solo deja pasar los hosts de Google y el proyecto salud-stage |
| **tasks.md** | La lista ordenada de pasos chicos, cada uno con su condición de "terminado" y qué requisito cubre | Quien implementa (persona o agente de IA) | 28 tareas en 17 fases: tipos → guarda → cliente de Firestore → login → chequeos → pantalla → documentación → verificación final |

**Por qué en ese orden.** No se puede decidir *cómo* (plan) sin saber *qué* (spec), ni partir el
trabajo en pasos (tareas) sin el diseño. Cada paso tiene una revisión antes de pasar al siguiente.
Así, cuando algo no cierra al implementar, se corrige primero la spec y después el código, y siempre
se sabe qué requisito cubre cada línea.

El ciclo completo, con sus comandos:
`/spec-create` → `/spec-review` → `/spec-plan` → `/spec-tasks` → `/spec-implement` → `/spec-create done`.

---

## 4. El MVP hoy

**Funciona (contra el bot de demostración):**

- Casos de prueba como historias en español, con chequeos de sí o no. El admin nunca ve código.
- Crear y editar casos en lenguaje natural, con "Probarlo" antes de guardar.
- Generación automática de casos, con aprobación del admin.
- Corridas con progreso en vivo y reporte con la conversación como burbujas de WhatsApp, chequeos,
  juez de IA, causa probable e historial.
- Tarjetas de Jira sin duplicados y sin datos sensibles.
- Presupuesto de IA con aviso al 80 % y corte al 100 % (las pruebas siguen con sus chequeos fijos).
- Conexión al bot real con login de Google y guardas de seguridad con tests.
- Unos 190 tests automáticos, TypeScript estricto.

**Todavía no:**

- **No verifica que el turno exista.** Es la brecha principal.
- **No corrió una batería completa contra el bot real**; depende de accesos y respuestas de
  desarrollo.
- La estabilidad (9 de cada 10) no está medida, porque solo se puede medir contra el bot real.
- No completa los formularios de WhatsApp (Flows): cada uno usa una clave de un solo uso que solo
  recibe WhatsApp. Detecta que el bot lo ofreció.
- No lee el diseño del bot en Dialogflow CX (falta el archivo de desarrollo).
- El presupuesto cuenta solo las llamadas de la plataforma, no el gasto real de la cuenta.
- Corre en una sola computadora, lo mantiene una sola persona, y no hay CI ni linter.

---

## 5. Próximos pasos

En orden de prioridad:

1. **Cerrar la Spec 001:** verificación de punta a punta en salud-stage (login, seis chequeos en
   verde, "hola" de prueba, un caso aprobado).
2. **Primera corrida real.** Conseguir la URL del webhook, el OK para la clínica de QA y las
   respuestas sobre el "hola" de reinicio y la ventana de 24 h de WhatsApp. Ajustar los casos
   iniciales al menú real.
3. **Chequeo de turnos** (próxima spec). Acordar con desarrollo si alcanza con leer los turnos en
   Firestore o hace falta el sistema de pruebas de Macena, y agregar "el turno existe / fue
   cancelado". Cierra la brecha principal.
4. **Medir estabilidad** con el criterio del MVP sobre los casos activos.
5. **Generación desde Dialogflow CX**, cuando llegue el archivo del agente.
6. **Bajar la dependencia de una persona:** CI con typecheck y tests, linter (Biome) y una guía corta
   para que otra persona la corra y la mantenga.

**Después del MVP** (fuera de alcance hoy): corridas nocturnas, pruebas en cada PR del chatbot,
pruebas que se reparan solas con aprobación, alojamiento en la nube con login y roles, y otros
productos (Turnos, bot legacy, landing).

**Dirección a largo plazo (no adoptada):** convertir la plataforma en un producto de QA con IA
vendible y multi-cliente. Cualquier paso en esa dirección requiere su propia spec aprobada.

**Qué hace falta de otros:** acompañar los puntos necesarios para la primera ejecución contra el bot
real en stage, y acordar cómo verificar turnos.
