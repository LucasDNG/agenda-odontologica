-- Datos ficticios para poder entrar la primera vez.
-- Se puede ejecutar más de una vez. No borra turnos.

INSERT INTO clinics (
  name,
  phone,
  email,
  address,
  active,
  max_active_appointments_per_patient
)
SELECT
  'Consultorio Demo',
  '1140000000',
  'demo@consultorio.local',
  'Calle Falsa 123',
  TRUE,
  2
WHERE NOT EXISTS (
  SELECT 1 FROM clinics WHERE name = 'Consultorio Demo'
);

INSERT INTO users (name, lastname, email, password, phone, role)
VALUES (
  'Laura',
  'Guilenia',
  'ana.demo@example.com',
  '$2b$10$ORjvCOqE4tM9C5dHk7T6TOTuoKcBmTxVwKwIJsZMi0YJA0BhgEJli',
  '1140000001',
  'dentist'
)
ON CONFLICT (email) DO UPDATE
SET
  role = 'dentist',
  name = EXCLUDED.name,
  lastname = EXCLUDED.lastname;

INSERT INTO professionals (
  clinic_id,
  user_id,
  name,
  lastname,
  phone,
  email,
  specialty,
  active
)
SELECT
  c.id,
  u.id,
  'Laura',
  'Guilenia',
  '1140000001',
  'ana.demo@example.com',
  'Odontología general',
  TRUE
FROM clinics c
JOIN users u ON u.email = 'ana.demo@example.com'
WHERE c.name = 'Consultorio Demo'
  AND NOT EXISTS (
    SELECT 1 FROM professionals p WHERE p.user_id = u.id
  );

UPDATE professionals
SET
  name = 'Laura',
  lastname = 'Guilenia'
WHERE email = 'ana.demo@example.com'
   OR user_id IN (
     SELECT id FROM users WHERE email = 'ana.demo@example.com'
   );

INSERT INTO appointment_types (name, duration_minutes, active)
SELECT 'Consulta', 30, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM appointment_types WHERE LOWER(name) = 'consulta'
);

INSERT INTO appointment_types (name, duration_minutes, active)
SELECT 'Ortodoncia', 30, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM appointment_types WHERE LOWER(name) = 'ortodoncia'
);

INSERT INTO appointment_types (name, duration_minutes, active)
SELECT 'Otros', 30, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM appointment_types WHERE LOWER(name) = 'otros'
);

UPDATE appointment_types
SET active = FALSE
WHERE LOWER(name) = 'limpieza';

INSERT INTO professional_services (professional_id, appointment_type_id)
SELECT p.id, at.id
FROM professionals p
JOIN appointment_types at ON LOWER(at.name) IN ('consulta', 'ortodoncia', 'otros')
WHERE p.email = 'ana.demo@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO availability (
  professional_id,
  day_of_week,
  start_time,
  end_time,
  active
)
SELECT p.id, day.day_of_week, shift.start_time, shift.end_time, TRUE
FROM professionals p
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS day(day_of_week)
CROSS JOIN (VALUES ('09:00'::time, '13:00'::time), ('14:00'::time, '18:00'::time)) AS shift(start_time, end_time)
WHERE p.email = 'ana.demo@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM availability a WHERE a.professional_id = p.id
  );

INSERT INTO users (name, lastname, email, password, phone, role, dni)
VALUES (
  'Lucía',
  'Prueba',
  'paciente.demo@example.com',
  '$2b$10$ORjvCOqE4tM9C5dHk7T6TOTuoKcBmTxVwKwIJsZMi0YJA0BhgEJli',
  '1112345678',
  'patient',
  '30123456'
)
ON CONFLICT (email) DO UPDATE
SET role = 'patient',
    dni = EXCLUDED.dni;

INSERT INTO patients (
  clinic_id,
  user_id,
  name,
  lastname,
  phone,
  email,
  dni,
  profile_type,
  active
)
SELECT
  c.id,
  u.id,
  'Lucía',
  'Prueba',
  '1112345678',
  'paciente.demo@example.com',
  '30123456',
  'quick',
  TRUE
FROM clinics c
JOIN users u ON u.email = 'paciente.demo@example.com'
WHERE c.name = 'Consultorio Demo'
ON CONFLICT (user_id) WHERE user_id IS NOT NULL
DO UPDATE SET
  active = TRUE,
  dni = EXCLUDED.dni;
