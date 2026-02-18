import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, status: true, clientId: true, createdAt: true }
  });
  res.json(users);
});

router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const Schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["ADMIN", "MANAGER", "INSPECTOR", "CLIENT"]),
    clientId: z.string().optional().nullable()
  });

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return res.status(409).json({ error: "Email already exists" });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      clientId: parsed.data.role === "CLIENT" ? (parsed.data.clientId || null) : null,
      status: "ACTIVE"
    },
    select: { id: true, name: true, email: true, role: true, status: true, clientId: true }
  });

  await prisma.auditLog.create({ data: { userId: req.user.sub, action: "USER_CREATE", entityType: "User", entityId: user.id, ip: req.ip } });
  res.json(user);
});

router.patch("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const Schema = z.object({ status: z.enum(["ACTIVE", "LOCKED", "DISABLED"]) });
  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
    select: { id: true, name: true, email: true, role: true, status: true, clientId: true }
  });

  await prisma.auditLog.create({ data: { userId: req.user.sub, action: "USER_STATUS_UPDATE", entityType: "User", entityId: updated.id, ip: req.ip } });
  res.json(updated);
});

export default router;
