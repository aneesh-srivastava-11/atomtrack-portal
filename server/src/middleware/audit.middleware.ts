import type { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma.js";

export async function auditLockedGoal(req: Request, _res: Response, next: NextFunction) {
  const goalId = String(req.params.id || "");
  if (!goalId || !req.user) return next();
  const goal = await prisma.goal.findUnique({ where: { id: goalId }, include: { goalSheet: true } });
  if (goal?.goalSheet.locked) {
    await prisma.auditLog.create({
      data: {
        goalId,
        userId: req.user.id,
        action: "LOCKED_GOAL_MODIFICATION_ATTEMPT",
        oldValue: goal,
        newValue: req.body
      }
    });
  }
  next();
}
