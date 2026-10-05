# Agenda Odontológica — Deuda técnica y limpieza pendiente

Este archivo es una lista de trabajo, no significa que haya que cambiar todo ahora.

## Prioridad alta
- Normalizar relación paciente/turno:
  - siguen conviviendo `appointments.patient_id` y `appointments.patient_record_id`;
  - la reserva pública ahora también guarda `patient_record_id`;
  - falta definir una única relación canónica sin romper datos existentes.
- Autenticación de profesionales inactivos:
  - el login ya se rechaza si la ficha vinculada está inactiva;
  - la cuenta de usuario no se desactiva por sí misma.
- Revisar consultas que obtienen clínica activa para garantizar que no haya ambigüedad.
- Deduplicación de recordatorios:
  - `001_schema.sql` crea un índice único parcial para recordatorios `pending`/`sent`;
  - ese índice no fue aplicado ni verificado en Neon.

## Prioridad media
- Revisar `adminAppointments.controllers.js`: es grande y puede dividirse en servicios/helpers una vez estabilizado.
- Centralizar formateo de fecha/hora.
- Centralizar reglas de estados de turno.
- Revisar validaciones duplicadas entre controladores.
- Revisar variables CSS potencialmente inexistentes (`--blue`, `--shadow-sm`).
- Sustituir URLs de API hardcodeadas por configuración de entorno donde todavía existan.

## WhatsApp
- Confirmar nombres/idioma exactos de plantillas aprobadas.
- Manejar explícitamente estados/rechazos de Meta.
- Evaluar reintentos controlados para errores transitorios.
- Mantener mensajes y parámetros alineados con las plantillas aprobadas.
- No exponer token ni `.env`.

## Limpieza futura
Cuando la funcionalidad esté estable:
1. inventario de rutas/controladores/servicios;
2. detectar código muerto y duplicado;
3. agregar pruebas de regresión;
4. refactorizar un módulo por vez;
5. comparar comportamiento antes/después;
6. eliminar archivos/dependencias sólo con evidencia de que no se usan.
