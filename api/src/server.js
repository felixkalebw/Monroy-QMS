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

// ---- middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined"));

// ---- health
app.get("/health", (req, res) => res.json({ ok: true, env: env.NODE_ENV }));

app.get("/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up" });
  } catch (e) {
    res.status(503).json({ ok: false, db: "down", error: String(e?.message || e) });
  }
});

// ---- api home + api health (IMPORTANT)
app.get("/api", (req, res) => res.json({ ok: true, name: "Monroy QMS API" }));
app.get("/api/health", (req, res) => res.json({ ok: true, api: true }));

// ---- auth
app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const result = await login(String(email), String(password));
    if (!result) return res.status(401).json({ error: "Invalid credentials" });

    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ✅ TEMP SEED ENDPOINT (remove after demo)
// Call once: POST /api/dev/seed-admin  (with a header x-seed-key)
app.post("/api/dev/seed-admin", async (req, res, next) => {
  try {
    const key = req.headers["x-seed-key"];
    if (!key || String(key) !== String(process.env.SEED_KEY || "")) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const email = String(req.body?.email || "admin@monroyqms.com").toLowerCase();
    const password = String(req.body?.password || "Admin@12345");
    const name = String(req.body?.name || "Admin");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.json({ ok: true, message: "Admin already exists", email });

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, email, passwordHash, role: "ADMIN" },
    });

    res.json({ ok: true, message: "Admin created", email, password });
  } catch (e) {
    next(e);
  }
});

// ---- CRUD MVP (Enterprise Demo)

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
    const client = await prisma.client.create({
      data: { name, category, notes: notes || null },
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
    const item = await prisma.equipment.create({ data: req.body || {} });
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
    const item = await prisma.inspection.create({ data: req.body || {} });
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

// NCR
app.get("/api/ncr", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.ncr.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});
app.post("/api/ncr", requireAuth, async (req, res, next) => {
  try {
    const item = await prisma.ncr.create({ data: req.body || {} });
    res.json(item);
  } catch (e) {
    next(e);
  }
});

// ---- error handler (prevents 502 from crashing)
app.use((err, req, res, next) => {
  console.error("API ERROR:", err);
  res.status(500).json({ error: err?.message ? String(err.message) : "Server error" });
});

// ---- serve built React app
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: this must match where your build copies the web dist
// Your script "copy-web-dist.js" should copy public/dist -> api/public_dist
const WEB_DIST = path.join(__dirname, "..", "public_dist");

app.use(express.static(WEB_DIST));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) return res.status(404).end();
  res.sendFile(path.join(WEB_DIST, "index.html"));
});

// ---- listen (Render port scan safe)
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server listening on port ${PORT}`));

// ---- connect in background (won't block startup)
(async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
  } catch (e) {
    console.error("⚠️ Database connection failed:", e?.message || e);
  }
})();
