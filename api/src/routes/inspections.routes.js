import express from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { makeInspectionCode } from "../utils/codes.js";
import { calcRpn, riskLevelFromRpn } from "../utils/risk.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const where = {};
  if (req.user.role === "CLIENT" && req.user.clientId) where.clientId = req.user.clientId;

  const rows = await prisma.inspection.findMany({
    where,
    orderBy: { datePerformed: "desc" },
    take: 200
  });
  res.json(rows);
});

router.post("/", requireAuth, requireRole("ADMIN", "MANAGER", "INSPECTOR"), async (req, res) => {
  const Schema = z.object({
    equipmentId: z.string().min(1),
    type: z.string().min(2),
    datePerformed: z.string().datetime(),
    findingsText: z.string().optional().nullable(),
    nonConformance: z.boolean().optional(),
    certificateIssued: z.boolean().optional(),
    certificateExpiryDate: z.string().datetime().optional().nullable()
  });

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const eq = await prisma.equipment.findUnique({ where: { id: parsed.data.equipmentId } });
  if (!eq) return res.status(404).json({ error: "Equipment not found" });

  // client users can't create inspections
  if (req.user.role === "CLIENT") return res.status(403).json({ error: "Forbidden" });

  const inspectionCode = makeInspectionCode();

  const created = await prisma.inspection.create({
    data: {
      inspectionCode,
      equipmentId: eq.id,
      clientId: eq.clientId,
      siteId: eq.siteId,
      inspectorId: req.user.sub,
      type: parsed.data.type,
      datePerformed: new Date(parsed.data.datePerformed),
      findingsText: parsed.data.findingsText || null,
      nonConformance: parsed.data.nonConformance ?? false,
      certificateIssued: parsed.data.certificateIssued ?? false,
      certificateExpiryDate: parsed.data.certificateExpiryDate ? new Date(parsed.data.certificateExpiryDate) : null,
      status: "SUBMITTED"
    }
  });

  // update equipment dates
  await prisma.equipment.update({
    where: { id: eq.id },
    data: { lastInspectedAt: created.datePerformed }
  });

  await prisma.auditLog.create({ data: { userId: req.user.sub, action: "INSPECTION_CREATE", entityType: "Inspection", entityId: created.id, ip: req.ip } });
  res.json(created);
});

// PFMEA list for inspection
router.get("/:id/pfmea", requireAuth, async (req, res) => {
  const inspection = await prisma.inspection.findUnique({ where: { id: req.params.id } });
  if (!inspection) return res.status(404).json({ error: "Inspection not found" });

  if (req.user.role === "CLIENT" && req.user.clientId !== inspection.clientId) return res.status(403).json({ error: "Forbidden" });

  const items = await prisma.pfmeaItem.findMany({ where: { inspectionId: req.params.id }, orderBy: { createdAt: "desc" } });
  res.json(items);
});

// add PFMEA item
router.post("/:id/pfmea", requireAuth, requireRole("ADMIN", "MANAGER", "INSPECTOR"), async (req, res) => {
  const Schema = z.object({
    failureMode: z.string().min(1),
    failureCause: z.string().min(1),
    failureEffect: z.string().min(1),
    existingControls: z.string().optional().nullable(),
    severity: z.number().int(),
    occurrence: z.number().int(),
    detection: z.number().int()
  });

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const inspection = await prisma.inspection.findUnique({ where: { id: req.params.id } });
  if (!inspection) return res.status(404).json({ error: "Inspection not found" });

  const eq = await prisma.equipment.findUnique({ where: { id: inspection.equipmentId } });
  if (!eq) return res.status(404).json({ error: "Equipment not found" });

  const rpn = calcRpn(parsed.data.severity, parsed.data.occurrence, parsed.data.detection);
  const riskLevel = riskLevelFromRpn(rpn);

  const created = await prisma.pfmeaItem.create({
    data: {
      inspectionId: inspection.id,
      equipmentId: eq.id,
      clientId: inspection.clientId,
      failureMode: parsed.data.failureMode,
      failureCause: parsed.data.failureCause,
      failureEffect: parsed.data.failureEffect,
      existingControls: parsed.data.existingControls || null,
      severity: parsed.data.severity,
      occurrence: parsed.data.occurrence,
      detection: parsed.data.detection,
      rpn,
      riskLevel,
      status: "OPEN"
    }
  });

  await prisma.auditLog.create({ data: { userId: req.user.sub, action: "PFMEA_CREATE", entityType: "PfmeaItem", entityId: created.id, ip: req.ip } });
  res.json(created);
});

export default router;
