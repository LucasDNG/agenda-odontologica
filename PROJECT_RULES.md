# Agenda Odontológica — Reglas del proyecto

## Objetivo
Construir una agenda odontológica genérica, reutilizable para distintos consultorios. Laura/Diego son la primera configuración, no deben quedar hardcodeados como arquitectura del producto.

## Arquitectura
- Backend: Node.js + Express.
- Frontend: React + Vite.
- Base de datos: PostgreSQL/Neon.
- Autenticación: JWT/cookies.
- Integración: WhatsApp Cloud API de Meta.
- Un consultorio por deployment/base de datos, salvo decisión futura explícita.

## Reglas funcionales vigentes
- Portal paciente en `/`.
- Panel profesional/admin en `/odontologo`.
- Los turnos normales se reservan sin confirmación manual.
- Límite de turnos activos por paciente configurable en `clinics`.
- Los turnos cancelados no se eliminan.
- Restaurar: horario original si está libre; si no, próximo libre del día; si no, sobreturno.
- Reprogramar conserva el mismo turno/id.
- Sobreturnos no bloquean los horarios públicos normales.
- Estados operativos: programado/confirmado, atendido, ausente, cancelado.
- WhatsApp: alta, cancelación, reprogramación, restauración y recordatorio.
- Fechas visibles: DD/MM/YYYY.
- No guardar secretos ni `.env` en Git.

## Forma de trabajo
- Trabajar por entregas completas, preferentemente ZIP listo para reemplazar sobre la raíz.
- Cada entrega debe actualizar estos archivos Markdown cuando cambie arquitectura, reglas, decisiones, deuda o estado.
- Antes de modificar código, leer `NEXT_CHAT_HANDOFF.md`, `PROJECT_RULES.md`, `DECISIONS.md`, `CHECKPOINT.md` y `TECH_DEBT.md`.
- No reconstruir archivos existentes desde memoria: usar la versión actual del repositorio.
- Después de probar una entrega: commit + push.
- Luego verificar GitHub antes de iniciar el siguiente bloque.
