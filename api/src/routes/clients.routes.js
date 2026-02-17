import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { audit } from "../middleware/audit.js";

const prisma = new PrismaClient();
const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.client.findMany({
      include: { sites: true, contacts: true },
      orderBy: { createdAt: "desc" },
      take: 200
    });
    res.json(rows);
  } catch (e) { next(e); }
});

router.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), audit("CREATE_CLIENT", "CLIENT"), async (req, res, next) => {
  try {
    const d = req.body ?? {};
    const row = await prisma.client.create({
      data: {
        name: d.name,
        category: d.category,
        status: d.status ?? "ACTIVE",
        notes: d.notes ?? null
      }
    });
    res.status(201).json(row);
  } catch (e) { next(e); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const row = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { sites: true, contacts: true, equipment: true }
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (e) { next(e); }
});

router.patch("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), audit("UPDATE_CLIENT", "CLIENT"), async (req, res, next) => {
  try {
    const d = req.body ?? {};
    const row = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        name: d.name ?? undefined,
        category: d.category ?? undefined,
        status: d.status ?? undefined,
        notes: d.notes ?? undefined
      }
    });
    res.json(row);
  } catch (e) { next(e); }
});

router.post("/:id/sites", requireAuth, requireRole("ADMIN", "MANAGER", "INSPECTOR"), audit("CREATE_SITE", "CLIENT_SITE"), async (req, res, next) => {
  try {
    const d = req.body ?? {};
    const row = await prisma.clientSite.create({
      data: {
        clientId: req.params.id,
        name: d.name,
        locationText: d.locationText ?? null,
        gpsLat: d.gpsLat ?? null,
        gpsLng: d.gpsLng ?? null
      }
    });
    res.status(201).json(row);
  } catch (e) { next(e); }
});

router.post("/:id/contacts", requireAuth, requireRole("ADMIN", "MANAGER", "INSPECTOR"), audit("CREATE_CONTACT", "CLIENT_CONTACT"), async (req, res, next) => {
  try {
    const d = req.body ?? {};
    const row = await prisma.clientContact.create({
      data: {
        clientId: req.params.id,
        fullName: d.fullName,
        position: d.position ?? null,
        email: d.email ?? null,
        phone: d.phone ?? null
      }
    });
    res.status(201).json(row);
  } catch (e) { next(e); }
});

export default router;
