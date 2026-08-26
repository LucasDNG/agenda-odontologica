import { pool } from "../db.js";

export const isDentist = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [req.userId],
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (result.rows[0].role !== "dentist") {
      return res.status(403).json({ message: "Acceso exclusivo para la odontóloga" });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al verificar permisos" });
  }
};
