# Guion de demo — Chatbot Testing Platform

Duración: **~10 minutos**. Todo corre contra el **bot demo** (simulado), así que no toca el chatbot real.

## Antes de compartir pantalla (5 min)

- [ ] La plataforma está corriendo en http://localhost:4000 (pedile a Claude "levantá la plataforma").
- [ ] Arriba a la derecha se ve **DEMO bot** (amarillo) y el gasto de IA del mes.
- [ ] **Generar casos tarda unos minutos**: corré uno antes (**Test cases → Generate test cases → Start**).
      Cuando termina de explorar se frena y espera tu OK: hacé click en **Continue** y esperá a que diga **Finished**.
      Recién ahí aparecen las propuestas en **Test cases → To review**. **No las apruebes ni rechaces**: guardalas para la demo.
- [ ] Jira no está configurado: el botón **Create Jira card** aparece pero dice "Jira is not set up yet". Se menciona, no se muestra.
- [ ] Navegador con zoom 110–125 % y otras pestañas cerradas.

---

## 1. Qué es (30 s) — pantalla **Test cases**

> "Esta plataforma prueba el chatbot de Cauce como si fuera un paciente. Cada fila es una **historia de paciente**:
> lo que escribe o toca, y qué esperamos que responda el bot. Hoy tenemos 8, cada una con un id fijo."

Señalá: la columna **Story** (en castellano, en palabras simples) y **Last result**.

## 2. Cómo es un caso de prueba (1 min) — abrí **SAL-CANCEL-002**

> "Este paciente escribe 'Quiero cancelar mi turno' sin usar el menú. Los pasos son lo que hace el paciente;
> los tildes son lo que revisamos en cada respuesta: que mencione 'cancel' y que no diga 'no te entendí'."

Volvé a **Test cases**.

## 3. Correr todo (2 min) — **Run all active (8)**

1. Click en **Run all active (8)**. Se abre el reporte y se ve el progreso **en vivo**.
2. Mientras corre (son ~20 segundos en total): > "Cada historia arranca una conversación nueva con el bot."
3. Al terminar: **7 Passed / 1 Failed**. > "El que falla, falla a propósito, para ver cómo se ve un error."

## 4. Entender un fallo (2 min) — en el mismo reporte

Bajá hasta **SAL-CANCEL-002**:

- **Resumen arriba** (lo escribe la IA): qué pasó en la corrida, en un párrafo.
- **Likely cause** + **Next step**: la IA explica la causa probable y qué hacer.
- **La conversación completa**, como en WhatsApp, con cada tilde en verde o rojo debajo del paso.

> "No hace falta leer logs: se ve qué escribió el paciente, qué contestó el bot y qué chequeo no se cumplió."

Señalá **Create Jira card**:
> "Con Jira conectado, esto arma la tarjeta ya completa —pasos, qué falló, la conversación— y se puede editar antes de enviarla.
> Si el caso ya tiene tarjeta, ofrece agregar un comentario en vez de duplicarla."

## 5. Crear un caso en tus palabras (2 min) — **Test cases → New test case**

1. En **Describe the patient story** escribí:
   `Un paciente entra a "Mis turnos", elige "Cancelar turno" y después se arrepiente y elige "No". El bot le dice que su turno sigue en pie.`
2. **Write the test case** → la IA arma los pasos y los chequeos.
   > "Yo no escribo código: describo la historia y la IA propone los pasos. Si algo no me cierra, lo pido con **Apply change**."
3. **Try it** → se prueba contra el bot sin guardarse en el historial.
4. **Save as active** → ya entra en "Run all active".

## 6. Que la plataforma proponga casos (2 min) — **Test cases → Generate test cases**

Mostrá los 5 pasos de arriba y abrí la generación que dejaste lista en **Earlier**.

> "La plataforma recorre sola los menús del bot. **Nunca** toca opciones que reserven, cancelen o deriven a una persona.
> Antes de gastar en IA, me muestra el costo estimado y espera mi OK. Después propone casos para lo que **no** está cubierto,
> y prueba cada uno dos veces."

Mostrá: **What the explorer found** (los caminos del menú) y una propuesta con su resultado de prueba.
Andá a **Test cases → To review** y mostrá **Approve** / **Change with AI** / **Reject**:
> "Yo decido. Si rechazo y digo por qué, no lo vuelve a proponer."

Aprobá en vivo una que diga **Passed its trial** (por ejemplo **SAL-BOOK-005**): pasa a **Active** y entra en "Run all active".
Si preguntan por las que dicen **Failed its trial**: > "Son cosas que el bot demo no sabe hacer, como entender pedidos escritos. Justamente eso es lo que queremos encontrar."

## 7. Control de costos y bot real (1 min) — **Settings**

- **Presupuesto mensual de IA**: al 80 % la leyenda se pone amarilla; al 100 % la IA se pausa y las pruebas siguen corriendo igual.
- **Real bot (salud-stage)**:
  > "El paso siguiente es apuntar al chatbot real en salud-stage, en la clínica de QA, con login de Google de prestobots.com.
  > Tiene protecciones: sólo stage, sólo lectura de la base, y nunca producción."

## 8. Cierre (30 s)

> "En resumen: escribimos historias de pacientes en castellano, las corremos con un click, vemos exactamente dónde falla
> y por qué, y la IA nos ayuda a escribir y a encontrar lo que nos falta probar, con el gasto bajo control."

Preguntas.

---

### Si algo sale mal

| Pasa esto | Hacé esto |
| --- | --- |
| Arriba dice "The platform server is not answering" | Pedile a Claude "reiniciá la plataforma" y recargá la página. |
| **Start** de generar está gris | Hay una corrida en curso: esperá a que termine. |
| **To review** está vacía | La generación quedó esperando tu OK: abrila desde **Earlier** y hacé click en **Continue**. |
| La IA tarda en "Write the test case" | Seguí hablando; puede tardar unos segundos. |
| Te preguntan por Jira | "Está implementado; falta cargar las credenciales del proyecto." |
