import bcrypt from "bcrypt";
import { pool } from "../db.js";

export const getProfessionals = async (req, res) => {
  try {
    const { clinicId } = req.query;

    let query = `
      SELECT
        p.id,
        p.clinic_id,
        p.user_id,
        p.name,
        p.lastname,
        p.phone,
        p.email,
        p.specialty,
        p.active,
        p.created_at,
        p.updated_at,
        c.name AS clinic_name
      FROM professionals p
      JOIN clinics c
        ON c.id = p.clinic_id
    `;

    const values = [];

    if (clinicId) {
      query += ` WHERE p.clinic_id = $1`;
      values.push(clinicId);
    }

    query += ` ORDER BY p.lastname, p.name`;

    const result = await pool.query(query, values);

    res.json({
      professionals: result.rows,
    });
  } catch (error) {
    console.error(
      "Error obteniendo profesionales:",
      error,
    );

    res.status(500).json({
      message:
        "Error al obtener los profesionales",
    });
  }
};

export const createProfessional = async (
  req,
  res,
) => {
  try {
    const {
      clinicId,
      userId,
      name,
      lastname,
      phone,
      email,
      specialty,
    } = req.body;

    if (!clinicId) {
      return res.status(400).json({
        message:
          "Debes indicar el consultorio",
      });
    }

    if (!name?.trim() || !lastname?.trim()) {
      return res.status(400).json({
        message:
          "Nombre y apellido son obligatorios",
      });
    }

    const clinicResult = await pool.query(
      `
        SELECT id
        FROM clinics
        WHERE id = $1
      `,
      [clinicId],
    );

    if (clinicResult.rows.length === 0) {
      return res.status(404).json({
        message:
          "Consultorio no encontrado",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO professionals
        (
          clinic_id,
          user_id,
          name,
          lastname,
          phone,
          email,
          specialty
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        clinicId,
        userId || null,
        name.trim(),
        lastname.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        specialty?.trim() || null,
      ],
    );

    res.status(201).json({
      message:
        "Profesional creado correctamente",
      professional: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Error creando profesional:",
      error,
    );

    res.status(500).json({
      message:
        "Error al crear el profesional",
    });
  }
};

export const updateProfessional = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const {
      clinicId,
      userId,
      name,
      lastname,
      phone,
      email,
      specialty,
      active,
    } = req.body;

    if (!clinicId) {
      return res.status(400).json({
        message:
          "Debes indicar el consultorio",
      });
    }

    if (!name?.trim() || !lastname?.trim()) {
      return res.status(400).json({
        message:
          "Nombre y apellido son obligatorios",
      });
    }

    const result = await pool.query(
      `
        UPDATE professionals
        SET
          clinic_id = $1,
          user_id = $2,
          name = $3,
          lastname = $4,
          phone = $5,
          email = $6,
          specialty = $7,
          active = $8,
          updated_at = NOW()
        WHERE id = $9
        RETURNING *
      `,
      [
        clinicId,
        userId || null,
        name.trim(),
        lastname.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        specialty?.trim() || null,
        active !== false,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          "Profesional no encontrado",
      });
    }

    res.json({
      message:
        "Profesional actualizado correctamente",
      professional: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Error actualizando profesional:",
      error,
    );

    res.status(500).json({
      message:
        "Error al actualizar el profesional",
    });
  }
};

export const createProfessionalAccess = async (
  req,
  res,
) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { email, password } = req.body;

    const cleanEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    if (!cleanEmail) {
      return res.status(400).json({
        message: "El email es obligatorio",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 6
    ) {
      return res.status(400).json({
        message:
          "La contraseña debe tener al menos 6 caracteres",
      });
    }

    await client.query("BEGIN");

    const professionalResult =
      await client.query(
        `
          SELECT
            id,
            user_id,
            name,
            lastname,
            phone,
            email
          FROM professionals
          WHERE id = $1
            AND active = TRUE
          FOR UPDATE
        `,
        [id],
      );

    if (
      professionalResult.rows.length === 0
    ) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message:
          "Profesional no encontrado",
      });
    }

    const professional =
      professionalResult.rows[0];

    if (professional.user_id) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Este profesional ya tiene una cuenta vinculada",
      });
    }

    const existingUser =
      await client.query(
        `
          SELECT id
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
        `,
        [cleanEmail],
      );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Ya existe una cuenta con ese email",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `
        INSERT INTO users
        (
          name,
          lastname,
          email,
          password,
          phone,
          role
        )
        VALUES
        ($1, $2, $3, $4, $5, 'dentist')
        RETURNING
          id,
          name,
          lastname,
          email,
          phone,
          role,
          created_at
      `,
      [
        professional.name,
        professional.lastname,
        cleanEmail,
        hashedPassword,
        professional.phone || null,
      ],
    );

    const user = userResult.rows[0];

    const updatedProfessional =
      await client.query(
        `
          UPDATE professionals
          SET
            user_id = $1,
            email = COALESCE(email, $2),
            updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `,
        [user.id, cleanEmail, id],
      );

    await client.query("COMMIT");

    res.status(201).json({
      message:
        "Acceso del profesional creado correctamente",
      user,
      professional:
        updatedProfessional.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Error creando acceso del profesional:",
      error,
    );

    res.status(500).json({
      message:
        "Error al crear el acceso del profesional",
    });
  } finally {
    client.release();
  }
};

export const getProfessionalServices = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        SELECT
          at.id,
          at.name,
          at.duration_minutes,
          at.active
        FROM professional_services ps
        JOIN appointment_types at
          ON at.id = ps.appointment_type_id
        WHERE ps.professional_id = $1
        ORDER BY at.name
      `,
      [id],
    );

    res.json({
      services: result.rows,
    });
  } catch (error) {
    console.error(
      "Error obteniendo servicios del profesional:",
      error,
    );

    res.status(500).json({
      message:
        "Error al obtener los servicios del profesional",
    });
  }
};

export const setProfessionalServices = async (
  req,
  res,
) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { appointmentTypeIds } = req.body;

    if (!Array.isArray(appointmentTypeIds)) {
      return res.status(400).json({
        message:
          "appointmentTypeIds debe ser un array",
      });
    }

    await client.query("BEGIN");

    const professionalResult =
      await client.query(
        `
          SELECT id
          FROM professionals
          WHERE id = $1
        `,
        [id],
      );

    if (
      professionalResult.rows.length === 0
    ) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message:
          "Profesional no encontrado",
      });
    }

    await client.query(
      `
        DELETE FROM professional_services
        WHERE professional_id = $1
      `,
      [id],
    );

    for (const appointmentTypeId of appointmentTypeIds) {
      await client.query(
        `
          INSERT INTO professional_services
          (
            professional_id,
            appointment_type_id
          )
          VALUES
          ($1, $2)
        `,
        [id, appointmentTypeId],
      );
    }

    await client.query("COMMIT");

    res.json({
      message:
        "Servicios del profesional actualizados correctamente",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Error actualizando servicios del profesional:",
      error,
    );

    res.status(500).json({
      message:
        "Error al actualizar los servicios del profesional",
    });
  } finally {
    client.release();
  }
};