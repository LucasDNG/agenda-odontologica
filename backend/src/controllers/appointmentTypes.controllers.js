import { pool } from "../db.js";

const validateService = (
  name,
  durationMinutes,
) => {
  const cleanName =
    typeof name === "string"
      ? name.trim()
      : "";

  const duration =
    Number(durationMinutes);

  if (!cleanName) {
    return {
      error:
        "El nombre del servicio es obligatorio",
    };
  }

  if (
    !Number.isInteger(duration) ||
    duration < 5 ||
    duration > 480
  ) {
    return {
      error:
        "La duración debe estar entre 5 y 480 minutos",
    };
  }

  return {
    cleanName,
    duration,
  };
};

export const getAppointmentTypes =
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT
            id,
            name,
            duration_minutes,
            active
          FROM appointment_types
          WHERE active = TRUE
          ORDER BY name
        `);

      return res.json({
        appointmentTypes:
          result.rows,
      });
    } catch (error) {
      console.error(
        "Error obteniendo servicios:",
        error,
      );

      return res.status(500).json({
        message:
          "Error al obtener los servicios",
      });
    }
  };

export const getAdminAppointmentTypes =
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT
            id,
            name,
            duration_minutes,
            active
          FROM appointment_types
          ORDER BY
            active DESC,
            name
        `);

      return res.json({
        appointmentTypes:
          result.rows,
      });
    } catch (error) {
      console.error(
        "Error obteniendo servicios para administración:",
        error,
      );

      return res.status(500).json({
        message:
          "Error al obtener los servicios",
      });
    }
  };

export const createAppointmentType =
  async (req, res) => {
    try {
      const {
        name,
        durationMinutes,
      } = req.body;

      const validation =
        validateService(
          name,
          durationMinutes,
        );

      if (validation.error) {
        return res.status(400).json({
          message:
            validation.error,
        });
      }

      const duplicateResult =
        await pool.query(
          `
            SELECT id
            FROM appointment_types
            WHERE LOWER(name) =
              LOWER($1)
            LIMIT 1
          `,
          [
            validation.cleanName,
          ],
        );

      if (
        duplicateResult.rows
          .length > 0
      ) {
        return res.status(409).json({
          message:
            "Ya existe un servicio con ese nombre",
        });
      }

      const result =
        await pool.query(
          `
            INSERT INTO appointment_types
            (
              name,
              duration_minutes,
              active
            )
            VALUES
            (
              $1,
              $2,
              TRUE
            )
            RETURNING
              id,
              name,
              duration_minutes,
              active
          `,
          [
            validation.cleanName,
            validation.duration,
          ],
        );

      return res
        .status(201)
        .json({
          message:
            "Servicio creado correctamente",
          appointmentType:
            result.rows[0],
        });
    } catch (error) {
      console.error(
        "Error creando servicio:",
        error,
      );

      return res.status(500).json({
        message:
          "Error al crear el servicio",
      });
    }
  };

export const updateAppointmentType =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        name,
        durationMinutes,
        active,
      } = req.body;

      const numericId =
        Number(id);

      if (
        !Number.isInteger(
          numericId,
        ) ||
        numericId <= 0
      ) {
        return res.status(400).json({
          message:
            "Servicio inválido",
        });
      }

      const validation =
        validateService(
          name,
          durationMinutes,
        );

      if (validation.error) {
        return res.status(400).json({
          message:
            validation.error,
        });
      }

      const duplicateResult =
        await pool.query(
          `
            SELECT id
            FROM appointment_types
            WHERE LOWER(name) =
              LOWER($1)
              AND id <> $2
            LIMIT 1
          `,
          [
            validation.cleanName,
            numericId,
          ],
        );

      if (
        duplicateResult.rows
          .length > 0
      ) {
        return res.status(409).json({
          message:
            "Ya existe otro servicio con ese nombre",
        });
      }

      const result =
        await pool.query(
          `
            UPDATE appointment_types
            SET
              name = $1,
              duration_minutes = $2,
              active = $3
            WHERE id = $4
            RETURNING
              id,
              name,
              duration_minutes,
              active
          `,
          [
            validation.cleanName,
            validation.duration,
            active !== false,
            numericId,
          ],
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          message:
            "Servicio no encontrado",
        });
      }

      return res.json({
        message:
          "Servicio actualizado correctamente",
        appointmentType:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "Error actualizando servicio:",
        error,
      );

      return res.status(500).json({
        message:
          "Error al actualizar el servicio",
      });
    }
  };