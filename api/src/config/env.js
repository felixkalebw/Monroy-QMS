import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),

  DATABASE_URL: process.env.DATABASE_URL,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TTL_MIN: Number(process.env.ACCESS_TTL_MIN ?? 15),
  REFRESH_TTL_DAYS: Number(process.env.REFRESH_TTL_DAYS ?? 14),

  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  PUBLIC_VERIFY_BASE_URL: process.env.PUBLIC_VERIFY_BASE_URL ?? "http://localhost:5173/verify"
};

for (const k of ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
  if (!env[k]) throw new Error(`Missing env var: ${k}`);
}
