import express from "express";
import { prisma } from "../prisma.js";

const router = express.Router();

// Public QR verify (no auth)
router.get("/verify/:publicCode", async (req, res) => {
  const qr = await prisma.equipmentQr.findUnique({
    where: { publicCode: req.params.publicCode },
    include: { equipment: true }
  });

  if (!qr) return res.status(404).json({ valid: false, error: "Code not found" });

  const latestInspection = await prisma.inspection.findFirst({
    where: { equipmentId: qr.equipmentId },
    orderBy: { datePerformed: "desc" }
  });

  return res.json({
    valid: true,
    equipment: qr.equipment,
    latestInspection
  });
});

export default router;
