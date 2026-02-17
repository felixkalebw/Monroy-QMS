import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { audit } from "../middleware/audit.js";

const prisma = new PrismaClient();
const router = Router();

const DEFAULT_INTERVAL_DAYS = {
  CRANE: 365,
  MOBILE_CRANE: 365,
  SLINGS_CHAINS_SHACKLES: 180,
  PRESSURE_VESSEL: 365,
  AIR_RECEIVER: 365,
  COMPRESSOR: 365,
  FORKLIFT: 365,
  SERVICE_TRUCK_LIFTING_ATTACHMENTS: 365,
  HYDRAULIC_JACK: 365,
  MECHANICAL_JACK: 365,
  SAFETY_HARNESS: 180,
  CLAMPS_SHUTTER_CLAMPS: 365,
  STEP_LADDERS: 365
};

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.inspection.findMany({
      orderBy: { datePerformed: "desc" },
      take: 200
    });
    res.json(rows);
  } catch (e) { next(e); }
});

router.post("/", requireAuth, requireRole("ADMIN", "MANAGER", "INSPECTOR"), audit("CREATE_INSPECTION", "INSPECTION"), async (req, res, next) => {
  try {
    const d = req.body ?? {};

    const eq = await prisma.equipment.findUnique({ where: { id: d.equipmentId } });
    if (!eq) return res.status(404).json({ error: "Equipment not found" });

    const count = await prisma.inspection.count();
    const inspectionCode = `INSP-${String(count + 1).padStart(6, "0")}`;

    const datePerformed = new Date(d.datePerformed);

    const ins = await prisma.inspection.create({
      data: {
        inspectionCode,
        equipmentId: eq.id,
        clientId: eq.clientId,
        siteId: eq.siteId ?? null,
        inspectorId: req.user.sub,
        type: d.type,
        datePerformed,
        findingsText: d.findingsText ?? null,
        nonConformance: Boolean(d.nonConformance),
        certificateIssued: Boolean(d.certificateIssued),
        certificateExpiryDate: d.certificateExpiryDate ? new Date(d.certificateExpiryDate) : null,
        status: "DRAFT"
      }
    });

    const intervalDays = eq.intervalDays ?? DEFAULT_INTERVAL_DAYS[eq.type] ?? 365;
    const nextDue = new Date(datePerformed.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    await prisma.equipment.update({
      where: { id: eq.id },
      data: { lastInspectedAt: datePerformed, nextDueDate: nextDue }
    });

    res.status(201).json(ins);
  } catch (e) { next(e); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const row = await prisma.inspection.findUnique({
      where: { id: req.params.id },
      include: { pfmeaItems: true, ncrs: true }
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (e) { next(e); }
});

export default router;
