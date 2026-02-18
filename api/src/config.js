import dotenv from "dotenv";
dotenv.config();

function req(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),

  databaseUrl: req("DATABASE_URL"),
  directUrl: process.env.DIRECT_URL || "",

  jwtAccessSecret: req("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: req("JWT_REFRESH_SECRET"),
  accessTtlMin: Number(process.env.ACCESS_TTL_MIN || 15),
  refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS || 14),

  corsOrigin: process.env.CORS_ORIGIN || "*"
};
