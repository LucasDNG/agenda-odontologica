-- Permite que el paciente ingrese con el DNI.
-- Se puede ejecutar más de una vez. No borra turnos ni cuentas.

ALTER TABLE users ADD COLUMN IF NOT EXISTS dni TEXT;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_dni_unique
  ON users (dni)
  WHERE dni IS NOT NULL;

UPDATE users
SET dni = '30123456'
WHERE email = 'paciente.demo@example.com'
  AND (dni IS NULL OR dni = '');

UPDATE patients
SET dni = '30123456'
WHERE email = 'paciente.demo@example.com'
  AND (dni IS NULL OR dni = '');
