# Agenda Odontológica — Decisiones

## Producto
- La aplicación será una base genérica reutilizable para consultorios odontológicos.
- Laura/Diego son datos/configuración del primer cliente.
- No crear selector de múltiples clínicas por ahora: una instalación corresponde a una clínica.

## Ingreso de pacientes
- En el portal de pacientes, el alta pide nombre, apellido, teléfono, DNI y contraseña. No pide email.
- El DNI se guarda solo con números, sin puntos. Vale con 7 u 8 dígitos.
- En la pantalla de ingreso hay un solo botón Ingresar. Crear cuenta queda como un enlace.
- El panel del odontólogo sigue ingresando con el email de acceso.
- El paciente de prueba usa el DNI ficticio `30123456` y la contraseña `demo1234`.

## Servicios que ve el paciente
- El paciente elige entre tres grupos: Consulta, Ortodoncia y Otros.
- Reglas, fracciones, ajuste y el resto no tienen un botón propio. Entran en Otros.
- Cada grupo dura 30 minutos en los datos de prueba. La odontóloga puede cambiar los minutos desde el panel.
- La fecha de la reserva se elige en una semana visible. Sábado y domingo no se pueden elegir. Un día completo tampoco.
- La odontóloga de este consultorio es Laura Guilenia. Guilenia es el apellido.
- Ese nombre está en los datos del profesional. La pantalla no lo tiene escrito fijo.
- El panel entra con el email y la contraseña de la odontóloga, guardados en la base. Esa contraseña no se escribe en el repositorio.
- En Configuración, la odontóloga edita el nombre, la calle, el teléfono y el email del consultorio, además del máximo de turnos activos.
- Esos cuatro datos se muestran en el portal del paciente, antes de ingresar y al reservar. El nombre va solo, sin repetir la palabra consultorio arriba.
- En el ingreso, el nombre del consultorio va primero y es más grande que Agenda odontológica y que Turnos online. Esas tres líneas van juntas. La calle, el teléfono y el email van en filas con ícono, dentro de una carta diseñada.
- El resto de las pantallas usa esa misma carta: cabecera suave, bloques blancos, campos y botón azul.
- Hay dos aplicaciones para instalar en el celular. Solo el portal de pacientes ofrece instalar la suya. El panel se instala con el enlace privado `/odontologo/instalar`, que no aparece en el inicio.
- Si el día abierto en la agenda no tiene turnos, eso se lee en la barra de la fecha. La ficha de abajo dice Siguiente día con turno y se puede abrir.
- Desde la agenda, el odontólogo puede asignar un turno en un horario libre. Elige paciente, servicio, profesional, día y horario, igual que la reserva del paciente. El sobreturno sigue aparte, para un horario ocupado o fuera del habitual.

## Pacientes y turnos
- Mantener historial: cancelar no elimina.
- Restauración reutiliza el mismo registro.
- Reprogramación reutiliza el mismo registro.
- Los pacientes pueden cancelar sus propios turnos futuros.
- El máximo de turnos activos por paciente es configurable.

## WhatsApp
- Usar plantillas oficiales de Meta para mensajes proactivos.
- Plantillas previstas:
  - `appointment_created`
  - `appointment_cancelled`
  - `appointment_rescheduled`
  - `appointment_restored`
  - `appointment_reminder`
- Idioma previsto: `es_AR`.
- Variables acordadas, en este orden:
  1. paciente
  2. consultorio
  3. fecha
  4. hora
  5. servicio
  6. profesional
- Registrar intentos/resultados en `whatsapp_notifications`.
- El fallo de WhatsApp no debe deshacer una reserva/cancelación/reprogramación/restauración ya confirmada en DB.
- Los recordatorios deben evitar duplicados.

## Publicación
- La base de datos del consultorio va en Neon.
- El programa se publica en un sitio con dirección https fija. Meta usa esa dirección.
- El túnel hacia la computadora de desarrollo no forma parte del uso real.
- En producción el mismo servidor entrega la página y la API.

## Base de datos local
- El esquema que usa el código queda en `backend/sql/001_schema.sql`.
- Ese archivo es idempotente y se aplica con `npm run db:schema`.
- Los datos de `npm run db:seed` son ficticios y solo sirven para desarrollo.
- No se aplicó este SQL sobre Neon ni sobre producción.

## Reserva pública
- Al reservar, se crea o reutiliza una ficha en `patients` vinculada al usuario y se guarda `appointments.patient_record_id`.
- Siguen existiendo `patient_id` (usuario) y `patient_record_id` (ficha). No se unificó la relación.
- Después de reservar, Mis turnos abre con una ficha grande: fecha, hora, servicio, duración, profesional y especialidad. El aviso chico de una línea no es la confirmación.

## Confirmación del turno
- La confirmación usa los datos que el paciente acaba de elegir.
- Al volver a Mis turnos desde el menú, esa ficha se cierra. El turno sigue en Próximos turnos, con las mismas etiquetas.

## Acceso profesional
- Si un profesional vinculado está inactivo, su login se rechaza.
- Una cuenta `dentist` sin ficha de profesional puede seguir ingresando.

## Mantenimiento
- No hacer una gran refactorización ciega.
- Primero estabilizar funcionalidad y pruebas.
- Luego limpiar código por módulos, eliminando duplicación y deuda comprobada.
