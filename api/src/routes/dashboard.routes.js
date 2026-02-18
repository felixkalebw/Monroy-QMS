import express from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/kpis", requireAuth, async (req, res) => {
  const whereClient = req.user.role === "CLIENT" && req.user.clientId ? { id: req.user.clientId } : {};
  const whereEquipment = req.user.role === "CLIENT" && req.user.clientId ? { clientId: req.user.clientId } : {};
  const whereNcr = req.user.role === "CLIENT" && req.user.clientId ? { clientId: req.user.clientId } : {};
  const wherePfmea = req.user.role === "CLIENT" && req.user.clientId ? { clientId: req.user.clientId } : {};

  const totalClients = await prisma.client.count({ where: whereClient });
  const totalEquipment = await prisma.equipment.count({ where: whereEquipment });

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in15 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

  const expiring30 = await prisma.equipment.count({ where: { ...whereEquipment, nextDueDate: { lte: in30, gte: now } } });
  const expiring15 = await prisma.equipment.count({ where: { ...whereEquipment, nextDueDate: { lte: in15, gte: now } } });
  const expiredEquipment = await prisma.equipment.count({ where: { ...whereEquipment, nextDueDate: { lt: now } } });

  const openNcrs = await prisma.ncr.count({ where: { ...whereNcr, status: { not: "CLOSED" } } });
  const highRiskPfmea = await prisma.pfmeaItem.count({ where: { ...wherePfmea, riskLevel: { in: ["HIGH", "CRITICAL"] } } });

  // simple compliance: due date not expired
  const compliant = await prisma.equipment.count({ where: { ...whereEquipment, OR: [{ nextDueDate: null }, { nextDueDate: { gte: now } }] } });
  const compliancePct = totalEquipment === 0 ? 100 : Math.round((compliant / totalEquipment) * 100);

  res.json({
    totalClients,
    totalEquipment,
    expiring30,
    expiring15,
    expiredEquipment,
    openNcrs,
    highRiskPfmea,
    compliancePct
  });
});

router.get("/inspections-by-month", requireAuth, async (req, res) => {
  const months = Math.max(1, Math.min(24, Number(req.query.months || 12)));
  const where = {};
  if (req.user.role === "CLIENT" && req.user.clientId) where.clientId = req.user.clientId;

  const now = new Date();
  const out = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const count = await prisma.inspection.count({
      where: { ...where, datePerformed: { gte: start, lt: end } }
    });

    const month = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    out.push({ month, count });
  }

  res.json(out);
});

export default router;
