import { prisma } from "../utils/prisma.js";
import { asyncHandler } from "../utils/errors.js";

export const createCycle = asyncHandler(async (req, res) => {
  const cycle = await prisma.cycle.create({ data: req.body });
  res.status(201).json(cycle);
});

export const activateCycle = asyncHandler(async (req, res) => {
  await prisma.cycle.updateMany({ data: { active: false } });
  const cycle = await prisma.cycle.update({ where: { id: String(req.params.id) }, data: { active: true } });
  res.json(cycle);
});

export const completionDashboard = asyncHandler(async (_req, res) => {
  const [employees, submitted, approved] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE" } }),
    prisma.goalSheet.count({ where: { submittedAt: { not: null } } }),
    prisma.goalSheet.count({ where: { locked: true } })
  ]);
  res.json({
    employees,
    goalsSubmittedPercent: employees ? Math.round((submitted / employees) * 100) : 0,
    goalsApprovedPercent: employees ? Math.round((approved / employees) * 100) : 0
  });
});

export const unlockGoal = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const goal = await prisma.goal.findUnique({ where: { id }, include: { goalSheet: true } });
  const updated = await prisma.$transaction(async (tx) => {
    if (goal) {
      await tx.goalSheet.update({ where: { id: goal.goalSheetId }, data: { locked: false } });
      await tx.auditLog.create({
        data: {
          goalId: goal.id,
          userId: req.user!.id,
          action: "ADMIN_UNLOCK",
          oldValue: { locked: goal.goalSheet.locked },
          newValue: { reason: req.body.reason, locked: false }
        }
      });
    }
    return tx.goal.update({ where: { id }, data: { status: "DRAFT" } });
  });
  res.json(updated);
});

export const users = asyncHandler(async (_req, res) => {
  const all = await prisma.user.findMany({
    include: { reports: true, manager: true },
    orderBy: [{ role: "asc" }, { name: "asc" }]
  });
  res.json(all.map(({ password: _password, ...user }) => user));
});
