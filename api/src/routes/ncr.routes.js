import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { audit } from "../middleware/audit.js";

const prisma = new PrismaClient();
const router = Router();

router.get("/ncrs", requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.ncr.findMany({
      orderBy: { createdAt: "desc" },
      take: 200
    });
    res.json(rows);
  } catch (e) { next(e); }
});

router.post("/ncrs", requireAuth, requireRole("ADMIN", "MANAGER", "INSPECTOR"), audit("CREATE_NCR", "NCR"), async (req, res, next) => {
  try {
    const d = req.body ?? {};

    const count = await prisma.ncr.count();
    const ncrCode = `NCR-${String(count + 1).padStart(6, "0")}`;

    const row = await prisma.ncr.create({
      data: {
        ncrCode,
        clientId: d.clientId,
        equipmentId: d.equipmentId,
        inspectionId: d.inspectionId ?? null,
        category: d.category,
        description: d.description,
        assignedToUserId: d.assignedToUserId ?? null,
        dueDate: d.dueDate ? new Date(d.dueDate) : null
      }
    });

    res.status(201).json(row);
  } catch (e) { next(e); }
});

router.patch("/ncrs/:id", requireAuth, requireRole("ADMIN", "MANAGER"), audit("UPDATE_NCR", "NCR"), async (req, res, next) => {
  try {
    const d = req.body ?? {};
    const row = await prisma.ncr.update({
      where: { id: req.params.id },
      data: {
        status: d.status ?? undefined,
        closedAt: d.status === "CLOSED" ? new Date() : undefined
      }
    });
    res.json(row);
  } catch (e) { next(e); }
});

export default router;
