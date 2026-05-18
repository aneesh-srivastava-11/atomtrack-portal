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
  const activeCycle = await prisma.cycle.findFirst({ where: { active: true } });

  let employees = 0;
  let submitted = 0;
  let approved = 0;
  let approvedGoals = 0;
  let goalsWithCheckIns = 0;
  let managerStats: Array<{ name: string; teamSize: number; submitted: number; approved: number; completion: number }> = [];

  if (activeCycle) {
    // Run both queries in parallel — saves one full round trip to the database
    const [statsRaw, managersRaw] = await Promise.all([
      prisma.$queryRaw<Array<{
        employees: number;
        submitted: number;
        approved: number;
        approvedGoals: number;
        goalsWithCheckIns: number;
      }>>`
        SELECT 
          (SELECT COUNT(*)::int FROM "User" WHERE role = 'EMPLOYEE') as employees,
          (SELECT COUNT(*)::int FROM "GoalSheet" WHERE "submittedAt" IS NOT NULL AND "cycleId" = ${activeCycle.id}) as submitted,
          (SELECT COUNT(*)::int FROM "GoalSheet" WHERE "locked" = true AND "cycleId" = ${activeCycle.id}) as approved,
          (SELECT COUNT(*)::int FROM "Goal" g JOIN "GoalSheet" gs ON g."goalSheetId" = gs.id WHERE g.status = 'APPROVED' AND gs."cycleId" = ${activeCycle.id}) as "approvedGoals",
          (SELECT COUNT(DISTINCT g.id)::int FROM "Goal" g 
           JOIN "GoalSheet" gs ON g."goalSheetId" = gs.id
           JOIN "CheckIn" c ON c."goalId" = g.id 
           WHERE g.status = 'APPROVED' AND gs."cycleId" = ${activeCycle.id}) as "goalsWithCheckIns"
      `,
      prisma.$queryRaw<Array<{
        name: string;
        teamSize: number;
        submitted: number;
        approved: number;
      }>>`
        SELECT 
          m.name,
          COUNT(e.id)::int as "teamSize",
          COUNT(CASE WHEN gs."submittedAt" IS NOT NULL THEN 1 END)::int as submitted,
          COUNT(CASE WHEN gs.locked = true THEN 1 END)::int as approved
        FROM "User" m
        LEFT JOIN "User" e ON e."managerId" = m.id AND e.role = 'EMPLOYEE'
        LEFT JOIN "GoalSheet" gs ON gs."userId" = e.id AND gs."cycleId" = ${activeCycle.id}
        WHERE m.role = 'MANAGER'
        GROUP BY m.id, m.name
        ORDER BY m.name ASC
      `
    ]);

    if (statsRaw && statsRaw.length > 0) {
      employees = statsRaw[0].employees;
      submitted = statsRaw[0].submitted;
      approved = statsRaw[0].approved;
      approvedGoals = statsRaw[0].approvedGoals;
      goalsWithCheckIns = statsRaw[0].goalsWithCheckIns;
    }

    managerStats = managersRaw.map((mgr) => ({
      name: mgr.name,
      teamSize: mgr.teamSize,
      submitted: mgr.submitted,
      approved: mgr.approved,
      completion: mgr.teamSize ? Math.round((mgr.approved / mgr.teamSize) * 100) : 0
    }));
  } else {
    // If no active cycle, count employees
    employees = await prisma.user.count({ where: { role: "EMPLOYEE" } });
  }

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
    return tx.goal.update({ where: { id }, data: { status: "DRAFT", rejectionComment: `[Admin Unlock Reason]: ${req.body.reason}` } });
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
