# Agenda Odontológica — Decisiones

## Producto
- La aplicación será una base genérica reutilizable para consultorios odontológicos.
- Laura/Diego son datos/configuración del primer cliente.
- No crear selector de múltiples clínicas por ahora: una instalación corresponde a una clínica.

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

## Acceso profesional
- Si un profesional vinculado está inactivo, su login se rechaza.
- Una cuenta `dentist` sin ficha de profesional puede seguir ingresando.

## Mantenimiento
- No hacer una gran refactorización ciega.
- Primero estabilizar funcionalidad y pruebas.
- Luego limpiar código por módulos, eliminando duplicación y deuda comprobada.
