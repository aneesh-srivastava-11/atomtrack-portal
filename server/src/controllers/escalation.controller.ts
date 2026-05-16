import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";
import { runEscalations } from "../services/escalation.service.js";

/** List all escalation rules */
export const listRules = asyncHandler(async (_req, res) => {
  const rules = await prisma.escalationRule.findMany({
    include: { _count: { select: { logs: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json(rules);
});

/** Create a new escalation rule */
export const createRule = asyncHandler(async (req, res) => {
  const { name, triggerType, thresholdDays } = req.body;
  if (!name || !triggerType || !thresholdDays) {
    throw new AppError("name, triggerType, and thresholdDays are required", 400);
  }
  const valid = ["GOAL_NOT_SUBMITTED", "GOAL_NOT_APPROVED", "CHECKIN_MISSING"];
  if (!valid.includes(triggerType)) {
    throw new AppError(`triggerType must be one of: ${valid.join(", ")}`, 400);
  }
  const rule = await prisma.escalationRule.create({
    data: { name, triggerType, thresholdDays: Number(thresholdDays) }
  });
  res.status(201).json(rule);
});

/** Toggle a rule on/off */
export const toggleRule = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const rule = await prisma.escalationRule.findUnique({ where: { id } });
  if (!rule) throw new AppError("Rule not found", 404);
  const updated = await prisma.escalationRule.update({
    where: { id },
    data: { active: !rule.active }
  });
  res.json(updated);
});

/** Delete a rule */
export const deleteRule = asyncHandler(async (req, res) => {
  await prisma.escalationRule.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
});

/** Run all escalation rules manually */
export const triggerEscalations = asyncHandler(async (_req, res) => {
  const result = await runEscalations();
  res.json(result);
});

/** Get escalation logs with filters */
export const getLogs = asyncHandler(async (req, res) => {
  const where: Record<string, unknown> = {};
  if (req.query.status) where.status = String(req.query.status);
  if (req.query.ruleId) where.ruleId = String(req.query.ruleId);

  const logs = await prisma.escalationLog.findMany({
    where,
    include: { rule: true, user: true },
    orderBy: { firedAt: "desc" },
    take: 100
  });
  res.json(logs);
});

/** Resolve an escalation log */
export const resolveLog = asyncHandler(async (req, res) => {
  const updated = await prisma.escalationLog.update({
    where: { id: String(req.params.id) },
    data: { status: "RESOLVED", resolvedAt: new Date() }
  });
  res.json(updated);
});
