import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const sign = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: "30d" },
  );

export const verifyAuthHeader = (header) => {
  if (!header) return null;
  try {
    return jwt.verify(header.replace("Bearer ", ""), config.jwtSecret);
  } catch {
    return null;
  }
};

export const requireUser = (req, res, next) => {
  req.user = verifyAuthHeader(req.headers.authorization);
  if (!req.user) return res.status(401).json({ error: "unauthenticated" });
  next();
};
