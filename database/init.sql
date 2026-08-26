CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'patient'
    CHECK (role IN ('patient', 'dentist')),
  max_active_appointments INTEGER NOT NULL DEFAULT 1
    CHECK (max_active_appointments BETWEEN 1 AND 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointment_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS availability (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS blocked_dates (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  reason VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_type_id INTEGER NOT NULL REFERENCES appointment_types(id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'completed', 'absent')),
  notes TEXT,
  is_overbooked BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_appointments_date
ON appointments (appointment_date);

INSERT INTO appointment_types (name, duration_minutes, active)
VALUES
  ('Consulta', 15, true),
  ('Ortodoncia', 30, true)
ON CONFLICT (name) DO UPDATE SET
  duration_minutes = EXCLUDED.duration_minutes,
  active = true;

INSERT INTO availability (day_of_week, start_time, end_time, active)
SELECT * FROM (VALUES
  (1, '09:00'::time, '11:30'::time, true),
  (2, '09:00'::time, '11:30'::time, true),
  (2, '14:00'::time, '16:00'::time, true),
  (3, '09:00'::time, '11:30'::time, true),
  (4, '09:00'::time, '11:30'::time, true),
  (4, '14:00'::time, '16:00'::time, true),
  (5, '09:00'::time, '11:30'::time, true)
) AS v(day_of_week, start_time, end_time, active)
WHERE NOT EXISTS (SELECT 1 FROM availability);
