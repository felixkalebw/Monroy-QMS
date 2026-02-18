import express from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { makeEquipmentCode, makePublicCode } from "../utils/codes.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
  const search = (req.query.search || "").toString().trim();
  const type = (req.query.type || "").toString().trim();
  const clientId = (req.query.clientId || "").toString().trim();

  const where = {};

  if (req.user.role === "CLIENT" && req.user.clientId) {
    where.clientId = req.user.clientId;
  } else if (clientId) {
    where.clientId = clientId;
  }

  if (type) where.type = type;

  if (search) {
    where.OR = [
      { serialNumber: { contains: search, mode: "insensitive" } },
      { equipmentCode: { contains: search, mode: "insensitive" } }
    ];
  }

  const total = await prisma.equipment.count({ where });
  const items = await prisma.equipment.findMany({
    where,
    include: { client: true, qr: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize
  });

  res.json({ page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)), items });
});

router.post("/", requireAuth, requireRole("ADMIN", "MANAGER", "INSPECTOR"), async (req, res) => {
  const Schema = z.object({
    clientId: z.string().min(1),
    siteId: z.string().optional().nullable(),
    type: z.string().min(2),
    serialNumber: z.string().min(1),
    manufacturer: z.string().optional().nullable(),
    yearOfManufacture: z.number().int().optional().nullable(),
    countryOfOrigin: z.string().optional().nullable(),
    swl: z.number().optional().nullable(),
    mawp: z.number().optional().nullable(),
    designPressure: z.number().optional().nullable(),
    testPressure: z.number().optional().nullable()
  });

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  // CLIENT users cannot create
  if (req.user.role === "CLIENT") return res.status(403).json({ error: "Forbidden" });

  const equipmentCode = makeEquipmentCode();
  const created = await prisma.equipment.create({
    data: {
      ...parsed.data,
      equipmentCode
    }
  });

  // auto-create QR public code
  await prisma.equipmentQr.create({
    data: { equipmentId: created.id, publicCode: makePublicCode() }
  });

  await prisma.auditLog.create({ data: { userId: req.user.sub, action: "EQUIPMENT_CREATE", entityType: "Equipment", entityId: created.id, ip: req.ip } });

  const full = await prisma.equipment.findUnique({ where: { id: created.id }, include: { client: true, qr: true } });
  res.json(full);
});

export default router;
