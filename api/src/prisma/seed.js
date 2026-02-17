import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@monroy.local";
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log("Admin already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash("Admin@12345", 12);

  await prisma.user.create({
    data: {
      name: "System Admin",
      email,
      passwordHash,
      role: "ADMIN"
    }
  });

  console.log("Seeded admin:", email, "password: Admin@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
