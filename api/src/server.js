import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./env.js";
import { prisma } from "./prisma.js";
import { login, requireAuth } from "./auth.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined"));

app.get("/health", (req, res) => res.json({ ok: true, env: env.NODE_ENV }));

app.get("/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up" });
  } catch (e) {
    res.status(503).json({ ok: false, db: "down", error: String(e?.message || e) });
  }
});

// Home
app.get("/api", (req, res) => res.json({ ok: true, name: "Monroy QMS API" }));

// Auth
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const result = await login(String(email), String(password));
  if (!result) return res.status(401).json({ error: "Invalid credentials" });
  res.json(result);
});

// ------------------------
// CRUD MVP (Enterprise Demo)
// ------------------------

// Clients
app.get("/api/clients", requireAuth, async (req, res) => {
  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ items: clients });
});
app.post("/api/clients", requireAuth, async (req, res) => {
  const { name, category, notes } = req.body || {};
  const client = await prisma.client.create({
    data: { name, category, notes: notes || null }
  });
  res.json(client);
});

// Equipment
app.get("/api/equipment", requireAuth, async (req, res) => {
  const items = await prisma.equipment.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ items });
});
app.post("/api/equipment", requireAuth, async (req, res) => {
  const data = req.body || {};
  const item = await prisma.equipment.create({ data });
  res.json(item);
});

// Inspections
app.get("/api/inspections", requireAuth, async (req, res) => {
  const items = await prisma.inspection.findMany({ orderBy: { datePerformed: "desc" } });
  res.json({ items });
});
app.post("/api/inspections", requireAuth, async (req, res) => {
  const item = await prisma.inspection.create({ data: req.body || {} });
  res.json(item);
});

// PFMEA
app.get("/api/pfmea", requireAuth, async (req, res) => {
  const items = await prisma.pfmeaItem.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ items });
});
app.post("/api/pfmea", requireAuth, async (req, res) => {
  const item = await prisma.pfmeaItem.create({ data: req.body || {} });
  res.json(item);
});

// NCR
app.get("/api/ncr", requireAuth, async (req, res) => {
  const items = await prisma.ncr.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ items });
});
app.post("/api/ncr", requireAuth, async (req, res) => {
  const item = await prisma.ncr.create({ data: req.body || {} });
  res.json(item);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

// ✅ Serve built React app from api/public_dist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_DIST = path.join(__dirname, "..", "public_dist");

app.use(express.static(WEB_DIST));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) return res.status(404).end();
  res.sendFile(path.join(WEB_DIST, "index.html"));
});

// ✅ Listen first (Render port scan safe)
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));

// DB connect in background
(async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
  } catch (e) {
    console.error("⚠️ Database connection failed:", e?.message || e);
  }
})();
