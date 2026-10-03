# Agenda Odontológica — Checkpoint

## Base de referencia
Repositorio: `LucasDNG/agenda-odontologica`
Rama de trabajo: `cursor/levantar-agenda-local-9f25`
Commit de `main` desde el que parte esta entrega:
`c6105564d07cc3dbaf2a1476593e21d67ec1e35a`

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
- Plantillas oficiales de WhatsApp en el código.

## Esta entrega
BACKEND:
- `backend/sql/001_schema.sql`: esquema idempotente reconstruido desde las consultas actuales.
- `backend/src/scripts/apply-schema.js` y `npm run db:schema`.
- `backend/src/scripts/seed-demo.js` y `npm run db:seed`, con datos ficticios.
- La reserva pública crea o reutiliza la ficha de paciente y guarda `patient_record_id`.
- La agenda del odontólogo muestra el turno aunque falte la ficha, usando la cuenta del paciente.
- Las notificaciones toman teléfono y nombre de la ficha o, si no hay, de la cuenta.
- Un profesional desactivado no puede iniciar sesión.
- Cancelar un turno propio ya no falla por `FOR UPDATE` sobre joins externos.
- El mensaje de conexión ya no dice que Neon está conectado si no se probó Neon.

BASE DE DATOS:
- El SQL está en `backend/sql/001_schema.sql`.
- Se aplicó y se probó en PostgreSQL 16 local.
- Neon/producción no se modificó ni se verificó.

FRONTEND:
- Sin cambios de pantallas.
- Las llamadas a la API usan el mismo host que la página (`localhost` o `127.0.0.1`) para que la cookie de sesión viaje.

## Verificación local
Con PostgreSQL local, backend en el puerto 3000 y Vite en el puerto 5173:
- alta de paciente, horarios, reserva, agenda del odontólogo, cancelación, restauración y reprogramación respondieron bien;
- cada una de esas acciones dejó una fila en `whatsapp_notifications`;
- sin `WHATSAPP_TOKEN`, el turno se guardó igual y la notificación quedó en `failed` con el texto `Falta WHATSAPP_TOKEN en el .env`.

No se envió ningún mensaje a Meta. WhatsApp de producción no está verificado.

## Datos demo locales
No son clientes reales.
- Odontólogo: `ana.demo@example.com` / `demo1234`
- Paciente: `paciente.demo@example.com` / `demo1234`
- Consultorio: Consultorio Demo

## Pendiente inmediato
1. Aplicar `backend/sql/001_schema.sql` en la base real solo cuando se decida hacerlo.
2. Cargar token, phone number id y plantillas aprobadas de Meta.
3. Repetir un turno con un teléfono real y revisar que `whatsapp_notifications.status` pase a `sent`.
