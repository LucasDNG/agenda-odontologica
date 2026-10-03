import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { createAccessToken } from "../libs/jwt.js";

const sessionCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 1000 * 60 * 60 * 24,
};

export const signUp = async (req, res) => {
  try {
    const { name, lastname, email, password, phone } = req.body;

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "El email ya está registrado",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
        (name, lastname, email, password, phone, role)
       VALUES ($1, $2, $3, $4, $5, 'patient')
       RETURNING id, name, lastname, email, phone, role, created_at`,
      [name, lastname, email, hashedPassword, phone],
    );

    const user = result.rows[0];

    const token = await createAccessToken({
      id: user.id,
    });

    res.cookie("token", token, sessionCookie);

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

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Email o contraseña incorrectos",
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({
        message: "Email o contraseña incorrectos",
      });
    }

    if (user.role === "dentist") {
      const professionalResult = await pool.query(
        `
          SELECT active
          FROM professionals
          WHERE user_id = $1
          ORDER BY id
          LIMIT 1
        `,
        [user.id],
      );

      if (
        professionalResult.rows.length > 0 &&
        professionalResult.rows[0].active === false
      ) {
        return res.status(403).json({
          message: "Este profesional está inactivo",
        });
      }
    }

    const token = await createAccessToken({
      id: user.id,
    });

    res.cookie("token", token, sessionCookie);

    res.json({
      message: "Sesión iniciada correctamente",
      user: {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al iniciar sesión",
    });
  }
};

export const signOut = (req, res) => {
  res.clearCookie("token");

  res.json({
    message: "Sesión cerrada correctamente",
  });
};

export const profile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, lastname, email, phone, role, created_at
       FROM users
       WHERE id = $1`,
      [req.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener el perfil",
    });
  }
};