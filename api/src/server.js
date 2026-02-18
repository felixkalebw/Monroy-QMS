import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config.js";
import { corsMw } from "./middleware/cors.js";
import { prisma } from "./prisma.js";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import equipmentRoutes from "./routes/equipment.routes.js";
import inspectionsRoutes from "./routes/inspections.routes.js";
import ncrRoutes from "./routes/ncr.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import publicRoutes from "./routes/public.routes.js";

const app = express();

app.use(helmet());
app.use(corsMw);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined"));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/inspections", inspectionsRoutes);
app.use("/api/ncrs", ncrRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit-logs", auditRoutes);

app.use("/public", publicRoutes);

// basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error", detail: config.nodeEnv === "development" ? String(err) : undefined });
});

const port = config.port;

async function ensureAdminSeed() {
  // If no users exist, create default admin (only first boot)
  const count = await prisma.user.count();
  if (count > 0) return;

  const bcrypt = (await import("bcryptjs")).default;
  const passwordHash = await bcrypt.hash("Admin@12345", 10);

  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@monroy.local",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE"
    }
  });

  console.log("✅ Seeded default admin: admin@monroy.local / Admin@12345");
}

app.listen(port, async () => {
  console.log(`API listening on :${port}`);
  await ensureAdminSeed();
});
