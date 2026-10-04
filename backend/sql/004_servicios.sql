-- El paciente elige entre tres grupos.
-- Se puede ejecutar más de una vez. No borra turnos.

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
SET active = TRUE,
    duration_minutes = 30
WHERE LOWER(name) IN ('consulta', 'ortodoncia', 'otros');

UPDATE appointment_types
SET active = FALSE
WHERE LOWER(name) NOT IN ('consulta', 'ortodoncia', 'otros');

INSERT INTO professional_services (professional_id, appointment_type_id)
SELECT p.id, at.id
FROM professionals p
JOIN appointment_types at
  ON LOWER(at.name) IN ('consulta', 'ortodoncia', 'otros')
WHERE p.active = TRUE
ON CONFLICT DO NOTHING;
