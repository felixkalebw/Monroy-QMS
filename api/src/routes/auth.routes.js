import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { config } from "../config.js";

const router = express.Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, clientId: user.clientId || null },
    config.jwtAccessSecret,
    { expiresIn: `${config.accessTtlMin}m` }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { sub: user.id },
    config.jwtRefreshSecret,
    { expiresIn: `${config.refreshTtlDays}d` }
  );
}

router.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  if (user.status !== "ACTIVE") return res.status(403).json({ error: "Account not active" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);

  await prisma.auditLog.create({
    data: { userId: user.id, action: "LOGIN", ip: req.ip, userAgent: req.get("user-agent") || null }
  });

  return res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, clientId: user.clientId }
  });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: "Missing refreshToken" });

  try {
    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE") return res.status(401).json({ error: "Invalid refresh" });

    const accessToken = signAccess(user);
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: "Invalid refresh" });
  }
});

export default router;
