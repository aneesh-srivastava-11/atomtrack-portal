import { prisma } from "../utils/prisma.js";
import { AppError } from "../utils/errors.js";
import { getOrCreateGoalSheet } from "./goal.service.js";

/**
 * Push a shared goal (departmental KPI) to multiple employees.
 * The caller becomes the primary owner. Each recipient gets a copy
 * with isShared=true, read-only title/description/target, and
 * only the weightage is adjustable by the recipient.
 */
export async function pushSharedGoal(
  primaryOwnerId: string,
  recipientIds: string[],
  goalData: {
    title: string;
    description: string;
    thrustArea: string;
    uom: string;
    target: number;
    weightage: number;
  }
) {
  const allUserIds = [primaryOwnerId, ...recipientIds.filter((id) => id !== primaryOwnerId)];

  const createdGoals = await prisma.$transaction(async (tx) => {
    const goals = [];
    for (const userId of allUserIds) {
      const sheet = await getOrCreateGoalSheetTx(tx, userId);
      const existingGoals = await tx.goal.findMany({ where: { goalSheetId: sheet.id } });
      if (existingGoals.length >= 8) {
        throw new AppError(`Employee ${userId} already has 8 goals`, 400);
      }

      const isPrimary = userId === primaryOwnerId;
      const goal = await tx.goal.create({
        data: {
          title: goalData.title,
          description: goalData.description,
          thrustArea: goalData.thrustArea as any,
          uom: goalData.uom as any,
          target: goalData.target,
          weightage: goalData.weightage,
          userId,
          goalSheetId: sheet.id,
          isShared: true,
          primaryOwnerId,
          sharedWith: allUserIds.filter((id) => id !== userId)
        }
      });
      goals.push(goal);
    }
    return goals;
  });

  return createdGoals;
}

/**
 * Sync achievement data from the primary owner's check-in to all linked
 * shared goal copies. Called after a check-in is created or updated.
 */
export async function syncSharedAchievement(goalId: string, quarter: string) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || !goal.isShared || goal.primaryOwnerId !== goal.userId) return;

  // Find the primary owner's check-in for this quarter
  const primaryCheckIn = await prisma.checkIn.findUnique({
    where: { goalId_quarter: { goalId, quarter: quarter as any } }
  });
  if (!primaryCheckIn) return;

  // Find all linked copies (same title, same primaryOwnerId, isShared)
  const linkedGoals = await prisma.goal.findMany({
    where: {
      primaryOwnerId: goal.primaryOwnerId,
      title: goal.title,
      isShared: true,
      id: { not: goalId }
    }
  });

  if (linkedGoals.length === 0) return;

  // Upsert check-ins for each linked goal with the same achievement data
  await prisma.$transaction(
    linkedGoals.map((linked) =>
      prisma.checkIn.upsert({
        where: { goalId_quarter: { goalId: linked.id, quarter: quarter as any } },
        create: {
          goalId: linked.id,
          userId: linked.userId,
          quarter: quarter as any,
          plannedTarget: primaryCheckIn.plannedTarget,
          actualAchievement: primaryCheckIn.actualAchievement,
          progressStatus: primaryCheckIn.progressStatus
        },
        update: {
          actualAchievement: primaryCheckIn.actualAchievement,
          progressStatus: primaryCheckIn.progressStatus
        }
      })
    )
  );
}

/**
 * Transaction-aware version of getOrCreateGoalSheet.
 */
async function getOrCreateGoalSheetTx(tx: any, userId: string) {
  const cycle = await tx.cycle.findFirst({ where: { active: true } });
  if (!cycle) throw new AppError("No active cycle configured", 400);
  return tx.goalSheet.upsert({
    where: { userId_cycleId: { userId, cycleId: cycle.id } },
    create: { userId, cycleId: cycle.id },
    update: {}
  });
}
