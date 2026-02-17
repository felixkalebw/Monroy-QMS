import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { audit } from "../middleware/audit.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/users
 * Admin only
 */
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const rows = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        clientId: true,
        failedLoginCount: true,
        lockUntil: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" },
      take: 300
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/users
 * Create user (Admin only)
 * Body:
 *  { name, email, phone?, role, password, clientId? }
 *
 * For CLIENT role, you should pass clientId
 */
router.post("/", requireAuth, requireRole("ADMIN"), audit("CREATE_USER", "USER"), async (req, res, next) => {
  try {
    const d = req.body ?? {};
    if (!d.name || !d.email || !d.password || !d.role) {
      return res.status(400).json({ error: "name, email, password, role are required" });
    }

    if (d.role === "CLIENT" && !d.clientId) {
      return res.status(400).json({ error: "clientId is required for CLIENT role" });
    }

    const passwordHash = await bcrypt.hash(d.password, 12);

    const row = await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        phone: d.phone ?? null,
        role: d.role,
        passwordHash,
        clientId: d.clientId ?? null
      },
      select: { id: true, name: true, email: true, role: true, status: true, clientId: true, createdAt: true }
    });

    res.status(201).json(row);
  } catch (e) {
    if (String(e?.message ?? "").includes("Unique constraint")) {
      return res.status(409).json({ error: "Email already exists" });
    }
    next(e);
  }
});

/**
 * PATCH /api/users/:id
 * Admin only
 * Update role, status, clientId, phone, name
 */
router.patch("/:id", requireAuth, requireRole("ADMIN"), audit("UPDATE_USER", "USER"), async (req, res, next) => {
  try {
    const d = req.body ?? {};

    if (d.role === "CLIENT" && d.clientId === undefined) {
      // allow leaving as-is, but if they set role to CLIENT they should provide clientId
      const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (existing && existing.role !== "CLIENT" && !d.clientId) {
        return res.status(400).json({ error: "clientId required when changing role to CLIENT" });
      }
    }

    const row = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name: d.name ?? undefined,
        phone: d.phone ?? undefined,
        role: d.role ?? undefined,
        status: d.status ?? undefined,
        clientId: d.clientId ?? undefined,
        lockUntil: d.status === "LOCKED" ? (d.lockUntil ? new Date(d.lockUntil) : new Date(Date.now() + 30 * 60 * 1000)) : undefined
      },
      select: { id: true, name: true, email: true, role: true, status: true, clientId: true, lockUntil: true }
    });

    res.json(row);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/users/:id/reset-password
 * Admin only
 */
router.post("/:id/reset-password", requireAuth, requireRole("ADMIN"), audit("RESET_PASSWORD", "USER"), async (req, res, next) => {
  try {
    const { newPassword } = req.body ?? {};
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: "newPassword must be at least 8 characters" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash, failedLoginCount: 0, status: "ACTIVE", lockUntil: null }
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
