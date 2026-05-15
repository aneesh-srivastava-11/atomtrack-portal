import { Quarter } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";
import { currentQuarterAllowed, getActiveCycle } from "../services/goal.service.js";
import { syncSharedAchievement } from "../services/shared.service.js";

async function ensureWindowOpen(quarter: Quarter) {
  const cycle = await getActiveCycle();
  if (!currentQuarterAllowed(quarter, cycle)) throw new AppError("Window closed", 400);
}

export const upsertCheckIn = asyncHandler(async (req, res) => {
  const { goalId, quarter, plannedTarget, actualAchievement, progressStatus } = req.body;
  await ensureWindowOpen(quarter);
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId: req.user!.id } });
  if (!goal) throw new AppError("Goal not found", 404);

  // Only allow whitelisted fields — prevent userId/goalId injection
  const checkIn = await prisma.checkIn.upsert({
    where: { goalId_quarter: { goalId, quarter } },
    create: { goalId, userId: req.user!.id, quarter, plannedTarget, actualAchievement, progressStatus },
    update: { plannedTarget, actualAchievement, progressStatus }
  });

  // Sync achievement to linked shared goals if this is the primary owner
  await syncSharedAchievement(goalId, quarter);

  res.json(checkIn);
});

export const getGoalCheckIns = asyncHandler(async (req, res) => {
  const checkIns = await prisma.checkIn.findMany({ where: { goalId: String(req.params.goalId) }, orderBy: { quarter: "asc" } });
  res.json(checkIns);
});

export const updateCheckIn = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.checkIn.findUnique({ where: { id } });
  if (!existing) throw new AppError("Check-in not found", 404);
  // Verify ownership
  if (existing.userId !== req.user!.id) throw new AppError("Check-in not found", 404);
  await ensureWindowOpen(existing.quarter);

  // Whitelist fields
  const { plannedTarget, actualAchievement, progressStatus } = req.body;
  const updated = await prisma.checkIn.update({
    where: { id },
    data: { plannedTarget, actualAchievement, progressStatus }
  });

  // Sync achievement to linked shared goals if this is the primary owner
  await syncSharedAchievement(existing.goalId, existing.quarter);

  res.json(updated);
});
