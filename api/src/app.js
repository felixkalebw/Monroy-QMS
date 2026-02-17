import usersRoutes from "./routes/users.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import auditRoutes from "./routes/audit.routes.js";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import equipmentRoutes from "./routes/equipment.routes.js";
import inspectionsRoutes from "./routes/inspections.routes.js";
import pfmeaRoutes from "./routes/pfmea.routes.js";
import ncrRoutes from "./routes/ncr.routes.js";
import publicRoutes from "./routes/public.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/inspections", inspectionsRoutes);
app.use("/api", pfmeaRoutes);
app.use("/api", ncrRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? "Server error" });
});

export default app;
