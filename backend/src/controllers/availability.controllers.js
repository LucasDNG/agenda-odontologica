import { pool } from "../db.js";

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const isValidTime = (time) => {
  return /^\d{2}:\d{2}$/.test(time);
};

export const getAvailability = async (req, res) => {
  try {
    const { professionalId } = req.query;

    let query = `
      SELECT
        id,
        day_of_week,
        start_time,
        end_time,
        active,
        professional_id
      FROM availability
      WHERE active = true
    `;

    const values = [];

    if (professionalId) {
      query += `
        AND professional_id = $1
      `;

      values.push(professionalId);
    }

    query += `
      ORDER BY day_of_week, start_time
    `;

    const result = await pool.query(query, values);

    res.json({
      availability: result.rows,
    });
  } catch (error) {
    console.error("Error obteniendo disponibilidad:", error);

    res.status(500).json({
      message: "Error al obtener la disponibilidad",
    });
  }
};

export const getProfessionalAvailability = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const professionalResult = await pool.query(
      `
        SELECT id
        FROM professionals
        WHERE id = $1
        AND active = true
      `,
      [id],
    );

    if (professionalResult.rows.length === 0) {
      return res.status(404).json({
        message: "Profesional no encontrado",
      });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          day_of_week,
          start_time,
          end_time,
          active,
          professional_id
        FROM availability
        WHERE professional_id = $1
        ORDER BY day_of_week, start_time
      `,
      [id],
    );

    res.json({
      availability: result.rows,
    });
  } catch (error) {
    console.error(
      "Error obteniendo horarios del profesional:",
      error,
    );

    res.status(500).json({
      message:
        "Error al obtener los horarios del profesional",
    });
  }
};

export const setProfessionalAvailability = async (
  req,
  res,
) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({
        message: "availability debe ser un array",
      });
    }

    const professionalResult = await client.query(
      `
        SELECT id
        FROM professionals
        WHERE id = $1
        AND active = true
      `,
      [id],
    );

    if (professionalResult.rows.length === 0) {
      return res.status(404).json({
        message: "Profesional no encontrado",
      });
    }

    for (const schedule of availability) {
      const {
        dayOfWeek,
        startTime,
        endTime,
        active = true,
      } = schedule;

      if (
        !Number.isInteger(Number(dayOfWeek)) ||
        Number(dayOfWeek) < 0 ||
        Number(dayOfWeek) > 6
      ) {
        return res.status(400).json({
          message:
            "El día de la semana debe estar entre 0 y 6",
        });
      }

      if (
        !isValidTime(startTime) ||
        !isValidTime(endTime)
      ) {
        return res.status(400).json({
          message:
            "Los horarios deben tener formato HH:MM",
        });
      }

      if (
        timeToMinutes(startTime) >=
        timeToMinutes(endTime)
      ) {
        return res.status(400).json({
          message:
            "El horario de inicio debe ser anterior al horario de finalización",
        });
      }

      if (typeof active !== "boolean") {
        return res.status(400).json({
          message:
            "El estado active debe ser verdadero o falso",
        });
      }
    }

    await client.query("BEGIN");

    await client.query(
      `
        DELETE FROM availability
        WHERE professional_id = $1
      `,
      [id],
    );

    for (const schedule of availability) {
      await client.query(
        `
          INSERT INTO availability
            (
              day_of_week,
              start_time,
              end_time,
              active,
              professional_id
            )
          VALUES
            ($1, $2, $3, $4, $5)
        `,
        [
          Number(schedule.dayOfWeek),
          schedule.startTime,
          schedule.endTime,
          schedule.active !== false,
          id,
        ],
      );
    }

    await client.query("COMMIT");

    const result = await client.query(
      `
        SELECT
          id,
          day_of_week,
          start_time,
          end_time,
          active,
          professional_id
        FROM availability
        WHERE professional_id = $1
        ORDER BY day_of_week, start_time
      `,
      [id],
    );

    res.json({
      message:
        "Horarios del profesional actualizados correctamente",
      availability: result.rows,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Error haciendo rollback:",
        rollbackError,
      );
    }

    console.error(
      "Error actualizando horarios del profesional:",
      error,
    );

    res.status(500).json({
      message:
        "Error al actualizar los horarios del profesional",
    });
  } finally {
    client.release();
  }
};