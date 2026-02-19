import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";

dotenv.config();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@monroy.local";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  const name = process.env.SEED_ADMIN_NAME || "Monroy Admin";

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log("✅ Admin already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN" }
  });

  console.log("✅ Seeded admin:");
  console.log("Email:", email);
  console.log("Password:", password);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
