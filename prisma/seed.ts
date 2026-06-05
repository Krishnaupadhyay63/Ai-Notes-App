import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("test123", 12);
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: { name: "Test User", email: "test@example.com", password },
  });
  console.log("Seed user created:", user.email);
}

main().finally(() => prisma.$disconnect());
