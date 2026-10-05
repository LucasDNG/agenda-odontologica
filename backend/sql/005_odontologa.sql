-- La odontóloga de este consultorio es Laura Guilenia.
-- Guilenia es el apellido. El ingreso del panel no cambia.
-- Se puede ejecutar más de una vez. No borra turnos.

UPDATE users
SET
  name = 'Laura',
  lastname = 'Guilenia'
WHERE email = 'ana.demo@example.com';

UPDATE professionals
SET
  name = 'Laura',
  lastname = 'Guilenia'
WHERE email = 'ana.demo@example.com'
   OR user_id IN (
     SELECT id
     FROM users
     WHERE email = 'ana.demo@example.com'
   );
