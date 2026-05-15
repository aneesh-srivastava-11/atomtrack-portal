import type { Goal, GoalUom, Quarter } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../utils/errors.js";

export async function getActiveCycle() {
  const cycle = await prisma.cycle.findFirst({ where: { active: true } });
  if (!cycle) throw new AppError("No active cycle configured", 400);
  return cycle;
}

export async function getOrCreateGoalSheet(userId: string) {
  const cycle = await getActiveCycle();
  return prisma.goalSheet.upsert({
    where: { userId_cycleId: { userId, cycleId: cycle.id } },
    create: { userId, cycleId: cycle.id },
    update: {}
  });
}

export async function assertGoalEditable(goal: Goal & { goalSheet: { locked: boolean } }) {
  if (goal.goalSheet.locked || goal.status !== "DRAFT") throw new AppError("Goal is locked", 400);
}

export async function validateGoalCreation(userId: string, weightage: number) {
  const sheet = await getOrCreateGoalSheet(userId);
  const goals = await prisma.goal.findMany({ where: { goalSheetId: sheet.id } });
  if (goals.length >= 8) throw new AppError("Maximum 8 goals allowed", 400);
  if (weightage < 10) throw new AppError("Minimum 10%", 400);
  return sheet;
}

export function calculateProgress(uom: GoalUom, target: number, actual?: number | null) {
  if (actual == null) return 0;
  if (uom.startsWith("MIN")) return Math.min((actual / target) * 100, 200);
  if (uom.startsWith("MAX")) return actual === 0 ? 100 : Math.min((target / actual) * 100, 200);
  if (uom === "ZERO_BASED") return actual === 0 ? 100 : 0;
  return actual <= target ? 100 : 0;
}

export function currentQuarterAllowed(quarter: Quarter, cycle: { q1Window: Date; q2Window: Date; q3Window: Date; q4Window: Date }) {
  const now = new Date();
  const windows = { Q1: cycle.q1Window, Q2: cycle.q2Window, Q3: cycle.q3Window, Q4: cycle.q4Window };
  return now <= windows[quarter];
}
