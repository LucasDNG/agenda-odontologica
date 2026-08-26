# Agenda Odontológica

Proyecto completo PERN para agenda odontológica.

## Incluye

- Registro e inicio de sesión.
- Roles `patient` y `dentist`.
- Reserva con confirmación automática.
- 1 turno futuro por paciente por defecto.
- La odontóloga puede autorizar más turnos por paciente.
- Consulta (15 min) y Ortodoncia (30 min).
- Horarios configurables.
- Fechas bloqueadas.
- Cancelación del paciente y de la odontóloga.
- Turnos cancelados quedan en historial y liberan el horario.
- Restauración:
  - intenta horario original;
  - busca el siguiente hueco del mismo día;
  - si no hay hueco crea sobreturno.
- Reprogramación.
- Atendido / Ausente.
- WhatsApp Cloud API preparada:
  - confirmación automática;
  - cancelación;
  - reprogramación/restauración;
  - recordatorio el día anterior.
- Panel de administración para turnos, pacientes, servicios, horarios y días bloqueados.

## 1. Base de datos

Crear una base PostgreSQL/Neon y ejecutar:

`database/init.sql`

Para convertir a Laura en odontóloga después de registrarla:

```sql
UPDATE users
SET role = 'dentist'
WHERE email = 'lauraguilenia@hotmail.com';
```

## 2. Backend

Copiar `.env.example` a `.env` y completar `DATABASE_URL` y `JWT_SECRET`.

```bash
npm install
npm run dev
```

Backend: `http://localhost:3000`

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Si el backend está publicado, copiar `frontend/.env.example` a `frontend/.env` y cambiar:

```env
VITE_API_URL=https://TU-BACKEND/api
```

## 4. WhatsApp

Por defecto:

```env
WHATSAPP_ENABLED=false
```

La agenda funciona sin WhatsApp.

Para habilitar mensajes reales necesitás WhatsApp Cloud API de Meta, un `WHATSAPP_PHONE_NUMBER_ID`, token y plantillas aprobadas:

- `turno_confirmado`
- `turno_cancelado`
- `turno_reprogramado`
- `recordatorio_turno`

Luego:

```env
WHATSAPP_ENABLED=true
```

Los parámetros esperados por las plantillas están documentados en `src/services/whatsapp.service.js`.

## Nota sobre recordatorios

El backend debe estar ejecutándose para que `node-cron` pueda enviar recordatorios. En producción, alojá el backend en un servicio que permanezca activo.
