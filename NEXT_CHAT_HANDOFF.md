# Agenda Odontológica — Handoff para continuar en otro chat

## Instrucción principal
Antes de proponer cambios o escribir código:
1. revisar el repositorio `LucasDNG/agenda-odontologica`;
2. leer completos, en este orden:
   - `NEXT_CHAT_HANDOFF.md`
   - `CHECKPOINT.md`
   - `PROJECT_RULES.md`
   - `DECISIONS.md`
   - `TECH_DEBT.md`
3. tomar GitHub como fuente de verdad del código;
4. tomar estos Markdown como fuente de verdad de reglas, decisiones, estado y deuda técnica.

## Método de entrega
El usuario prefiere entregas completas. Si se entrega un ZIP:
- estructura relativa desde la raíz del proyecto;
- al descomprimir, debe poder aceptar reemplazo;
- incluir todos los archivos modificados completos;
- actualizar los `.md` correspondientes en la misma entrega;
- indicar claramente si hay cambios de BACKEND / FRONTEND / BASE DE DATOS;
- si hay SQL, entregarlo de forma controlada y no mezclar migraciones no verificadas.

## Estado actual
La base del consultorio va a estar en Neon. Meta no se conecta a la computadora de desarrollo: usa la dirección https del sitio publicado.

La aplicación también puede levantarse en local con PostgreSQL. El esquema está versionado en `backend/sql/001_schema.sql`.

Para arrancar una base vacía:
1. copiar `backend/.env.example` a `backend/.env` y completar `DATABASE_URL` y `JWT_SECRET`;
2. en `backend`: `npm install`, `npm run db:schema`, `npm run db:seed`, `npm start`;
3. en `frontend`: `npm install`, `npm run dev`.

Portal paciente: `http://localhost:5173/`
Panel: `http://localhost:5173/odontologo`

Las plantillas de WhatsApp siguen en el código:
- `appointment_created`
- `appointment_cancelled`
- `appointment_rescheduled`
- `appointment_restored`
- `appointment_reminder`

Parámetros, en orden: paciente, consultorio, fecha, hora, servicio, profesional.

En local, sin token de Meta, el turno se confirma y la notificación queda registrada como fallida. Eso se probó. El envío real a WhatsApp no.

## Próximo paso
La odontóloga de este consultorio es Laura Guilenia. Guilenia es el apellido. El nombre está en `backend/sql/005_odontologa.sql`. El ingreso del panel usa el email y la contraseña cargados en Neon. Esa contraseña no está en el repositorio. Hasta ejecutar el cambio en DBeaver, el panel puede seguir con el acceso de prueba.

La confirmación de un turno reservado está en Mis turnos: una ficha grande con fecha, hora, servicio, duración, profesional y especialidad. Si el sitio publicado todavía muestra el aviso chico, falta que Render termine de publicar esta rama.

La reserva pública tiene que mostrar Consulta, Ortodoncia y Otros. Eso está en `backend/sql/004_servicios.sql` y hay que ejecutarlo en Neon si todavía no se hizo. Cada grupo dura 30 minutos. Limpieza deja de ofrecerse. No dar por verificados Neon de producción ni WhatsApp hasta probarlos.

## Importante
No depender sólo de memoria o historial del chat. Si hay contradicción, revisar GitHub y documentar la decisión nueva en Markdown. No guardar secretos ni datos reales de clientes.
