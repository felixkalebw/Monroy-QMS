// api/src/server.js
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

import { env } from "./env.js";
import { prisma } from "./prisma.js";
import { login, requireAuth } from "./auth.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

// --------------------
// Middleware
// --------------------
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined"));

// --------------------
// Health
// --------------------
app.get("/health", (req, res) => res.json({ ok: true, env: env.NODE_ENV }));

app.get("/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up" });
  } catch (e) {
    res.status(503).json({ ok: false, db: "down", error: String(e?.message || e) });
  }
});

// --------------------
// API base
// --------------------
app.get("/api", (req, res) => res.json({ ok: true, name: "Monroy QMS API" }));
app.get("/api/health", (req, res) => res.json({ ok: true, api: true }));

// --------------------
// DEV helpers (TEMP)
// --------------------

// Create admin user once (remove after demo)
// Call: POST /api/dev/seed-admin
// Headers: x-seed-key: <SEED_KEY env>
// Body: { "email": "...", "password": "...", "name": "..." }
app.post("/api/dev/seed-admin", async (req, res, next) => {
  try {
    const seedKey = String(process.env.SEED_KEY || "");
    const headerKey = String(req.headers["x-seed-key"] || "");
    if (!seedKey || headerKey !== seedKey) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const email = String(req.body?.email || "admin@monroyqms.com").toLowerCase();
    const password = String(req.body?.password || "Admin@12345");
    const name = String(req.body?.name || "Admin");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.json({ ok: true, message: "Admin already exists", email });

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ADMIN"
      }
    });

    res.json({ ok: true, message: "Admin created", email });
  } catch (e) {
    next(e);
  }
});

// --------------------
// Auth
// --------------------
app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const result = await login(String(email).toLowerCase(), String(password));
    if (!result) return res.status(401).json({ error: "Invalid credentials" });

    res.json(result);
  } catch (e) {
    next(e);
  }
});

// --------------------
// CRUD MVP (Enterprise Demo)
// --------------------

// Clients
app.get("/api/clients", requireAuth, async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ items: clients });
  } catch (e) {
    next(e);
  }
});

app.post("/api/clients", requireAuth, async (req, res, next) => {
  try {
    const { name, category, notes } = req.body || {};
    if (!name || !category) return res.status(400).json({ error: "name and category required" });

    const client = await prisma.client.create({
      data: { name: String(name), category: String(category), notes: notes ? String(notes) : null }
    });

    res.json(client);
  } catch (e) {
    next(e);
  }
});

// Equipment
app.get("/api/equipment", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.equipment.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

app.post("/api/equipment", requireAuth, async (req, res, next) => {
  try {
    const data = req.body || {};
    // Minimal required fields (adjust to your schema)
    if (!data.clientId || !data.name || !data.type || !data.serialNumber) {
      return res.status(400).json({ error: "clientId, name, type, serialNumber required" });
    }

    const item = await prisma.equipment.create({ data });
    res.json(item);
  } catch (e) {
    next(e);
  }
});

// Inspections
app.get("/api/inspections", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.inspection.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

app.post("/api/inspections", requireAuth, async (req, res, next) => {
  try {
    const data = req.body || {};
    if (!data.equipmentId) return res.status(400).json({ error: "equipmentId required" });

    const item = await prisma.inspection.create({ data });
    res.json(item);
  } catch (e) {
    next(e);
  }
});

// PFMEA
app.get("/api/pfmea", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.pfmeaItem.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

app.post("/api/pfmea", requireAuth, async (req, res, next) => {
  try {
    const item = await prisma.pfmeaItem.create({ data: req.body || {} });
    res.json(item);
  } catch (e) {
    next(e);
  }
});

// NCR REPORT (Statutory NCR Sections 1–7 + Legal)
// GET report json
app.get("/api/ncr/:id/report", requireAuth, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const ncr = await prisma.ncr.findUnique({
      where: { id },
      select: { id: true, ncrCode: true, reportJson: true, updatedAt: true }
    });
    if (!ncr) return res.status(404).json({ error: "NCR not found" });
    res.json({ ok: true, ...ncr });
  } catch (e) {
    next(e);
  }
});

// PUT report json (save)
app.put("/api/ncr/:id/report", requireAuth, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const reportJson = req.body?.reportJson ?? req.body ?? {};

    const updated = await prisma.ncr.update({
      where: { id },
      data: { reportJson }
    });

    res.json({ ok: true, id: updated.id, updatedAt: updated.updatedAt });
  } catch (e) {
    next(e);
  }
});

// --------------------
// Error handler (prevents crashes -> 502)
// --------------------
app.use((err, req, res, next) => {
  console.error("API ERROR:", err);
  res.status(500).json({ error: err?.message ? String(err.message) : "Server error" });
});

// --------------------
// Serve React build (api/public_dist)
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_DIST = path.join(__dirname, "..", "public_dist");

app.use(express.static(WEB_DIST));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) return res.status(404).end();
  res.sendFile(path.join(WEB_DIST, "index.html"));
});

// --------------------
// Start server (Render port scan safe)
// --------------------
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server listening on port ${PORT}`));

// --------------------
// Connect DB in background
// --------------------
(async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
  } catch (e) {
    console.error("⚠️ Database connection failed:", e?.message || e);
  }
})();
