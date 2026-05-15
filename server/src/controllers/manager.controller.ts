import { GoalStatus } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";

export const teamGoals = asyncHandler(async (req, res) => {
  const sheets = await prisma.goalSheet.findMany({
    where: { user: { managerId: req.user!.id } },
    include: { user: true, goals: true, cycle: true },
    orderBy: { updatedAt: "desc" }
  });
  res.json(sheets);
});

export const approveGoal = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const goal = await prisma.goal.findUnique({ where: { id }, include: { user: true, goalSheet: true } });
  if (!goal || goal.user.managerId !== req.user!.id) throw new AppError("Goal not found", 404);
  const updated = await prisma.$transaction(async (tx) => {
    const approved = await tx.goal.update({ where: { id: goal.id }, data: { status: GoalStatus.APPROVED } });
    await tx.goalSheet.update({
      where: { id: goal.goalSheetId },
      data: { locked: true, approvedAt: new Date(), approvedBy: req.user!.id }
    });
    return approved;
  });
  res.json(updated);
});

export const rejectGoal = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const goal = await prisma.goal.findUnique({ where: { id }, include: { user: true } });
  if (!goal || goal.user.managerId !== req.user!.id) throw new AppError("Goal not found", 404);
  const updated = await prisma.goal.update({ where: { id: goal.id }, data: { status: GoalStatus.REJECTED } });
  await prisma.auditLog.create({
    data: { goalId: goal.id, userId: req.user!.id, action: "GOAL_REJECTED", newValue: { comment: req.body.comment } }
  });
  res.json(updated);
});

export const managerEditGoal = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const goal = await prisma.goal.findUnique({ where: { id }, include: { user: true } });
  if (!goal || goal.user.managerId !== req.user!.id) throw new AppError("Goal not found", 404);
  const updated = await prisma.goal.update({
    where: { id: goal.id },
    data: { target: req.body.target, weightage: req.body.weightage, title: req.body.title, description: req.body.description }
  });
  res.json(updated);
});

export const addManagerCheckInComment = asyncHandler(async (req, res) => {
  const checkIn = await prisma.checkIn.update({
    where: { id: req.body.checkInId },
    data: { managerComment: req.body.comment }
  });
  res.json(checkIn);
});
