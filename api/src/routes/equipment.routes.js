import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { audit } from "../middleware/audit.js";
import { enforceClientScope } from "../middleware/clientScope.js";
import QRCode from "qrcode";
import { env } from "../config/env.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/equipment
 * Query params:
 *  - clientId
 *  - type
 *  - status
 *  - search (serialNumber or equipmentCode contains)
 *  - dueFrom (ISO date)
 *  - dueTo (ISO date)
 *  - page (default 1)
 *  - pageSize (default 20, max 100)
 *
 * CLIENT role: forced to their clientId
 */
router.get("/", requireAuth, enforceClientScope, async (req, res, next) => {
  try {
    const scopeClientId = req.clientScopeId ?? null;

    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(req.query.pageSize ?? 20)));
    const skip = (page - 1) * pageSize;

    const clientId = scopeClientId ?? (req.query.clientId || undefined);
    const type = req.query.type || undefined;
    const status = req.query.status || undefined;
    const search = (req.query.search || "").trim();
    const dueFrom = req.query.dueFrom ? new Date(String(req.query.dueFrom)) : null;
    const dueTo = req.query.dueTo ? new Date(String(req.query.dueTo)) : null;

    const where = {
      ...(clientId ? { clientId } : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { serialNumber: { contains: search, mode: "insensitive" } },
              { equipmentCode: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(dueFrom || dueTo
        ? {
            nextDueDate: {
              ...(dueFrom ? { gte: dueFrom } : {}),
              ...(dueTo ? { lte: dueTo } : {})
            }
          }
        : {})
    };

    const [total, rows] = await Promise.all([
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({
        where,
        include: { client: true, qr: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      })
    ]);

    res.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items: rows
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/equipment
 * (Admin/Manager/Inspector)
 */
router.post("/", requireAuth, requireRole("ADMIN", "MANAGER", "INSPECTOR"), audit("CREATE_EQUIPMENT", "EQUIPMENT"), async (req, res, next) => {
  try {
    const d = req.body ?? {};

    const count = await prisma.equipment.count();
    const equipmentCode = `EQ-${String(count + 1).padStart(6, "0")}`;

    const row = await prisma.equipment.create({
      data: {
        clientId: d.clientId,
        siteId: d.siteId ?? null,
        equipmentCode,
        type: d.type,
        serialNumber: d.serialNumber,
        manufacturer: d.manufacturer ?? null,
        yearOfManufacture: d.yearOfManufacture ?? null,
        countryOfOrigin: d.countryOfOrigin ?? null,
        swl: d.swl ?? null,
        mawp: d.mawp ?? null,
        designPressure: d.designPressure ?? null,
        testPressure: d.testPressure ?? null,
        intervalDays: d.intervalDays ?? null,
        nextDueDate: d.nextDueDate ? new Date(d.nextDueDate) : null
      }
    });

    const publicCode = `PUB-${row.id.slice(-10)}`;
    const qr = await prisma.equipmentQr.create({
      data: { equipmentId: row.id, publicCode }
    });

    res.status(201).json({ ...row, qr });
  } catch (e) {
    if (String(e?.message ?? "").includes("Unique constraint")) {
      return res.status(409).json({ error: "Duplicate serial number for this client" });
    }
    next(e);
  }
});

/**
 * GET /api/equipment/:id
 * CLIENT role: can only access their client equipment
 */
router.get("/:id", requireAuth, enforceClientScope, async (req, res, next) => {
  try {
    const scopeClientId = req.clientScopeId ?? null;

    const row = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        qr: true,
        inspections: { orderBy: { datePerformed: "desc" }, take: 50 }
      }
    });

    if (!row) return res.status(404).json({ error: "Not found" });
    if (scopeClientId && row.clientId !== scopeClientId) return res.status(403).json({ error: "Forbidden" });

    res.json(row);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/equipment/:id/qr
 * CLIENT role: can access if equipment belongs to them
 */
router.get("/:id/qr", requireAuth, enforceClientScope, async (req, res, next) => {
  try {
    const scopeClientId = req.clientScopeId ?? null;

    const eq = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: { qr: true }
    });

    if (!eq?.qr) return res.status(404).json({ error: "QR not generated" });
    if (scopeClientId && eq.clientId !== scopeClientId) return res.status(403).json({ error: "Forbidden" });

    const verifyUrl = `${env.PUBLIC_VERIFY_BASE_URL}/${eq.qr.publicCode}`;
    const pngDataUrl = await QRCode.toDataURL(verifyUrl);

    res.json({ publicCode: eq.qr.publicCode, verifyUrl, pngDataUrl });
  } catch (e) {
    next(e);
  }
});

export default router;
