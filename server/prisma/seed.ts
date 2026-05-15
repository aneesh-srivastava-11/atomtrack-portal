import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("Password@123", 10);
  const admin = await prisma.user.create({
    data: { email: "admin@atomtrack.test", name: "Admin User", password, role: Role.ADMIN }
  });

  const managers = await Promise.all(
    ["Meera Rao", "Arjun Menon", "Kavya Shah"].map((name, index) =>
      prisma.user.create({
        data: {
          email: `manager${index + 1}@atomtrack.test`,
          name,
          password,
          role: Role.MANAGER
        }
      })
    )
  );

  await Promise.all(
    Array.from({ length: 10 }).map((_, index) =>
      prisma.user.create({
        data: {
          email: `employee${index + 1}@atomtrack.test`,
          name: `Employee ${index + 1}`,
          password,
          role: Role.EMPLOYEE,
          managerId: managers[index % managers.length].id
        }
      })
    )
  );

  await prisma.cycle.create({
    data: {
      name: "Performance Cycle 2025",
      year: 2025,
      startDate: new Date("2025-01-01T00:00:00.000Z"),
      q1Window: new Date("2025-03-31T23:59:59.000Z"),
      q2Window: new Date("2025-06-30T23:59:59.000Z"),
      q3Window: new Date("2025-09-30T23:59:59.000Z"),
      q4Window: new Date("2025-12-31T23:59:59.000Z"),
      active: true
    }
  });

  console.log(`Seed complete. Admin: ${admin.email}, password: Password@123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
