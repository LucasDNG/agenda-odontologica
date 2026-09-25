# Agenda Odontológica — Deuda técnica y limpieza pendiente

Este archivo es una lista de trabajo, no significa que haya que cambiar todo ahora.

## Prioridad alta
- Normalizar relación paciente/turno:
  - hoy conviven `appointments.patient_id` y `appointments.patient_record_id`;
  - el booking público todavía puede depender del id de usuario;
  - definir una única relación canónica sin romper datos existentes.
- Revisar autenticación de profesionales inactivos:
  - desactivar un profesional no necesariamente desactiva su usuario/login.
- Revisar consultas que obtienen clínica activa para garantizar que no haya ambigüedad.
- Endurecer deduplicación de recordatorios a nivel DB si se despliegan múltiples procesos/instancias.

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
