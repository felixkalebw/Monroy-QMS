import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/**
 * Public verification page data:
 * GET /public/verify/:publicCode
 */
router.get("/verify/:publicCode", async (req, res, next) => {
  try {
    const { publicCode } = req.params;

    const qr = await prisma.equipmentQr.findUnique({
      where: { publicCode },
      include: { equipment: { include: { client: true } } }
    });

    if (!qr) return res.status(404).json({ valid: false, message: "Not found" });

    const eq = qr.equipment;

    // Latest inspection (if any)
    const latest = await prisma.inspection.findFirst({
      where: { equipmentId: eq.id },
      orderBy: { datePerformed: "desc" }
    });

    res.json({
      valid: true,
      equipment: {
        equipmentCode: eq.equipmentCode,
        type: eq.type,
        serialNumber: eq.serialNumber,
        clientName: eq.client.name,
        nextDueDate: eq.nextDueDate
      },
      latestInspection: latest
        ? {
            inspectionCode: latest.inspectionCode,
            type: latest.type,
            datePerformed: latest.datePerformed,
            certificateExpiryDate: latest.certificateExpiryDate,
            certificateIssued: latest.certificateIssued
          }
        : null
    });
  } catch (e) { next(e); }
});

export default router;
