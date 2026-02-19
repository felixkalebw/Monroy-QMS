export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "dev_secret_change_me",
};
