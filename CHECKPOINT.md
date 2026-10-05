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

## Datos demo
No son clientes reales.
- Odontóloga: Laura Guilenia. El email y la contraseña del panel están en Neon, no en este repositorio.
- Paciente: DNI `30123456` / `demo1234`
- Consultorio: Consultorio Demo

## Publicación
Render llegó a mostrar Live para la rama `cursor/levantar-agenda-local-9f25`. Desde acá no se abrió la dirección pública definitiva ni se probó el login en ese sitio. Neon tiene el esquema y el consultorio demo. `003_dni_login.sql` todavía no se ejecutó en Neon. Meta y WhatsApp real no se probaron.

## Esta entrega de ingreso
BACKEND / FRONTEND / BASE DE DATOS:
- El portal de pacientes pide DNI.
- `backend/sql/003_dni_login.sql` agrega `users.dni` y carga el DNI ficticio del paciente demo.
- El panel `/odontologo` sigue pidiendo email. El inicio de los pacientes no muestra ese enlace. Solo ahí se ofrece instalar la aplicación de pacientes. El panel se instala desde `/odontologo/instalar`.

## Servicios de la reserva
El paciente ve tres grupos de 30 minutos: Consulta, Ortodoncia y Otros. Reglas, fracciones y ajuste no tienen botón propio. El cambio en el sitio que ya está publicado depende de ejecutar `backend/sql/004_servicios.sql` en Neon.

## Confirmación del turno
FRONTEND:
- Después de reservar, Mis turnos muestra una ficha grande con fecha, hora, servicio, duración, profesional y especialidad.
- Próximos turnos e historial usan las mismas etiquetas.
- Se revisó en el navegador local. El sitio publicado cambia cuando Render termina de publicar esta rama. Desde acá no se abrió el sitio de Render para esta ficha.

## Nombre de la odontóloga
BASE DE DATOS:
- El profesional que ve el paciente pasa a llamarse Laura Guilenia. Guilenia es el apellido.
- El cambio está en `backend/sql/005_odontologa.sql`. En Neon todavía no se ejecutó desde acá.
- El ingreso del panel se cambia en Neon. La contraseña no queda en el repositorio. Desde acá no se ejecutó ese cambio.

## Consultorio editable
FRONTEND:
- En Configuración, el nombre, el teléfono, el email y la dirección del consultorio se editan y se guardan con el límite de turnos.
- El portal del paciente muestra ese nombre, la calle, el teléfono y el email.
- En el ingreso, el nombre del consultorio es la primera línea. La carta tiene cabecera, filas de contacto con ícono y el formulario debajo.
- Las demás pantallas del paciente y del panel usan la misma cabecera, los mismos bloques y el mismo botón.
- El sitio publicado muestra eso cuando Render termina de publicar esta rama.

## Agenda del consultorio
FRONTEND:
- Si el día que está abierto no tiene turnos, eso se lee en la barra de la fecha. La ficha de abajo dice que es otro día.

## Pendiente inmediato
1. Ejecutar `backend/sql/005_odontologa.sql` en la conexión de Neon, con Alt+X, y recargar el sitio.
2. Ejecutar `backend/sql/003_dni_login.sql` en la conexión nueva de Neon, con Alt+X, si todavía no se ejecutó.
3. Ejecutar `backend/sql/004_servicios.sql` en esa misma conexión y recargar la reserva.
4. Probar el ingreso del paciente demo con DNI `30123456` y contraseña `demo1234`.
5. Cargar token, phone number id y plantillas aprobadas de Meta en el sitio, no en la computadora.
6. Repetir un turno con un teléfono real y revisar que `whatsapp_notifications.status` pase a `sent`.
