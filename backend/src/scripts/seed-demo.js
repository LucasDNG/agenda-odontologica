import bcrypt from "bcrypt";
import { pool } from "../db.js";

const DEMO_PASSWORD = "demo1234";

const seedDemo = async () => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingClinic = await client.query(
      `
        SELECT id
        FROM clinics
        WHERE name = 'Consultorio Demo'
        ORDER BY id
        LIMIT 1
      `,
    );

    const clinicId = existingClinic.rows[0]?.id
      || (
        await client.query(
          `
            INSERT INTO clinics (
              name,
              phone,
              email,
              address,
              active,
              max_active_appointments_per_patient
            )
            VALUES (
              'Consultorio Demo',
              '1140000000',
              'demo@consultorio.local',
              'Calle Falsa 123',
              TRUE,
              2
            )
            RETURNING id
          `,
        )
      ).rows[0].id;

    if (!clinicId) {
      throw new Error("No se pudo crear el consultorio demo");
    }

    const dentistResult = await client.query(
      `
        INSERT INTO users (
          name,
          lastname,
          email,
          password,
          phone,
          role
        )
        VALUES ($1, $2, $3, $4, $5, 'dentist')
        ON CONFLICT (email) DO UPDATE
          SET role = 'dentist'
        RETURNING id
      `,
      [
        "Ana",
        "Demo",
        "ana.demo@example.com",
        passwordHash,
        "1140000001",
      ],
    );

    const dentistUserId = dentistResult.rows[0].id;

    const existingProfessional = await client.query(
      `
        SELECT id
        FROM professionals
        WHERE user_id = $1
        ORDER BY id
        LIMIT 1
      `,
      [dentistUserId],
    );

    const professionalId = existingProfessional.rows[0]?.id
      || (
        await client.query(
          `
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
            VALUES ($1, $2, 'Ana', 'Demo', '1140000001', $3, 'Odontología general', TRUE)
            RETURNING id
          `,
          [clinicId, dentistUserId, "ana.demo@example.com"],
        )
      ).rows[0].id;

    const serviceNames = [
      ["Consulta", 30],
      ["Ortodoncia", 30],
      ["Otros", 30],
    ];

    for (const [name, duration] of serviceNames) {
      const serviceResult = await client.query(
        `
          INSERT INTO appointment_types (
            name,
            duration_minutes,
            active
          )
          SELECT $1, $2, TRUE
          WHERE NOT EXISTS (
            SELECT 1
            FROM appointment_types
            WHERE LOWER(name) = LOWER($1)
          )
          RETURNING id
        `,
        [name, duration],
      );

      const serviceId =
        serviceResult.rows[0]?.id ||
        (
          await client.query(
            `
              SELECT id
              FROM appointment_types
              WHERE LOWER(name) = LOWER($1)
              LIMIT 1
            `,
            [name],
          )
        ).rows[0]?.id;

      await client.query(
        `
          INSERT INTO professional_services (
            professional_id,
            appointment_type_id
          )
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [professionalId, serviceId],
      );
    }

    await client.query(`
      UPDATE appointment_types
      SET active = FALSE
      WHERE LOWER(name) = 'limpieza'
    `);

    const existingAvailability = await client.query(
      `
        SELECT id
        FROM availability
        WHERE professional_id = $1
        LIMIT 1
      `,
      [professionalId],
    );

    if (existingAvailability.rows.length === 0) {
      for (const dayOfWeek of [1, 2, 3, 4, 5]) {
        await client.query(
          `
            INSERT INTO availability (
              professional_id,
              day_of_week,
              start_time,
              end_time,
              active
            )
            VALUES
              ($1, $2, '09:00', '13:00', TRUE),
              ($1, $2, '14:00', '18:00', TRUE)
          `,
          [professionalId, dayOfWeek],
        );
      }
    }

    const patientUser = await client.query(
      `
        INSERT INTO users (
          name,
          lastname,
          email,
          password,
          phone,
          role,
          dni
        )
        VALUES ('Lucía', 'Prueba', 'paciente.demo@example.com', $1, '1112345678', 'patient', '30123456')
        ON CONFLICT (email) DO UPDATE
          SET
            phone = EXCLUDED.phone,
            role = 'patient',
            dni = EXCLUDED.dni
        RETURNING id, name, lastname, email, phone, dni
      `,
      [passwordHash],
    );

    const patient = patientUser.rows[0];

    await client.query(
      `
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'quick', TRUE)
        ON CONFLICT (user_id) WHERE user_id IS NOT NULL
        DO UPDATE SET
          phone = EXCLUDED.phone,
          dni = EXCLUDED.dni,
          active = TRUE,
          updated_at = NOW()
      `,
      [
        clinicId,
        patient.id,
        patient.name,
        patient.lastname,
        patient.phone,
        patient.email,
        patient.dni,
      ],
    );

    await client.query("COMMIT");

    console.log("Datos demo listos.");
    console.log("Odontólogo: ana.demo@example.com / demo1234");
    console.log("Paciente: DNI 30123456 / demo1234");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedDemo().catch((error) => {
  console.error("No se pudieron cargar los datos demo:", error);
  process.exit(1);
});
