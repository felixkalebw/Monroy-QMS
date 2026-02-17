import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/audit-logs?page=1&pageSize=50
 */
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(req.query.pageSize ?? 50)));
    const skip = (page - 1) * pageSize;

    const [total, rows] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      })
    ]);

    res.json({ page, pageSize, total, totalPages: Math.ceil(total / pageSize), items: rows });
  } catch (e) {
    next(e);
  }
});

export default router;
