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

## Mantenimiento
- No hacer una gran refactorización ciega.
- Primero estabilizar funcionalidad y pruebas.
- Luego limpiar código por módulos, eliminando duplicación y deuda comprobada.
