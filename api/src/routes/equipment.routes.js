import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { audit } from "../middleware/audit.js";
import QRCode from "qrcode";
import { env } from "../config/env.js";

const prisma = new PrismaClient();
const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.equipment.findMany({
      include: { client: true, qr: true },
      orderBy: { createdAt: "desc" },
      take: 200
    });
    res.json(rows);
  } catch (e) { next(e); }
});

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

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const row = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        qr: true,
        inspections: { orderBy: { datePerformed: "desc" }, take: 50 }
      }
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (e) { next(e); }
});

router.get("/:id/qr", requireAuth, async (req, res, next) => {
  try {
    const eq = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: { qr: true }
    });
    if (!eq?.qr) return res.status(404).json({ error: "QR not generated" });

    const verifyUrl = `${env.PUBLIC_VERIFY_BASE_URL}/${eq.qr.publicCode}`;
    const pngDataUrl = await QRCode.toDataURL(verifyUrl);

    res.json({ publicCode: eq.qr.publicCode, verifyUrl, pngDataUrl });
  } catch (e) { next(e); }
});

export default router;
