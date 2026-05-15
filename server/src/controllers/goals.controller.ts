import { GoalStatus } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";
import { assertGoalEditable, getOrCreateGoalSheet, validateGoalCreation } from "../services/goal.service.js";

export const createGoal = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const sheet = await validateGoalCreation(userId, req.body.weightage);
  if (sheet.locked) throw new AppError("Goal is locked", 400);
  const goal = await prisma.goal.create({
    data: { ...req.body, userId, goalSheetId: sheet.id, primaryOwnerId: req.body.primaryOwnerId || userId }
  });
  res.status(201).json(goal);
});

export const getGoals = asyncHandler(async (req, res) => {
  const goals = await prisma.goal.findMany({
    where: { userId: req.user!.id },
    include: { checkIns: true, goalSheet: { include: { cycle: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json(goals);
});

export const getGoal = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const goal = await prisma.goal.findFirst({
    where: { id, OR: [{ userId: req.user!.id }, { user: { managerId: req.user!.id } }] },
    include: { checkIns: true, goalSheet: true, user: true }
  });
  if (!goal) throw new AppError("Goal not found", 404);
  res.json(goal);
});

export const updateGoal = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const goal = await prisma.goal.findUnique({ where: { id }, include: { goalSheet: true } });
  if (!goal || goal.userId !== req.user!.id) throw new AppError("Goal not found", 404);
  await assertGoalEditable(goal);
  const updated = await prisma.goal.update({ where: { id }, data: req.body });
  res.json(updated);
});

export const submitGoals = asyncHandler(async (req, res) => {
  const sheet = await getOrCreateGoalSheet(req.user!.id);
  const goals = await prisma.goal.findMany({ where: { goalSheetId: sheet.id } });
  const total = goals.reduce((sum, goal) => sum + goal.weightage, 0);
  if (total !== 100) throw new AppError("Total must equal 100%", 400);
  await prisma.goal.updateMany({ where: { goalSheetId: sheet.id }, data: { status: GoalStatus.SUBMITTED } });
  const updated = await prisma.goalSheet.update({ where: { id: sheet.id }, data: { submittedAt: new Date() }, include: { goals: true } });
  res.json(updated);
});

export const deleteGoal = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const goal = await prisma.goal.findUnique({ where: { id }, include: { goalSheet: true } });
  if (!goal || goal.userId !== req.user!.id) throw new AppError("Goal not found", 404);
  await assertGoalEditable(goal);
  await prisma.goal.delete({ where: { id: goal.id } });
  res.status(204).send();
});
