import express from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  // CLIENT users only see their client
  if (req.user.role === "CLIENT" && req.user.clientId) {
    const c = await prisma.client.findMany({ where: { id: req.user.clientId }, orderBy: { createdAt: "desc" } });
    return res.json(c);
  }
  const list = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  res.json(list);
});

router.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const Schema = z.object({
    name: z.string().min(2),
    category: z.enum(["MINE", "INDUSTRIAL", "CONSTRUCTION"]),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
    notes: z.string().optional().nullable()
  });
  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const created = await prisma.client.create({ data: parsed.data });
  await prisma.auditLog.create({ data: { userId: req.user.sub, action: "CLIENT_CREATE", entityType: "Client", entityId: created.id, ip: req.ip } });
  res.json(created);
});

export default router;
