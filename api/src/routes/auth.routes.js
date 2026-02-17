import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";
import { loginLimiter } from "../middleware/rateLimit.js";
import { audit } from "../middleware/audit.js";

const prisma = new PrismaClient();
const router = Router();

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: `${env.ACCESS_TTL_MIN}m` }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { sub: user.id, tokenType: "refresh" },
    env.JWT_REFRESH_SECRET,
    { expiresIn: `${env.REFRESH_TTL_DAYS}d` }
  );
}

router.post("/login", loginLimiter, audit("LOGIN_ATTEMPT", "AUTH"), async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (user.status === "DISABLED") return res.status(403).json({ error: "Account disabled" });

    if (user.status === "LOCKED" && user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({ error: "Account locked. Try later." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const failed = user.failedLoginCount + 1;
      const lock = failed >= 7 ? new Date(Date.now() + 30 * 60 * 1000) : null; // lock 30 min after 7 attempts

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failed,
          status: lock ? "LOCKED" : user.status,
          lockUntil: lock
        }
      });

      return res.status(401).json({ error: "Invalid credentials" });
    }

    // reset failed count + set last login
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ?? req.ip;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, status: "ACTIVE", lockUntil: null, lastLoginAt: new Date(), lastLoginIp: ip }
    });

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, role: user.role }
    });
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", audit("TOKEN_REFRESH", "AUTH"), async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) return res.status(400).json({ error: "Missing refreshToken" });

    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    if (payload.tokenType !== "refresh") return res.status(401).json({ error: "Invalid token type" });

    const rows = await prisma.refreshToken.findMany({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 25
    });

    let matched = false;
    for (const r of rows) {
      if (await bcrypt.compare(refreshToken, r.tokenHash)) {
        matched = true;
        break;
      }
    }
    if (!matched) return res.status(401).json({ error: "Refresh token not recognized" });

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "User not found" });

    res.json({ accessToken: signAccess(user) });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", audit("LOGOUT", "AUTH"), async (req, res) => {
  // Client should delete tokens. Optional: implement revoke.
  res.json({ ok: true });
});

export default router;
