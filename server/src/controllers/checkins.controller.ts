import { Quarter } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";
import { currentQuarterAllowed, getActiveCycle } from "../services/goal.service.js";

async function ensureWindowOpen(quarter: Quarter) {
  const cycle = await getActiveCycle();
  if (!currentQuarterAllowed(quarter, cycle)) throw new AppError("Window closed", 400);
}

export const upsertCheckIn = asyncHandler(async (req, res) => {
  await ensureWindowOpen(req.body.quarter);
  const goal = await prisma.goal.findFirst({ where: { id: req.body.goalId, userId: req.user!.id } });
  if (!goal) throw new AppError("Goal not found", 404);
  const checkIn = await prisma.checkIn.upsert({
    where: { goalId_quarter: { goalId: req.body.goalId, quarter: req.body.quarter } },
    create: { ...req.body, userId: req.user!.id },
    update: req.body
  });
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
  await ensureWindowOpen(existing.quarter);
  const updated = await prisma.checkIn.update({ where: { id }, data: req.body });
  res.json(updated);
});
