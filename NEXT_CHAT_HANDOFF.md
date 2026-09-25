# Agenda Odontológica — Handoff para continuar en otro chat

## Instrucción principal
Antes de proponer cambios o escribir código:
1. revisar el repositorio `LucasDNG/agenda-odontologica`, rama `main`;
2. leer completos, en este orden:
   - `NEXT_CHAT_HANDOFF.md`
   - `CHECKPOINT.md`
   - `PROJECT_RULES.md`
   - `DECISIONS.md`
   - `TECH_DEBT.md`
3. tomar GitHub como fuente de verdad del código;
4. tomar estos Markdown como fuente de verdad de reglas, decisiones, estado y deuda técnica.

## Método de entrega
El usuario prefiere entregas completas en ZIP:
- estructura relativa desde la raíz del proyecto;
- al descomprimir, debe poder aceptar reemplazo;
- incluir todos los archivos modificados completos;
- actualizar los `.md` correspondientes en la misma entrega;
- indicar claramente si hay cambios de BACKEND / FRONTEND / BASE DE DATOS;
- si hay SQL, entregarlo de forma controlada y no mezclar migraciones no verificadas.

## Estado actual
Se está integrando WhatsApp con plantillas oficiales de Meta.
Plantillas:
- `appointment_created`
- `appointment_cancelled`
- `appointment_rescheduled`
- `appointment_restored`
- `appointment_reminder`

Todas usan seis parámetros:
paciente, consultorio, fecha, hora, servicio, profesional.

## Próximo paso
Instalar/probar el ZIP de integración de plantillas. Cuando funcione:
- commit/push;
- verificar remoto;
- actualizar checkpoint con el commit;
- continuar funcionalidad;
- paralelamente mantener `TECH_DEBT.md` para una limpieza posterior segura.

## Importante
No depender sólo de memoria o historial del chat. Si hay contradicción, revisar GitHub y documentar la decisión nueva en Markdown.
