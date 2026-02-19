import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";
import { env } from "./env.js";

export function signToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "12h" });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken: signToken({ sub: user.id, role: user.role })
  };
}
