-- Esquema inicial reconstruido desde las consultas del backend.
-- Idempotente: se puede volver a ejecutar sobre una base vacía o ya creada.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  lastname TEXT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'patient',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_role_check CHECK (
    role IN ('patient', 'dentist')
  )
);

CREATE TABLE IF NOT EXISTS clinics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  max_active_appointments_per_patient INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clinics_max_appointments_check CHECK (
    max_active_appointments_per_patient BETWEEN 1 AND 5
  )
);

CREATE TABLE IF NOT EXISTS professionals (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL REFERENCES clinics (id),
  user_id INTEGER REFERENCES users (id),
  name TEXT NOT NULL,
  lastname TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  specialty TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT appointment_types_duration_check CHECK (
    duration_minutes BETWEEN 5 AND 480
  )
);

CREATE TABLE IF NOT EXISTS professional_services (
  professional_id INTEGER NOT NULL REFERENCES professionals (id) ON DELETE CASCADE,
  appointment_type_id INTEGER NOT NULL REFERENCES appointment_types (id),
  PRIMARY KEY (professional_id, appointment_type_id)
);

CREATE TABLE IF NOT EXISTS availability (
  id SERIAL PRIMARY KEY,
  professional_id INTEGER NOT NULL REFERENCES professionals (id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT availability_day_check CHECK (
    day_of_week BETWEEN 0 AND 6
  ),
  CONSTRAINT availability_time_check CHECK (
    start_time < end_time
  )
);

CREATE TABLE IF NOT EXISTS blocked_dates (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL REFERENCES clinics (id),
  user_id INTEGER REFERENCES users (id),
  name TEXT NOT NULL,
  lastname TEXT,
  dni TEXT,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  health_insurance TEXT,
  health_insurance_plan TEXT,
  member_number TEXT,
  allergies TEXT,
  medications TEXT,
  medical_history TEXT,
  notes TEXT,
  profile_type TEXT NOT NULL DEFAULT 'quick',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT patients_profile_type_check CHECK (
    profile_type IN ('quick', 'complete')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS patients_user_id_unique
  ON patients (user_id)
  WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES users (id),
  patient_record_id INTEGER REFERENCES patients (id),
  professional_id INTEGER NOT NULL REFERENCES professionals (id),
  appointment_type_id INTEGER NOT NULL REFERENCES appointment_types (id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  is_overbooked BOOLEAN NOT NULL DEFAULT FALSE,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT appointments_status_check CHECK (
    status IN (
      'scheduled',
      'confirmed',
      'cancelled',
      'completed',
      'absent'
    )
  )
);

CREATE INDEX IF NOT EXISTS appointments_professional_date_idx
  ON appointments (professional_id, appointment_date);

CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments (id),
  patient_id INTEGER REFERENCES patients (id),
  notification_type TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  whatsapp_message_id TEXT,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_notifications_active_reminder
  ON whatsapp_notifications (appointment_id, notification_type)
  WHERE notification_type = 'appointment_reminder'
    AND status IN ('pending', 'sent');

CREATE TABLE IF NOT EXISTS whatsapp_consultations (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  meta_message_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  CONSTRAINT whatsapp_consultations_status_check CHECK (
    status IN ('pending', 'answered')
  )
);
