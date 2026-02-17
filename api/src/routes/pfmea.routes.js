import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { audit } from "../middleware/audit.js";
import { computeRpn, riskLevelFromRpn } from "../utils/rpn.js";

const prisma = new PrismaClient();
const router = Router();

router.get("/inspections/:id/pfmea", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.pfmeaItem.findMany({
      where: { inspectionId: req.params.id },
      orderBy: { createdAt: "desc" }
    });
    res.json(items);
  } catch (e) { next(e); }
});

router.post("/inspections/:id/pfmea", requireAuth, requireRole("ADMIN", "MANAGER", "INSPECTOR"), audit("CREATE_PFMEA", "PFMEA"), async (req, res, next) => {
  try {
    const inspection = await prisma.inspection.findUnique({ where: { id: req.params.id } });
    if (!inspection) return res.status(404).json({ error: "Inspection not found" });

    const d = req.body ?? {};
    const rpn = computeRpn(d.severity, d.occurrence, d.detection);
    const riskLevel = riskLevelFromRpn(rpn);

    const item = await prisma.pfmeaItem.create({
      data: {
        inspectionId: inspection.id,
        equipmentId: inspection.equipmentId,
        clientId: inspection.clientId,
        failureMode: d.failureMode,
        failureCause: d.failureCause,
        failureEffect: d.failureEffect,
        existingControls: d.existingControls ?? null,
        severity: Number(d.severity),
        occurrence: Number(d.occurrence),
        detection: Number(d.detection),
        rpn,
        riskLevel,
        actionOwnerUserId: d.actionOwnerUserId ?? null,
        actionDueDate: d.actionDueDate ? new Date(d.actionDueDate) : null
      }
    });

    res.status(201).json(item);
  } catch (e) { next(e); }
});

export default router;
