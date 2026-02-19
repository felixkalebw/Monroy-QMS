import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(10),
  JWT_ACCESS_SECRET: z.string().min(16),
  NODE_ENV: z.string().default("production")
});

export const env = schema.parse(process.env);
