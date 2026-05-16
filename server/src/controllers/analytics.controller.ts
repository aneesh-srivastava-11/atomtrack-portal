import { prisma } from "../utils/prisma.js";
import { asyncHandler } from "../utils/errors.js";

/** Quarter-over-Quarter achievement trends across the org */
export const qoqTrends = asyncHandler(async (_req, res) => {
  const checkIns = await prisma.checkIn.findMany({
    where: { actualAchievement: { not: null } },
    include: { goal: true }
  });

  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const trends = quarters.map((q) => {
    const qCheckIns = checkIns.filter((c) => c.quarter === q);
    if (qCheckIns.length === 0) return { quarter: q, avgProgress: 0, count: 0 };

    const progressScores = qCheckIns.map((c) => {
      const { uom, target } = c.goal;
      const actual = c.actualAchievement!;
      if (uom.startsWith("MIN")) return Math.min((actual / target) * 100, 200);
      if (uom.startsWith("MAX")) return actual === 0 ? 100 : Math.min((target / actual) * 100, 200);
      if (uom === "ZERO_BASED") return actual === 0 ? 100 : 0;
      return actual <= target ? 100 : 0;
    });

    const avg = Math.round(progressScores.reduce((a, b) => a + b, 0) / progressScores.length);
    return { quarter: q, avgProgress: avg, count: qCheckIns.length };
  });

  res.json(trends);
});

/** Heatmap: per-employee completion status across Q1–Q4 */
export const heatmap = asyncHandler(async (_req, res) => {
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: {
      goals: {
        where: { status: { in: ["APPROVED", "LOCKED"] } },
        include: { checkIns: true }
      },
      manager: true
    },
    orderBy: { name: "asc" }
  });

  const data = employees.map((emp) => {
    const quarters = ["Q1", "Q2", "Q3", "Q4"];
    const qStatus: Record<string, string> = {};
    for (const q of quarters) {
      const hasCheckIn = emp.goals.some((g) => g.checkIns.some((c) => c.quarter === q));
      const allComplete = emp.goals.length > 0 && emp.goals.every((g) =>
        g.checkIns.some((c) => c.quarter === q && c.progressStatus === "COMPLETED")
      );
      qStatus[q] = allComplete ? "COMPLETED" : hasCheckIn ? "PARTIAL" : "NONE";
    }

    return {
      employee: emp.name,
      manager: emp.manager?.name || "—",
      goalCount: emp.goals.length,
      ...qStatus
    };
  });

  res.json(data);
});

/** Goal distribution by thrust area, UoM, and status */
export const distribution = asyncHandler(async (_req, res) => {
  const goals = await prisma.goal.findMany();

  // Group by thrust area
  const byThrustArea: Record<string, number> = {};
  const byUom: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  for (const goal of goals) {
    byThrustArea[goal.thrustArea] = (byThrustArea[goal.thrustArea] || 0) + 1;
    byUom[goal.uom] = (byUom[goal.uom] || 0) + 1;
    byStatus[goal.status] = (byStatus[goal.status] || 0) + 1;
  }

  const toArray = (obj: Record<string, number>) =>
    Object.entries(obj).map(([name, value]) => ({ name, value }));

  res.json({
    byThrustArea: toArray(byThrustArea),
    byUom: toArray(byUom),
    byStatus: toArray(byStatus),
    total: goals.length
  });
});

/** Manager effectiveness — check-in completion rate per manager */
export const managerEffectiveness = asyncHandler(async (_req, res) => {
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER" },
    include: {
      reports: {
        include: {
          goals: {
            where: { status: { in: ["APPROVED", "LOCKED"] } },
            include: { checkIns: true }
          }
        }
      }
    },
    orderBy: { name: "asc" }
  });

  const data = managers.map((mgr) => {
    const totalGoals = mgr.reports.reduce((sum, emp) => sum + emp.goals.length, 0);
    const goalsWithCheckIn = mgr.reports.reduce(
      (sum, emp) => sum + emp.goals.filter((g) => g.checkIns.length > 0).length,
      0
    );
    const commentsGiven = mgr.reports.reduce(
      (sum, emp) => sum + emp.goals.reduce(
        (s, g) => s + g.checkIns.filter((c) => c.managerComment).length, 0
      ),
      0
    );

    return {
      name: mgr.name,
      teamSize: mgr.reports.length,
      totalGoals,
      goalsWithCheckIn,
      checkInRate: totalGoals ? Math.round((goalsWithCheckIn / totalGoals) * 100) : 0,
      commentsGiven
    };
  });

  res.json(data);
});
