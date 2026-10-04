import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { createAccessToken } from "../libs/jwt.js";

const sessionCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 1000 * 60 * 60 * 24,
};

const normalizeDni = (value) =>
  String(value || "").replace(/\D/g, "");

const isArgentineDni = (dni) =>
  dni.length === 7 || dni.length === 8;

export const signUp = async (req, res) => {
  try {
    const { name, lastname, password, phone } = req.body;
    const dni = normalizeDni(req.body.dni);

    if (!String(name || "").trim() || !String(lastname || "").trim()) {
      return res.status(400).json({
        message: "Completá nombre y apellido",
      });
    }

    if (!isArgentineDni(dni)) {
      return res.status(400).json({
        message: "El DNI tiene que tener 7 u 8 números, sin puntos.",
      });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE dni = $1",
      [dni],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "Ya hay una cuenta con ese DNI",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
        (name, lastname, email, password, phone, role, dni)
       VALUES ($1, $2, NULL, $3, $4, 'patient', $5)
       RETURNING id, name, lastname, email, phone, role, dni, created_at`,
      [
        String(name).trim(),
        String(lastname).trim(),
        hashedPassword,
        phone,
        dni,
      ],
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

    if (error.code === "23505") {
      return res.status(400).json({
        message: "Ya hay una cuenta con ese DNI",
      });
    }

    res.status(500).json({
      message: "Error al registrar el usuario",
    });
  }
};

export const signIn = async (req, res) => {
  try {
    const { password } = req.body;
    const dni = normalizeDni(req.body.dni);
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    let result;

    if (dni) {
      if (!isArgentineDni(dni)) {
        return res.status(400).json({
          message: "El DNI tiene que tener 7 u 8 números, sin puntos.",
        });
      }

      result = await pool.query(
        "SELECT * FROM users WHERE dni = $1",
        [dni],
      );
    } else if (email) {
      result = await pool.query(
        "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
        [email],
      );
    } else {
      return res.status(400).json({
        message: "Ingresá el DNI y la contraseña",
      });
    }

    const invalidMessage = dni
      ? "DNI o contraseña incorrectos"
      : "Email o contraseña incorrectos";

    if (typeof password !== "string" || !password) {
      return res.status(400).json({
        message: invalidMessage,
      });
    }

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: invalidMessage,
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({
        message: invalidMessage,
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
        dni: user.dni,
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