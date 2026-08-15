import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { createAccessToken } from "../libs/jwt.js";

export const signUp = async (req, res) => {
  try {
    const { name, lastname, email, password, phone } = req.body;

    // Comprobamos si el email ya está registrado
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "El email ya está registrado",
      });
    }

    // Ciframos la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creamos siempre un paciente
    const result = await pool.query(
      `INSERT INTO users
        (name, lastname, email, password, phone, role)
       VALUES ($1, $2, $3, $4, $5, 'patient')
       RETURNING id, name, lastname, email, phone, role, created_at`,
      [name, lastname, email, hashedPassword, phone],
    );

    const user = result.rows[0];

    // Creamos el token
    const token = await createAccessToken({
      id: user.id,
    });

    // Guardamos el token en una cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.status(201).json({
      message: "Usuario registrado correctamente",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al registrar el usuario",
    });
  }
};