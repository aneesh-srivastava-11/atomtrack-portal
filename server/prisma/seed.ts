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
    data: { email: "admin@atomtrack.test", name: "Admin", password, role: Role.ADMIN }
  });

  const managers = await Promise.all(
    [1, 2, 3].map((n) =>
      prisma.user.create({
        data: {
          email: `manager${n}@atomtrack.test`,
          name: `Manager ${n}`,
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
      name: "Performance Cycle 2026",
      year: 2026,
      startDate: new Date("2026-05-01T00:00:00.000Z"),
      q1Window: new Date("2026-07-31T23:59:59.000Z"),
      q2Window: new Date("2026-10-31T23:59:59.000Z"),
      q3Window: new Date("2027-01-31T23:59:59.000Z"),
      q4Window: new Date("2027-04-30T23:59:59.000Z"),
      active: true
    }
  });

  console.log("Seed complete.");
  console.log("");
  console.log("Accounts (all use password: Password@123):");
  console.log(`  Admin:      ${admin.email}`);
  managers.forEach((m, i) => console.log(`  Manager ${i + 1}:   manager${i + 1}@atomtrack.test`));
  for (let i = 1; i <= 10; i++) console.log(`  Employee ${i}: employee${i}@atomtrack.test`);
  console.log("");
  console.log("Manager → Employee mapping:");
  console.log("  Manager 1 → Employee 1, 4, 7, 10");
  console.log("  Manager 2 → Employee 2, 5, 8");
  console.log("  Manager 3 → Employee 3, 6, 9");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
