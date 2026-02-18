import express from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { makeNcrCode } from "../utils/codes.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const where = {};
  if (req.user.role === "CLIENT" && req.user.clientId) where.clientId = req.user.clientId;

  const rows = await prisma.ncr.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200
  });
  res.json(rows);
});

router.post("/", requireAuth, requireRole("ADMIN", "MANAGER", "INSPECTOR"), async (req, res) => {
  const Schema = z.object({
    clientId: z.string().min(1),
    equipmentId: z.string().min(1),
    category: z.enum(["MAJOR", "MINOR", "OBSERVATION"]),
    description: z.string().min(3),
    dueDate: z.string().datetime().optional().nullable()
  });

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const ncrCode = makeNcrCode();

  const created = await prisma.ncr.create({
    data: {
      ncrCode,
      clientId: parsed.data.clientId,
      equipmentId: parsed.data.equipmentId,
      category: parsed.data.category,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      status: "OPEN"
    }
  });

  await prisma.auditLog.create({ data: { userId: req.user.sub, action: "NCR_CREATE", entityType: "Ncr", entityId: created.id, ip: req.ip } });
  res.json(created);
});

router.patch("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const Schema = z.object({ status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]) });
  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const updated = await prisma.ncr.update({
    where: { id: req.params.id },
    data: {
      status: parsed.data.status,
      closedAt: parsed.data.status === "CLOSED" ? new Date() : null
    }
  });

  await prisma.auditLog.create({ data: { userId: req.user.sub, action: "NCR_UPDATE", entityType: "Ncr", entityId: updated.id, ip: req.ip } });
  res.json(updated);
});

export default router;
