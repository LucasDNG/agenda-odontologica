import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { createAccessToken } from "../libs/jwt.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

export const signUp = async (req, res) => {
  try {
    const { name, lastname, email, password, phone } = req.body;

    if (!name || !lastname || !email || !password || !phone) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length) {
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, lastname, email, password, phone, role)
       VALUES ($1, $2, $3, $4, $5, 'patient')
       RETURNING id, name, lastname, email, phone, role, max_active_appointments`,
      [name.trim(), lastname.trim(), normalizedEmail, hashedPassword, phone.trim()],
    );

    const user = result.rows[0];
    const token = await createAccessToken({ id: user.id });
    res.cookie("token", token, cookieOptions);

    res.status(201).json({ message: "Usuario registrado correctamente", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar el usuario" });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son obligatorios" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.trim().toLowerCase()],
    );

    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Email o contraseña incorrectos" });
    }

    const token = await createAccessToken({ id: user.id });
    res.cookie("token", token, cookieOptions);

    res.json({
      message: "Sesión iniciada correctamente",
      user: {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        role: user.role,
        max_active_appointments: user.max_active_appointments,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

export const signOut = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({ message: "Sesión cerrada correctamente" });
};

export const profile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, lastname, email, phone, role, max_active_appointments, created_at
       FROM users WHERE id = $1`,
      [req.userId],
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el perfil" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Datos de contraseña inválidos" });
    }

    const result = await pool.query("SELECT password FROM users WHERE id = $1", [req.userId]);
    if (!result.rows[0] || !(await bcrypt.compare(currentPassword, result.rows[0].password))) {
      return res.status(400).json({ message: "La contraseña actual es incorrecta" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [hash, req.userId]);
    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al cambiar la contraseña" });
  }
};
