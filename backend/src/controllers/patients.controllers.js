import { pool } from "../db.js";

const normalizeText = (value) => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed || null;
};

export const searchPatients = async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const values = [];
    let searchCondition = "";

    if (search) {
      values.push(`%${search}%`);

      searchCondition = `
        AND (
          p.name ILIKE $1
          OR p.lastname ILIKE $1
          OR p.dni ILIKE $1
          OR p.phone ILIKE $1
          OR CONCAT_WS(
            ' ',
            p.name,
            p.lastname
          ) ILIKE $1
        )
      `;
    }

    const result = await pool.query(
      `
        SELECT
          p.id,
          p.clinic_id,
          p.user_id,
          p.name,
          p.lastname,
          p.dni,
          p.birth_date,
          p.phone,
          p.email,
          p.address,
          p.health_insurance,
          p.health_insurance_plan,
          p.member_number,
          p.allergies,
          p.medications,
          p.medical_history,
          p.notes,
          p.profile_type,
          p.active,
          p.created_at,
          p.updated_at
        FROM patients p
        WHERE p.active = TRUE
        ${searchCondition}
        ORDER BY
          p.lastname NULLS LAST,
          p.name
        LIMIT 30
      `,
      values,
    );

    res.json({
      patients: result.rows,
    });
  } catch (error) {
    console.error("Error buscando pacientes:", error);

    res.status(500).json({
      message: "Error al buscar pacientes",
    });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        SELECT
          p.id,
          p.clinic_id,
          p.user_id,
          p.name,
          p.lastname,
          p.dni,
          p.birth_date,
          p.phone,
          p.email,
          p.address,
          p.health_insurance,
          p.health_insurance_plan,
          p.member_number,
          p.allergies,
          p.medications,
          p.medical_history,
          p.notes,
          p.profile_type,
          p.active,
          p.created_at,
          p.updated_at
        FROM patients p
        WHERE p.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Paciente no encontrado",
      });
    }

    res.json({
      patient: result.rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo paciente:", error);

    res.status(500).json({
      message: "Error al obtener el paciente",
    });
  }
};

export const createPatient = async (req, res) => {
  try {
    const {
      name,
      lastname,
      dni,
      birthDate,
      phone,
      email,
      address,
      healthInsurance,
      healthInsurancePlan,
      memberNumber,
      allergies,
      medications,
      medicalHistory,
      notes,
      profileType = "quick",
    } = req.body;

    const cleanName = normalizeText(name);
    const cleanLastname = normalizeText(lastname);
    const cleanDni = normalizeText(dni);
    const cleanPhone = normalizeText(phone);

    if (!cleanName) {
      return res.status(400).json({
        message: "El nombre del paciente es obligatorio",
      });
    }

    if (!["quick", "complete"].includes(profileType)) {
      return res.status(400).json({
        message: "Tipo de ficha inválido",
      });
    }

    /*
      Evitamos duplicados fuertes por DNI.
    */
    if (cleanDni) {
      const dniResult = await pool.query(
        `
          SELECT
            id,
            name,
            lastname,
            dni,
            phone
          FROM patients
          WHERE dni = $1
            AND active = TRUE
          LIMIT 1
        `,
        [cleanDni],
      );

      if (dniResult.rows.length > 0) {
        return res.status(409).json({
          message:
            "Ya existe un paciente con ese DNI",
          existingPatient: dniResult.rows[0],
        });
      }
    }

    /*
      También avisamos por teléfono para reducir
      pacientes duplicados.
    */
    if (cleanPhone) {
      const phoneResult = await pool.query(
        `
          SELECT
            id,
            name,
            lastname,
            dni,
            phone
          FROM patients
          WHERE phone = $1
            AND active = TRUE
          LIMIT 1
        `,
        [cleanPhone],
      );

      if (phoneResult.rows.length > 0) {
        return res.status(409).json({
          message:
            "Ya existe un paciente con ese teléfono",
          existingPatient: phoneResult.rows[0],
        });
      }
    }

    const clinicResult = await pool.query(`
      SELECT id
      FROM clinics
      WHERE active = TRUE
      ORDER BY id
      LIMIT 1
    `);

    if (clinicResult.rows.length === 0) {
      return res.status(400).json({
        message:
          "No hay un consultorio activo configurado",
      });
    }

    const clinicId = clinicResult.rows[0].id;

    const result = await pool.query(
      `
        INSERT INTO patients
        (
          clinic_id,
          name,
          lastname,
          dni,
          birth_date,
          phone,
          email,
          address,
          health_insurance,
          health_insurance_plan,
          member_number,
          allergies,
          medications,
          medical_history,
          notes,
          profile_type,
          active
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16,
          TRUE
        )
        RETURNING
          id,
          clinic_id,
          user_id,
          name,
          lastname,
          dni,
          birth_date,
          phone,
          email,
          address,
          health_insurance,
          health_insurance_plan,
          member_number,
          allergies,
          medications,
          medical_history,
          notes,
          profile_type,
          active,
          created_at,
          updated_at
      `,
      [
        clinicId,
        cleanName,
        cleanLastname,
        cleanDni,
        birthDate || null,
        cleanPhone,
        normalizeText(email),
        normalizeText(address),
        normalizeText(healthInsurance),
        normalizeText(healthInsurancePlan),
        normalizeText(memberNumber),
        normalizeText(allergies),
        normalizeText(medications),
        normalizeText(medicalHistory),
        normalizeText(notes),
        profileType,
      ],
    );

    res.status(201).json({
      message:
        profileType === "quick"
          ? "Paciente rápido creado correctamente"
          : "Ficha del paciente creada correctamente",
      patient: result.rows[0],
    });
  } catch (error) {
    console.error("Error creando paciente:", error);

    res.status(500).json({
      message: "Error al crear el paciente",
    });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      lastname,
      dni,
      birthDate,
      phone,
      email,
      address,
      healthInsurance,
      healthInsurancePlan,
      memberNumber,
      allergies,
      medications,
      medicalHistory,
      notes,
      profileType,
    } = req.body;

    const patientResult = await pool.query(
      `
        SELECT id
        FROM patients
        WHERE id = $1
          AND active = TRUE
      `,
      [id],
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        message: "Paciente no encontrado",
      });
    }

    if (
      profileType &&
      !["quick", "complete"].includes(profileType)
    ) {
      return res.status(400).json({
        message: "Tipo de ficha inválido",
      });
    }

    const cleanDni = normalizeText(dni);
    const cleanPhone = normalizeText(phone);

    if (cleanDni) {
      const duplicateDni = await pool.query(
        `
          SELECT id
          FROM patients
          WHERE dni = $1
            AND id <> $2
            AND active = TRUE
          LIMIT 1
        `,
        [cleanDni, id],
      );

      if (duplicateDni.rows.length > 0) {
        return res.status(409).json({
          message:
            "Ya existe otro paciente con ese DNI",
        });
      }
    }

    if (cleanPhone) {
      const duplicatePhone = await pool.query(
        `
          SELECT id
          FROM patients
          WHERE phone = $1
            AND id <> $2
            AND active = TRUE
          LIMIT 1
        `,
        [cleanPhone, id],
      );

      if (duplicatePhone.rows.length > 0) {
        return res.status(409).json({
          message:
            "Ya existe otro paciente con ese teléfono",
        });
      }
    }

    const result = await pool.query(
      `
        UPDATE patients
        SET
          name = COALESCE($1, name),
          lastname = $2,
          dni = $3,
          birth_date = $4,
          phone = $5,
          email = $6,
          address = $7,
          health_insurance = $8,
          health_insurance_plan = $9,
          member_number = $10,
          allergies = $11,
          medications = $12,
          medical_history = $13,
          notes = $14,
          profile_type = COALESCE(
            $15,
            profile_type
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $16
        RETURNING
          id,
          clinic_id,
          user_id,
          name,
          lastname,
          dni,
          birth_date,
          phone,
          email,
          address,
          health_insurance,
          health_insurance_plan,
          member_number,
          allergies,
          medications,
          medical_history,
          notes,
          profile_type,
          active,
          created_at,
          updated_at
      `,
      [
        normalizeText(name),
        normalizeText(lastname),
        cleanDni,
        birthDate || null,
        cleanPhone,
        normalizeText(email),
        normalizeText(address),
        normalizeText(healthInsurance),
        normalizeText(healthInsurancePlan),
        normalizeText(memberNumber),
        normalizeText(allergies),
        normalizeText(medications),
        normalizeText(medicalHistory),
        normalizeText(notes),
        profileType || null,
        id,
      ],
    );

    res.json({
      message:
        "Paciente actualizado correctamente",
      patient: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Error actualizando paciente:",
      error,
    );

    res.status(500).json({
      message: "Error al actualizar el paciente",
    });
  }
};