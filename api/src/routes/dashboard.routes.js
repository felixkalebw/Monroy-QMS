import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { enforceClientScope } from "../middleware/clientScope.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/dashboard/kpis
 * - Admin/Manager/Inspector: global
 * - Client: scoped to their clientId only
 */
router.get("/kpis", requireAuth, enforceClientScope, async (req, res, next) => {
  try {
    const scopeClientId = req.clientScopeId ?? null;

    const now = new Date();
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const in15 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const equipmentWhere = scopeClientId ? { clientId: scopeClientId } : {};
    const inspectionsWhere = scopeClientId ? { clientId: scopeClientId } : {};
    const ncrWhere = scopeClientId ? { clientId: scopeClientId } : {};
    const pfmeaWhere = scopeClientId ? { clientId: scopeClientId } : {};

    const [
      totalClients,
      totalEquipment,
      expiring30,
      expiring15,
      expiredEquipment,
      openNcrs,
      highRiskPfmea
    ] = await Promise.all([
      scopeClientId ? Promise.resolve(1) : prisma.client.count({ where: { status: "ACTIVE" } }),
      prisma.equipment.count({ where: equipmentWhere }),
      prisma.equipment.count({ where: { ...equipmentWhere, nextDueDate: { gt: now, lte: in30 } } }),
      prisma.equipment.count({ where: { ...equipmentWhere, nextDueDate: { gt: now, lte: in15 } } }),
      prisma.equipment.count({ where: { ...equipmentWhere, nextDueDate: { lte: now } } }),
      prisma.ncr.count({ where: { ...ncrWhere, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.pfmeaItem.count({ where: { ...pfmeaWhere, riskLevel: { in: ["HIGH", "CRITICAL"] }, status: { in: ["OPEN", "VERIFIED"] } } })
    ]);

    // Compliance % (simple):
    // compliant = equipment not expired
    const compliant = totalEquipment - expiredEquipment;
    const compliancePct = totalEquipment === 0 ? 100 : Math.round((compliant / totalEquipment) * 100);

    // Monthly inspections completed (last 30 days)
    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyInspectionsCompleted = await prisma.inspection.count({
      where: { ...inspectionsWhere, datePerformed: { gte: last30, lte: now } }
    });

    res.json({
      totalClients,
      totalEquipment,
      expiring30,
      expiring15,
      expiredEquipment,
      openNcrs,
      highRiskPfmea,
      compliancePct,
      monthlyInspectionsCompleted
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/dashboard/inspections-by-month?months=12
 * returns [{ month: "2026-02", count: 12 }, ...]
 */
router.get("/inspections-by-month", requireAuth, enforceClientScope, async (req, res, next) => {
  try {
    const scopeClientId = req.clientScopeId ?? null;
    const months = Math.max(1, Math.min(24, Number(req.query.months ?? 12)));

    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const where = {
      ...(scopeClientId ? { clientId: scopeClientId } : {}),
      datePerformed: { gte: start }
    };

    // Pull and bucket in JS to keep it simple/portable
    const rows = await prisma.inspection.findMany({
      where,
      select: { datePerformed: true },
      take: 50000
    });

    const map = new Map();
    for (const r of rows) {
      const d = r.datePerformed;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    const out = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    res.json(out);
  } catch (e) {
    next(e);
  }
});

export default router;
