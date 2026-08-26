import jwt from "jsonwebtoken";

export const isAuth = (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: "No estás autorizado" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).json({ message: "Token inválido o vencido" });
    }

    req.userId = decoded.id;
    next();
  });
};
