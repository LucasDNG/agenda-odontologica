# Agenda Odontológica — Checkpoint

## Base de referencia
Repositorio: `LucasDNG/agenda-odontologica`
Rama: `main`
Commit base usado para esta entrega:
`551c0bff8b62454ec9294e7b21e8921144291d06`

## Funcionalidad ya existente
- Login/registro.
- Portal de pacientes.
- Reserva pública por servicio/profesional/fecha/horario.
- Panel odontólogo/admin.
- Gestión de servicios.
- Gestión de profesionales.
- Disponibilidad.
- Agenda diaria/semanal.
- Sobreturnos.
- Cancelación.
- Reprogramación.
- Restauración.
- Configuración de máximo de turnos activos.
- Webhook/consultas de WhatsApp.
- Tabla/log de `whatsapp_notifications`.
- Worker de recordatorios.

## Entrega actual
Se reemplazan:
- `backend/src/services/whatsapp.service.js`
- `backend/src/services/appointmentNotifications.service.js`

Objetivo:
- Enviar notificaciones de turnos mediante plantillas oficiales de WhatsApp.
- Mantener normalización de teléfonos.
- Mantener logs.
- Mantener recordatorios y prevención de duplicados.

## Base de datos
Esta entrega NO requiere cambios SQL.

## Frontend
Esta entrega NO modifica frontend.

## Pendiente inmediato
1. Esperar aprobación de plantillas en Meta.
2. Reemplazar archivos con este ZIP.
3. Ejecutar backend y comprobar que inicia sin errores.
4. Probar un flujo de turno con un número válido.
5. Revisar `whatsapp_notifications`.
6. Commit/push.
7. Verificar el commit remoto.
