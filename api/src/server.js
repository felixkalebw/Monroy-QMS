import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 4000);
const NODE_ENV = process.env.NODE_ENV || "production";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// middleware
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map(s => s.trim()) }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined"));

// ✅ Always-on health (does NOT require DB)
app.get("/health", (req, res) => res.json({ ok: true, env: NODE_ENV }));

// ✅ DB health (optional)
app.get("/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up" });
  } catch (e) {
    res.status(503).json({ ok: false, db: "down", error: String(e?.message || e) });
  }
});

// ---- your routes here (later) ----
// app.use("/api/auth", authRoutes) ...

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

// ✅ IMPORTANT: Listen first so Render sees an open port
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

// Connect to DB in background (won’t stop port binding)
(async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
  } catch (e) {
    console.error("⚠️ Database connection failed (server still running):", e?.message || e);
  }
})();

// crash visibility
process.on("unhandledRejection", (err) => console.error("UNHANDLED REJECTION:", err));
process.on("uncaughtException", (err) => console.error("UNCAUGHT EXCEPTION:", err));
