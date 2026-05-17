import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";
import { pushSharedGoal } from "../services/shared.service.js";

export const createCycle = asyncHandler(async (req, res) => {
  const { name, year, startDate, q1Window, q2Window, q3Window, q4Window } = req.body;
  const cycle = await prisma.cycle.create({
    data: { name, year: Number(year), startDate: new Date(startDate), q1Window: new Date(q1Window), q2Window: new Date(q2Window), q3Window: new Date(q3Window), q4Window: new Date(q4Window) }
  });
  res.status(201).json(cycle);
});

export const activateCycle = asyncHandler(async (req, res) => {
  await prisma.cycle.updateMany({ data: { active: false } });
  const cycle = await prisma.cycle.update({ where: { id: String(req.params.id) }, data: { active: true } });
  res.json(cycle);
});

export const completionDashboard = asyncHandler(async (_req, res) => {
  const [employees, submitted, approved, activeCycle] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE" } }),
    prisma.goalSheet.count({ where: { submittedAt: { not: null } } }),
    prisma.goalSheet.count({ where: { locked: true } }),
    prisma.cycle.findFirst({ where: { active: true } })
  ]);

  // Per-manager breakdown — real data from the database, optimized to prevent massive over-fetching
  const managersRaw = await prisma.user.findMany({
    where: { role: "MANAGER" },
    select: {
      name: true,
      reports: {
        select: {
          goalSheets: {
            where: activeCycle ? { cycleId: activeCycle.id } : undefined,
            select: {
              submittedAt: true,
              locked: true
            }
          }
        }
      }
    }
  });

  const managerStats = managersRaw.map((mgr) => {
    const teamSize = mgr.reports.length;
    const sheetsSubmitted = mgr.reports.filter((emp) =>
      emp.goalSheets.some((s) => s.submittedAt)
    ).length;
    const sheetsApproved = mgr.reports.filter((emp) =>
      emp.goalSheets.some((s) => s.locked)
    ).length;

    return {
      name: mgr.name,
      teamSize,
      submitted: sheetsSubmitted,
      approved: sheetsApproved,
      completion: teamSize ? Math.round((sheetsApproved / teamSize) * 100) : 0
    };
  });

  // Check-in completion: how many approved goals have at least one check-in
  const approvedGoals = await prisma.goal.count({ where: { status: "APPROVED" } });
  const goalsWithCheckIns = await prisma.goal.count({
    where: { status: "APPROVED", checkIns: { some: {} } }
  });
  const checkInPercent = approvedGoals ? Math.round((goalsWithCheckIns / approvedGoals) * 100) : 0;

  res.json({
    employees,
    submitted,
    approved,
    goalsSubmittedPercent: employees ? Math.round((submitted / employees) * 100) : 0,
    goalsApprovedPercent: employees ? Math.round((approved / employees) * 100) : 0,
    checkInPercent,
    managerStats
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

/**
 * Push a shared goal (departmental KPI) to multiple employees.
 * Body: { primaryOwnerId, recipientIds: string[], title, description, thrustArea, uom, target, weightage }
 */
export const createSharedGoal = asyncHandler(async (req, res) => {
  const { primaryOwnerId, recipientIds, ...goalData } = req.body;
  if (!primaryOwnerId || !Array.isArray(recipientIds) || recipientIds.length === 0) {
    throw new AppError("primaryOwnerId and recipientIds[] are required", 400);
  }
  const goals = await pushSharedGoal(primaryOwnerId, recipientIds, goalData);
  res.status(201).json(goals);
});

/** Org-wide audit trail — most recent 200 entries */
export const allAuditLogs = asyncHandler(async (_req, res) => {
  const logs = await prisma.auditLog.findMany({
    include: { user: true, goal: true },
    orderBy: { timestamp: "desc" },
    take: 200
  });
  res.json(logs);
});

/** All approved/locked goals for the unlock page */
export const lockedGoals = asyncHandler(async (_req, res) => {
  const goals = await prisma.goal.findMany({
    where: { status: "APPROVED" },
    include: { user: true, goalSheet: true },
    orderBy: { updatedAt: "desc" }
  });
  res.json(goals);
});
