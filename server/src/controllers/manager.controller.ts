import { GoalStatus } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";
import { sendNotification } from "../services/email.service.js";

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
  if (goal.status !== GoalStatus.SUBMITTED) throw new AppError("Only submitted goals can be approved", 400);

  const updated = await prisma.$transaction(async (tx) => {
    const approved = await tx.goal.update({
      where: { id: goal.id },
      data: { status: GoalStatus.APPROVED, rejectionComment: null }
    });

    // Check if ALL goals on this sheet are now approved — only then lock the sheet
    const siblings = await tx.goal.findMany({ where: { goalSheetId: goal.goalSheetId } });
    const allApproved = siblings.every(
      (g) => g.id === goal.id ? true : g.status === GoalStatus.APPROVED
    );
    if (allApproved) {
      await tx.goalSheet.update({
        where: { id: goal.goalSheetId },
        data: { locked: true, approvedAt: new Date(), approvedBy: req.user!.id }
      });
    }

    return approved;
  });

  // Email notification to employee
  const employee = await prisma.user.findUnique({ where: { id: goal.userId } });
  if (employee) {
    sendNotification(
      employee.email,
      "Your goals have been approved",
      `Hi ${employee.name}, your goal "${goal.title}" has been approved by ${req.user!.name}.`
    );
  }

  res.json(updated);
});

export const rejectGoal = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const goal = await prisma.goal.findUnique({ where: { id }, include: { user: true } });
  if (!goal || goal.user.managerId !== req.user!.id) throw new AppError("Goal not found", 404);
  if (goal.status !== GoalStatus.SUBMITTED) throw new AppError("Only submitted goals can be rejected", 400);

  const comment = req.body.comment || "";
  const updated = await prisma.$transaction(async (tx) => {
    // Reset to DRAFT so employee can rework
    const rejected = await tx.goal.update({
      where: { id: goal.id },
      data: { status: GoalStatus.DRAFT, rejectionComment: comment }
    });

    // Also reset the goal sheet's submittedAt so the employee can re-submit
    await tx.goalSheet.update({
      where: { id: goal.goalSheetId },
      data: { submittedAt: null, locked: false }
    });

    await tx.auditLog.create({
      data: { goalId: goal.id, userId: req.user!.id, action: "GOAL_REJECTED", newValue: { comment } }
    });

    return rejected;
  });

  // Email notification to employee
  const employee = await prisma.user.findUnique({ where: { id: goal.userId } });
  if (employee) {
    sendNotification(
      employee.email,
      "Goal returned for rework",
      `Hi ${employee.name}, your goal "${goal.title}" was returned for rework by ${req.user!.name}. Feedback: ${comment || 'No comment provided.'}`
    );
  }

  res.json(updated);
});

export const managerEditGoal = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const goal = await prisma.goal.findUnique({ where: { id }, include: { user: true } });
  if (!goal || goal.user.managerId !== req.user!.id) throw new AppError("Goal not found", 404);

  // Only allow editing submitted goals (not already approved/locked)
  if (goal.status !== GoalStatus.SUBMITTED) throw new AppError("Only submitted goals can be edited by manager", 400);

  const data: Record<string, unknown> = {};
  if (req.body.target != null) data.target = req.body.target;
  if (req.body.weightage != null) data.weightage = req.body.weightage;
  if (req.body.title != null) data.title = req.body.title;
  if (req.body.description != null) data.description = req.body.description;

  const updated = await prisma.goal.update({ where: { id: goal.id }, data });
  res.json(updated);
});

export const addManagerCheckInComment = asyncHandler(async (req, res) => {
  const checkIn = await prisma.checkIn.update({
    where: { id: req.body.checkInId },
    data: { managerComment: req.body.comment }
  });
  res.json(checkIn);
});
